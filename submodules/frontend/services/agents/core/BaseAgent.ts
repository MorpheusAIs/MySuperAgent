import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { AgentResponse, ChatRequest, ResponseType } from '@/services/agents/types';

export abstract class BaseAgent {
  protected agent: Agent;
  protected name: string;
  protected description: string;
  protected capabilities: string[];

  constructor(
    name: string,
    description: string,
    capabilities: string[],
    modelName: string = 'gpt-4o-mini'
  ) {
    this.name = name;
    this.description = description;
    this.capabilities = capabilities;

    // Create the Mastra agent with proper configuration
    this.agent = new Agent({
      name: this.name,
      description: this.description,
      instructions: this.getInstructions(),
      model: openai(modelName),
      tools: this.getTools(),
    });
  }

  abstract getInstructions(): string;
  abstract getTools(): any;

  async chat(request: ChatRequest): Promise<AgentResponse> {
    try {
      // Build messages from request
      const messages = this.buildMessages(request);
      
      // Use Mastra's generate method
      const result = await this.agent.generate(messages);

      return this.parseResponse(result);
    } catch (error) {
      console.error(`Error in ${this.name} agent:`, error);
      return {
        responseType: ResponseType.ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  protected buildMessages(request: ChatRequest): string {
    // Build a simple string from chat history and current prompt
    let fullMessage = '';
    
    if (request.chatHistory) {
      request.chatHistory.forEach(msg => {
        fullMessage += `${msg.role}: ${msg.content}\n`;
      });
    }
    
    fullMessage += `user: ${request.prompt.content}`;
    
    return fullMessage;
  }

  async streamVNext(messages: any, options?: any) {
    // Delegate to the underlying Mastra agent's streamVNext method
    return await this.agent.streamVNext(messages, options);
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