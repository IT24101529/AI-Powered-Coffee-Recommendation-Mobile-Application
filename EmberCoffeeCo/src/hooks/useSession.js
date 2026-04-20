// hooks/useSession.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URLS from '../config/api';

export function useSession() {
  const [sessionId, setSessionId]         = useState(null);
  const [weatherContext, setWeatherContext] = useState(null);
  const [sessionReady, setSessionReady]   = useState(false);
  const [error, setError]                 = useState(null);

  // Start a new session on mount
  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    try {
      const res = await axios.post(
        `${API_URLS.CHATBOT_API}/session/start`,
        {},
        { timeout: 3000 }
      );
      setSessionId(res.data.session_id);
      setSessionReady(true);
    } catch (err) {
      setError('Could not start session quickly. Continuing with local session.');
      // Use a local fallback session ID so the app still works
      setSessionId('local_' + Date.now());
      setSessionReady(true);
    }
  };

  // Called by ContextIntegration when weather loads
  const onContextReady = (contextData) => {
    setWeatherContext(contextData);
  };

  return {
    sessionId,
    weatherContext,
    sessionReady,
    error,
    onContextReady,
  };
}