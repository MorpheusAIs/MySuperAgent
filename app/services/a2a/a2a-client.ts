// A2A (Agent-to-Agent) client implementation based on Mastra's A2A protocol
// Implements Google's A2A standard with JSON-RPC 2.0

export interface A2AAgentCard {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  endpoint: string;
  version: string;
  owner: string;
  metadata?: Record<string, any>;
}

export interface A2AMessage {
  id: string;
  to: string;
  from: string;
  content: string;
  type: 'text' | 'json' | 'binary';
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface A2ATask {
  id?: string;
  agentId: string;
  taskType: string;
  payload: any;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface A2ATaskResult {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  result?: any;
  error?: string;
  progress?: number;
  metadata?: Record<string, any>;
}

export interface A2ATaskUpdate {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  progress?: number;
  message?: string;
  timestamp: number;
}

export interface A2AResponse {
  success: boolean;
  data?: any;
  error?: string;
  messageId?: string;
}

export interface A2AServerConfig {
  serverUrl: string;
  port: number;
  agentId: string;
  agentName: string;
  agentDescription: string;
  capabilities: string[];
}

/**
 * A2A Client for communicating with other agents using the Agent-to-Agent protocol
 */
export class A2AClient {
  private serverUrl: string;
  private agentId: string;
  private agentName: string;
  private messageIdCounter: number = 0;

  constructor(config: { serverUrl: string; agentId: string; agentName: string }) {
    this.serverUrl = config.serverUrl;
    this.agentId = config.agentId;
    this.agentName = config.agentName;
  }

  /**
   * Discover available A2A agents on the network
   */
  async discoverAgents(): Promise<A2AAgentCard[]> {
    try {
      const response = await this.makeRequest('/api/a2a/discover', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-ID': this.agentId
        }
      });

      if (!response.ok) {
        throw new Error(`Discovery failed: ${response.status}`);
      }

      const data = await response.json();
      return data.agents || [];
    } catch (error) {
      console.error('Agent discovery failed:', error);
      throw new Error(`Failed to discover agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get information about a specific agent
   */
  async getAgentCard(agentId: string): Promise<A2AAgentCard | null> {
    try {
      const response = await this.makeRequest(`/api/a2a/agents/${agentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-ID': this.agentId
        }
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get agent card: ${response.status}`);
      }

      const data = await response.json();
      return data.agent;
    } catch (error) {
      console.error(`Failed to get agent card for ${agentId}:`, error);
      throw new Error(`Failed to get agent card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(message: Omit<A2AMessage, 'id' | 'from' | 'timestamp'>): Promise<A2AResponse> {
    try {
      const fullMessage: A2AMessage = {
        ...message,
        id: this.generateMessageId(),
        from: this.agentId,
        timestamp: Date.now()
      };

      const response = await this.makeRequest('/api/a2a/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-ID': this.agentId
        },
        body: JSON.stringify({ message: fullMessage })
      });

      if (!response.ok) {
        throw new Error(`Message sending failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        messageId: fullMessage.id,
        data: data.response
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a task for another agent
   */
  async createTask(task: Omit<A2ATask, 'id'>): Promise<A2ATaskResult> {
    try {
      const fullTask: A2ATask = {
        ...task,
        id: this.generateMessageId(),
        priority: task.priority || 'normal',
        timeout: task.timeout || 30000
      };

      const response = await this.makeRequest('/api/a2a/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-ID': this.agentId
        },
        body: JSON.stringify({ task: fullTask })
      });

      if (!response.ok) {
        throw new Error(`Task creation failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        taskId: fullTask.id!,
        status: 'pending',
        ...data.taskResult
      };
    } catch (error) {
      console.error('Failed to create task:', error);
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get task status and result
   */
  async getTaskResult(taskId: string): Promise<A2ATaskResult | null> {
    try {
      const response = await this.makeRequest(`/api/a2a/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-ID': this.agentId
        }
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get task result: ${response.status}`);
      }

      const data = await response.json();
      return data.taskResult;
    } catch (error) {
      console.error(`Failed to get task result for ${taskId}:`, error);
      throw new Error(`Failed to get task result: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream task updates (using Server-Sent Events)
   */
  async* streamTaskUpdates(taskId: string): AsyncGenerator<A2ATaskUpdate, void, unknown> {
    try {
      const url = new URL(`/api/a2a/tasks/${taskId}/stream`, this.serverUrl);
      
      const response = await this.makeRequest(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'X-Agent-ID': this.agentId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to start task stream: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'task_update') {
                  yield data.update as A2ATaskUpdate;
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error(`Failed to stream task updates for ${taskId}:`, error);
      throw new Error(`Failed to stream task updates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Register this agent on the A2A network
   */
  async registerAgent(agentCard: Omit<A2AAgentCard, 'id'>): Promise<boolean> {
    try {
      const fullAgentCard: A2AAgentCard = {
        ...agentCard,
        id: this.agentId
      };

      const response = await this.makeRequest('/api/a2a/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-ID': this.agentId
        },
        body: JSON.stringify({ agentCard: fullAgentCard })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to register agent:', error);
      return false;
    }
  }

  /**
   * Unregister this agent from the A2A network
   */
  async unregisterAgent(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/a2a/unregister', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-ID': this.agentId
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to unregister agent:', error);
      return false;
    }
  }

  /**
   * Ping another agent to check if it's alive
   */
  async pingAgent(agentId: string): Promise<boolean> {
    try {
      const response = await this.sendMessage({
        to: agentId,
        content: 'ping',
        type: 'text'
      });

      return response.success;
    } catch (error) {
      console.error(`Failed to ping agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Make HTTP request with proper error handling
   */
  private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.serverUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': `MySuperAgent-A2A/${this.agentName}`,
          ...options.headers
        }
      });

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${this.agentId}-${Date.now()}-${++this.messageIdCounter}`;
  }
}

/**
 * A2A Server for hosting our agents and handling incoming requests
 */
export class A2AServer {
  private config: A2AServerConfig;
  private registeredAgents: Map<string, A2AAgentCard> = new Map();
  private activeTasks: Map<string, A2ATaskResult> = new Map();

  constructor(config: A2AServerConfig) {
    this.config = config;
  }

  /**
   * Start the A2A server
   */
  async start(): Promise<void> {
    console.log(`[A2AServer] Starting A2A server on ${this.config.serverUrl}:${this.config.port}`);
    
    // Register our main agent
    const mainAgentCard: A2AAgentCard = {
      id: this.config.agentId,
      name: this.config.agentName,
      description: this.config.agentDescription,
      capabilities: this.config.capabilities,
      endpoint: `${this.config.serverUrl}:${this.config.port}`,
      version: '1.0.0',
      owner: 'MySuperAgent'
    };

    this.registeredAgents.set(this.config.agentId, mainAgentCard);
    console.log(`[A2AServer] Registered main agent: ${this.config.agentName}`);
  }

  /**
   * Stop the A2A server
   */
  async stop(): Promise<void> {
    console.log('[A2AServer] Stopping A2A server');
    this.registeredAgents.clear();
    this.activeTasks.clear();
  }

  /**
   * Register an external agent
   */
  registerExternalAgent(agentCard: A2AAgentCard): void {
    this.registeredAgents.set(agentCard.id, agentCard);
    console.log(`[A2AServer] Registered external agent: ${agentCard.name}`);
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    this.registeredAgents.delete(agentId);
    console.log(`[A2AServer] Unregistered agent: ${agentId}`);
  }

  /**
   * Get all registered agents
   */
  getRegisteredAgents(): A2AAgentCard[] {
    return Array.from(this.registeredAgents.values());
  }

  /**
   * Get specific agent
   */
  getAgent(agentId: string): A2AAgentCard | null {
    return this.registeredAgents.get(agentId) || null;
  }

  /**
   * Process incoming message
   */
  async processMessage(message: A2AMessage): Promise<A2AResponse> {
    console.log(`[A2AServer] Processing message from ${message.from} to ${message.to}`);
    
    // Handle ping messages
    if (message.content === 'ping') {
      return {
        success: true,
        data: 'pong',
        messageId: message.id
      };
    }

    // Route message to appropriate agent handler
    const targetAgent = this.registeredAgents.get(message.to);
    if (!targetAgent) {
      return {
        success: false,
        error: `Agent ${message.to} not found`,
        messageId: message.id
      };
    }

    // For now, return a generic response
    // In a full implementation, this would route to specific agent handlers
    return {
      success: true,
      data: `Message received by ${targetAgent.name}`,
      messageId: message.id
    };
  }

  /**
   * Process incoming task
   */
  async processTask(task: A2ATask): Promise<A2ATaskResult> {
    console.log(`[A2AServer] Processing task ${task.id} for agent ${task.agentId}`);
    
    const taskResult: A2ATaskResult = {
      taskId: task.id!,
      status: 'pending',
      metadata: {
        createdAt: Date.now(),
        agentId: task.agentId,
        taskType: task.taskType
      }
    };

    this.activeTasks.set(task.id!, taskResult);

    // For now, simulate task processing
    // In a full implementation, this would route to specific agent task handlers
    setTimeout(() => {
      taskResult.status = 'completed';
      taskResult.result = `Task ${task.taskType} completed successfully`;
      taskResult.progress = 100;
    }, 1000);

    return taskResult;
  }

  /**
   * Get task result
   */
  getTaskResult(taskId: string): A2ATaskResult | null {
    return this.activeTasks.get(taskId) || null;
  }
}