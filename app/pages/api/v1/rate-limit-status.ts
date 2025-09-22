import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimiter } from '@/services/rate-limiting/rate-limiter';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Get identifier (wallet address or IP)
    const walletAddress = req.headers['x-wallet-address'] as string;
    const clientIP = getClientIP(req);
    const identifier = walletAddress || clientIP;

    if (!identifier) {
      return res.status(400).json({ 
        error: 'Could not determine client identifier' 
      });
    }

    // Get all rate limit statuses
    const status = await rateLimiter.getAllRateLimitStatus(identifier);
    const userType = Object.values(status)[0]?.userType || 'anonymous';
    const limits = rateLimiter.getUserLimits(identifier);

    // Format response
    const formattedStatus = {
      userType,
      identifier: walletAddress ? `wallet:${walletAddress.substring(0, 8)}...` : `ip:${identifier}`,
      limits: {
        jobs: {
          current: limits.jobs.maxRequests - status.jobs.remaining,
          max: limits.jobs.maxRequests,
          remaining: status.jobs.remaining,
          resetTime: status.jobs.resetTime,
          windowDescription: `${Math.floor(limits.jobs.windowMs / 1000 / 60 / 60)} hours`,
          description: limits.jobs.description
        },
        messages: {
          current: limits.messages.maxRequests - status.messages.remaining,
          max: limits.messages.maxRequests,
          remaining: status.messages.remaining,
          resetTime: status.messages.resetTime,
          windowDescription: `${Math.floor(limits.messages.windowMs / 1000 / 60)} minutes`,
          description: limits.messages.description
        },
        orchestration: {
          current: limits.orchestration.maxRequests - status.orchestration.remaining,
          max: limits.orchestration.maxRequests,
          remaining: status.orchestration.remaining,
          resetTime: status.orchestration.resetTime,
          windowDescription: `${Math.floor(limits.orchestration.windowMs / 1000 / 60)} minutes`,
          description: limits.orchestration.description
        },
        scheduling: {
          current: limits.scheduling.maxRequests - status.scheduling.remaining,
          max: limits.scheduling.maxRequests,
          remaining: status.scheduling.remaining,
          resetTime: status.scheduling.resetTime,
          windowDescription: `${Math.floor(limits.scheduling.windowMs / 1000 / 60 / 60)} hours`,
          description: limits.scheduling.description
        }
      },
      upgradeInfo: {
        available: userType !== 'pro',
        currentTier: userType,
        nextTier: userType === 'anonymous' ? 'free' : 'pro',
        benefits: userType === 'anonymous' 
          ? [
              'Connect wallet for 25 jobs/day',
              '100 messages/hour',
              'Job scheduling enabled',
              'Persistent job history'
            ]
          : userType === 'free'
          ? [
              'Pro: 500 jobs/day',
              '1000 messages/hour', 
              'Priority support',
              'Advanced analytics'
            ]
          : []
      }
    };

    return res.status(200).json(formattedStatus);

  } catch (error) {
    console.error('Rate limit status API error:', error);
    return res.status(500).json({ 
      error: 'Failed to get rate limit status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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