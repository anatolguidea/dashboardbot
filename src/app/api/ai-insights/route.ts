import { NextResponse } from "next/server";
import type { AiInsightsData, ApiError, ApiSuccess } from "@/lib/types";

const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 8000;
const PYTHON_SHARED_SECRET = process.env.PYTHON_SHARED_SECRET;

function isAiInsightsData(value: unknown): value is AiInsightsData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.summary === "string" &&
    Array.isArray(data.highlights) &&
    Array.isArray(data.recommendations)
  );
}

function validateBotId(value: string | null): string | null {
  if (!value) return null;
  if (value === "all") return value;
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) return null;
  return value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "month";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const botIdRaw = searchParams.get("botId");
  const botId = validateBotId(botIdRaw);
  if (botIdRaw && !botId) {
    return NextResponse.json<ApiError>(
      { status: "error", message: "Invalid botId. Use alphanumeric, _, -, or all." },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers: HeadersInit = { Accept: "application/json" };
  if (PYTHON_SHARED_SECRET) {
    headers["x-python-shared-secret"] = PYTHON_SHARED_SECRET;
  }
  const qs = new URLSearchParams({ period, date });
  if (botId) qs.set("botId", botId);

  try {
    const upstream = await fetch(`${PYTHON_SERVER_URL}/api/ai-insights?${qs.toString()}`, {
      cache: "no-store",
      headers,
      signal: controller.signal,
    });

    if (!upstream.ok) {
      return NextResponse.json<ApiError>(
        { status: "error", message: `Python insights endpoint error (${upstream.status}).` },
        { status: 502 }
      );
    }

    const payload: unknown = await upstream.json();
    const data = (payload &&
      typeof payload === "object" &&
      "data" in payload &&
      (payload as Record<string, unknown>).data) || payload;

    if (!isAiInsightsData(data)) {
      return NextResponse.json<ApiError>(
        { status: "error", message: "Invalid AI insights payload." },
        { status: 502 }
      );
    }

    return NextResponse.json<ApiSuccess<AiInsightsData>>({ status: "success", data });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Python insights request timed out."
        : "Could not connect to Python insights endpoint.";
    return NextResponse.json<ApiError>({ status: "error", message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
