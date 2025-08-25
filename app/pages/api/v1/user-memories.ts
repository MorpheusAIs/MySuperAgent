import type { NextApiRequest, NextApiResponse } from 'next';

// TODO: Re-enable when database module issues are resolved
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(503).json({
    error: 'Memories API temporarily disabled - using localStorage fallback',
  });
}

/* Disabled until database issues resolved
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    let DB;
    try {
      const dbModule = await import('@/services/database/db');
      DB = dbModule.default;
      
      // Check if the required DB classes are available
      if (!DB || !DB.UserMemoriesDB) {
        throw new Error('UserMemoriesDB not available in database module');
      }
    } catch (importError) {
      console.error('Database module not available:', importError);
      return res.status(503).json({
        error:
          'Database service unavailable. Please install dependencies and initialize the database.',
      });
    }

    switch (req.method) {
      case 'GET':
        // Get user memories
        const memories = await DB.UserMemoriesDB.getUserMemories(walletAddress);
        return res.status(200).json(memories);

      case 'POST':
        // Create new memory
        const { title, content } = req.body;

        if (!title || !content) {
          return res
            .status(400)
            .json({ error: 'Title and content are required' });
        }

        const newMemory = await DB.UserMemoriesDB.createMemory(
          walletAddress,
          title,
          content
        );
        return res.status(201).json(newMemory);

      case 'PUT':
        // Update memory
        const { id, updates } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Memory ID is required' });
        }

        const updatedMemory = await DB.UserMemoriesDB.updateMemory(
          id,
          walletAddress,
          updates
        );
        if (!updatedMemory) {
          return res.status(404).json({ error: 'Memory not found' });
        }
        return res.status(200).json(updatedMemory);

      case 'DELETE':
        const { memoryId, deleteAll } = req.query;

        if (deleteAll === 'true') {
          // Delete all memories
          await DB.UserMemoriesDB.deleteAllMemories(walletAddress);
          return res.status(204).end();
        } else if (memoryId && typeof memoryId === 'string') {
          // Delete specific memory
          await DB.UserMemoriesDB.deleteMemory(memoryId, walletAddress);
          return res.status(204).end();
        } else {
          return res
            .status(400)
            .json({ error: 'Memory ID or deleteAll parameter is required' });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res
          .status(405)
          .json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('User memories API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
} */
