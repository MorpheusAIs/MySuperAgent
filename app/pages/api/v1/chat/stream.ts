import { NextApiRequest, NextApiResponse } from 'next';
import { ChatRequest } from '@/services/agents/types';
import { AgentRegistry } from '@/services/agents/core/agent-registry';
import { orchestrator } from '@/services/agents/orchestrator';
import { initializeAgents } from '@/services/agents/initialize';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError, createSafeErrorResponse, validateRequired } from '@/services/utils/errors';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const chatRequest: ChatRequest = req.body;
    
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
      const { error: errorMessage, statusCode } = createSafeErrorResponse(error);
      return res.status(statusCode).json({ error: errorMessage });
    }

    // Ensure agents are initialized
    await initializeAgents();

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ type: 'connected', requestId: chatRequest.requestId })}\n\n`);

    // Set up event listeners for orchestration events (matching Python implementation)
    const eventHandlers = {
      'flow-start': (data: any) => {
        res.write(`event: flow_start\ndata: ${JSON.stringify({ type: 'flow_start', data })}\n\n`);
      },
      'subtask-dispatch': (data: any) => {
        res.write(`event: subtask_dispatch\ndata: ${JSON.stringify({ type: 'subtask_dispatch', data })}\n\n`);
      },
      'subtask-result': (data: any) => {
        res.write(`event: subtask_result\ndata: ${JSON.stringify({ type: 'subtask_result', data })}\n\n`);
      },
      'synthesis-start': (data: any) => {
        res.write(`event: synthesis_start\ndata: ${JSON.stringify({ type: 'synthesis_start', data })}\n\n`);
      },
      'synthesis-complete': (data: any) => {
        res.write(`event: synthesis_complete\ndata: ${JSON.stringify({ type: 'synthesis_complete', data })}\n\n`);
      },
      'flow-end': (data: any) => {
        res.write(`event: flow_end\ndata: ${JSON.stringify({ type: 'flow_end', data })}\n\n`);
      },
    };

    // Register event listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      orchestrator.onEvent(event, handler);
    });

    // Start streaming processing
    orchestrator.streamOrchestration(chatRequest, res)
      .catch((error) => {
        res.write(`data: ${JSON.stringify({ 
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error' 
        })}\n\n`);
        res.end();
      })
      .finally(() => {
        // Clean up event listeners
        Object.entries(eventHandlers).forEach(([event, handler]) => {
          orchestrator.removeEventListener(event, handler);
        });
      });

    // Handle client disconnect
    req.on('close', () => {
      // Client disconnected - stream will naturally end
    });

  } catch (error) {
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}