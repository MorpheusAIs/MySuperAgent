import { NextRequest, NextResponse } from 'next/server';
import { AgentRegistry } from '@/services/agents/core/agent-registry';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

/**
 * GET /api/agents/user-registry
 * Get comprehensive agent registry information for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const action = searchParams.get('action') || 'summary';

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'summary':
        const summary = await AgentRegistry.getUserCapabilitySummary(walletAddress);
        return NextResponse.json({
          success: true,
          summary
        });

      case 'agents':
        const agents = await AgentRegistry.getUserAvailableAgents(walletAddress);
        return NextResponse.json({
          success: true,
          agents,
          total: agents.length
        });

      case 'mcp-tools':
        const mcpTools = await AgentRegistry.getUserMCPTools(walletAddress);
        return NextResponse.json({
          success: true,
          tools: mcpTools,
          total: mcpTools.length
        });

      case 'a2a-agents':
        const a2aAgents = await AgentRegistry.getUserA2AAgents(walletAddress);
        return NextResponse.json({
          success: true,
          agents: a2aAgents,
          total: a2aAgents.length
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: summary, agents, mcp-tools, or a2a-agents' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('User agent registry error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get user agent registry',
        success: false
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/user-registry
 * Refresh user agent registry data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, action } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'refresh':
        await AgentRegistry.refreshUserData(walletAddress);
        const updatedSummary = await AgentRegistry.getUserCapabilitySummary(walletAddress);
        
        return NextResponse.json({
          success: true,
          message: 'User agent data refreshed successfully',
          summary: updatedSummary
        });

      case 'clear':
        AgentRegistry.clearUserData(walletAddress);
        
        return NextResponse.json({
          success: true,
          message: 'User agent data cleared successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: refresh or clear' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('User agent registry action error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to perform user agent registry action',
        success: false
      },
      { status: 500 }
    );
  }
}