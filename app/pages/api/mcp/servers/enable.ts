import { NextApiRequest, NextApiResponse } from 'next';
import { UserMCPManager } from '@/services/mcp/user-mcp-manager';
import { CredentialValidator } from '@/services/credentials/user-credential-manager';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

interface EnableMCPServerRequest {
  walletAddress: string;
  serverName: string;
  credentials: Record<string, string>;
  masterKey: string;
  validate?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      walletAddress,
      serverName,
      credentials,
      masterKey,
      validate = true
    }: EnableMCPServerRequest = req.body;

    if (!walletAddress || !serverName || !credentials || !masterKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, serverName, credentials, masterKey' 
      });
    }

    // Validate credentials if requested
    if (validate) {
      const validationResults = [];
      
      for (const [credName, credValue] of Object.entries(credentials)) {
        let validationResult;
        
        // Validate based on server name and credential type
        switch (serverName.toLowerCase()) {
          case 'github':
            if (credName === 'personal_access_token') {
              validationResult = await CredentialValidator.validateGitHubToken(credValue);
            } else {
              validationResult = CredentialValidator.validateAPIKeyFormat(credValue, serverName);
            }
            break;
            
          case 'slack':
            if (credName === 'bot_token') {
              validationResult = await CredentialValidator.validateSlackToken(credValue);
            } else {
              validationResult = CredentialValidator.validateAPIKeyFormat(credValue, serverName);
            }
            break;
            
          case 'notion':
            if (credName === 'integration_token') {
              validationResult = await CredentialValidator.validateNotionToken(credValue);
            } else {
              validationResult = CredentialValidator.validateAPIKeyFormat(credValue, serverName);
            }
            break;
            
          default:
            // Generic validation for other services
            validationResult = CredentialValidator.validateAPIKeyFormat(credValue, serverName);
            break;
        }

        validationResults.push({
          credentialName: credName,
          ...validationResult
        });

        // If any validation fails, return error
        if (!validationResult.isValid) {
          return res.status(400).json({
            error: 'Credential validation failed',
            details: validationResult.error,
            credential: credName,
            validationResults
          });
        }
      }
    }

    // Enable the MCP server
    const serverStatus = await UserMCPManager.enableMCPServer({
      walletAddress,
      serverName,
      credentials,
      masterKey
    });

    return res.status(200).json({
      success: true,
      message: `MCP server ${serverName} enabled successfully`,
      serverStatus
    });

  } catch (error) {
    console.error('Error enabling MCP server:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('Unknown MCP server')) {
        return res.status(404).json({ 
          error: 'MCP server not found in registry' 
        });
      }
      if (error.message.includes('Missing required credential')) {
        return res.status(400).json({ 
          error: error.message 
        });
      }
      if (error.message.includes('Invalid master key')) {
        return res.status(401).json({ 
          error: 'Invalid master key - unable to encrypt credentials' 
        });
      }
    }

    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to enable MCP server' 
    });
  }
}