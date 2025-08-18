import { NextApiRequest, NextApiResponse } from 'next';
import { UserMCPManager } from '@/services/mcp/user-mcp-manager';

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
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ 
        error: 'Missing required parameter: walletAddress' 
      });
    }

    const servers = await UserMCPManager.getUserMCPServers(walletAddress);

    // Calculate summary statistics
    const totalServers = servers.length;
    const enabledServers = servers.filter(s => s.isEnabled).length;
    const healthyServers = servers.filter(s => s.healthStatus === 'healthy').length;
    const totalTools = servers.reduce((sum, s) => sum + s.availableTools, 0);

    return res.status(200).json({
      walletAddress,
      servers,
      summary: {
        totalServers,
        enabledServers,
        healthyServers,
        totalTools
      }
    });

  } catch (error) {
    console.error('Error getting MCP server status:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get MCP server status' 
    });
  }
}