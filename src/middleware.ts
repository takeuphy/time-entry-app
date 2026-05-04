import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];
const CRON_PATHS = ["/api/auto-send", "/api/send-daily-report"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    CRON_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.next();
  }

  const session = request.cookies.get("session")?.value;
  if (!session) {
    return toLogin(request);
  }

  const expected = await computeSessionToken();
  if (session !== expected) {
    return toLogin(request);
  }

  return NextResponse.next();
}

function toLogin(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

async function computeSessionToken(): Promise<string> {
  const password = process.env.APP_PASSWORD || "";
  const secret = process.env.SESSION_SECRET || "time-entry-app-default";
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ":" + secret);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-).*)",
  ],
};
