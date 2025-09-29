import { defaultChatSimilarityService } from '@/services/similarity/chat-similarity-service';
import { TFIDFSimilarityService } from '@/services/similarity/tf-idf-similarity';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, walletAddress } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Test the similarity service
    const chatRequest = {
      prompt: { role: 'user', content: prompt },
      conversationId: 'test-conversation',
    };

    const enhancedRequest =
      await defaultChatSimilarityService.processChatRequest(
        chatRequest,
        walletAddress || 'test-wallet'
      );

    // Test the TF-IDF service directly with diverse examples including crypto
    const mockMessages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'Tell me a joke about crypto wallets',
        job_id: 'job1',
        created_at: new Date('2024-01-01'),
        order_index: 1,
        metadata: {},
        requires_action: false,
        is_streaming: false,
      },
      {
        id: '2',
        role: 'assistant' as const,
        content:
          'Why did the crypto wallet go to therapy? Because it had too many trust issues! 😄',
        job_id: 'job1',
        created_at: new Date('2024-01-01'),
        order_index: 2,
        metadata: {},
        requires_action: false,
        is_streaming: false,
      },
      {
        id: '3',
        role: 'user' as const,
        content: 'Can you tell me a crypto wallet joke?',
        job_id: 'job2',
        created_at: new Date('2024-01-02'),
        order_index: 3,
        metadata: {},
        requires_action: false,
        is_streaming: false,
      },
      {
        id: '4',
        role: 'assistant' as const,
        content:
          "What do you call a crypto wallet that lost its keys? A hardware wallet! (Because it's now just a paperweight) 🗝️",
        job_id: 'job2',
        created_at: new Date('2024-01-02'),
        order_index: 4,
        metadata: {},
        requires_action: false,
        is_streaming: false,
      },
      {
        id: '5',
        role: 'user' as const,
        content: 'How do I create a React component?',
        job_id: 'job3',
        created_at: new Date('2024-01-03'),
        order_index: 5,
        metadata: {},
        requires_action: false,
        is_streaming: false,
      },
      {
        id: '6',
        role: 'assistant' as const,
        content:
          'You can create a React component using function component syntax. Start with a simple function that returns JSX...',
        job_id: 'job3',
        created_at: new Date('2024-01-03'),
        order_index: 6,
        metadata: {},
        requires_action: false,
        is_streaming: false,
      },
      {
        id: '7',
        role: 'user' as const,
        content: 'What is the best way to build React components?',
        job_id: 'job4',
        created_at: new Date('2024-01-04'),
        order_index: 7,
        metadata: {},
        requires_action: false,
        is_streaming: false,
      },
      {
        id: '8',
        role: 'assistant' as const,
        content:
          'For React component structure, I recommend organizing components in folders by feature. Use hooks for state management...',
        job_id: 'job4',
        created_at: new Date('2024-01-04'),
        order_index: 8,
        metadata: {},
        requires_action: false,
        is_streaming: false,
      },
    ];

    const similarityService = new TFIDFSimilarityService({
      similarityThreshold: 0.3, // Much lower threshold for testing
      maxSimilarPrompts: 3,
      minPromptLength: 5,
    });

    const similarPrompts = await similarityService.findSimilarPrompts(
      prompt,
      mockMessages,
      walletAddress || 'test-wallet'
    );

    return res.status(200).json({
      success: true,
      originalPrompt: prompt,
      enhancedRequest: {
        hasSimilarityContext: !!enhancedRequest.similarityContext,
        similarPromptsCount: enhancedRequest.similarPrompts?.length || 0,
      },
      directSimilarityTest: {
        similarPromptsFound: similarPrompts.length,
        similarPrompts: similarPrompts.map((p) => ({
          prompt: p.prompt,
          similarity: Math.round(p.similarity * 100) + '%',
        })),
      },
      serviceConfig: defaultChatSimilarityService.getConfig(),
    });
  } catch (error) {
    console.error('Error testing similarity service:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
