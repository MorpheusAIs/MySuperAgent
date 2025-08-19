import { NextRequest, NextResponse } from 'next/server';
import { UserA2AManager } from '@/services/a2a/user-a2a-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

/**
 * POST /api/a2a/agents/disconnect
 * Disconnect from an A2A agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, agentId } = body;

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

    await UserA2AManager.disconnectFromA2AAgent(walletAddress, agentId);

    return NextResponse.json({
      success: true,
      message: `Disconnected from agent ${agentId}`
    });

  } catch (error) {
    console.error('A2A agent disconnection error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to disconnect from A2A agent',
        success: false
      },
      { status: 500 }
    );
  }
}