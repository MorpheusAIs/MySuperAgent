import { NextRequest, NextResponse } from 'next/server';
import { UserA2AManager } from '@/services/a2a/user-a2a-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

/**
 * POST /api/a2a/communication/task
 * Create a task for an A2A agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, targetAgentId, task } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!targetAgentId) {
      return NextResponse.json(
        { error: 'Target agent ID is required' },
        { status: 400 }
      );
    }

    if (!task) {
      return NextResponse.json(
        { error: 'Task is required' },
        { status: 400 }
      );
    }

    // Validate task structure
    if (!task.taskType || !task.payload) {
      return NextResponse.json(
        { error: 'Task must have taskType and payload fields' },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (task.priority && !['low', 'normal', 'high'].includes(task.priority)) {
      return NextResponse.json(
        { error: 'Task priority must be low, normal, or high' },
        { status: 400 }
      );
    }

    const taskResult = await UserA2AManager.createTaskForAgent({
      walletAddress,
      targetAgentId,
      task
    });

    return NextResponse.json({
      success: true,
      taskResult
    });

  } catch (error) {
    console.error('A2A task creation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create task for A2A agent',
        success: false
      },
      { status: 500 }
    );
  }
}