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
    const walletAddress = req.query.walletAddress as string;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const stats = await defaultChatSimilarityService.getUserSimilarityStats(
      walletAddress
    );

    return res.status(200).json({ stats });
  } catch (error) {
    console.error('Error getting similarity stats:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
