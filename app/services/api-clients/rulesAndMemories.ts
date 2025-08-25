// Types for Rules and Memories API
interface UserRule {
  id: string;
  wallet_address: string;
  title: string;
  content: string;
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

interface UserMemory {
  id: string;
  wallet_address: string;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

class RulesAndMemoriesAPI {
  private static baseURL = '/api/v1';

  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit & { walletAddress: string }
  ): Promise<T> {
    const { walletAddress, ...requestOptions } = options;

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...requestOptions,
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': walletAddress,
        ...requestOptions.headers,
      },
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

  // Rules API
  static async getUserRules(walletAddress: string): Promise<UserRule[]> {
    return this.makeRequest<UserRule[]>('/user-rules', {
      method: 'GET',
      walletAddress,
    });
  }

  static async createRule(
    walletAddress: string,
    title: string,
    content: string
  ): Promise<UserRule> {
    return this.makeRequest<UserRule>('/user-rules', {
      method: 'POST',
      walletAddress,
      body: JSON.stringify({ title, content }),
    });
  }

  static async updateRule(
    walletAddress: string,
    id: string,
    updates: Partial<Pick<UserRule, 'title' | 'content' | 'is_enabled'>>
  ): Promise<UserRule> {
    return this.makeRequest<UserRule>('/user-rules', {
      method: 'PUT',
      walletAddress,
      body: JSON.stringify({ id, updates }),
    });
  }

  static async deleteRule(
    walletAddress: string,
    ruleId: string
  ): Promise<void> {
    return this.makeRequest<void>(`/user-rules?ruleId=${ruleId}`, {
      method: 'DELETE',
      walletAddress,
    });
  }

  static async toggleRule(
    walletAddress: string,
    ruleId: string
  ): Promise<UserRule> {
    return this.makeRequest<UserRule>('/user-rules', {
      method: 'PATCH',
      walletAddress,
      body: JSON.stringify({ ruleId }),
    });
  }

  // Memories API
  static async getUserMemories(walletAddress: string): Promise<UserMemory[]> {
    return this.makeRequest<UserMemory[]>('/user-memories', {
      method: 'GET',
      walletAddress,
    });
  }

  static async createMemory(
    walletAddress: string,
    title: string,
    content: string
  ): Promise<UserMemory> {
    return this.makeRequest<UserMemory>('/user-memories', {
      method: 'POST',
      walletAddress,
      body: JSON.stringify({ title, content }),
    });
  }

  static async updateMemory(
    walletAddress: string,
    id: string,
    updates: Partial<Pick<UserMemory, 'title' | 'content'>>
  ): Promise<UserMemory> {
    return this.makeRequest<UserMemory>('/user-memories', {
      method: 'PUT',
      walletAddress,
      body: JSON.stringify({ id, updates }),
    });
  }

  static async deleteMemory(
    walletAddress: string,
    memoryId: string
  ): Promise<void> {
    return this.makeRequest<void>(`/user-memories?memoryId=${memoryId}`, {
      method: 'DELETE',
      walletAddress,
    });
  }

  static async deleteAllMemories(walletAddress: string): Promise<void> {
    return this.makeRequest<void>('/user-memories?deleteAll=true', {
      method: 'DELETE',
      walletAddress,
    });
  }
}

export default RulesAndMemoriesAPI;
