import { NextApiRequest, NextApiResponse } from 'next';
import { UserCredentialManager, CredentialValidator } from '@/services/credentials/user-credential-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

interface StoreCredentialRequest {
  walletAddress: string;
  serviceType: 'mcp_server' | 'a2a_agent' | 'api_service';
  serviceName: string;
  credentialName: string;
  value: string;
  masterKey: string;
  validate?: boolean; // Whether to validate the credential before storing
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      walletAddress,
      serviceType,
      serviceName,
      credentialName,
      value,
      masterKey,
      validate = true
    }: StoreCredentialRequest = req.body;

    // Validate required fields
    if (!walletAddress || !serviceType || !serviceName || !credentialName || !value || !masterKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, serviceType, serviceName, credentialName, value, masterKey' 
      });
    }

    // Validate credential if requested
    if (validate) {
      let validationResult;
      
      switch (serviceName.toLowerCase()) {
        case 'github':
          if (credentialName === 'personal_access_token') {
            validationResult = await CredentialValidator.validateGitHubToken(value);
          } else {
            validationResult = CredentialValidator.validateAPIKeyFormat(value, serviceName);
          }
          break;
          
        case 'slack':
          if (credentialName === 'bot_token') {
            validationResult = await CredentialValidator.validateSlackToken(value);
          } else {
            validationResult = CredentialValidator.validateAPIKeyFormat(value, serviceName);
          }
          break;
          
        case 'notion':
          if (credentialName === 'integration_token') {
            validationResult = await CredentialValidator.validateNotionToken(value);
          } else {
            validationResult = CredentialValidator.validateAPIKeyFormat(value, serviceName);
          }
          break;
          
        default:
          // Generic validation for other services
          validationResult = CredentialValidator.validateAPIKeyFormat(value, serviceName);
          break;
      }

      if (!validationResult.isValid) {
        return res.status(400).json({
          error: 'Credential validation failed',
          details: validationResult.error,
          service: validationResult.service,
          credentialType: validationResult.credentialType
        });
      }
    }

    // Store the credential
    await UserCredentialManager.storeCredential({
      walletAddress,
      serviceType,
      serviceName,
      credentialName,
      value,
      masterKey
    });

    return res.status(200).json({
      success: true,
      message: `Credential ${serviceName}:${credentialName} stored successfully`
    });

  } catch (error) {
    console.error('Error storing credential:', error);
    
    // Check for specific error types to provide better error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid master key')) {
        return res.status(401).json({ 
          error: 'Invalid master key - unable to encrypt credential' 
        });
      }
      if (error.message.includes('Invalid wallet signature')) {
        return res.status(400).json({ 
          error: 'Invalid wallet signature format' 
        });
      }
    }

    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to store credential' 
    });
  }
}