import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';
import { createRateLimitError } from './error-handler';

// Initialize Redis client (optional - only if Upstash is configured)
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // General rate limit: 100 requests per minute
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        '1 m'
      ),
      analytics: true,
      prefix: 'ratelimit',
    });
  } catch (error) {
    console.warn('Rate limiting disabled: Upstash configuration failed', error);
  }
}

// Get client identifier from request
export function getClientIdentifier(req: NextRequest | any): string {
  // Try to get IP from various headers
  const forwarded = req.headers.get?.('x-forwarded-for') || req.headers['x-forwarded-for'];
  const ip =
    forwarded?.split(',')[0] ||
    req.headers.get?.('x-real-ip') ||
    req.headers['x-real-ip'] ||
    req.ip ||
    'unknown';

  return ip;
}

// Rate limit middleware for API routes
export async function checkRateLimit(
  identifier: string,
  limit?: number,
  window?: string
): Promise<boolean> {
  // If rate limiting is not configured, allow all requests in development
  if (!ratelimit && process.env.NODE_ENV === 'development') {
    return true;
  }

  // If rate limiting is not configured in production, deny
  if (!ratelimit) {
    return false;
  }

  try {
    const { success, limit: maxLimit, remaining, reset } = await ratelimit.limit(identifier);

    if (!success) {
      throw createRateLimitError();
    }

    return success;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Too many requests')) {
      throw error;
    }
    // If rate limiting fails, allow request but log error
    console.error('Rate limit check failed:', error);
    return true;
  }
}

// Specific rate limiters
export async function checkAuthRateLimit(identifier: string): Promise<boolean> {
  // 5 login attempts per 15 minutes
  const customLimit = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'auth',
  });

  if (!redis) {
    return process.env.NODE_ENV === 'development';
  }

  const { success } = await customLimit.limit(identifier);
  if (!success) {
    throw createRateLimitError();
  }

  return success;
}

export async function checkRegistrationRateLimit(identifier: string): Promise<boolean> {
  // 3 registration attempts per hour
  const customLimit = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
    prefix: 'registration',
  });

  if (!redis) {
    return process.env.NODE_ENV === 'development';
  }

  const { success } = await customLimit.limit(identifier);
  if (!success) {
    throw createRateLimitError();
  }

  return success;
}

export async function checkExportRateLimit(identifier: string): Promise<boolean> {
  // 10 export requests per hour
  const customLimit = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'export',
  });

  if (!redis) {
    return process.env.NODE_ENV === 'development';
  }

  const { success } = await customLimit.limit(identifier);
  if (!success) {
    throw createRateLimitError();
  }

  return success;
}
