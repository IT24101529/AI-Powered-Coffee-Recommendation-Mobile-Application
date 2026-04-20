// hooks/useSentiment.js
// Calls POST /analyze/sentiment on Bandara's backend (port 8001)
// Returns mood, sentiment, intensity, tone_style, keywords_found

import { useState } from 'react';
import axios from 'axios';
import API_URLS from '../config/api';

export function useSentiment() {
  const [currentMood, setCurrentMood] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  // ── Main function — call after every user message ────────────
  // Returns the full API response so Wijerathna can use it too
  const analyseSentiment = async (text, sessionId) => {
    if (!text || !text.trim()) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URLS.SENTIMENT_API}/analyze/sentiment`,
        {
          text:       text,
          session_id: sessionId || '',
        },
        { timeout: 5000 }
      );

      // Response shape from Bandara's backend:
      // { sentiment, mood, intensity, score, tone_style, keywords_found }
      const result = response.data;
      setCurrentMood(result);
      return result;

    } catch (err) {
      setError('Sentiment service unavailable.');
      // Return a safe fallback so the app keeps working
      const fallback = {
        sentiment:      'Neutral',
        mood:           'Calm',
        intensity:      0.5,
        score:          0.0,
        tone_style:     { style: 'friendly' },
        keywords_found: [],
      };
      setCurrentMood(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch mood history for a session ─────────────────────────
  const getMoodHistory = async (sessionId) => {
    try {
      const response = await axios.get(
        `${API_URLS.SENTIMENT_API}/mood/history/${sessionId}`,
        { timeout: 5000 }
      );
      // Response shape: { session_id, history: [{emotion, score, timestamp}] }
      return response.data.history || [];
    } catch (err) {
      return [];
    }
  };

  return {
    currentMood,
    loading,
    error,
    analyseSentiment,
    getMoodHistory,
  };
}