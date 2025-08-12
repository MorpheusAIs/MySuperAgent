import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { AgentResponse, ChatRequest, ResponseType } from '@/services/agents/types';
import { getApifyToolsets } from '@/services/agents/mcp-client';

export abstract class BaseAgent {
  protected agent: Agent;
  protected name: string;
  protected description: string;
  protected capabilities: string[];
  protected useApifyTools: boolean;

  constructor(
    name: string,
    description: string,
    capabilities: string[],
    modelName: string = 'gpt-4o-mini',
    useApifyTools: boolean = false
  ) {
    console.log(`[BaseAgent] Creating agent: ${name}`);
    this.name = name;
    this.description = description;
    this.capabilities = capabilities;
    this.useApifyTools = useApifyTools;

    // Create the Mastra agent with proper configuration
    const tools = this.getTools();
    console.log(`[${this.name}] Tools configured:`, Object.keys(tools));
    console.log(`[${this.name}] Tools details:`, tools);
    console.log(`[${this.name}] Agent description:`, this.description);
    
    // CRITICAL: Mastra requires description to be a non-empty string for tools to work
    if (!this.description || this.description.trim() === '') {
      throw new Error(`Agent ${this.name} must have a non-empty description for tools to work`);
    }
    
    // For MCP agents, tools are loaded dynamically  
    const agentConfig: any = {
      name: this.name,
      description: this.description, // Mastra needs both description AND instructions
      instructions: this.getInstructions(),
      model: openai(modelName),
    };
    
    console.log(`[${this.name}] Agent config before tools:`, {
      name: agentConfig.name,
      instructions: agentConfig.instructions?.substring(0, 100) + '...',
      hasInstructions: !!agentConfig.instructions
    });
    
    // Add tools - either static tools or dynamic MCP tools
    if (this.useApifyTools) {
      // For MCP agents, use function-based tools to load dynamically
      console.log(`[${this.name}] Setting up dynamic MCP tools`);
      agentConfig.tools = async () => {
        const apifyToolsets = await getApifyToolsets();
        console.log(`[${this.name}] Dynamic MCP tools loaded:`, Object.keys(apifyToolsets));
        return apifyToolsets;
      };
    } else {
      // For regular agents, use static tools
      console.log(`[${this.name}] Setting up static tools:`, Object.keys(tools));
      agentConfig.tools = tools;
    }
    
    this.agent = new Agent(agentConfig);
    
    console.log(`[${this.name}] Agent created successfully with ${this.useApifyTools ? 'dynamic MCP' : 'static'} tools`);
    console.log(`[${this.name}] Agent instance:`, !!this.agent);
    console.log(`[${this.name}] Agent model:`, typeof this.agent?.model === 'object' && 'modelId' in this.agent.model ? this.agent.model.modelId : 'unknown');
  }

  abstract getInstructions(): string;
  abstract getTools(): any;

  async chat(request: ChatRequest): Promise<AgentResponse> {
    try {
      console.log(`[${this.name}] Starting chat with prompt:`, request.prompt.content.substring(0, 100) + '...');
      
      // Build messages from request
      const messages = this.buildMessages(request);
      
      // No need to pass toolsets in options for MCP agents since they're handled in the agent config
      const options: any = {};
      console.log(`[${this.name}] Calling agent.generate with messages:`, messages);
      
      // Use Mastra's generate method
      const result = await this.agent.generate(messages as any, options);
      
      console.log(`[${this.name}] Generate result type:`, typeof result);
      console.log(`[${this.name}] Generate result keys:`, Object.keys(result || {}));
      console.log(`[${this.name}] Generate result.text:`, result?.text?.substring(0, 200) + '...');
      console.log(`[${this.name}] Generate result.steps:`, result?.steps?.length || 0, 'steps');
      
      // Log any tool calls that were made
      if (result?.steps) {
        result.steps.forEach((step: any, i: number) => {
          console.log(`[${this.name}] Step ${i}:`, step.type, step.toolName || 'no tool');
        });
      }

      return this.parseResponse(result);
    } catch (error) {
      console.error(`Error in ${this.name} agent:`, error);
      return {
        responseType: ResponseType.ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  protected buildMessages(request: ChatRequest): Array<{role: string, content: string}> {
    // Build proper Mastra message format
    const messages: Array<{role: string, content: string}> = [];
    
    if (request.chatHistory) {
      request.chatHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }
    
    messages.push({
      role: 'user',
      content: request.prompt.content
    });
    
    return messages;
  }

  async streamVNext(messages: any, options?: any) {
    // For MCP agents, tools are already configured in the agent constructor
    // No need to pass toolsets in options
    console.log(`[${this.name}] Starting streamVNext with messages:`, messages);
    console.log(`[${this.name}] Agent has tools:`, this.agent.tools ? Object.keys(this.agent.tools) : 'NO TOOLS PROPERTY');
    console.log(`[${this.name}] Agent tools property:`, this.agent.tools ? 'HAS TOOLS' : 'NO TOOLS');
    
    // Force log the actual agent configuration
    console.log(`[${this.name}] Raw agent config:`, {
      name: this.agent.name,
      description: this.agent.getDescription?.(),
      hasTools: !!this.agent.tools,
    });
    
    // Delegate to the underlying Mastra agent's streamVNext method
    const result = await this.agent.streamVNext(messages, options || {});
    
    console.log(`[${this.name}] streamVNext completed`);
    return result;
  }

  protected parseResponse(result: any): AgentResponse {
    // Parse the Mastra agent response
    const content = result?.text || result?.content || '';
    
    return {
      responseType: ResponseType.SUCCESS,
      content: content,
    };
  }

  getDefinition() {
    return {
      name: this.name,
      description: this.description,
      capabilities: this.capabilities,
    };
  }
}