import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const CART_SESSION_COOKIE = "estei_session";

export type CartSession = {
  sessionId: string;
  setCookie: boolean;
};

function legacySessionId(request: NextRequest): string | null {
  return request.headers.get("x-session-id") ?? request.nextUrl.searchParams.get("sessionId");
}

function cookieSessionId(request: NextRequest): string | null {
  return request.cookies.get(CART_SESSION_COOKIE)?.value ?? null;
}

export function resolveCartSessionId(request: NextRequest): CartSession {
  const existing = cookieSessionId(request);
  if (existing) return { sessionId: existing, setCookie: false };
  const legacy = legacySessionId(request);
  const sessionId = legacy ?? `sess_${randomUUID().replace(/-/g, "")}`;
  return { sessionId, setCookie: true };
}

export function attachCartSessionCookie(response: NextResponse, sessionId: string): NextResponse {
  response.cookies.set(CART_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}