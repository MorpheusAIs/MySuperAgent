// API client for user credentials management

interface UserCredential {
  id: string;
  service_type: 'mcp_server' | 'a2a_agent' | 'api_service';
  service_name: string;
  credential_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

interface StoreCredentialRequest {
  service_type: string;
  service_name: string;
  credential_name: string;
  value: string;
}

class CredentialsAPI {
  private static baseURL = '/api/v1';

  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit & { walletAddress: string; masterKey?: string }
  ): Promise<T> {
    const { walletAddress, masterKey, ...requestOptions } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-wallet-address': walletAddress,
      ...requestOptions.headers as Record<string, string>,
    };

    if (masterKey) {
      headers['x-master-key'] = masterKey;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...requestOptions,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  static async getUserCredentials(walletAddress: string): Promise<UserCredential[]> {
    return this.makeRequest<UserCredential[]>('/user-credentials', {
      method: 'GET',
      walletAddress,
    });
  }

  static async storeCredential(
    walletAddress: string,
    masterKey: string,
    credential: StoreCredentialRequest
  ): Promise<UserCredential> {
    return this.makeRequest<UserCredential>('/user-credentials', {
      method: 'POST',
      walletAddress,
      masterKey,
      body: JSON.stringify(credential),
    });
  }

  static async updateCredential(
    walletAddress: string,
    masterKey: string,
    serviceName: string,
    credentialName: string,
    newValue: string
  ): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>('/user-credentials', {
      method: 'PUT',
      walletAddress,
      masterKey,
      body: JSON.stringify({
        serviceName,
        credentialName,
        newValue
      }),
    });
  }

  static async deleteCredential(
    walletAddress: string,
    serviceName: string,
    credentialName: string
  ): Promise<void> {
    return this.makeRequest<void>(
      `/user-credentials?serviceName=${serviceName}&credentialName=${credentialName}`,
      {
        method: 'DELETE',
        walletAddress,
      }
    );
  }
}

export default CredentialsAPI;
export type { UserCredential, StoreCredentialRequest };