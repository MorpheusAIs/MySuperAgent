// API client for MCP servers management

interface MCPServer {
  id: string;
  wallet_address: string;
  server_name: string;
  server_url: string;
  connection_config: Record<string, any>;
  is_enabled: boolean;
  health_status: 'healthy' | 'error' | 'timeout' | 'unknown';
  last_health_check: string | null;
  created_at: string;
  updated_at: string;
  availableTools?: number;
}

interface AddMCPServerRequest {
  server_name: string;
  server_url: string;
  connection_config?: Record<string, any>;
  is_enabled?: boolean;
}

class MCPServersAPI {
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

  static async getUserMCPServers(walletAddress: string): Promise<MCPServer[]> {
    return this.makeRequest<MCPServer[]>('/mcp-servers', {
      method: 'GET',
      walletAddress,
    });
  }

  static async addMCPServer(
    walletAddress: string,
    server: AddMCPServerRequest
  ): Promise<MCPServer> {
    return this.makeRequest<MCPServer>('/mcp-servers', {
      method: 'POST',
      walletAddress,
      body: JSON.stringify(server),
    });
  }

  static async updateMCPServer(
    walletAddress: string,
    serverName: string,
    updates: {
      enabled?: boolean;
      healthStatus?: MCPServer['health_status'];
    }
  ): Promise<MCPServer> {
    return this.makeRequest<MCPServer>('/mcp-servers', {
      method: 'PUT',
      walletAddress,
      body: JSON.stringify({
        serverName,
        ...updates,
      }),
    });
  }

  static async deleteMCPServer(
    walletAddress: string,
    serverName: string
  ): Promise<void> {
    return this.makeRequest<void>(`/mcp-servers?serverName=${serverName}`, {
      method: 'DELETE',
      walletAddress,
    });
  }
}

export default MCPServersAPI;
export type { MCPServer, AddMCPServerRequest };