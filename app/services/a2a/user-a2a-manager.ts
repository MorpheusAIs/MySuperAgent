import { 
  UserA2AAgentDB, 
  UserA2AAgent 
} from '@/services/database/db';
import { A2AClient, A2AAgentCard, A2AMessage, A2ATask, A2ATaskResult } from './a2a-client';

export interface A2AConnectionRequest {
  walletAddress: string;
  agentCard: A2AAgentCard;
  endpoint: string;
}

export interface A2AAgentStatus {
  agentId: string;
  agentName: string;
  isEnabled: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'unknown';
  lastPing: Date | null;
  capabilities: string[];
  endpoint: string;
}

export interface A2ACommunicationRequest {
  walletAddress: string;
  targetAgentId: string;
  message?: Omit<A2AMessage, 'id' | 'from' | 'timestamp' | 'to'>;
  task?: Omit<A2ATask, 'id'>;
}

/**
 * Service for managing user A2A agent connections and communication
 */
export class UserA2AManager {
  // Cache for A2A clients
  private static a2aClients: Map<string, A2AClient> = new Map();

  /**
   * Connect to an external A2A agent
   */
  static async connectToA2AAgent(request: A2AConnectionRequest): Promise<A2AAgentStatus> {
    try {
      const { walletAddress, agentCard, endpoint } = request;

      // Create A2A client for communication
      const clientKey = `${walletAddress}:${agentCard.id}`;
      const a2aClient = new A2AClient({
        serverUrl: endpoint,
        agentId: `mysuperagent-${walletAddress}`,
        agentName: 'MySuperAgent'
      });

      // Test connection by pinging the agent
      let connectionStatus: 'connected' | 'disconnected' | 'error' = 'connected';
      try {
        const pingResult = await a2aClient.pingAgent(agentCard.id);
        connectionStatus = pingResult ? 'connected' : 'disconnected';
        
        // Cache the client if connection successful
        if (pingResult) {
          this.a2aClients.set(clientKey, a2aClient);
        }
      } catch (error) {
        console.error(`Failed to ping A2A agent ${agentCard.id}:`, error);
        connectionStatus = 'error';
      }

      // Store agent information in database
      const a2aAgent = await UserA2AAgentDB.addA2AAgent({
        wallet_address: walletAddress,
        agent_id: agentCard.id,
        agent_name: agentCard.name,
        agent_description: agentCard.description,
        endpoint_url: endpoint,
        capabilities: agentCard.capabilities,
        is_enabled: true,
        connection_status: connectionStatus,
        last_ping: null
      });

      return {
        agentId: agentCard.id,
        agentName: agentCard.name,
        isEnabled: true,
        connectionStatus,
        lastPing: a2aAgent.last_ping,
        capabilities: agentCard.capabilities,
        endpoint
      };

    } catch (error) {
      console.error(`Error connecting to A2A agent ${request.agentCard.id}:`, error);
      throw new Error(`Failed to connect to A2A agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect from an A2A agent
   */
  static async disconnectFromA2AAgent(walletAddress: string, agentId: string): Promise<void> {
    try {
      // Remove from cache
      const clientKey = `${walletAddress}:${agentId}`;
      this.a2aClients.delete(clientKey);

      // Update database
      await UserA2AAgentDB.enableA2AAgent(walletAddress, agentId, false);

      console.log(`[UserA2AManager] Disconnected from A2A agent ${agentId} for ${walletAddress}`);
    } catch (error) {
      console.error(`Error disconnecting from A2A agent ${agentId}:`, error);
      throw new Error(`Failed to disconnect from A2A agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all A2A agents for a user with their status
   */
  static async getUserA2AAgents(walletAddress: string): Promise<A2AAgentStatus[]> {
    try {
      const agents = await UserA2AAgentDB.getUserA2AAgents(walletAddress);
      
      return agents.map(agent => ({
        agentId: agent.agent_id,
        agentName: agent.agent_name,
        isEnabled: agent.is_enabled,
        connectionStatus: agent.connection_status,
        lastPing: agent.last_ping,
        capabilities: agent.capabilities,
        endpoint: agent.endpoint_url
      }));
    } catch (error) {
      console.error(`Error getting user A2A agents:`, error);
      throw new Error(`Failed to get A2A agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a message to an A2A agent
   */
  static async sendMessageToAgent(request: A2ACommunicationRequest): Promise<any> {
    try {
      const { walletAddress, targetAgentId, message } = request;

      if (!message) {
        throw new Error('Message is required');
      }

      // Get A2A client
      const a2aClient = await this.getA2AClient(walletAddress, targetAgentId);
      if (!a2aClient) {
        throw new Error(`A2A client not available for agent: ${targetAgentId}`);
      }

      // Send message
      const response = await a2aClient.sendMessage({
        ...message,
        to: targetAgentId
      });

      // Update last ping time if successful
      if (response.success) {
        await UserA2AAgentDB.updateA2AAgentStatus(walletAddress, targetAgentId, 'connected');
      }

      return response;

    } catch (error) {
      console.error(`Error sending message to A2A agent ${request.targetAgentId}:`, error);
      
      // Update status to error
      try {
        await UserA2AAgentDB.updateA2AAgentStatus(request.walletAddress, request.targetAgentId, 'error');
      } catch (updateError) {
        console.error('Failed to update agent status:', updateError);
      }

      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a task for an A2A agent
   */
  static async createTaskForAgent(request: A2ACommunicationRequest): Promise<A2ATaskResult> {
    try {
      const { walletAddress, targetAgentId, task } = request;

      if (!task) {
        throw new Error('Task is required');
      }

      // Get A2A client
      const a2aClient = await this.getA2AClient(walletAddress, targetAgentId);
      if (!a2aClient) {
        throw new Error(`A2A client not available for agent: ${targetAgentId}`);
      }

      // Create task
      const taskResult = await a2aClient.createTask({
        ...task,
        agentId: targetAgentId
      });

      // Update last ping time
      await UserA2AAgentDB.updateA2AAgentStatus(walletAddress, targetAgentId, 'connected');

      return taskResult;

    } catch (error) {
      console.error(`Error creating task for A2A agent ${request.targetAgentId}:`, error);
      
      // Update status to error
      try {
        await UserA2AAgentDB.updateA2AAgentStatus(request.walletAddress, request.targetAgentId, 'error');
      } catch (updateError) {
        console.error('Failed to update agent status:', updateError);
      }

      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run health check on all enabled A2A agents for a user
   */
  static async runHealthCheckForAllAgents(walletAddress: string): Promise<Record<string, 'connected' | 'disconnected' | 'error'>> {
    try {
      const agents = await UserA2AAgentDB.getUserA2AAgents(walletAddress);
      const enabledAgents = agents.filter(agent => agent.is_enabled);
      
      const healthResults: Record<string, 'connected' | 'disconnected' | 'error'> = {};
      
      await Promise.all(enabledAgents.map(async (agent) => {
        try {
          const status = await this.pingAgent(walletAddress, agent.agent_id);
          healthResults[agent.agent_id] = status;
        } catch (error) {
          console.error(`Health check failed for ${agent.agent_id}:`, error);
          healthResults[agent.agent_id] = 'error';
        }
      }));

      return healthResults;
    } catch (error) {
      console.error(`Error running A2A health checks:`, error);
      throw new Error(`Failed to run health checks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ping a specific A2A agent
   */
  static async pingAgent(walletAddress: string, agentId: string): Promise<'connected' | 'disconnected' | 'error'> {
    try {
      const a2aClient = await this.getA2AClient(walletAddress, agentId);
      if (!a2aClient) {
        return 'error';
      }

      const pingResult = await a2aClient.pingAgent(agentId);
      const status = pingResult ? 'connected' : 'disconnected';

      // Update status in database
      await UserA2AAgentDB.updateA2AAgentStatus(walletAddress, agentId, status);
      
      return status;

    } catch (error) {
      console.error(`Error pinging A2A agent ${agentId}:`, error);
      await UserA2AAgentDB.updateA2AAgentStatus(walletAddress, agentId, 'error');
      return 'error';
    }
  }

  /**
   * Discover available A2A agents on the network
   */
  static async discoverA2AAgents(serverUrl: string, walletAddress: string): Promise<A2AAgentCard[]> {
    try {
      const a2aClient = new A2AClient({
        serverUrl,
        agentId: `mysuperagent-${walletAddress}`,
        agentName: 'MySuperAgent'
      });

      const agents = await a2aClient.discoverAgents();
      console.log(`[UserA2AManager] Discovered ${agents.length} A2A agents`);
      
      return agents;

    } catch (error) {
      console.error('Error discovering A2A agents:', error);
      throw new Error(`Failed to discover A2A agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get or create A2A client for a user's agent
   */
  private static async getA2AClient(walletAddress: string, agentId: string): Promise<A2AClient | null> {
    const clientKey = `${walletAddress}:${agentId}`;
    
    // Check cache first
    let a2aClient = this.a2aClients.get(clientKey);
    if (a2aClient) {
      return a2aClient;
    }

    try {
      // Get agent info from database
      const agent = await UserA2AAgentDB.getA2AAgent(walletAddress, agentId);
      if (!agent || !agent.is_enabled) {
        return null;
      }

      // Create new client
      a2aClient = new A2AClient({
        serverUrl: agent.endpoint_url,
        agentId: `mysuperagent-${walletAddress}`,
        agentName: 'MySuperAgent'
      });

      // Cache the client
      this.a2aClients.set(clientKey, a2aClient);
      
      return a2aClient;

    } catch (error) {
      console.error(`Error creating A2A client for ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Enable/disable an A2A agent
   */
  static async toggleA2AAgent(walletAddress: string, agentId: string, enabled: boolean): Promise<void> {
    try {
      if (!enabled) {
        // Remove from cache when disabling
        const clientKey = `${walletAddress}:${agentId}`;
        this.a2aClients.delete(clientKey);
      }

      await UserA2AAgentDB.enableA2AAgent(walletAddress, agentId, enabled);
      
      console.log(`[UserA2AManager] ${enabled ? 'Enabled' : 'Disabled'} A2A agent ${agentId} for ${walletAddress}`);
    } catch (error) {
      console.error(`Error toggling A2A agent ${agentId}:`, error);
      throw new Error(`Failed to toggle A2A agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove an A2A agent completely
   */
  static async removeA2AAgent(walletAddress: string, agentId: string): Promise<void> {
    try {
      // Remove from cache
      const clientKey = `${walletAddress}:${agentId}`;
      this.a2aClients.delete(clientKey);

      // Remove from database
      await UserA2AAgentDB.deleteA2AAgent(walletAddress, agentId);

      console.log(`[UserA2AManager] Removed A2A agent ${agentId} for ${walletAddress}`);
    } catch (error) {
      console.error(`Error removing A2A agent ${agentId}:`, error);
      throw new Error(`Failed to remove A2A agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get task result from an A2A agent
   */
  static async getTaskResult(walletAddress: string, agentId: string, taskId: string): Promise<A2ATaskResult | null> {
    try {
      const a2aClient = await this.getA2AClient(walletAddress, agentId);
      if (!a2aClient) {
        throw new Error(`A2A client not available for agent: ${agentId}`);
      }

      return await a2aClient.getTaskResult(taskId);

    } catch (error) {
      console.error(`Error getting task result ${taskId} from agent ${agentId}:`, error);
      throw new Error(`Failed to get task result: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream task updates from an A2A agent
   */
  static async* streamTaskUpdates(walletAddress: string, agentId: string, taskId: string): AsyncGenerator<any, void, unknown> {
    try {
      const a2aClient = await this.getA2AClient(walletAddress, agentId);
      if (!a2aClient) {
        throw new Error(`A2A client not available for agent: ${agentId}`);
      }

      yield* a2aClient.streamTaskUpdates(taskId);

    } catch (error) {
      console.error(`Error streaming task updates ${taskId} from agent ${agentId}:`, error);
      throw new Error(`Failed to stream task updates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up A2A client cache (call on user logout or session end)
   */
  static async cleanupUserClients(walletAddress: string): Promise<void> {
    const keysToRemove: string[] = [];
    
    for (const clientKey of Array.from(this.a2aClients.keys())) {
      if (clientKey.startsWith(`${walletAddress}:`)) {
        keysToRemove.push(clientKey);
      }
    }

    keysToRemove.forEach(key => this.a2aClients.delete(key));
    console.log(`[UserA2AManager] Cleaned up ${keysToRemove.length} A2A clients for ${walletAddress}`);
  }
}