import { NextRequest, NextResponse } from 'next/server';
import { UserA2AManager } from '@/services/a2a/user-a2a-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

/**
 * GET /api/a2a/status
 * Get comprehensive A2A status for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get all user's A2A agents
    const agents = await UserA2AManager.getUserA2AAgents(walletAddress);

    // Calculate summary statistics
    const totalAgents = agents.length;
    const enabledAgents = agents.filter(agent => agent.isEnabled).length;
    const connectedAgents = agents.filter(agent => agent.connectionStatus === 'connected').length;
    const errorAgents = agents.filter(agent => agent.connectionStatus === 'error').length;

    // Group agents by connection status
    const agentsByStatus = {
      connected: agents.filter(agent => agent.connectionStatus === 'connected'),
      disconnected: agents.filter(agent => agent.connectionStatus === 'disconnected'),
      error: agents.filter(agent => agent.connectionStatus === 'error'),
      unknown: agents.filter(agent => agent.connectionStatus === 'unknown')
    };

    // Get unique capabilities across all agents
    const allCapabilities = new Set<string>();
    agents.forEach(agent => {
      agent.capabilities.forEach(cap => allCapabilities.add(cap));
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalAgents,
        enabledAgents,
        connectedAgents,
        errorAgents,
        availableCapabilities: Array.from(allCapabilities).length
      },
      agents,
      agentsByStatus: {
        connected: agentsByStatus.connected.length,
        disconnected: agentsByStatus.disconnected.length,
        error: agentsByStatus.error.length,
        unknown: agentsByStatus.unknown.length
      },
      capabilities: Array.from(allCapabilities),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get A2A status error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get A2A status',
        success: false
      },
      { status: 500 }
    );
  }
}