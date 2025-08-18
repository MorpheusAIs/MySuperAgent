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
    const { walletAddress, serverName } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ 
        error: 'Missing required parameter: walletAddress' 
      });
    }

    const tools = await UserMCPManager.getUserAvailableTools(walletAddress);

    // Filter by server if specified
    let filteredTools = tools;
    if (serverName && typeof serverName === 'string') {
      filteredTools = tools.filter(tool => tool.serverName === serverName);
    }

    // Group tools by server for better organization
    const toolsByServer = filteredTools.reduce((acc, tool) => {
      if (!acc[tool.serverName]) {
        acc[tool.serverName] = [];
      }
      acc[tool.serverName].push(tool);
      return acc;
    }, {} as Record<string, typeof tools>);

    // Calculate summary statistics
    const totalTools = filteredTools.length;
    const serverCount = Object.keys(toolsByServer).length;

    return res.status(200).json({
      walletAddress,
      tools: filteredTools,
      toolsByServer,
      summary: {
        totalTools,
        serverCount,
        servers: Object.keys(toolsByServer)
      }
    });

  } catch (error) {
    console.error('Error getting MCP tools:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get MCP tools' 
    });
  }
}