import { initializeAgents } from '@/services/agents/initialize';
import { createOrchestrator } from '@/services/agents/orchestrator';
import { ChatRequest } from '@/services/agents/types';
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

    // Create a new orchestrator instance for this request
    const requestOrchestrator = createOrchestrator(chatRequest.requestId);

    // Run orchestration and get the result directly (no streaming)
    const [currentAgent, agentResponse] = await requestOrchestrator.runOrchestration(
      chatRequest,
      walletAddress
    );

    return res.status(200).json({
      response: agentResponse,
      current_agent: currentAgent,
    });
  } catch (error) {
    console.error('Error handling orchestrated chat:', error);
    const { error: errorMessage, statusCode } = createSafeErrorResponse(error);
    return res.status(statusCode).json({ error: errorMessage });
  }
}