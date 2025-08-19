import { NextRequest, NextResponse } from 'next/server';
import { UserA2AManager } from '@/services/a2a/user-a2a-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

/**
 * POST /api/a2a/communication/message
 * Send a message to an A2A agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, targetAgentId, message } = body;

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

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate message structure
    if (!message.content || !message.type) {
      return NextResponse.json(
        { error: 'Message must have content and type fields' },
        { status: 400 }
      );
    }

    if (!['text', 'json', 'binary'].includes(message.type)) {
      return NextResponse.json(
        { error: 'Message type must be text, json, or binary' },
        { status: 400 }
      );
    }

    const response = await UserA2AManager.sendMessageToAgent({
      walletAddress,
      targetAgentId,
      message
    });

    return NextResponse.json({
      success: true,
      response
    });

  } catch (error) {
    console.error('A2A message sending error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to send message to A2A agent',
        success: false
      },
      { status: 500 }
    );
  }
}