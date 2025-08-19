import { NextApiRequest, NextApiResponse } from 'next';
import { AgentRegistry } from '@/services/agents/agent-registry';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, popular, search } = req.query;

    let agents = AgentRegistry.getAllAgents();

    // Filter by category if specified
    if (category && typeof category === 'string') {
      agents = AgentRegistry.getAgentsByCategory(category as any);
    }

    // Filter by popularity if specified
    if (popular === 'true') {
      agents = AgentRegistry.getPopularAgents();
    }

    // Search if query provided
    if (search && typeof search === 'string') {
      agents = AgentRegistry.searchAgents(search);
    }

    // Get categories for metadata
    const categories = AgentRegistry.getCategories();

    return res.status(200).json({
      agents,
      categories,
      totalAgents: agents.length,
      popularCount: AgentRegistry.getPopularAgents().length,
      builtInCount: agents.filter(a => a.isBuiltIn).length
    });

  } catch (error) {
    console.error('Error getting available agents:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get available agents' 
    });
  }
}