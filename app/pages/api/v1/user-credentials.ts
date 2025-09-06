import type { NextApiRequest, NextApiResponse } from 'next';
import { UserCredentialDB, UserEncryptionKeyDB } from '@/services/database/db';
import crypto from 'crypto';

// Helper function to encrypt data
function encrypt(text: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(64);
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, authTag, encrypted]).toString('base64');
}

// Helper function to decrypt data
function decrypt(encryptedData: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  const data = Buffer.from(encryptedData, 'base64');
  
  const salt = data.slice(0, 64);
  const iv = data.slice(64, 80);
  const authTag = data.slice(80, 96);
  const encrypted = data.slice(96);
  
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
  const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const walletAddress = req.headers['x-wallet-address'] as string;
  const masterKey = req.headers['x-master-key'] as string;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get all user credentials (without decrypting values)
        const credentials = await UserCredentialDB.getAllUserCredentials(walletAddress);
        
        // Don't send encrypted values to client, just metadata
        const sanitizedCredentials = credentials.map(cred => ({
          id: cred.id,
          service_type: cred.service_type,
          service_name: cred.service_name,
          credential_name: cred.credential_name,
          is_active: cred.is_active,
          created_at: cred.created_at,
          updated_at: cred.updated_at,
          last_used_at: cred.last_used_at
        }));
        
        return res.status(200).json(sanitizedCredentials);

      case 'POST':
        // Store new credential
        const { service_type, service_name, credential_name, value } = req.body;

        if (!service_type || !service_name || !credential_name || !value) {
          return res.status(400).json({ 
            error: 'Service type, name, credential name, and value are required' 
          });
        }

        if (!masterKey) {
          return res.status(400).json({ 
            error: 'Master key is required for encryption' 
          });
        }

        // Encrypt the credential value
        const encryptedValue = encrypt(value, masterKey);

        // Store the credential
        const newCredential = await UserCredentialDB.storeCredential({
          wallet_address: walletAddress,
          service_type,
          service_name,
          credential_name,
          encrypted_value: encryptedValue,
          is_active: true,
          last_used_at: null
        });

        // Store/update encryption key hash
        const keyHash = crypto.createHash('sha256').update(masterKey).digest('hex');
        const salt = crypto.randomBytes(32).toString('hex');
        await UserEncryptionKeyDB.storeEncryptionKey(walletAddress, keyHash, salt);

        return res.status(201).json({
          id: newCredential.id,
          service_type: newCredential.service_type,
          service_name: newCredential.service_name,
          credential_name: newCredential.credential_name,
          is_active: newCredential.is_active
        });

      case 'PUT':
        // Update credential value
        const { serviceName, credentialName, newValue } = req.body;

        if (!serviceName || !credentialName || !newValue) {
          return res.status(400).json({ 
            error: 'Service name, credential name, and new value are required' 
          });
        }

        if (!masterKey) {
          return res.status(400).json({ 
            error: 'Master key is required for encryption' 
          });
        }

        // Encrypt the new value
        const newEncryptedValue = encrypt(newValue, masterKey);

        // Update the credential
        const updatedCredential = await UserCredentialDB.storeCredential({
          wallet_address: walletAddress,
          service_type: 'api_service', // Default to api_service
          service_name: serviceName,
          credential_name: credentialName,
          encrypted_value: newEncryptedValue,
          is_active: true,
          last_used_at: null
        });

        return res.status(200).json({
          success: true,
          service_name: updatedCredential.service_name,
          credential_name: updatedCredential.credential_name
        });

      case 'DELETE':
        // Delete credential
        const { serviceName: delServiceName, credentialName: delCredentialName } = req.query;

        if (!delServiceName || !delCredentialName || 
            typeof delServiceName !== 'string' || 
            typeof delCredentialName !== 'string') {
          return res.status(400).json({ 
            error: 'Service name and credential name are required' 
          });
        }

        await UserCredentialDB.deleteCredential(
          walletAddress,
          delServiceName,
          delCredentialName
        );

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ 
          error: `Method ${req.method} not allowed` 
        });
    }
  } catch (error: any) {
    console.error('User credentials API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}