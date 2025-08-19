import { NextRequest, NextResponse } from 'next/server';
import { AgentRegistry } from '@/services/agents/core/agent-registry';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

/**
 * GET /api/registry/summary
 * Get comprehensive registry summary for a user
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

    // Get comprehensive capability summary
    const capabilitySummary = await AgentRegistry.getUserCapabilitySummary(walletAddress);
    
    // Get all available agents
    const userAgents = await AgentRegistry.getUserAvailableAgents(walletAddress);
    
    // Get MCP tools and A2A agents separately for detailed info
    const mcpTools = await AgentRegistry.getUserMCPTools(walletAddress);
    const a2aAgents = await AgentRegistry.getUserA2AAgents(walletAddress);

    return NextResponse.json({
      success: true,
      summary: capabilitySummary,
      agents: userAgents,
      mcpTools,
      a2aAgents,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Registry summary error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get registry summary',
        success: false
      },
      { status: 500 }
    );
  }
}