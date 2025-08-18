import { NextApiRequest, NextApiResponse } from 'next';
import { UserMCPManager } from '@/services/mcp/user-mcp-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

interface DisableMCPServerRequest {
  walletAddress: string;
  serverName: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, serverName }: DisableMCPServerRequest = req.body;

    if (!walletAddress || !serverName) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, serverName' 
      });
    }

    await UserMCPManager.disableMCPServer(walletAddress, serverName);

    return res.status(200).json({
      success: true,
      message: `MCP server ${serverName} disabled successfully`
    });

  } catch (error) {
    console.error('Error disabling MCP server:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to disable MCP server' 
    });
  }
}