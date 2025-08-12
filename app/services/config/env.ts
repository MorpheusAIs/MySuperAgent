/**
 * Environment variable validation and configuration
 */

export interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;
  
  // API Configuration
  NEXT_PUBLIC_API_URL: string;
  
  // LIT Protocol
  NEXT_PUBLIC_LIT_RELAYER_API_KEY?: string;
  NEXT_PUBLIC_LIT_PAYER_SECRET_KEY?: string;
  
  // Feature Flags
  NEXT_PUBLIC_FLAGS_SECRET?: string;
  
  // Application Environment
  NODE_ENV: 'development' | 'production' | 'test';
  APP_ENV?: 'development' | 'staging' | 'production';
  
  // Optional testnets
  NEXT_PUBLIC_ENABLE_TESTNETS?: string;
}

class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private config: EnvironmentConfig | null = null;
  private validationErrors: string[] = [];

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  private validateRequiredEnvVar(key: keyof EnvironmentConfig, value: string | undefined): boolean {
    if (!value || value.trim() === '') {
      this.validationErrors.push(`Missing required environment variable: ${key}`);
      return false;
    }
    return true;
  }

  private validateOptionalEnvVar(key: keyof EnvironmentConfig, value: string | undefined): string | undefined {
    return value && value.trim() !== '' ? value.trim() : undefined;
  }

  public validate(): EnvironmentConfig {
    if (this.config) {
      return this.config;
    }

    this.validationErrors = [];

    // Required variables
    const DATABASE_URL = process.env.DATABASE_URL;
    const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const NODE_ENV = process.env.NODE_ENV as 'development' | 'production' | 'test';

    // Validate required
    this.validateRequiredEnvVar('DATABASE_URL', DATABASE_URL);
    
    if (!NODE_ENV || !['development', 'production', 'test'].includes(NODE_ENV)) {
      this.validationErrors.push('NODE_ENV must be one of: development, production, test');
    }

    // Optional variables
    const NEXT_PUBLIC_LIT_RELAYER_API_KEY = this.validateOptionalEnvVar('NEXT_PUBLIC_LIT_RELAYER_API_KEY', process.env.NEXT_PUBLIC_LIT_RELAYER_API_KEY);
    const NEXT_PUBLIC_LIT_PAYER_SECRET_KEY = this.validateOptionalEnvVar('NEXT_PUBLIC_LIT_PAYER_SECRET_KEY', process.env.NEXT_PUBLIC_LIT_PAYER_SECRET_KEY);
    const NEXT_PUBLIC_FLAGS_SECRET = this.validateOptionalEnvVar('NEXT_PUBLIC_FLAGS_SECRET', process.env.NEXT_PUBLIC_FLAGS_SECRET);
    const APP_ENV = this.validateOptionalEnvVar('APP_ENV', process.env.APP_ENV) as 'development' | 'staging' | 'production' | undefined;
    const NEXT_PUBLIC_ENABLE_TESTNETS = this.validateOptionalEnvVar('NEXT_PUBLIC_ENABLE_TESTNETS', process.env.NEXT_PUBLIC_ENABLE_TESTNETS);

    if (this.validationErrors.length > 0) {
      throw new Error(`Environment validation failed:\n${this.validationErrors.join('\n')}`);
    }

    this.config = {
      DATABASE_URL: DATABASE_URL!,
      NEXT_PUBLIC_API_URL,
      NODE_ENV,
      NEXT_PUBLIC_LIT_RELAYER_API_KEY,
      NEXT_PUBLIC_LIT_PAYER_SECRET_KEY,
      NEXT_PUBLIC_FLAGS_SECRET,
      APP_ENV,
      NEXT_PUBLIC_ENABLE_TESTNETS,
    };

    return this.config;
  }

  public getConfig(): EnvironmentConfig {
    if (!this.config) {
      return this.validate();
    }
    return this.config;
  }

  public isProduction(): boolean {
    const config = this.getConfig();
    return config.NODE_ENV === 'production';
  }

  public isDevelopment(): boolean {
    const config = this.getConfig();
    return config.NODE_ENV === 'development';
  }

  public isTest(): boolean {
    const config = this.getConfig();
    return config.NODE_ENV === 'test';
  }
}

export const env = EnvironmentValidator.getInstance();

// Export commonly used environment checks
export const isDevelopment = () => env.isDevelopment();
export const isProduction = () => env.isProduction();
export const isTest = () => env.isTest();

// Validate environment on module load (except in test environment)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    env.validate();
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}