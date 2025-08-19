import { NextApiRequest, NextApiResponse } from 'next';
import { MCPServerRegistry } from '@/services/mcp/server-registry';

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
    const servers = MCPServerRegistry.getAllServers();
    const popular = MCPServerRegistry.getPopularServers();
    const categories = MCPServerRegistry.getCategories();

    return res.status(200).json({
      message: 'MCP Server Registry Test',
      totalServers: servers.length,
      popularServers: popular.length,
      categories: categories.length,
      sampleServer: servers[0] || null
    });

  } catch (error) {
    console.error('Error testing MCP registry:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to test MCP registry' 
    });
  }
}