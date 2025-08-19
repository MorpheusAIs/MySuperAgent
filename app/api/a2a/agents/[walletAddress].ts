import { NextRequest, NextResponse } from 'next/server';
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
export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const { walletAddress } = params;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const agents = await UserA2AManager.getUserA2AAgents(walletAddress);

    return NextResponse.json({
      success: true,
      agents,
      total: agents.length
    });

  } catch (error) {
    console.error('Get A2A agents error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get A2A agents',
        success: false
      },
      { status: 500 }
    );
  }
}