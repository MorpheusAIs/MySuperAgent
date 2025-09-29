import { defaultChatSimilarityService } from '@/services/similarity/chat-similarity-service';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = defaultChatSimilarityService.getConfig();
    const cacheStats = defaultChatSimilarityService.getCacheStats();

    return res.status(200).json({
      status: 'ok',
      config,
      cache: cacheStats,
      message: 'Similarity service is running',
    });
  } catch (error) {
    console.error('Error getting similarity status:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
