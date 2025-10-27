import { initializeAgents } from '@/services/agents/initialize';
import { createOrchestrator } from '@/services/agents/orchestrator';
import { ChatRequest } from '@/services/agents/types';
import {
  ValidationError,
  createSafeErrorResponse,
  validateRequired,
} from '@/services/utils/errors';
import { defaultChatSimilarityService } from '@/services/similarity/chat-similarity-service';
import { MessageDB } from '@/services/database/db';
import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { withRateLimit, rateLimitErrorResponse } from '@/middleware/rate-limiting';

// Timeout configuration
const ORCHESTRATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const AGENT_SELECTION_TIMEOUT_MS = 30 * 1000; // 30 seconds
const AGENT_EXECUTION_TIMEOUT_MS = 4 * 60 * 1000; // 4 minutes

// Timeout utility function
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check rate limits first
  const { allowed, result } = await withRateLimit(req, res, 'orchestration');
  if (!allowed) {
    return rateLimitErrorResponse(res, result);
  }

  const startTime = Date.now();
  let chatRequest: ChatRequest;
  let walletAddress: string | undefined;
  
  try {
    // Wrap entire orchestration in timeout
    const result = await withTimeout(
      executeOrchestration(req),
      ORCHESTRATION_TIMEOUT_MS,
      'Orchestration'
    );
    
    const processingTime = Date.now() - startTime;
    console.log(`[ORCHESTRATION] Completed successfully in ${processingTime}ms`);
    
    return res.status(200).json({
      ...result,
      _meta: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[ORCHESTRATION ERROR] Failed after ${processingTime}ms:`, error);
    
    const { error: errorMessage, statusCode } = createSafeErrorResponse(error);
    return res.status(statusCode).json({ 
      error: errorMessage,
      _meta: {
        processingTime,
        timestamp: new Date().toISOString(),
        failed: true
      }
    });
  }
}

async function executeOrchestration(req: NextApiRequest) {
  const chatRequest: ChatRequest = req.body;
  const walletAddress = req.body.walletAddress;

  // Generate request ID if not provided
  if (!chatRequest.requestId) {
    chatRequest.requestId = uuidv4();
  }

  console.log(`[ORCHESTRATION] Starting request ${chatRequest.requestId}`);

  // Validate required fields
  try {
    validateRequired(chatRequest, ['prompt'] as (keyof ChatRequest)[]);
    if (!chatRequest.prompt?.content) {
      throw new ValidationError('Missing prompt content');
    }
  } catch (error) {
    const { error: errorMessage, statusCode } =
      createSafeErrorResponse(error);
    throw new Error(errorMessage);
  }

  // Ensure agents are initialized with timeout
  try {
    await withTimeout(
      initializeAgents(),
      AGENT_SELECTION_TIMEOUT_MS,
      'Agent initialization'
    );
  } catch (error) {
    console.error('[ORCHESTRATION] Agent initialization failed:', error);
    throw new Error('Failed to initialize agents: ' + (error as Error).message);
  }

  // Process similarity detection if wallet address provided
  let enhancedRequest = chatRequest;
  if (walletAddress) {
    try {
      console.log(`[ORCHESTRATION] Processing similarity detection for wallet: ${walletAddress}`);
      enhancedRequest = await defaultChatSimilarityService.processChatRequest(
        chatRequest,
        walletAddress
      );
      console.log(`[ORCHESTRATION] Similarity detection complete - found ${enhancedRequest.similarPrompts?.length || 0} similar prompts`);
    } catch (similarityError) {
      console.error('[ORCHESTRATION] Similarity detection failed:', similarityError);
      // Continue without similarity context if it fails
    }
  } else {
    // For non-logged-in users, add temporal context to prevent duplicate responses
    const currentDate = new Date();
    const timestamp = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
    enhancedRequest = {
      ...chatRequest,
      prompt: {
        ...chatRequest.prompt,
        content: `[Request at ${timestamp}]\n\n${chatRequest.prompt.content}`
      }
    };
  }

  // Create a new orchestrator instance for this request
  const requestOrchestrator = createOrchestrator(chatRequest.requestId);

  // Run orchestration with timeout and enhanced error handling
  try {
    const [currentAgent, agentResponse] = await withTimeout(
      requestOrchestrator.runOrchestrationWithRetry(
        enhancedRequest,
        walletAddress,
        3 // max retries
      ),
      AGENT_EXECUTION_TIMEOUT_MS,
      'Agent execution'
    );

    // Save messages to database if wallet address is provided and conversationId exists
    // This enables similarity detection for future requests
    if (walletAddress && chatRequest.conversationId) {
      try {
        console.log(`[ORCHESTRATION] Saving messages to database for conversation: ${chatRequest.conversationId}`);

        // Get current message count to determine order indices
        const existingMessages = await MessageDB.getMessagesByJob(chatRequest.conversationId);
        let orderIndex = existingMessages.length;

        // Save user message
        await MessageDB.createMessage({
          job_id: chatRequest.conversationId,
          role: 'user',
          content: chatRequest.prompt.content,
          order_index: orderIndex++,
          metadata: {},
          requires_action: false,
          is_streaming: false
        });

        // Save assistant response
        await MessageDB.createMessage({
          job_id: chatRequest.conversationId,
          role: 'assistant',
          content: typeof agentResponse.content === 'string' ? agentResponse.content : JSON.stringify(agentResponse.content),
          agent_name: currentAgent,
          metadata: agentResponse.metadata || {},
          order_index: orderIndex,
          requires_action: false,
          action_type: agentResponse.actionType,
          is_streaming: false
        });

        console.log(`[ORCHESTRATION] Messages saved successfully to database`);

        // Clear similarity cache so next request will fetch fresh messages including these new ones
        defaultChatSimilarityService.clearCache();
        console.log(`[ORCHESTRATION] Cleared similarity cache for fresh detection on next request`);
      } catch (saveError) {
        console.error(`[ORCHESTRATION] Failed to save messages to database:`, saveError);
        // Continue even if save fails - don't block the response
      }
    }

    return {
      response: agentResponse,
      current_agent: currentAgent,
    };
  } catch (error) {
    console.error(`[ORCHESTRATION] Execution failed for request ${chatRequest.requestId}:`, error);
    throw error;
  }
}