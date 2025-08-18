import { NextRequest, NextResponse } from 'next/server';
import { UserA2AManager } from '@/services/a2a/user-a2a-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

/**
 * POST /api/a2a/agents/connect
 * Connect to an external A2A agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, agentCard, endpoint } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!agentCard) {
      return NextResponse.json(
        { error: 'Agent card is required' },
        { status: 400 }
      );
    }

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint URL is required' },
        { status: 400 }
      );
    }

    // Validate agent card structure
    if (!agentCard.id || !agentCard.name || !agentCard.capabilities) {
      return NextResponse.json(
        { error: 'Invalid agent card: missing required fields (id, name, capabilities)' },
        { status: 400 }
      );
    }

    const agentStatus = await UserA2AManager.connectToA2AAgent({
      walletAddress,
      agentCard,
      endpoint
    });

    return NextResponse.json({
      success: true,
      agentStatus
    });

  } catch (error) {
    console.error('A2A agent connection error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to connect to A2A agent',
        success: false
      },
      { status: 500 }
    );
  }
}