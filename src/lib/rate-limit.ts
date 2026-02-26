type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

declare global {
  // eslint-disable-next-line no-var
  var __subtrackRateLimitStore: RateLimitStore | undefined;
}

const store: RateLimitStore = globalThis.__subtrackRateLimitStore ?? new Map();

if (!globalThis.__subtrackRateLimitStore) {
  globalThis.__subtrackRateLimitStore = store;
}

export type ConsumeRateLimitInput = {
  key: string;
  maxRequests: number;
  windowMs: number;
};

export type ConsumeRateLimitResult = {
  allowed: boolean;
  retryAfterSec: number;
  headers: Record<string, string>;
};

function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function getRequestClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export function consumeRateLimit({
  key,
  maxRequests,
  windowMs,
}: ConsumeRateLimitInput): ConsumeRateLimitResult {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      retryAfterSec: 0,
      headers: {
        "X-RateLimit-Limit": String(maxRequests),
        "X-RateLimit-Remaining": String(Math.max(0, maxRequests - 1)),
        "X-RateLimit-Reset": String(Math.floor(resetAt / 1000)),
      },
    };
  }

  existing.count += 1;
  store.set(key, existing);

  const remaining = Math.max(0, maxRequests - existing.count);
  const retryAfterSec = Math.max(
    1,
    Math.ceil((existing.resetAt - now) / 1000)
  );
  const allowed = existing.count <= maxRequests;

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.floor(existing.resetAt / 1000)),
  };

  if (!allowed) {
    headers["Retry-After"] = String(retryAfterSec);
  }

  return {
    allowed,
    retryAfterSec: allowed ? 0 : retryAfterSec,
    headers,
  };
}
