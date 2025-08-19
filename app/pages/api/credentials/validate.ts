import { NextApiRequest, NextApiResponse } from 'next';
import { CredentialValidator } from '@/services/credentials/user-credential-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

interface ValidateCredentialRequest {
  serviceName: string;
  credentialName: string;
  value: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { serviceName, credentialName, value }: ValidateCredentialRequest = req.body;

    if (!serviceName || !credentialName || !value) {
      return res.status(400).json({ 
        error: 'Missing required fields: serviceName, credentialName, value' 
      });
    }

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

    return res.status(200).json({
      isValid: validationResult.isValid,
      service: validationResult.service,
      credentialType: validationResult.credentialType,
      error: validationResult.error || null
    });

  } catch (error) {
    console.error('Error validating credential:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to validate credential' 
    });
  }
}