interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 20, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // No previous requests or window expired
    if (!entry || now > entry.resetTime) {
      const resetTime = now + this.windowMs;
      this.requests.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: this.maxRequests - 1, resetTime };
    }

    // Within rate limit window
    if (entry.count < this.maxRequests) {
      entry.count++;
      this.requests.set(identifier, entry);
      return { allowed: true, remaining: this.maxRequests - entry.count, resetTime: entry.resetTime };
    }

    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  reset(identifier: string) {
    this.requests.delete(identifier);
  }
}

// Create singleton instance
// 20 requests per minute per session
export const chatRateLimiter = new RateLimiter(20, 60000);
