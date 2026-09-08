import type { NextRequest } from "next/server";

// Lightweight in-memory rate limiter. NOTE: state is per server instance, so on
// serverless (Vercel) it limits per-instance, not globally — good enough to blunt
// casual spam/enumeration. For strict global limits use a shared store (e.g.
// Upstash Redis).
type Bucket = { count: number; reset: number };
const store = new Map<string, Bucket>();

/** Returns true if the request is allowed, false if the limit is exceeded. */
export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = store.get(key);
  if (!b || now > b.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

/** Best-effort client IP from proxy headers. */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
