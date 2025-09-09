import { NextApiRequest, NextApiResponse } from 'next';
import { UserA2AManager } from '@/services/a2a/user-a2a-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

/**
 * GET /api/a2a/agents/[walletAddress]
 * Get all A2A agents for a user
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        error: 'Wallet address is required',
        success: false
      });
    }

    const agents = await UserA2AManager.getUserA2AAgents(walletAddress);

    return res.status(200).json({
      success: true,
      agents,
      total: agents.length
    });

  } catch (error) {
    console.error('Get A2A agents error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get A2A agents',
      success: false
    });
  }
}