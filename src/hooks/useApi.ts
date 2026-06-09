"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60_000; // 60 seconds

export function useApi<T>(path: string, options?: { skip?: boolean }): UseApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: !options?.skip,
    error: null,
  });
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    // Check cache
    const cached = cache.get(path);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setState({ data: cached.data as T, loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "https://tcghub.ai";
      const res = await fetch(`${base}${path}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      if (!res.ok) {
        throw new Error(`API ${path}: ${res.status}`);
      }
      const json = await res.json();
      cache.set(path, { data: json, ts: Date.now() });
      if (mounted.current) {
        setState({ data: json as T, loading: false, error: null });
      }
    } catch (err: unknown) {
      if (mounted.current) {
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  }, [path]);

  useEffect(() => {
    mounted.current = true;
    if (!options?.skip) {
      fetchData();
    }
    return () => {
      mounted.current = false;
    };
  }, [fetchData, options?.skip]);

  const refetch = useCallback(() => {
    cache.delete(path);
    fetchData();
  }, [fetchData, path]);

  return { ...state, refetch };
}
