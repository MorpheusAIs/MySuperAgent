import { NextRequest, NextResponse } from 'next/server';
import { UserA2AManager } from '@/services/a2a/user-a2a-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

/**
 * GET /api/a2a/discover
 * Discover available A2A agents on a network
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const serverUrl = searchParams.get('serverUrl');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!serverUrl) {
      return NextResponse.json(
        { error: 'Server URL is required' },
        { status: 400 }
      );
    }

    const agents = await UserA2AManager.discoverA2AAgents(serverUrl, walletAddress);

    return NextResponse.json({
      success: true,
      agents,
      total: agents.length
    });

  } catch (error) {
    console.error('A2A discovery error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to discover A2A agents',
        success: false
      },
      { status: 500 }
    );
  }
}