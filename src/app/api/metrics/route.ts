import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess, MetricsData, PythonEventPayload, RecentActivity } from "@/lib/types";

const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 8000;
const PYTHON_SHARED_SECRET = process.env.PYTHON_SHARED_SECRET;

type Period = "month" | "week" | "day";

function validatePeriod(value: string | null): Period | null {
  if (value === "month" || value === "week" || value === "day") {
    return value;
  }
  return null;
}

function validateDate(value: string | null): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const dt = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return null;
  return value;
}

function validateBotId(value: string | null): string | null {
  if (!value) return null;
  if (value === "all") return value;
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) return null;
  return value;
}

function isMetricsData(value: unknown): value is MetricsData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.messagesThisMonth === "number" &&
    typeof data.totalUsers === "number" &&
    typeof data.phoneNumbersCaptured === "number" &&
    typeof data.growth === "object" &&
    Array.isArray(data.chartData)
  );
}

function parsePythonEvents(payload: unknown): PythonEventPayload[] {
  const base =
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as Record<string, unknown>).data)
      ? ((payload as Record<string, unknown>).data as unknown[])
      : Array.isArray(payload)
      ? payload
      : [];

  return base
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      if (
        typeof rec.time !== "string" ||
        typeof rec.bot_id !== "string" ||
        typeof rec.channel !== "string" ||
        typeof rec.sender_id !== "string" ||
        typeof rec.sender_name !== "string"
      ) {
        return null;
      }
      return {
        time: rec.time,
        bot_id: rec.bot_id,
        channel: rec.channel,
        sender_id: rec.sender_id,
        sender_name: rec.sender_name,
      };
    })
    .filter((x): x is PythonEventPayload => x !== null);
}

function mapActivity(events: PythonEventPayload[], type: RecentActivity["type"]): RecentActivity[] {
  return events.map((ev, index) => ({
    id: `${type}-${ev.sender_id}-${ev.time}-${index}`,
    senderId: ev.sender_id,
    senderName: ev.sender_name,
    botId: ev.bot_id,
    channel: ev.channel,
    type,
    time: ev.time,
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = validatePeriod(searchParams.get("period"));
  const date = validateDate(searchParams.get("date"));
  const botId = validateBotId(searchParams.get("botId"));

  if (!period || !date || (searchParams.get("botId") && !botId)) {
    return NextResponse.json<ApiError>(
      {
        status: "error",
        message: "Invalid query params. Expected period=month|week|day, date=YYYY-MM-DD, optional botId.",
      },
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
    const [metricsRes, newUserRes, newPhoneRes] = await Promise.all([
      fetch(`${PYTHON_SERVER_URL}/api/bot-metrics?${qs.toString()}`, {
        cache: "no-store",
        signal: controller.signal,
        headers,
      }),
      fetch(`${PYTHON_SERVER_URL}/api/new-user?${qs.toString()}`, {
        cache: "no-store",
        signal: controller.signal,
        headers,
      }),
      fetch(`${PYTHON_SERVER_URL}/api/new-phonenumber?${qs.toString()}`, {
        cache: "no-store",
        signal: controller.signal,
        headers,
      }),
    ]);

    if (!metricsRes.ok) {
      return NextResponse.json<ApiError>(
        {
          status: "error",
          message: `Python backend error (${metricsRes.status}).`,
        },
        { status: 502 }
      );
    }

    const metricsPayload: unknown = await metricsRes.json();
    const metricsData = (metricsPayload &&
      typeof metricsPayload === "object" &&
      "data" in metricsPayload &&
      (metricsPayload as Record<string, unknown>).data) || metricsPayload;

    if (!isMetricsData(metricsData)) {
      return NextResponse.json<ApiError>(
        {
          status: "error",
          message: "Python backend returned an invalid metrics payload.",
        },
        { status: 502 }
      );
    }

    const newUserEvents = newUserRes.ok ? parsePythonEvents(await newUserRes.json()) : [];
    const newPhoneEvents = newPhoneRes.ok ? parsePythonEvents(await newPhoneRes.json()) : [];
    const recentActivity = [
      ...mapActivity(newUserEvents, "new_user"),
      ...mapActivity(newPhoneEvents, "new_phonenumber"),
    ].sort((a, b) => b.time.localeCompare(a.time));

    const data: MetricsData & { recentActivity: RecentActivity[] } = {
      ...metricsData,
      recentActivity,
    };

    return NextResponse.json<ApiSuccess<MetricsData & { recentActivity: RecentActivity[] }>>({
      status: "success",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Python backend request timed out."
        : "Could not connect to Python backend.";
    return NextResponse.json<ApiError>({ status: "error", message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers: HeadersInit = { "Content-Type": "application/json", Accept: "application/json" };
  if (PYTHON_SHARED_SECRET) {
    headers["x-python-shared-secret"] = PYTHON_SHARED_SECRET;
  }

  try {
    const body = await request.json();
    const upstream = await fetch(`${PYTHON_SERVER_URL}/api/bot-commands`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      return NextResponse.json<ApiError>(
        { status: "error", message: `Python backend error (${upstream.status}).` },
        { status: 502 }
      );
    }

    const payload: unknown = await upstream.json();
    return NextResponse.json<ApiSuccess<unknown>>({
      status: "success",
      data: payload,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Python backend request timed out."
        : "Failed to communicate with Python backend.";
    return NextResponse.json<ApiError>({ status: "error", message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
