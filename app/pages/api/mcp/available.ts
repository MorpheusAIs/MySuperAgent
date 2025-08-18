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
    const { category, popular, search } = req.query;

    let servers = MCPServerRegistry.getAllServers();

    // Filter by category if specified
    if (category && typeof category === 'string') {
      servers = MCPServerRegistry.getServersByCategory(category as any);
    }

    // Filter by popularity if specified
    if (popular === 'true') {
      servers = MCPServerRegistry.getPopularServers();
    }

    // Search if query provided
    if (search && typeof search === 'string') {
      servers = MCPServerRegistry.searchServers(search);
    }

    // Get categories for metadata
    const categories = MCPServerRegistry.getCategories();

    return res.status(200).json({
      servers,
      categories,
      totalServers: servers.length,
      popularCount: MCPServerRegistry.getPopularServers().length,
      noCredentialCount: MCPServerRegistry.getNoCredentialServers().length
    });

  } catch (error) {
    console.error('Error getting available MCP servers:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get available MCP servers' 
    });
  }
}