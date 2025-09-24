import { useState, useEffect, useCallback, useRef } from 'react';

interface DebouncedApiOptions {
  delay?: number;
  immediate?: boolean;
}

export const useDebouncedApi = <T>(
  apiCall: () => Promise<T>,
  dependencies: any[],
  options: DebouncedApiOptions = {}
) => {
  const { delay = 300, immediate = false } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const executeApiCall = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall]);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (immediate) {
      executeApiCall();
    } else {
      timeoutRef.current = setTimeout(executeApiCall, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(() => {
    executeApiCall();
  }, [executeApiCall]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};

export default useDebouncedApi;
