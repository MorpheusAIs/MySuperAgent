import { NextApiRequest, NextApiResponse } from 'next';
import { UserCredentialManager } from '@/services/credentials/user-credential-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

interface GetUserServicesRequest {
  walletAddress: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.query as { walletAddress: string };

    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Missing required parameter: walletAddress' 
      });
    }

    const services = await UserCredentialManager.getUserServices(walletAddress);

    return res.status(200).json({
      walletAddress,
      services,
      totalServices: services.length,
      totalCredentials: services.reduce((sum, service) => sum + service.credentialCount, 0)
    });

  } catch (error) {
    console.error('Error getting user services:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get user services' 
    });
  }
}