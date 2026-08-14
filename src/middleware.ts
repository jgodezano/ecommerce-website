import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW = 60_000;

function getRateLimitInfo(ip: string) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    const newRecord = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(ip, newRecord);
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  record.count += 1;
  return { allowed: record.count <= RATE_LIMIT_MAX, remaining: Math.max(0, RATE_LIMIT_MAX - record.count) };
}

const ADMIN_PATHS = ["/admin"];
const API_PATHS = ["/api"];
const AUTH_ONLY_PATHS = ["/api/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

  // ========================================
  // 1. Security Headers
  // ========================================
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.stripe.com https://*.paypal.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.stripe.com https://*.paypal.com https://*.googleapis.com",
    "frame-src 'self' https://*.stripe.com https://*.paypal.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Content-Security-Policy": csp,
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  };

  // Only add HSTS in production
  if (process.env.NODE_ENV === "production") {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  // ========================================
  // 2. HTTPS Redirect (production only)
  // ========================================
  if (process.env.NODE_ENV === "production") {
    const forwardedProto = request.headers.get("x-forwarded-proto");
    if (forwardedProto && forwardedProto !== "https") {
      const url = new URL(request.url);
      url.protocol = "https";
      return NextResponse.redirect(url, 301);
    }
  }

  // ========================================
  // 3. Rate Limiting
  // ========================================
  const { allowed, remaining } = getRateLimitInfo(ip);
  response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
  response.headers.set("X-RateLimit-Remaining", String(remaining));

  if (!allowed) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/rate-limited";
    return NextResponse.rewrite(url);
  }

  // ========================================
  // 4. Admin Route Protection
  // ========================================
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && pathname !== "/admin/login") {
    const adminCookie = request.cookies.get("bm_admin_session");
    if (!adminCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  // ========================================
  // 5. Block sensitive file access
  // ========================================
  const blockedPatterns = [
    /\.env/i, /\.git/i, /\.sql/i, /\.log$/i, /composer\.json/i,
    /package-lock\.json/i, /yarn\.lock/i, /\.DS_Store/i, /Thumbs\.db/i,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(pathname)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // ========================================
  // 6. API Route Protection
  // ========================================
  // The session endpoint must remain public so an administrator can log in.
  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/session") {
    const adminCookie = request.cookies.get("bm_admin_session");
    if (!adminCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
