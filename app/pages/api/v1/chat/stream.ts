import { initializeAgents } from '@/services/agents/initialize';
import { createOrchestrator } from '@/services/agents/orchestrator';
import { ChatRequest } from '@/services/agents/types';
import { defaultChatSimilarityService } from '@/services/similarity/chat-similarity-service';
import {
  ValidationError,
  createSafeErrorResponse,
  validateRequired,
} from '@/services/utils/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const chatRequest: ChatRequest = req.body;
    const walletAddress = req.body.walletAddress; // Extract wallet address from request

    // Generate request ID if not provided
    if (!chatRequest.requestId) {
      chatRequest.requestId = uuidv4();
    }

    // Validate required fields
    try {
      validateRequired(chatRequest, ['prompt'] as (keyof ChatRequest)[]);
      if (!chatRequest.prompt?.content) {
        throw new ValidationError('Missing prompt content');
      }
    } catch (error) {
      const { error: errorMessage, statusCode } =
        createSafeErrorResponse(error);
      return res.status(statusCode).json({ error: errorMessage });
    }

    // Ensure agents are initialized
    await initializeAgents();

    // Process chat request with similarity checking (with timeout protection)
    let enhancedChatRequest = chatRequest;
    try {
      const similarityPromise = defaultChatSimilarityService.processChatRequest(
        chatRequest,
        walletAddress
      );

      // Add timeout to prevent blocking
      enhancedChatRequest = await Promise.race([
        similarityPromise,
        new Promise<ChatRequest>((resolve) => {
          setTimeout(() => {
            console.log(
              '[ChatStreamAPI] Similarity processing timeout, using original request'
            );
            resolve(chatRequest);
          }, 2000); // 2 second timeout
        }),
      ]);
    } catch (error) {
      console.error(
        '[ChatStreamAPI] Error in similarity processing, using original request:',
        error
      );
      enhancedChatRequest = chatRequest;
    }

    // Create a new orchestrator instance for this request to avoid state conflicts
    const requestOrchestrator = createOrchestrator(chatRequest.requestId);

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // Send initial connection event
    res.write(
      `event: connected\ndata: ${JSON.stringify({
        type: 'connected',
        requestId: chatRequest.requestId,
      })}\n\n`
    );

    // Set up event listeners for orchestration events (matching Python implementation)
    const eventHandlers = {
      'flow-start': (data: any) => {
        res.write(
          `event: flow_start\ndata: ${JSON.stringify({
            type: 'flow_start',
            data,
          })}\n\n`
        );
      },
      'subtask-dispatch': (data: any) => {
        res.write(
          `event: subtask_dispatch\ndata: ${JSON.stringify({
            type: 'subtask_dispatch',
            data,
          })}\n\n`
        );
      },
      'subtask-result': (data: any) => {
        res.write(
          `event: subtask_result\ndata: ${JSON.stringify({
            type: 'subtask_result',
            data,
          })}\n\n`
        );
      },
      'synthesis-start': (data: any) => {
        res.write(
          `event: synthesis_start\ndata: ${JSON.stringify({
            type: 'synthesis_start',
            data,
          })}\n\n`
        );
      },
      'synthesis-complete': (data: any) => {
        res.write(
          `event: synthesis_complete\ndata: ${JSON.stringify({
            type: 'synthesis_complete',
            data,
          })}\n\n`
        );
      },
      'flow-end': (data: any) => {
        res.write(
          `event: flow_end\ndata: ${JSON.stringify({
            type: 'flow_end',
            data,
          })}\n\n`
        );
      },
    };

    // Register event listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      requestOrchestrator.onEvent(event, handler);
    });

    // Start streaming processing
    requestOrchestrator
      .streamOrchestration(enhancedChatRequest, res)
      .catch((error) => {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          })}\n\n`
        );
        res.end();
      })
      .finally(() => {
        // Clean up event listeners from the instance-based orchestrator
        Object.entries(eventHandlers).forEach(([event, handler]) => {
          requestOrchestrator.removeEventListener(event, handler);
        });
      });

    // Handle client disconnect
    req.on('close', () => {
      // Client disconnected - stream will naturally end
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
