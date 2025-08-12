import axios, { AxiosError } from 'axios';
import { createApiErrorHandler } from '@/utils/errorUtils';

/**
 * Base API client class providing common functionality for all API services
 */
export abstract class BaseAPIClient {
  /**
   * Generate standard headers for API requests
   */
  protected getHeaders(walletAddress: string): Record<string, string> {
    return {
      'x-wallet-address': walletAddress,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Standardized error handling for API requests
   */
  protected handleApiError(error: any, context: string): never {
    return createApiErrorHandler(context)(error);
  }

  /**
   * Make a standardized API request with error handling
   */
  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    walletAddress: string,
    data?: any
  ): Promise<T> {
    try {
      const response = await axios({
        method,
        url,
        headers: this.getHeaders(walletAddress),
        data
      });
      
      return response.data;
    } catch (error) {
      this.handleApiError(error, `${method} ${url}`);
    }
  }
}