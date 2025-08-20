import { NextRequest, NextResponse } from 'next/server';
import { UserA2AManager } from '@/services/a2a/user-a2a-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

/**
 * POST /api/a2a/health/check-all
 * Run health check on all enabled A2A agents for a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const healthResults = await UserA2AManager.runHealthCheckForAllAgents(walletAddress);

    // Calculate summary statistics
    const totalAgents = Object.keys(healthResults).length;
    const connectedAgents = Object.values(healthResults).filter(status => status === 'connected').length;
    const errorAgents = Object.values(healthResults).filter(status => status === 'error').length;
    const disconnectedAgents = Object.values(healthResults).filter(status => status === 'disconnected').length;

    return NextResponse.json({
      success: true,
      healthResults,
      summary: {
        total: totalAgents,
        connected: connectedAgents,
        disconnected: disconnectedAgents,
        error: errorAgents
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('A2A health check all error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to run health checks',
        success: false
      },
      { status: 500 }
    );
  }
}