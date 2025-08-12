import { NextApiRequest, NextApiResponse } from 'next';
import { AgentRegistry } from '@/services/agents/core/AgentRegistry';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize agents if not already done
    if (!AgentRegistry.isInitialized()) {
      await AgentRegistry.initialize();
    }

    const availableAgents = AgentRegistry.getAvailableAgents();
    
    return res.status(200).json(availableAgents);
  } catch (error) {
    console.error('Error fetching available agents:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}