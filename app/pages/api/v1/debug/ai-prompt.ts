import { initializeAgents } from '@/services/agents/initialize';
import { defaultChatSimilarityService } from '@/services/similarity/chat-similarity-service';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, walletAddress = 'test-wallet-123' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Initialize agents
    await initializeAgents();

    // Process with similarity service
    const chatRequest = {
      prompt: { role: 'user', content: prompt },
      conversationId: 'debug-conversation',
    };

    const enhancedRequest =
      await defaultChatSimilarityService.processChatRequest(
        chatRequest,
        walletAddress
      );

    return res.status(200).json({
      success: true,
      originalPrompt: prompt,
      enhancedRequest: {
        hasSimilarityContext: !!enhancedRequest.similarityContext,
        similarPromptsCount: enhancedRequest.similarPrompts?.length || 0,
        similarPrompts: enhancedRequest.similarPrompts,
        similarityContext: enhancedRequest.similarityContext,
      },
    });
  } catch (error) {
    console.error('Error debugging AI prompt:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
