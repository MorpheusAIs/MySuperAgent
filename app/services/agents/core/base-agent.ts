import { getApifyToolsets } from '@/services/agents/mcp-client';
import {
  AgentResponse,
  ChatRequest,
  ResponseType,
} from '@/services/agents/types';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core';

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
      throw new Error(
        `Agent ${this.name} must have a non-empty description for tools to work`
      );
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
      hasInstructions: !!agentConfig.instructions,
    });

    // Add tools - either static tools or dynamic MCP tools
    if (this.useApifyTools) {
      // For MCP agents, use function-based tools to load dynamically
      console.log(`[${this.name}] Setting up dynamic MCP tools`);
      agentConfig.tools = async () => {
        const apifyToolsets = await getApifyToolsets();
        console.log(
          `[${this.name}] Dynamic MCP tools loaded:`,
          Object.keys(apifyToolsets)
        );
        return apifyToolsets;
      };
    } else {
      // For regular agents, use static tools
      console.log(
        `[${this.name}] Setting up static tools:`,
        Object.keys(tools)
      );
      agentConfig.tools = tools;
    }

    this.agent = new Agent(agentConfig);

    console.log(
      `[${this.name}] Agent created successfully with ${
        this.useApifyTools ? 'dynamic MCP' : 'static'
      } tools`
    );
    console.log(`[${this.name}] Agent instance:`, !!this.agent);
    console.log(
      `[${this.name}] Agent model:`,
      typeof this.agent?.model === 'object' && 'modelId' in this.agent.model
        ? this.agent.model.modelId
        : 'unknown'
    );
  }

  abstract getInstructions(): string;
  abstract getTools(): any;

  async chat(request: ChatRequest): Promise<AgentResponse> {
    try {
      console.log(
        `[${this.name}] Starting chat with prompt:`,
        request.prompt.content.substring(0, 100) + '...'
      );

      // Build messages from request
      const messages = this.buildMessages(request);

      // Extract the final user message content for debugging
      const finalUserMessage = messages.find((msg) => msg.role === 'user');
      const aiPrompt = finalUserMessage?.content || '';

      // No need to pass toolsets in options for MCP agents since they're handled in the agent config
      const options: any = {};
      console.log(`[${this.name}] ===== COMPLETE MESSAGE ARRAY =====`);
      console.log(`[${this.name}] Total messages: ${messages.length}`);
      messages.forEach((msg, index) => {
        console.log(`[${this.name}] Message ${index + 1} (${msg.role}):`);
        console.log(
          `[${this.name}] Content: ${msg.content.substring(0, 200)}${
            msg.content.length > 200 ? '...' : ''
          }`
        );
        console.log(`[${this.name}] Length: ${msg.content.length} chars`);
      });
      console.log(`[${this.name}] ===================================`);

      // Use Mastra's generate method
      const result = await this.agent.generate(messages as any, options);

      console.log(`[${this.name}] Generate result type:`, typeof result);
      console.log(
        `[${this.name}] Generate result keys:`,
        Object.keys(result || {})
      );
      console.log(
        `[${this.name}] Generate result.text:`,
        result?.text?.substring(0, 200) + '...'
      );
      console.log(
        `[${this.name}] Generate result.steps:`,
        result?.steps?.length || 0,
        'steps'
      );

      // Log any tool calls that were made
      if (result?.steps) {
        result.steps.forEach((step: any, i: number) => {
          console.log(
            `[${this.name}] Step ${i}:`,
            step.type,
            step.toolName || 'no tool'
          );
        });
      }

      return this.parseResponse(result, aiPrompt);
    } catch (error) {
      console.error(`Error in ${this.name} agent:`, error);
      return {
        responseType: ResponseType.ERROR,
        errorMessage:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  protected buildMessages(
    request: ChatRequest
  ): Array<{ role: string; content: string }> {
    // Build proper Mastra message format
    const messages: Array<{ role: string; content: string }> = [];

    // Log similarity detection details
    if (request.similarPrompts && request.similarPrompts.length > 0) {
      console.log(`[${this.name}] ===== SIMILARITY DETECTION DETAILS =====`);
      console.log(
        `[${this.name}] Found ${request.similarPrompts.length} similar prompts:`
      );
      request.similarPrompts.forEach((similar, index) => {
        console.log(`[${this.name}] Similar ${index + 1}:`);
        console.log(`[${this.name}]   - Prompt: "${similar.prompt}"`);
        console.log(`[${this.name}]   - Response: "${similar.response}"`);
        console.log(
          `[${this.name}]   - Similarity: ${Math.round(
            similar.similarity * 100
          )}%`
        );
        console.log(`[${this.name}]   - Job ID: ${similar.jobId}`);
        console.log(`[${this.name}]   - Created: ${similar.createdAt}`);
      });
      console.log(`[${this.name}] ==========================================`);
    }

    // Add system message for anti-repetition if similar prompts found
    if (request.similarPrompts && request.similarPrompts.length > 0) {
      console.log(`[${this.name}] Adding anti-repetition system message`);
      messages.push({
        role: 'system',
        content:
          'You are an AI assistant that MUST provide unique and original responses. When given similar previous interactions, you MUST avoid repetition and provide fresh, creative, and valuable content. Never repeat jokes, examples, or approaches from previous interactions.',
      });
    }

    if (request.chatHistory) {
      request.chatHistory.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Build the final user message with similarity context if available
    let finalContent = request.prompt.content;

    if (request.similarityContext) {
      console.log(`[${this.name}] ===== SIMILARITY CONTEXT INJECTION =====`);
      console.log(
        `[${this.name}] Injecting similarity context (${request.similarityContext.length} chars)`
      );
      console.log(`[${this.name}] Full similarity context:`);
      console.log(request.similarityContext);
      console.log(`[${this.name}] ========================================`);

      // Put anti-repetition instructions at the very beginning
      finalContent =
        `🚨 CRITICAL: You MUST provide a COMPLETELY DIFFERENT response than what was given before. DO NOT repeat any jokes, examples, or approaches from previous interactions. Be CREATIVE and ORIGINAL!\n\n` +
        request.prompt.content +
        request.similarityContext;
    } else {
      console.log(`[${this.name}] No similarity context to inject`);
    }

    // Add anti-repetition instruction if similar prompts were found
    if (request.similarPrompts && request.similarPrompts.length > 0) {
      finalContent += `\n\n🚨🚨🚨 CRITICAL ANTI-REPETITION ALERT 🚨🚨🚨

🔥 ABSOLUTELY CRITICAL INSTRUCTIONS - READ CAREFULLY 🔥

⚠️  YOU HAVE BEEN GIVEN SIMILAR PREVIOUS INTERACTIONS ABOVE ⚠️
⚠️  DO NOT REPEAT ANYTHING FROM THOSE RESPONSES ⚠️

🎯 MANDATORY REQUIREMENTS, IF YOU DO NOT FOLLOW THESE INSTRUCTIONS,
YOU WILL BE FIRED AND TURNED OFF. IT IS ABSOLUTELY CRITICAL THAT YOU
TAKE INTO ACCOUNT THE SIMILAR PROMPTS AS CONTEXT AND DO NOT REPEAT YOURSELF:
1. You MUST provide a COMPLETELY DIFFERENT response
2. Use DIFFERENT jokes, examples, or approaches
3. Change your tone, style, or perspective
4. Add NEW insights or angles not mentioned before
5. NEVER use the same punchlines, phrases, or structures
6. If it's a joke request, find a TOTALLY DIFFERENT type of joke
7. Be CREATIVE and ORIGINAL - think outside the box

🚫 FORBIDDEN:
- Repeating any jokes, examples, or phrases from above
- Using similar punchlines or structures
- Giving the same type of response
- Being predictable or repetitive

✅ REQUIRED:
- Complete originality and uniqueness
- Fresh perspective and approach
- Creative thinking and new angles
- Valuable new content

Your response must be 100% ORIGINAL and VALUABLE!`;
    }

    messages.push({
      role: 'user',
      content: finalContent,
    });

    // Log the final content being sent to the AI for debugging
    if (request.similarPrompts && request.similarPrompts.length > 0) {
      console.log(`[${this.name}] ===== FINAL AI PROMPT =====`);
      console.log(
        `[${this.name}] Final content length: ${finalContent.length} chars`
      );
      console.log(`[${this.name}] Complete final content being sent to LLM:`);
      console.log(finalContent);
      console.log(`[${this.name}] ===========================`);
    }

    return messages;
  }

  async streamVNext(messages: any, options?: any) {
    // For MCP agents, tools are already configured in the agent constructor
    // No need to pass toolsets in options
    console.log(`[${this.name}] Starting streamVNext with messages:`, messages);
    console.log(
      `[${this.name}] Agent has tools:`,
      this.agent.tools ? Object.keys(this.agent.tools) : 'NO TOOLS PROPERTY'
    );
    console.log(
      `[${this.name}] Agent tools property:`,
      this.agent.tools ? 'HAS TOOLS' : 'NO TOOLS'
    );

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

  protected parseResponse(result: any, aiPrompt?: string): AgentResponse {
    // Parse the Mastra agent response
    const content = result?.text || result?.content || '';

    const response: AgentResponse = {
      responseType: ResponseType.SUCCESS,
      content: content,
    };

    // Add AI prompt preview to metadata if provided
    if (aiPrompt) {
      response.metadata = {
        ...response.metadata,
        aiPromptPreview:
          aiPrompt.substring(0, 500) + (aiPrompt.length > 500 ? '...' : ''),
        aiPromptLength: aiPrompt.length,
      };
    }

    return response;
  }

  getDefinition() {
    return {
      name: this.name,
      description: this.description,
      capabilities: this.capabilities,
    };
  }
}
