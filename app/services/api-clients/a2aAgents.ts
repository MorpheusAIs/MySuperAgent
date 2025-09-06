// API client for A2A agents management

interface A2AAgent {
  id: string;
  wallet_address: string;
  agent_id: string;
  agent_name: string;
  agent_description: string | null;
  endpoint_url: string;
  capabilities: string[];
  is_enabled: boolean;
  connection_status: 'connected' | 'disconnected' | 'error' | 'unknown';
  last_ping: string | null;
  created_at: string;
  updated_at: string;
}

interface AddA2AAgentRequest {
  agent_id: string;
  agent_name: string;
  agent_description?: string;
  endpoint_url: string;
  capabilities?: string[];
  is_enabled?: boolean;
}

interface PingAgentResponse {
  agentId: string;
  status: A2AAgent['connection_status'];
  lastPing: string;
  error?: string;
}

class A2AAgentsAPI {
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

  static async getUserA2AAgents(walletAddress: string): Promise<A2AAgent[]> {
    return this.makeRequest<A2AAgent[]>('/a2a-agents', {
      method: 'GET',
      walletAddress,
    });
  }

  static async addA2AAgent(
    walletAddress: string,
    agent: AddA2AAgentRequest
  ): Promise<A2AAgent> {
    return this.makeRequest<A2AAgent>('/a2a-agents', {
      method: 'POST',
      walletAddress,
      body: JSON.stringify(agent),
    });
  }

  static async updateA2AAgent(
    walletAddress: string,
    agentId: string,
    updates: {
      enabled?: boolean;
      connectionStatus?: A2AAgent['connection_status'];
    }
  ): Promise<A2AAgent> {
    return this.makeRequest<A2AAgent>('/a2a-agents', {
      method: 'PUT',
      walletAddress,
      body: JSON.stringify({
        agentId,
        ...updates,
      }),
    });
  }

  static async deleteA2AAgent(
    walletAddress: string,
    agentId: string
  ): Promise<void> {
    return this.makeRequest<void>(`/a2a-agents?agentId=${agentId}`, {
      method: 'DELETE',
      walletAddress,
    });
  }

  static async pingA2AAgent(
    walletAddress: string,
    agentId: string
  ): Promise<PingAgentResponse> {
    return this.makeRequest<PingAgentResponse>('/a2a-agents', {
      method: 'PATCH',
      walletAddress,
      body: JSON.stringify({ agentId }),
    });
  }
}

export default A2AAgentsAPI;
export type { A2AAgent, AddA2AAgentRequest, PingAgentResponse };