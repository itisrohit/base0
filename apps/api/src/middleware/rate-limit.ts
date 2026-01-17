import type { Context, Next } from 'hono';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator: (c: Context) => string;
}

const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiter middleware
 * In production, this should be replaced with a Redis-backed store
 */
export const rateLimit = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => {
    // Bypass rate limiting if the bypass header is present
    // This is useful for internal tests and migrations
    if (c.req.header('X-Base0-Bypass-Rate-Limit')) {
      return await next();
    }

    // Forced enforcement for specific test cases
    if (c.req.header('X-Test-Rate-Limit')) {
      // Proceed to rate limiting
    } else if (process.env.NODE_ENV === 'test') {
      return await next();
    }

    const key = config.keyGenerator(c);
    const now = Date.now();

    let record = memoryStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }

    record.count++;
    memoryStore.set(key, record);

    const remaining = Math.max(0, config.max - record.count);

    c.header('X-RateLimit-Limit', config.max.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

    if (record.count > config.max) {
      return c.json(
        {
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(
            (record.resetTime - now) / 1000,
          )} seconds.`,
        },
        429,
      );
    }

    await next();
  };
};

/**
 * Standard limit: 100 requests per minute by API key or IP
 */
export const standardRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '500', 10),
  keyGenerator: (c) => {
    // Try to limit by API Key or User ID if authenticated, else IP
    const variables = c as unknown as { Var: { auth: { keyId?: string; userId?: string } } };
    const auth = variables.Var?.auth;
    if (auth?.keyId) return `key:${auth.keyId}`;
    if (auth?.userId) return `user:${auth.userId}`;
    return `ip:${c.req.header('x-forwarded-for') || 'unknown'}`;
  },
});
