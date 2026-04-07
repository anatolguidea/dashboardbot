import { useEffect, useState } from "react";
import type { AiInsightsData, ApiError, ApiSuccess } from "@/lib/types";
import type { TimePeriod } from "@/components/TimeFilter";

interface AiInsightsState {
  requestKey: string;
  insights: AiInsightsData | null;
  error: string | null;
}

export function useAiInsights(period: TimePeriod, dateSelected: string, botId: string = "all") {
  const requestKey = `${period}:${dateSelected}:${botId}`;
  const [state, setState] = useState<AiInsightsState>({
    requestKey: "",
    insights: null,
    error: null,
  });

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const res = await fetch(
          `/api/ai-insights?period=${period}&date=${dateSelected}&botId=${encodeURIComponent(botId)}`
        );
        const json = (await res.json()) as ApiSuccess<AiInsightsData> | ApiError;
        if (!active) return;
        if (json.status === "success") {
          setState({
            requestKey,
            insights: json.data,
            error: null,
          });
        } else {
          setState((prev) => ({
            requestKey,
            insights: prev.insights,
            error: json.message || "Failed to fetch AI insights",
          }));
        }
      } catch (err) {
        if (!active) return;
        setState((prev) => ({
          requestKey,
          insights: prev.insights,
          error: err instanceof Error ? err.message : "Network error",
        }));
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [period, dateSelected, botId, requestKey]);

  const loading = state.requestKey !== requestKey;
  return { insights: state.insights, loading, error: state.error };
}
