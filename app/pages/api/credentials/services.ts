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
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle both GET (query params) and POST (body params)
    let walletAddress: string;
    
    if (req.method === 'GET') {
      walletAddress = req.query.walletAddress as string;
    } else {
      walletAddress = req.body.walletAddress;
    }

    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Missing required parameter: walletAddress' 
      });
    }

    // TODO: Implement proper UserCredentialManager.getUserServices
    // For now, return empty services to prevent errors
    const services: any[] = [];

    try {
      // Try to get services, but fall back to empty if it fails
      const actualServices = await UserCredentialManager.getUserServices(walletAddress);
      services.push(...actualServices);
    } catch (serviceError) {
      console.warn('UserCredentialManager not available, returning empty services:', serviceError);
    }

    return res.status(200).json({
      walletAddress,
      services,
      totalServices: services.length,
      totalCredentials: services.reduce((sum, service) => sum + (service.credentialCount || 0), 0)
    });

  } catch (error) {
    console.error('Error getting user services:', error);
    // Return empty services instead of error to prevent UI breaking
    return res.status(200).json({
      walletAddress: req.query.walletAddress || '',
      services: [],
      totalServices: 0,
      totalCredentials: 0
    });
  }
}