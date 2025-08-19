import { NextRequest, NextResponse } from 'next/server';
import { UserA2AManager } from '@/services/a2a/user-a2a-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

/**
 * GET /api/a2a/tasks/[taskId]
 * Get task result from an A2A agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const agentId = searchParams.get('agentId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

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

    const taskResult = await UserA2AManager.getTaskResult(walletAddress, agentId, taskId);

    if (!taskResult) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      taskResult
    });

  } catch (error) {
    console.error('Get A2A task result error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get task result',
        success: false
      },
      { status: 500 }
    );
  }
}