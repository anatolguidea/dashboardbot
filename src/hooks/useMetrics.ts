import { useState, useEffect } from 'react';
import { TimePeriod } from '@/components/TimeFilter';
import type { ApiError, ApiSuccess, MetricsData } from '@/lib/types';

interface MetricsState {
  requestKey: string;
  data: MetricsData | null;
  error: string | null;
}

export function useMetrics(botId: string = "all") {
  const [period, setPeriod] = useState<TimePeriod>('month');
  
  // Default to today (YYYY-MM-DD format)
  const today = new Date().toISOString().split('T')[0];
  const [dateSelected, setDateSelected] = useState(today);
  const requestKey = `${period}:${dateSelected}:${botId}`;
  const [state, setState] = useState<MetricsState>({
    requestKey: "",
    data: null,
    error: null,
  });

  const endpoint = `/api/metrics?period=${period}&date=${dateSelected}&botId=${encodeURIComponent(botId)}`;
  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const res = await fetch(endpoint);
        const json = (await res.json()) as ApiSuccess<MetricsData> | ApiError;
        if (!active) return;
        if (json.status === 'success') {
          setState({
            requestKey,
            data: json.data,
            error: null,
          });
        } else {
          setState((prev) => ({
            requestKey,
            data: prev.data,
            error: json.message || "Failed to parse data",
          }));
        }
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
  }, [endpoint, requestKey]);

  const loading = state.requestKey !== requestKey;

  return {
    data: state.data,
    loading,
    error: state.error,
    period,
    setPeriod,
    dateSelected,
    setDateSelected
  };
}
