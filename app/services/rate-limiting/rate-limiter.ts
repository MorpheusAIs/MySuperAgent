/**
 * Rate Limiting Service
 * Provides flexible rate limiting for different user types and actions
 */

export interface RateLimit {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests in the time window
  description: string;
}

export interface UserLimits {
  jobs: RateLimit;
  messages: RateLimit;
  orchestration: RateLimit;
  scheduling: RateLimit;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  userType: 'anonymous' | 'free' | 'pro';
  reason?: string;
}

export interface RateLimitUsage {
  count: number;
  windowStart: Date;
  userType: 'anonymous' | 'free' | 'pro';
  identifier: string; // IP or wallet address
}

// Rate limit configurations by user type
const RATE_LIMITS: Record<'anonymous' | 'free' | 'pro', UserLimits> = {
  anonymous: {
    jobs: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 3, // 3 jobs per day for anonymous users
      description: 'Daily job creation limit for anonymous users'
    },
    messages: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 messages per hour
      description: 'Hourly message limit for anonymous users'
    },
    orchestration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 orchestrations per hour
      description: 'Hourly orchestration limit for anonymous users'
    },
    scheduling: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 0, // No scheduling for anonymous users
      description: 'Scheduling not available for anonymous users'
    }
  },
  free: {
    jobs: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 25, // 25 jobs per day for free users
      description: 'Daily job creation limit for free users'
    },
    messages: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 100, // 100 messages per hour
      description: 'Hourly message limit for free users'
    },
    orchestration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 100, // 100 orchestrations per hour
      description: 'Hourly orchestration limit for free users'
    },
    scheduling: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 10, // 10 scheduled jobs per day
      description: 'Daily scheduling limit for free users'
    }
  },
  pro: {
    jobs: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 500, // 500 jobs per day for pro users
      description: 'Daily job creation limit for pro users'
    },
    messages: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 1000, // 1000 messages per hour
      description: 'Hourly message limit for pro users'
    },
    orchestration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 1000, // 1000 orchestrations per hour
      description: 'Hourly orchestration limit for pro users'
    },
    scheduling: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 100, // 100 scheduled jobs per day
      description: 'Daily scheduling limit for pro users'
    }
  }
};

export class RateLimiterService {
  private static instance: RateLimiterService;
  private usageMap = new Map<string, RateLimitUsage>();

  private constructor() {}

  static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  /**
   * Determine user type based on identifier
   */
  private determineUserType(identifier: string): 'anonymous' | 'free' | 'pro' {
    // IP addresses are anonymous users
    if (this.isIPAddress(identifier)) {
      return 'anonymous';
    }
    
    // Wallet addresses are at least free users
    if (this.isWalletAddress(identifier)) {
      // TODO: In the future, check database for pro status
      // For now, all wallet users are 'free'
      return 'free';
    }
    
    return 'anonymous';
  }

  /**
   * Check if identifier is an IP address
   */
  private isIPAddress(identifier: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(identifier);
  }

  /**
   * Check if identifier is a wallet address
   */
  private isWalletAddress(identifier: string): boolean {
    return identifier.startsWith('0x') && identifier.length === 42;
  }

  /**
   * Generate cache key for rate limiting
   */
  private getCacheKey(identifier: string, action: keyof UserLimits): string {
    return `rate_limit:${identifier}:${action}`;
  }

  /**
   * Check if request is within rate limits
   */
  async checkRateLimit(
    identifier: string, 
    action: keyof UserLimits,
    increment: boolean = true
  ): Promise<RateLimitResult> {
    const userType = this.determineUserType(identifier);
    const limits = RATE_LIMITS[userType];
    const actionLimit = limits[action];
    
    const cacheKey = this.getCacheKey(identifier, action);
    const now = new Date();
    
    // Get current usage
    let usage = this.usageMap.get(cacheKey);
    
    // Initialize usage if not exists or window has expired
    if (!usage || (now.getTime() - usage.windowStart.getTime()) >= actionLimit.windowMs) {
      usage = {
        count: 0,
        windowStart: now,
        userType,
        identifier
      };
    }
    
    // Calculate remaining and reset time
    const remaining = Math.max(0, actionLimit.maxRequests - usage.count);
    const resetTime = new Date(usage.windowStart.getTime() + actionLimit.windowMs);
    
    // Check if request would exceed limit
    if (usage.count >= actionLimit.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        userType,
        reason: `Rate limit exceeded: ${actionLimit.description}. Limit: ${actionLimit.maxRequests} requests per ${Math.floor(actionLimit.windowMs / 1000 / 60)} minutes.`
      };
    }
    
    // Increment usage if requested
    if (increment) {
      usage.count++;
      this.usageMap.set(cacheKey, usage);
      
      // Clean up old entries periodically
      this.cleanupExpiredEntries();
    }
    
    return {
      allowed: true,
      remaining: Math.max(0, actionLimit.maxRequests - usage.count),
      resetTime,
      userType
    };
  }

  /**
   * Get current usage for an identifier and action
   */
  async getUsage(identifier: string, action: keyof UserLimits): Promise<RateLimitUsage | null> {
    const cacheKey = this.getCacheKey(identifier, action);
    return this.usageMap.get(cacheKey) || null;
  }

  /**
   * Get all rate limits for a user type
   */
  getLimitsForUserType(userType: 'anonymous' | 'free' | 'pro'): UserLimits {
    return RATE_LIMITS[userType];
  }

  /**
   * Get user's current limits
   */
  getUserLimits(identifier: string): UserLimits {
    const userType = this.determineUserType(identifier);
    return this.getLimitsForUserType(userType);
  }

  /**
   * Clean up expired entries from memory
   */
  private cleanupExpiredEntries(): void {
    const now = new Date();
    const keysToDelete: string[] = [];
    
    this.usageMap.forEach((usage, key) => {
      const userType = this.determineUserType(usage.identifier);
      const action = key.split(':')[2] as keyof UserLimits;
      const actionLimit = RATE_LIMITS[userType][action];
      
      if ((now.getTime() - usage.windowStart.getTime()) >= actionLimit.windowMs) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.usageMap.delete(key));
  }

  /**
   * Reset rate limits for a specific identifier (admin function)
   */
  async resetLimits(identifier: string, action?: keyof UserLimits): Promise<void> {
    if (action) {
      const cacheKey = this.getCacheKey(identifier, action);
      this.usageMap.delete(cacheKey);
    } else {
      // Reset all actions for this identifier
      const keysToDelete: string[] = [];
      this.usageMap.forEach((_, key) => {
        if (key.includes(identifier)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.usageMap.delete(key));
    }
  }

  /**
   * Get rate limit status for all actions
   */
  async getAllRateLimitStatus(identifier: string): Promise<Record<keyof UserLimits, RateLimitResult>> {
    const actions: (keyof UserLimits)[] = ['jobs', 'messages', 'orchestration', 'scheduling'];
    const status: Record<keyof UserLimits, RateLimitResult> = {} as any;
    
    for (const action of actions) {
      status[action] = await this.checkRateLimit(identifier, action, false);
    }
    
    return status;
  }

  /**
   * Check if user can perform an action without incrementing
   */
  async canPerformAction(identifier: string, action: keyof UserLimits): Promise<boolean> {
    const result = await this.checkRateLimit(identifier, action, false);
    return result.allowed;
  }
}

// Export singleton instance
export const rateLimiter = RateLimiterService.getInstance();