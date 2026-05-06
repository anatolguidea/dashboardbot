import { useState, useEffect } from 'react';
import type { MetricsData } from '@/lib/types';
import { fetchMetricsData } from '@/lib/metrics';

interface MetricsState {
  requestKey: string;
  data: MetricsData | null;
  error: string | null;
}

export function useMetrics(
  channel: string = "Toate",
  startDate?: string,
  endDate?: string,
  grouping: 'Zi' | 'Săptămână' | 'Lună' = 'Zi'
) {
  const requestKey = `${channel}:${startDate}:${endDate}:${grouping}`;
  
  const [state, setState] = useState<MetricsState>({
    requestKey: "",
    data: null,
    error: null,
  });

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const data = await fetchMetricsData(channel, startDate, endDate, grouping);
        if (!active) return;
        setState({
          requestKey,
          data,
          error: null,
        });
      } catch (err) {
        if (!active) return;
        console.error("Failed to fetch metrics", err);
        setState((prev) => ({
          requestKey,
          data: prev.data,
          error: err instanceof Error ? err.message : "Network error",
        }));
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [requestKey, channel, startDate, endDate, grouping]);

  const loading = state.requestKey !== requestKey;

  return {
    data: state.data,
    loading,
    error: state.error,
  };
}
