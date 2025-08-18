import { 
  UserCredentialDB, 
  UserEncryptionKeyDB, 
  UserCredential 
} from '@/services/database/db';
import { 
  CredentialEncryption, 
  WalletKeyDerivation,
  type EncryptionResult,
  type DecryptionParams 
} from '@/services/security/encryption';

export interface CredentialStoreRequest {
  walletAddress: string;
  serviceType: 'mcp_server' | 'a2a_agent' | 'api_service';
  serviceName: string;
  credentialName: string;
  value: string;
  masterKey: string; // User's wallet signature
}

export interface CredentialRetrieveRequest {
  walletAddress: string;
  serviceName: string;
  credentialName: string;
  masterKey: string; // User's wallet signature
}

export interface ServiceCredentials {
  [credentialName: string]: string;
}

export interface CredentialValidationResult {
  isValid: boolean;
  service: string;
  credentialType: string;
  error?: string;
}

/**
 * High-level service for managing user credentials with encryption
 * Handles the complete flow of storing/retrieving encrypted credentials
 */
export class UserCredentialManager {
  /**
   * Initialize encryption key for a user (called when user first stores credentials)
   */
  static async initializeUserEncryption(walletAddress: string, masterKey: string): Promise<void> {
    try {
      // Validate the master key format
      if (!WalletKeyDerivation.validateSignature(masterKey)) {
        throw new Error('Invalid wallet signature format');
      }

      // Normalize the master key
      const normalizedKey = WalletKeyDerivation.normalizeSignature(masterKey);

      // Generate salt and hash the master key for verification
      const salt = CredentialEncryption.generateSalt();
      const keyHash = CredentialEncryption.hashMasterKey(normalizedKey, salt);

      // Store the key hash and salt in the database
      await UserEncryptionKeyDB.storeEncryptionKey(walletAddress, keyHash, salt);

      console.log(`[UserCredentialManager] Encryption initialized for wallet ${walletAddress}`);
    } catch (error) {
      console.error(`[UserCredentialManager] Failed to initialize encryption for ${walletAddress}:`, error);
      throw new Error(`Failed to initialize encryption: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify that the provided master key is correct for the user
   */
  static async verifyMasterKey(walletAddress: string, masterKey: string): Promise<boolean> {
    try {
      const encryptionKey = await UserEncryptionKeyDB.getEncryptionKey(walletAddress);
      if (!encryptionKey) {
        return false; // No encryption key stored
      }

      const normalizedKey = WalletKeyDerivation.normalizeSignature(masterKey);
      return CredentialEncryption.verifyMasterKey(normalizedKey, encryptionKey.salt, encryptionKey.key_hash);
    } catch (error) {
      console.error(`[UserCredentialManager] Master key verification failed:`, error);
      return false;
    }
  }

  /**
   * Store an encrypted credential for a user
   */
  static async storeCredential(request: CredentialStoreRequest): Promise<void> {
    try {
      const { walletAddress, serviceType, serviceName, credentialName, value, masterKey } = request;

      // Validate inputs
      if (!walletAddress || !serviceName || !credentialName || !value || !masterKey) {
        throw new Error('Missing required parameters');
      }

      // Normalize the master key
      const normalizedKey = WalletKeyDerivation.normalizeSignature(masterKey);

      // Get or initialize encryption key
      let encryptionKey = await UserEncryptionKeyDB.getEncryptionKey(walletAddress);
      if (!encryptionKey) {
        // First time storing credentials - initialize encryption
        await this.initializeUserEncryption(walletAddress, masterKey);
        encryptionKey = await UserEncryptionKeyDB.getEncryptionKey(walletAddress);
        if (!encryptionKey) {
          throw new Error('Failed to initialize encryption key');
        }
      } else {
        // Verify the master key is correct
        const isValidKey = await this.verifyMasterKey(walletAddress, masterKey);
        if (!isValidKey) {
          throw new Error('Invalid master key - cannot decrypt existing credentials');
        }
      }

      // Encrypt the credential value
      const encryptionResult = CredentialEncryption.encrypt(value, normalizedKey, encryptionKey.salt);

      // Store the encrypted credential in the database
      await UserCredentialDB.storeCredential({
        wallet_address: walletAddress,
        service_type: serviceType,
        service_name: serviceName,
        credential_name: credentialName,
        encrypted_value: encryptionResult.encryptedData,
        is_active: true,
        last_used_at: null
      });

      console.log(`[UserCredentialManager] Stored credential ${serviceName}:${credentialName} for ${walletAddress}`);
    } catch (error) {
      console.error(`[UserCredentialManager] Failed to store credential:`, error);
      throw new Error(`Failed to store credential: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve and decrypt a specific credential for a user
   */
  static async getCredential(request: CredentialRetrieveRequest): Promise<string | null> {
    try {
      const { walletAddress, serviceName, credentialName, masterKey } = request;

      // Get the encrypted credential from database
      const encryptedCredential = await UserCredentialDB.getCredential(walletAddress, serviceName, credentialName);
      if (!encryptedCredential) {
        return null; // Credential not found
      }

      // Get the encryption key
      const encryptionKey = await UserEncryptionKeyDB.getEncryptionKey(walletAddress);
      if (!encryptionKey) {
        throw new Error('No encryption key found for user');
      }

      // Verify the master key
      const normalizedKey = WalletKeyDerivation.normalizeSignature(masterKey);
      const isValidKey = CredentialEncryption.verifyMasterKey(normalizedKey, encryptionKey.salt, encryptionKey.key_hash);
      if (!isValidKey) {
        throw new Error('Invalid master key');
      }

      // Decrypt the credential
      const decryptedValue = CredentialEncryption.decrypt({
        encryptedData: encryptedCredential.encrypted_value,
        salt: encryptionKey.salt,
        masterKey: normalizedKey
      });

      // Update last used timestamp
      await UserCredentialDB.updateLastUsed(walletAddress, serviceName, credentialName);

      return decryptedValue;
    } catch (error) {
      console.error(`[UserCredentialManager] Failed to retrieve credential:`, error);
      throw new Error(`Failed to retrieve credential: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all credentials for a specific service (e.g., all GitHub credentials)
   */
  static async getServiceCredentials(walletAddress: string, serviceName: string, masterKey: string): Promise<ServiceCredentials> {
    try {
      // Get all encrypted credentials for the service
      const encryptedCredentials = await UserCredentialDB.getServiceCredentials(walletAddress, serviceName);
      if (encryptedCredentials.length === 0) {
        return {}; // No credentials found
      }

      // Get the encryption key
      const encryptionKey = await UserEncryptionKeyDB.getEncryptionKey(walletAddress);
      if (!encryptionKey) {
        throw new Error('No encryption key found for user');
      }

      // Verify the master key
      const normalizedKey = WalletKeyDerivation.normalizeSignature(masterKey);
      const isValidKey = CredentialEncryption.verifyMasterKey(normalizedKey, encryptionKey.salt, encryptionKey.key_hash);
      if (!isValidKey) {
        throw new Error('Invalid master key');
      }

      // Decrypt all credentials
      const decryptedCredentials: ServiceCredentials = {};
      for (const credential of encryptedCredentials) {
        try {
          const decryptedValue = CredentialEncryption.decrypt({
            encryptedData: credential.encrypted_value,
            salt: encryptionKey.salt,
            masterKey: normalizedKey
          });
          decryptedCredentials[credential.credential_name] = decryptedValue;

          // Update last used timestamp
          await UserCredentialDB.updateLastUsed(walletAddress, serviceName, credential.credential_name);
        } catch (decryptError) {
          console.error(`Failed to decrypt credential ${serviceName}:${credential.credential_name}:`, decryptError);
          // Continue with other credentials
        }
      }

      return decryptedCredentials;
    } catch (error) {
      console.error(`[UserCredentialManager] Failed to retrieve service credentials:`, error);
      throw new Error(`Failed to retrieve service credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a specific credential
   */
  static async deleteCredential(walletAddress: string, serviceName: string, credentialName: string): Promise<void> {
    try {
      await UserCredentialDB.deleteCredential(walletAddress, serviceName, credentialName);
      console.log(`[UserCredentialManager] Deleted credential ${serviceName}:${credentialName} for ${walletAddress}`);
    } catch (error) {
      console.error(`[UserCredentialManager] Failed to delete credential:`, error);
      throw new Error(`Failed to delete credential: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all credentials for a service
   */
  static async deleteServiceCredentials(walletAddress: string, serviceName: string): Promise<void> {
    try {
      await UserCredentialDB.deleteAllServiceCredentials(walletAddress, serviceName);
      console.log(`[UserCredentialManager] Deleted all credentials for ${serviceName} for ${walletAddress}`);
    } catch (error) {
      console.error(`[UserCredentialManager] Failed to delete service credentials:`, error);
      throw new Error(`Failed to delete service credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all services that have stored credentials for a user (without decrypting)
   */
  static async getUserServices(walletAddress: string): Promise<Array<{serviceName: string, credentialCount: number}>> {
    try {
      const credentials = await UserCredentialDB.getAllUserCredentials(walletAddress);
      
      // Group by service and count credentials
      const serviceMap = new Map<string, number>();
      credentials.forEach(cred => {
        const current = serviceMap.get(cred.service_name) || 0;
        serviceMap.set(cred.service_name, current + 1);
      });

      return Array.from(serviceMap.entries()).map(([serviceName, credentialCount]) => ({
        serviceName,
        credentialCount
      }));
    } catch (error) {
      console.error(`[UserCredentialManager] Failed to get user services:`, error);
      throw new Error(`Failed to get user services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rotate encryption by re-encrypting all credentials with a new master key
   */
  static async rotateEncryption(walletAddress: string, oldMasterKey: string, newMasterKey: string): Promise<void> {
    try {
      // Verify old master key first
      const isValidOldKey = await this.verifyMasterKey(walletAddress, oldMasterKey);
      if (!isValidOldKey) {
        throw new Error('Invalid old master key');
      }

      // Get all user credentials
      const allCredentials = await UserCredentialDB.getAllUserCredentials(walletAddress);
      if (allCredentials.length === 0) {
        // No credentials to rotate, just update the encryption key
        await this.initializeUserEncryption(walletAddress, newMasterKey);
        return;
      }

      // Get current encryption key
      const currentEncryptionKey = await UserEncryptionKeyDB.getEncryptionKey(walletAddress);
      if (!currentEncryptionKey) {
        throw new Error('No encryption key found');
      }

      // Normalize keys
      const normalizedOldKey = WalletKeyDerivation.normalizeSignature(oldMasterKey);
      const normalizedNewKey = WalletKeyDerivation.normalizeSignature(newMasterKey);

      // Generate new salt and key hash
      const newSalt = CredentialEncryption.generateSalt();
      const newKeyHash = CredentialEncryption.hashMasterKey(normalizedNewKey, newSalt);

      // Decrypt and re-encrypt each credential
      for (const credential of allCredentials) {
        try {
          // Decrypt with old key
          const decryptedValue = CredentialEncryption.decrypt({
            encryptedData: credential.encrypted_value,
            salt: currentEncryptionKey.salt,
            masterKey: normalizedOldKey
          });

          // Re-encrypt with new key
          const newEncryptionResult = CredentialEncryption.encrypt(decryptedValue, normalizedNewKey, newSalt);

          // Update the credential in database
          await UserCredentialDB.storeCredential({
            wallet_address: credential.wallet_address,
            service_type: credential.service_type,
            service_name: credential.service_name,
            credential_name: credential.credential_name,
            encrypted_value: newEncryptionResult.encryptedData,
            is_active: credential.is_active,
            last_used_at: credential.last_used_at
          });
        } catch (credError) {
          console.error(`Failed to rotate credential ${credential.service_name}:${credential.credential_name}:`, credError);
          // Continue with other credentials but track errors
        }
      }

      // Update the encryption key
      await UserEncryptionKeyDB.storeEncryptionKey(walletAddress, newKeyHash, newSalt);

      console.log(`[UserCredentialManager] Successfully rotated encryption for ${walletAddress}`);
    } catch (error) {
      console.error(`[UserCredentialManager] Failed to rotate encryption:`, error);
      throw new Error(`Failed to rotate encryption: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Service for validating API credentials before storing them
 */
export class CredentialValidator {
  /**
   * Validate GitHub personal access token
   */
  static async validateGitHubToken(token: string): Promise<CredentialValidationResult> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'MySuperAgent'
        }
      });

      if (response.ok) {
        const user = await response.json();
        return {
          isValid: true,
          service: 'github',
          credentialType: 'personal_access_token'
        };
      } else {
        return {
          isValid: false,
          service: 'github',
          credentialType: 'personal_access_token',
          error: `GitHub API error: ${response.status}`
        };
      }
    } catch (error) {
      return {
        isValid: false,
        service: 'github',
        credentialType: 'personal_access_token',
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate Slack bot token
   */
  static async validateSlackToken(token: string): Promise<CredentialValidationResult> {
    try {
      const response = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.ok) {
        return {
          isValid: true,
          service: 'slack',
          credentialType: 'bot_token'
        };
      } else {
        return {
          isValid: false,
          service: 'slack',
          credentialType: 'bot_token',
          error: `Slack API error: ${data.error}`
        };
      }
    } catch (error) {
      return {
        isValid: false,
        service: 'slack',
        credentialType: 'bot_token',
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate Notion integration token
   */
  static async validateNotionToken(token: string): Promise<CredentialValidationResult> {
    try {
      const response = await fetch('https://api.notion.com/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28'
        }
      });

      if (response.ok) {
        return {
          isValid: true,
          service: 'notion',
          credentialType: 'integration_token'
        };
      } else {
        return {
          isValid: false,
          service: 'notion',
          credentialType: 'integration_token',
          error: `Notion API error: ${response.status}`
        };
      }
    } catch (error) {
      return {
        isValid: false,
        service: 'notion',
        credentialType: 'integration_token',
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generic API key validation (basic format check)
   */
  static validateAPIKeyFormat(apiKey: string, serviceName: string): CredentialValidationResult {
    // Basic validation - not empty and reasonable length
    if (!apiKey || apiKey.trim().length === 0) {
      return {
        isValid: false,
        service: serviceName,
        credentialType: 'api_key',
        error: 'API key cannot be empty'
      };
    }

    if (apiKey.length < 10) {
      return {
        isValid: false,
        service: serviceName,
        credentialType: 'api_key',
        error: 'API key appears to be too short'
      };
    }

    return {
      isValid: true,
      service: serviceName,
      credentialType: 'api_key'
    };
  }
}