import { NextApiRequest, NextApiResponse } from 'next';
import { UserCredentialManager } from '@/services/credentials/user-credential-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

interface GetCredentialsRequest {
  walletAddress: string;
  masterKey: string;
}

interface UpdateCredentialsRequest extends GetCredentialsRequest {
  credentials: { [credentialName: string]: string };
  validate?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { serviceName } = req.query;

  if (typeof serviceName !== 'string') {
    return res.status(400).json({ error: 'Invalid service name' });
  }

  switch (req.method) {
    case 'GET':
      return handleGetServiceCredentials(req, res, serviceName);
    case 'PUT':
      return handleUpdateServiceCredentials(req, res, serviceName);
    case 'DELETE':
      return handleDeleteServiceCredentials(req, res, serviceName);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetServiceCredentials(
  req: NextApiRequest, 
  res: NextApiResponse, 
  serviceName: string
) {
  try {
    const { walletAddress, masterKey }: GetCredentialsRequest = req.body;

    if (!walletAddress || !masterKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, masterKey' 
      });
    }

    const credentials = await UserCredentialManager.getServiceCredentials(
      walletAddress, 
      serviceName, 
      masterKey
    );

    // Return credentials without exposing the actual values in logs
    const credentialNames = Object.keys(credentials);
    console.log(`Retrieved ${credentialNames.length} credentials for ${serviceName}`);

    return res.status(200).json({
      serviceName,
      credentials,
      credentialCount: credentialNames.length
    });

  } catch (error) {
    console.error(`Error retrieving credentials for ${serviceName}:`, error);
    
    if (error instanceof Error && error.message.includes('Invalid master key')) {
      return res.status(401).json({ 
        error: 'Invalid master key - unable to decrypt credentials' 
      });
    }

    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to retrieve credentials' 
    });
  }
}

async function handleUpdateServiceCredentials(
  req: NextApiRequest, 
  res: NextApiResponse, 
  serviceName: string
) {
  try {
    const { walletAddress, masterKey, credentials }: UpdateCredentialsRequest = req.body;

    if (!walletAddress || !masterKey || !credentials) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, masterKey, credentials' 
      });
    }

    // Store each credential individually
    const results = [];
    for (const [credentialName, value] of Object.entries(credentials)) {
      try {
        await UserCredentialManager.storeCredential({
          walletAddress,
          serviceType: 'api_service', // Default for manual updates
          serviceName,
          credentialName,
          value,
          masterKey
        });
        results.push({ credentialName, success: true });
      } catch (error) {
        results.push({ 
          credentialName, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return res.status(200).json({
      message: `Updated ${successCount}/${totalCount} credentials for ${serviceName}`,
      results,
      serviceName
    });

  } catch (error) {
    console.error(`Error updating credentials for ${serviceName}:`, error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update credentials' 
    });
  }
}

async function handleDeleteServiceCredentials(
  req: NextApiRequest, 
  res: NextApiResponse, 
  serviceName: string
) {
  try {
    const { walletAddress }: { walletAddress: string } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Missing required field: walletAddress' 
      });
    }

    await UserCredentialManager.deleteServiceCredentials(walletAddress, serviceName);

    return res.status(200).json({
      message: `All credentials deleted for service: ${serviceName}`,
      serviceName
    });

  } catch (error) {
    console.error(`Error deleting credentials for ${serviceName}:`, error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to delete credentials' 
    });
  }
}