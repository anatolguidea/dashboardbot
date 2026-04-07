import { useEffect, useState } from "react";
import type { ApiError, ApiSuccess, Bot } from "@/lib/types";

interface BotsState {
  loaded: boolean;
  bots: Bot[];
  error: string | null;
}

export function useBots() {
  const [state, setState] = useState<BotsState>({
    loaded: false,
    bots: [],
    error: null,
  });

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const res = await fetch("/api/bots");
        const json = (await res.json()) as ApiSuccess<Bot[]> | ApiError;
        if (!active) return;
        if (json.status === "success") {
          setState({ loaded: true, bots: json.data, error: null });
        } else {
          setState({ loaded: true, bots: [], error: json.message || "Failed to fetch bots" });
        }
      } catch (err) {
        if (!active) return;
        setState({
          loaded: true,
          bots: [],
          error: err instanceof Error ? err.message : "Network error",
        });
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, []);

  return {
    bots: state.bots,
    loading: !state.loaded,
    error: state.error,
  };
}
