export type RateLimiter = {
  allow(key: string): boolean;
};

/**
 * Minimal in-memory sliding-window rate limiter keyed by IP.
 * Single-instance deployments only; swap for Redis on multi-instance setups.
 */
export function createRateLimiter(max: number, windowMs: number): RateLimiter {
  const hits = new Map<string, number[]>();

  setInterval(
    () => {
      const cutoff = Date.now() - windowMs;
      for (const [key, list] of hits) {
        const kept = list.filter((t) => t > cutoff);
        if (kept.length === 0) hits.delete(key);
        else hits.set(key, kept);
      }
    },
    Math.min(windowMs, 60 * 60 * 1000)
  ).unref?.();

  return {
    allow(key: string): boolean {
      const now = Date.now();
      const cutoff = now - windowMs;
      const list = (hits.get(key) ?? []).filter((t) => t > cutoff);
      if (list.length >= max) return false;
      list.push(now);
      hits.set(key, list);
      return true;
    },
  };
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}