"use client";

import { useLanguage } from "./LanguageProvider";
import type { AiInsightsData } from "@/lib/types";

interface AiInsightsProps {
  insights: AiInsightsData | null;
  loading: boolean;
  error: string | null;
}

function severityClass(severity?: "low" | "medium" | "high") {
  if (severity === "high") return "text-red-300 border-red-500/30 bg-red-500/10";
  if (severity === "medium") return "text-amber-300 border-amber-500/30 bg-amber-500/10";
  return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
}

export function AiInsights({ insights, loading, error }: AiInsightsProps) {
  const { t } = useLanguage();

  return (
    <section className="glass-panel p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <div className="w-2 h-6 bg-cyan-500 rounded-full mr-3"></div>
        {t.aiInsights}
      </h3>

      {loading ? (
        <p className="text-sm text-slate-400">{t.loadingAiInsights}</p>
      ) : error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : !insights ? (
        <p className="text-sm text-slate-400">{t.noAiInsights}</p>
      ) : (
        <div className="space-y-4">
          <p className="text-slate-200 text-sm">{insights.summary}</p>

          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">{t.highlights}</h4>
            <div className="space-y-2">
              {insights.highlights.map((item, index) => (
                <div
                  key={`highlight-${index}`}
                  className={`rounded-lg border px-3 py-2 text-sm ${severityClass(item.severity)}`}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="opacity-90">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">{t.recommendations}</h4>
            <div className="space-y-2">
              {insights.recommendations.map((item, index) => (
                <div
                  key={`recommendation-${index}`}
                  className={`rounded-lg border px-3 py-2 text-sm ${severityClass(item.severity)}`}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="opacity-90">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
