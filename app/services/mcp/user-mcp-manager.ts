import { MCPClient } from '@mastra/mcp';
import { 
  UserMCPServerDB, 
  UserAvailableToolDB, 
  UserMCPServer,
  UserAvailableTool 
} from '@/services/database/db';
import { UserCredentialManager } from '@/services/credentials/user-credential-manager';
import { MCPServerRegistry, type MCPServerDefinition } from './server-registry';

export interface MCPConnectionRequest {
  walletAddress: string;
  serverName: string;
  credentials: Record<string, string>;
  masterKey: string; // For credential encryption
}

export interface MCPServerStatus {
  serverName: string;
  isEnabled: boolean;
  healthStatus: 'healthy' | 'error' | 'timeout' | 'unknown';
  lastHealthCheck: Date | null;
  availableTools: number;
  connectionConfig: Record<string, any>;
}

export interface ToolDescriptor {
  name: string;
  description: string;
  schema: Record<string, any>;
  serverName: string;
}

/**
 * Service for managing user MCP server connections and health monitoring
 */
export class UserMCPManager {
  // Cache for active MCP clients
  private static mcpClients: Map<string, MCPClient> = new Map();

  /**
   * Enable an MCP server for a user with their credentials
   */
  static async enableMCPServer(request: MCPConnectionRequest): Promise<MCPServerStatus> {
    try {
      const { walletAddress, serverName, credentials, masterKey } = request;

      // Get server definition
      const serverDef = MCPServerRegistry.getServer(serverName);
      if (!serverDef) {
        throw new Error(`Unknown MCP server: ${serverName}`);
      }

      // Validate required credentials are provided
      const requiredCreds = serverDef.requiredCredentials.filter(cred => cred.required);
      for (const requiredCred of requiredCreds) {
        if (!credentials[requiredCred.name]) {
          throw new Error(`Missing required credential: ${requiredCred.displayName}`);
        }
      }

      // Store credentials securely
      for (const [credName, credValue] of Object.entries(credentials)) {
        await UserCredentialManager.storeCredential({
          walletAddress,
          serviceType: 'mcp_server',
          serviceName: serverName,
          credentialName: credName,
          value: credValue,
          masterKey
        });
      }

      // Create MCP client and test connection
      const mcpClient = await this.createMCPClient(serverDef, credentials);
      const clientKey = `${walletAddress}:${serverName}`;
      
      // Test the connection
      let healthStatus: 'healthy' | 'error' | 'timeout' = 'healthy';
      let availableTools = 0;

      try {
        // Try to get tools to verify connection
        const tools = await Promise.race([
          mcpClient.getTools(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 10000)
          )
        ]) as any;

        availableTools = Object.keys(tools || {}).length;
        
        // Cache the client for future use
        this.mcpClients.set(clientKey, mcpClient);
      } catch (error) {
        console.error(`MCP connection test failed for ${serverName}:`, error);
        healthStatus = error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'error';
      }

      // Store server configuration in database
      const mcpServer = await UserMCPServerDB.addMCPServer({
        wallet_address: walletAddress,
        server_name: serverName,
        server_url: serverDef.serverUrl,
        connection_config: serverDef.connectionConfig || {},
        is_enabled: true,
        health_status: healthStatus,
        last_health_check: null
      });

      // If connection was successful, discover and cache tools
      if (healthStatus === 'healthy') {
        await this.discoverAndCacheTools(walletAddress, mcpServer.id, mcpClient);
      }

      return {
        serverName,
        isEnabled: true,
        healthStatus,
        lastHealthCheck: mcpServer.last_health_check,
        availableTools,
        connectionConfig: mcpServer.connection_config
      };

    } catch (error) {
      console.error(`Error enabling MCP server ${request.serverName}:`, error);
      throw new Error(`Failed to enable MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disable an MCP server for a user
   */
  static async disableMCPServer(walletAddress: string, serverName: string): Promise<void> {
    try {
      // Remove from cache
      const clientKey = `${walletAddress}:${serverName}`;
      const mcpClient = this.mcpClients.get(clientKey);
      if (mcpClient) {
        try {
          await mcpClient.disconnect();
        } catch (error) {
          console.warn(`Error disconnecting MCP client for ${serverName}:`, error);
        }
        this.mcpClients.delete(clientKey);
      }

      // Update database
      await UserMCPServerDB.enableMCPServer(walletAddress, serverName, false);

      // Optionally clean up credentials (commented out to preserve user data)
      // await UserCredentialManager.deleteServiceCredentials(walletAddress, serverName);

      console.log(`[UserMCPManager] Disabled MCP server ${serverName} for ${walletAddress}`);
    } catch (error) {
      console.error(`Error disabling MCP server ${serverName}:`, error);
      throw new Error(`Failed to disable MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all MCP servers for a user with their status
   */
  static async getUserMCPServers(walletAddress: string): Promise<MCPServerStatus[]> {
    try {
      const servers = await UserMCPServerDB.getUserMCPServers(walletAddress);
      
      const statuses = await Promise.all(servers.map(async (server) => {
        const tools = await UserAvailableToolDB.getServerTools(walletAddress, server.id);
        
        return {
          serverName: server.server_name,
          isEnabled: server.is_enabled,
          healthStatus: server.health_status,
          lastHealthCheck: server.last_health_check,
          availableTools: tools.length,
          connectionConfig: server.connection_config
        };
      }));

      return statuses;
    } catch (error) {
      console.error(`Error getting user MCP servers:`, error);
      throw new Error(`Failed to get MCP servers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's available MCP tools across all enabled servers
   */
  static async getUserAvailableTools(walletAddress: string): Promise<ToolDescriptor[]> {
    try {
      const tools = await UserAvailableToolDB.getUserTools(walletAddress);
      
      return tools.map(tool => ({
        name: tool.tool_name,
        description: tool.tool_description || '',
        schema: tool.tool_schema,
        serverName: (tool as any).server_name // From the JOIN query
      }));
    } catch (error) {
      console.error(`Error getting user available tools:`, error);
      throw new Error(`Failed to get available tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run health check on all enabled MCP servers for a user
   */
  static async runHealthCheckForAllServers(walletAddress: string): Promise<Record<string, 'healthy' | 'error' | 'timeout'>> {
    try {
      const servers = await UserMCPServerDB.getUserMCPServers(walletAddress);
      const enabledServers = servers.filter(server => server.is_enabled);
      
      const healthResults: Record<string, 'healthy' | 'error' | 'timeout'> = {};
      
      await Promise.all(enabledServers.map(async (server) => {
        try {
          const status = await this.checkServerHealth(walletAddress, server.server_name);
          healthResults[server.server_name] = status;
        } catch (error) {
          console.error(`Health check failed for ${server.server_name}:`, error);
          healthResults[server.server_name] = 'error';
        }
      }));

      return healthResults;
    } catch (error) {
      console.error(`Error running health checks:`, error);
      throw new Error(`Failed to run health checks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check health of a specific MCP server
   */
  static async checkServerHealth(walletAddress: string, serverName: string): Promise<'healthy' | 'error' | 'timeout'> {
    try {
      // Get or create MCP client
      const mcpClient = await this.getMCPClient(walletAddress, serverName);
      if (!mcpClient) {
        return 'error';
      }

      // Test connection with timeout
      try {
        await Promise.race([
          mcpClient.getTools(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);

        // Update health status in database
        await UserMCPServerDB.updateMCPServerHealth(walletAddress, serverName, 'healthy');
        return 'healthy';

      } catch (error) {
        const status = error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'error';
        await UserMCPServerDB.updateMCPServerHealth(walletAddress, serverName, status);
        return status;
      }

    } catch (error) {
      console.error(`Error checking server health for ${serverName}:`, error);
      await UserMCPServerDB.updateMCPServerHealth(walletAddress, serverName, 'error');
      return 'error';
    }
  }

  /**
   * Refresh tools for a specific MCP server
   */
  static async refreshServerTools(walletAddress: string, serverName: string): Promise<number> {
    try {
      const mcpClient = await this.getMCPClient(walletAddress, serverName);
      if (!mcpClient) {
        throw new Error('MCP client not available');
      }

      // Get server info from database
      const server = await UserMCPServerDB.getMCPServer(walletAddress, serverName);
      if (!server) {
        throw new Error('Server not found in database');
      }

      // Clear existing tools
      await UserAvailableToolDB.deleteServerTools(walletAddress, server.id);

      // Discover and cache new tools
      const toolCount = await this.discoverAndCacheTools(walletAddress, server.id, mcpClient);
      
      console.log(`[UserMCPManager] Refreshed ${toolCount} tools for ${serverName}`);
      return toolCount;

    } catch (error) {
      console.error(`Error refreshing tools for ${serverName}:`, error);
      throw new Error(`Failed to refresh tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get or create MCP client for a user's server
   */
  private static async getMCPClient(walletAddress: string, serverName: string): Promise<MCPClient | null> {
    const clientKey = `${walletAddress}:${serverName}`;
    
    // Check cache first
    let mcpClient = this.mcpClients.get(clientKey);
    if (mcpClient) {
      return mcpClient;
    }

    try {
      // Get server definition and credentials
      const serverDef = MCPServerRegistry.getServer(serverName);
      if (!serverDef) {
        throw new Error(`Unknown server: ${serverName}`);
      }

      // Get credentials (this would require masterKey - for now we'll skip caching)
      // In a real implementation, we'd need to handle this differently
      // For now, return null to indicate client not available
      return null;

    } catch (error) {
      console.error(`Error creating MCP client for ${serverName}:`, error);
      return null;
    }
  }

  /**
   * Create MCP client for a server with credentials
   */
  private static async createMCPClient(serverDef: MCPServerDefinition, credentials: Record<string, string>): Promise<MCPClient> {
    // For builtin servers
    if (serverDef.serverUrl.startsWith('builtin://')) {
      const serverType = serverDef.serverUrl.replace('builtin://', '');
      
      switch (serverType) {
        case 'filesystem':
          // Create filesystem MCP client
          return new MCPClient({
            servers: {
              filesystem: {
                command: 'filesystem-server', // This would be the actual command
                args: []
              }
            }
          });
          
        case 'sqlite':
          const dbPath = credentials.database_path;
          return new MCPClient({
            servers: {
              sqlite: {
                command: 'sqlite-server',
                args: [dbPath]
              }
            }
          });
          
        default:
          throw new Error(`Unknown builtin server type: ${serverType}`);
      }
    }

    // For external MCP servers
    const config: any = {
      servers: {
        [serverDef.name]: {
          url: new URL(serverDef.serverUrl)
        }
      }
    };

    // Add credentials to headers or config based on server type
    if (credentials.api_key) {
      config.servers[serverDef.name].requestInit = {
        headers: {
          'Authorization': `Bearer ${credentials.api_key}`
        }
      };
    } else if (credentials.bot_token) {
      config.servers[serverDef.name].requestInit = {
        headers: {
          'Authorization': `Bearer ${credentials.bot_token}`
        }
      };
    } else if (credentials.personal_access_token) {
      config.servers[serverDef.name].requestInit = {
        headers: {
          'Authorization': `token ${credentials.personal_access_token}`
        }
      };
    }

    return new MCPClient(config);
  }

  /**
   * Discover and cache tools from an MCP client
   */
  private static async discoverAndCacheTools(
    walletAddress: string, 
    mcpServerId: string, 
    mcpClient: MCPClient
  ): Promise<number> {
    try {
      const tools = await mcpClient.getTools();
      let toolCount = 0;

      for (const [toolName, toolConfig] of Object.entries(tools || {})) {
        try {
          await UserAvailableToolDB.storeTool({
            wallet_address: walletAddress,
            mcp_server_id: mcpServerId,
            tool_name: toolName,
            tool_description: (toolConfig as any)?.description || '',
            tool_schema: toolConfig || {},
            is_available: true,
            last_checked: new Date()
          });
          toolCount++;
        } catch (toolError) {
          console.error(`Error storing tool ${toolName}:`, toolError);
        }
      }

      return toolCount;
    } catch (error) {
      console.error('Error discovering tools:', error);
      return 0;
    }
  }

  /**
   * Execute a tool via MCP client (for runtime usage)
   */
  static async executeTool(
    walletAddress: string, 
    serverName: string, 
    toolName: string, 
    args: Record<string, any>
  ): Promise<any> {
    try {
      const mcpClient = await this.getMCPClient(walletAddress, serverName);
      if (!mcpClient) {
        throw new Error(`MCP client not available for server: ${serverName}`);
      }

      // Execute the tool
      const result = await mcpClient.callTool(toolName, args);
      return result;

    } catch (error) {
      console.error(`Error executing tool ${toolName} on ${serverName}:`, error);
      throw new Error(`Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up MCP client cache (call on user logout or session end)
   */
  static async cleanupUserClients(walletAddress: string): Promise<void> {
    const keysToRemove: string[] = [];
    
    for (const [clientKey, mcpClient] of this.mcpClients.entries()) {
      if (clientKey.startsWith(`${walletAddress}:`)) {
        try {
          await mcpClient.disconnect();
        } catch (error) {
          console.warn(`Error disconnecting MCP client ${clientKey}:`, error);
        }
        keysToRemove.push(clientKey);
      }
    }

    keysToRemove.forEach(key => this.mcpClients.delete(key));
    console.log(`[UserMCPManager] Cleaned up ${keysToRemove.length} MCP clients for ${walletAddress}`);
  }
}