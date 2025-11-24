// Simple in-memory rate limiter
// In production, use Redis or similar for distributed systems

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const userRateLimits = new Map<string, RateLimitEntry>();
const geminiRateLimits = new Map<string, RateLimitEntry>();

// Rate limit configuration
const USER_RATE_LIMIT = {
  maxRequests: 10, // per window
  windowMs: 60000, // 1 minute
};

const GEMINI_RATE_LIMIT = {
  maxRequests: 30, // per window
  windowMs: 60000, // 1 minute
};

export function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = userRateLimits.get(userId);

  if (!entry || now > entry.resetTime) {
    // Reset or create new entry
    userRateLimits.set(userId, {
      count: 1,
      resetTime: now + USER_RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (entry.count >= USER_RATE_LIMIT.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export function checkGeminiRateLimit(): boolean {
  const key = 'global';
  const now = Date.now();
  const entry = geminiRateLimits.get(key);

  if (!entry || now > entry.resetTime) {
    geminiRateLimits.set(key, {
      count: 1,
      resetTime: now + GEMINI_RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (entry.count >= GEMINI_RATE_LIMIT.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export function resetUserRateLimit(userId: string): void {
  userRateLimits.delete(userId);
}

export function resetGeminiRateLimit(): void {
  geminiRateLimits.clear();
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  
  for (const [key, entry] of userRateLimits.entries()) {
    if (now > entry.resetTime) {
      userRateLimits.delete(key);
    }
  }
  
  for (const [key, entry] of geminiRateLimits.entries()) {
    if (now > entry.resetTime) {
      geminiRateLimits.delete(key);
    }
  }
}, 60000); // Cleanup every minute

