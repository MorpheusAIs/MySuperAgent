import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { agents } = req.body;
    
    if (!Array.isArray(agents)) {
      return res.status(400).json({ error: 'Invalid agents array' });
    }

    // For now, just return success - agent selection is handled client-side
    // In the future, this could store selections in a database
    return res.status(200).json({ 
      status: 'success', 
      message: 'Selected agents updated',
      agents 
    });
  } catch (error) {
    console.error('Error setting selected agents:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}