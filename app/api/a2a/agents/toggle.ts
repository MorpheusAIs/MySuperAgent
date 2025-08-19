import { NextRequest, NextResponse } from 'next/server';
import { UserA2AManager } from '@/services/a2a/user-a2a-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

/**
 * POST /api/a2a/agents/toggle
 * Enable or disable an A2A agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, agentId, enabled } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Enabled status must be a boolean value' },
        { status: 400 }
      );
    }

    await UserA2AManager.toggleA2AAgent(walletAddress, agentId, enabled);

    return NextResponse.json({
      success: true,
      message: `Agent ${agentId} ${enabled ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    console.error('A2A agent toggle error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to toggle A2A agent',
        success: false
      },
      { status: 500 }
    );
  }
}