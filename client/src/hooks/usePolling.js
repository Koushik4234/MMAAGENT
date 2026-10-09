import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/http.js';

/**
 * Calls `fetcher` now and then every `intervalMs`. Gives near-real-time data without sockets.
 * `deps` restarts polling (e.g. when a filter changes). 401s are passed to `onUnauthorized`.
 */
export function usePolling(fetcher, intervalMs, deps = [], onUnauthorized) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    let timer;

    const tick = async () => {
      try {
        const result = await fetcherRef.current();
        if (cancelled) return;
        setData(result);
        setError('');
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) onUnauthorized?.();
        setError(err.message);
      } finally {
        if (!cancelled) {
          setLoading(false);
          timer = setTimeout(tick, intervalMs);
        }
      }
    };

    setLoading(true);
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);

  return { data, error, loading };
}
