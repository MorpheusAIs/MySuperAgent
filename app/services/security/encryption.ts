import crypto from 'crypto';

// Constants for encryption
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
const TAG_LENGTH = 16; // 128 bits
const ITERATIONS = 100000; // PBKDF2 iterations

export interface EncryptionResult {
  encryptedData: string;
  salt: string;
}

export interface DecryptionParams {
  encryptedData: string;
  salt: string;
  masterKey: string;
}

/**
 * Crypto service for encrypting/decrypting user credentials
 * Uses user's wallet signature as master key with PBKDF2 key derivation
 */
export class CredentialEncryption {
  /**
   * Generate a random salt for key derivation
   */
  static generateSalt(): string {
    return crypto.randomBytes(SALT_LENGTH).toString('hex');
  }

  /**
   * Derive encryption key from master key (wallet signature) and salt
   */
  private static deriveKey(masterKey: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(
      Buffer.from(masterKey, 'hex'),
      Buffer.from(salt, 'hex'),
      ITERATIONS,
      KEY_LENGTH,
      'sha256'
    );
  }

  /**
   * Encrypt a credential value using the user's master key
   */
  static encrypt(value: string, masterKey: string, salt?: string): EncryptionResult {
    try {
      // Generate salt if not provided
      const useSalt = salt || this.generateSalt();
      
      // Derive encryption key
      const key = this.deriveKey(masterKey, useSalt);
      
      // Generate random IV
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      cipher.setAAD(Buffer.from(useSalt, 'hex')); // Use salt as additional authenticated data
      
      // Encrypt the value
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine IV + encrypted data + tag
      const encryptedData = iv.toString('hex') + encrypted + tag.toString('hex');
      
      return {
        encryptedData,
        salt: useSalt
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt a credential value using the user's master key
   */
  static decrypt(params: DecryptionParams): string {
    try {
      const { encryptedData, salt, masterKey } = params;
      
      // Derive the same key used for encryption
      const key = this.deriveKey(masterKey, salt);
      
      // Extract IV, encrypted data, and tag
      const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
      const tag = Buffer.from(encryptedData.slice(-TAG_LENGTH * 2), 'hex');
      const encrypted = encryptedData.slice(IV_LENGTH * 2, -TAG_LENGTH * 2);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAAD(Buffer.from(salt, 'hex')); // Same AAD used during encryption
      decipher.setAuthTag(tag);
      
      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a hash of the master key for verification purposes
   */
  static hashMasterKey(masterKey: string, salt: string): string {
    return crypto.pbkdf2Sync(
      Buffer.from(masterKey, 'hex'),
      Buffer.from(salt, 'hex'),
      ITERATIONS,
      32,
      'sha256'
    ).toString('hex');
  }

  /**
   * Verify that a master key matches the stored hash
   */
  static verifyMasterKey(masterKey: string, salt: string, storedHash: string): boolean {
    try {
      const computedHash = this.hashMasterKey(masterKey, salt);
      return crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(storedHash, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Rotate encryption by re-encrypting with a new master key
   */
  static rotateEncryption(
    currentParams: DecryptionParams,
    newMasterKey: string
  ): EncryptionResult {
    // Decrypt with current key
    const decryptedValue = this.decrypt(currentParams);
    
    // Re-encrypt with new key and new salt
    return this.encrypt(decryptedValue, newMasterKey);
  }
}

/**
 * Utility functions for working with wallet signatures as master keys
 */
export class WalletKeyDerivation {
  /**
   * Generate a consistent challenge message for wallet signing
   */
  static generateChallengeMessage(walletAddress: string): string {
    return `MySuperAgent credential encryption key derivation for wallet ${walletAddress}. This signature will be used to encrypt your API credentials locally. Do not share this signature.`;
  }

  /**
   * Validate that a wallet signature is suitable for key derivation
   */
  static validateSignature(signature: string): boolean {
    try {
      // Basic validation - should be hex string of appropriate length
      const signatureBuffer = Buffer.from(signature.replace('0x', ''), 'hex');
      return signatureBuffer.length >= 32; // At least 256 bits
    } catch (error) {
      return false;
    }
  }

  /**
   * Normalize signature for consistent key derivation
   */
  static normalizeSignature(signature: string): string {
    // Remove 0x prefix and ensure lowercase
    return signature.replace('0x', '').toLowerCase();
  }
}