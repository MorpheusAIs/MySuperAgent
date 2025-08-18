import { NextApiRequest, NextApiResponse } from 'next';
import { UserMCPManager } from '@/services/mcp/user-mcp-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

interface HealthCheckRequest {
  walletAddress: string;
  serverName?: string; // If specified, check only this server
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, serverName }: HealthCheckRequest = req.body;

    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Missing required field: walletAddress' 
      });
    }

    let healthResults: Record<string, 'healthy' | 'error' | 'timeout'>;

    if (serverName) {
      // Check specific server
      const status = await UserMCPManager.checkServerHealth(walletAddress, serverName);
      healthResults = { [serverName]: status };
    } else {
      // Check all servers
      healthResults = await UserMCPManager.runHealthCheckForAllServers(walletAddress);
    }

    // Calculate summary
    const totalChecked = Object.keys(healthResults).length;
    const healthyCount = Object.values(healthResults).filter(status => status === 'healthy').length;
    const errorCount = Object.values(healthResults).filter(status => status === 'error').length;
    const timeoutCount = Object.values(healthResults).filter(status => status === 'timeout').length;

    return res.status(200).json({
      walletAddress,
      healthResults,
      summary: {
        totalChecked,
        healthyCount,
        errorCount,
        timeoutCount,
        allHealthy: healthyCount === totalChecked
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error running health check:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to run health check' 
    });
  }
}