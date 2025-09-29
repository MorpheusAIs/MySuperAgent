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

  // Create a new orchestrator instance for this request
  const requestOrchestrator = createOrchestrator(chatRequest.requestId);

  // Run orchestration with timeout and enhanced error handling
  try {
    const [currentAgent, agentResponse] = await withTimeout(
      requestOrchestrator.runOrchestrationWithRetry(
        chatRequest,
        walletAddress,
        3 // max retries
      ),
      AGENT_EXECUTION_TIMEOUT_MS,
      'Agent execution'
    );

    return {
      response: agentResponse,
      current_agent: currentAgent,
    };
  } catch (error) {
    console.error(`[ORCHESTRATION] Execution failed for request ${chatRequest.requestId}:`, error);
    throw error;
  }
}