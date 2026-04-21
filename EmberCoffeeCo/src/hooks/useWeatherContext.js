// hooks/useWeatherContext.js
// ─────────────────────────────────────────────────────────────
// Custom hook — fetches and manages context from Feature 3 API
// Owner: Ranasinghe R.M.N.K. (IT24101529)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_URLS from '../config/api';

export function useWeatherContext(sessionId, initialLocation = 'Kandy,LK') {
  const [contextData, setContextData]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [lastFetched, setLastFetched]   = useState(null);
  const [location, setLocation]         = useState(initialLocation);

  // ── Fetch live context from /context/all ──────────────────────
  const fetchContext = useCallback(async (loc = location) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URLS.CONTEXT_API}/context/all`, {
        params: { session_id: sessionId, location: loc },
        timeout: 8000,
      });
      setContextData(response.data);
      setLastFetched(new Date());
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Is the context backend running?');
      } else if (err.response?.status === 404) {
        setError(`Location "${loc}" not found. Try "Kandy,LK" or "Colombo,LK".`);
      } else if (err.response?.status === 422) {
        setError('Invalid session ID. Please restart the conversation.');
      } else {
        setError('Cannot reach context service. Check API host/port in config/api.js.');
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId, location]);

  // ── Post a manual weather override to /context/override ───────
  const overrideContext = useCallback(async (temperature, condition) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URLS.CONTEXT_API}/context/override`, {
        session_id:  sessionId,
        temperature: temperature,
        condition:   condition,
      });
      setContextData({ ...response.data, is_override: true });
      setLastFetched(new Date());
    } catch (err) {
      setError('Override failed. Check the context backend is running.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // ── DELETE an override to return to live weather ────────────
  const clearOverride = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.delete(`${API_URLS.CONTEXT_API}/context/override/${sessionId}`);
      setContextData(response.data);
      setLastFetched(new Date());
      // Re-fetch to ensure any location-based live data is fully loaded
      fetchContext(location);
    } catch (err) {
      setError('Failed to reset weather. Context service might be down.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Auto-fetch whenever session or location changes
  useEffect(() => {
    if (sessionId) fetchContext(location);
  }, [sessionId, location, fetchContext]);

  return {
    contextData,
    loading,
    error,
    lastFetched,
    location,
    setLocation,
    fetchContext,
    overrideContext,
    clearOverride,
  };
}