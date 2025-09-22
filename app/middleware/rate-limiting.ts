import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimiter, RateLimitResult } from '@/services/rate-limiting/rate-limiter';

/**
 * Rate limiting middleware for API routes
 */
export async function withRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  action: 'jobs' | 'messages' | 'orchestration' | 'scheduling'
): Promise<{ allowed: boolean; result: RateLimitResult }> {
  
  // Get identifier (wallet address or IP)
  const walletAddress = req.headers['x-wallet-address'] as string;
  const clientIP = getClientIP(req);
  const identifier = walletAddress || clientIP;

  if (!identifier) {
    return {
      allowed: false,
      result: {
        allowed: false,
        remaining: 0,
        resetTime: new Date(),
        userType: 'anonymous',
        reason: 'Could not determine client identifier'
      }
    };
  }

  // Check rate limit
  const result = await rateLimiter.checkRateLimit(identifier, action);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', getRateLimitForAction(identifier, action));
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime.getTime() / 1000));
  res.setHeader('X-RateLimit-UserType', result.userType);

  if (!result.allowed) {
    // Log rate limit hit for monitoring
    console.log(`[RATE LIMIT] ${action} blocked for ${result.userType} user ${identifier}: ${result.reason}`);
  }

  return { allowed: result.allowed, result };
}

/**
 * Extract client IP from request
 */
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const realIP = req.headers['x-real-ip'] as string;
  const connectionIP = req.connection?.remoteAddress;
  const socketIP = req.socket?.remoteAddress;

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return realIP || connectionIP || socketIP || '127.0.0.1';
}

/**
 * Get rate limit value for specific action
 */
function getRateLimitForAction(identifier: string, action: 'jobs' | 'messages' | 'orchestration' | 'scheduling'): number {
  const limits = rateLimiter.getUserLimits(identifier);
  return limits[action].maxRequests;
}

/**
 * Rate limit error response
 */
export function rateLimitErrorResponse(res: NextApiResponse, result: RateLimitResult): void {
  res.status(429).json({
    error: 'Rate limit exceeded',
    message: result.reason,
    userType: result.userType,
    resetTime: result.resetTime.toISOString(),
    upgradeMessage: result.userType === 'anonymous' 
      ? 'Connect your wallet for higher limits'
      : result.userType === 'free'
      ? 'Upgrade to Pro for higher limits'
      : undefined
  });
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimitProtection(
  action: 'jobs' | 'messages' | 'orchestration' | 'scheduling',
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Check rate limit first
    const { allowed, result } = await withRateLimit(req, res, action);
    
    if (!allowed) {
      return rateLimitErrorResponse(res, result);
    }

    // If allowed, proceed with the original handler
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`API handler error for ${action}:`, error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}