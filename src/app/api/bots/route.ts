import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess, Bot } from "@/lib/types";

const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 8000;
const PYTHON_SHARED_SECRET = process.env.PYTHON_SHARED_SECRET;

function normalizeBots(payload: unknown): Bot[] | null {
  const raw =
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as Record<string, unknown>).data)
      ? ((payload as Record<string, unknown>).data as unknown[])
      : Array.isArray(payload)
      ? payload
      : null;

  if (!raw) return null;

  const bots = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      const id = typeof rec.id === "string" ? rec.id : null;
      const name = typeof rec.name === "string" ? rec.name : null;
      if (!id || !name) return null;
      return { id, name };
    })
    .filter((x): x is Bot => x !== null);

  return bots;
}

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers: HeadersInit = { Accept: "application/json" };
  if (PYTHON_SHARED_SECRET) headers["x-python-shared-secret"] = PYTHON_SHARED_SECRET;

  try {
    const upstream = await fetch(`${PYTHON_SERVER_URL}/api/bots`, {
      cache: "no-store",
      headers,
      signal: controller.signal,
    });

    if (!upstream.ok) {
      return NextResponse.json<ApiError>(
        { status: "error", message: `Python bots endpoint error (${upstream.status}).` },
        { status: 502 }
      );
    }

    const payload: unknown = await upstream.json();
    const bots = normalizeBots(payload);
    if (!bots) {
      return NextResponse.json<ApiError>({ status: "error", message: "Invalid bots payload." }, { status: 502 });
    }

    return NextResponse.json<ApiSuccess<Bot[]>>({ status: "success", data: bots });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Python bots request timed out."
        : "Could not connect to Python bots endpoint.";
    return NextResponse.json<ApiError>({ status: "error", message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
