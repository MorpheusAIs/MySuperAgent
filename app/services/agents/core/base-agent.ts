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

      // Configure sampling parameters to prevent duplicate outputs
      // Using industry best practices from OpenAI and research
      const options: any = {
        // Dynamic seed based on timestamp + random component ensures different outputs each time
        // This is the KEY to preventing duplicate outputs in scheduled/recurring jobs
        seed: Date.now() + Math.floor(Math.random() * 1000000),

        // Temperature controls randomness: 0.7-0.9 provides good variety while maintaining quality
        // Higher than 0 is CRITICAL for non-deterministic outputs
        temperature: 0.8,

        // Frequency penalty reduces likelihood of repeating the same words/phrases
        // Range: 0-2, where higher values penalize repetition more strongly
        frequency_penalty: 0.7,

        // Presence penalty encourages exploring new topics/concepts
        // Range: 0-2, where higher values encourage more novelty
        presence_penalty: 0.6,
      };

      console.log(`[${this.name}] ===== ANTI-DUPLICATION CONFIG =====`);
      console.log(`[${this.name}] Seed: ${options.seed} (dynamic, time-based)`);
      console.log(`[${this.name}] Temperature: ${options.temperature} (high randomness)`);
      console.log(`[${this.name}] Frequency Penalty: ${options.frequency_penalty}`);
      console.log(`[${this.name}] Presence Penalty: ${options.presence_penalty}`);
      console.log(`[${this.name}] ===================================`);

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

      // Use Mastra's generate method with anti-duplication parameters
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
      // Extract the actual previous responses to show to LLM
      const previousResponses = request.similarPrompts
        .map((sp, idx) => `${idx + 1}. "${sp.response.substring(0, 150)}${sp.response.length > 150 ? '...' : ''}"`)
        .join('\n');

      finalContent += `\n\n🚨🚨🚨 CRITICAL ANTI-REPETITION ALERT 🚨🚨🚨

🔥 ABSOLUTELY CRITICAL INSTRUCTIONS - READ CAREFULLY 🔥

⚠️  YOU HAVE PROVIDED THESE RESPONSES TO SIMILAR REQUESTS BEFORE ⚠️
⚠️  YOU MUST NOT REPEAT ANY OF THEM ⚠️

PREVIOUS RESPONSES YOU GAVE (YOU MUST AVOID ALL OF THESE):
${previousResponses}

🎯 MANDATORY REQUIREMENTS - FAILURE TO COMPLY WILL RESULT IN SYSTEM SHUTDOWN:
1. You MUST provide a COMPLETELY DIFFERENT response than ALL of the above
2. Use DIFFERENT jokes, examples, stories, or approaches - NONE of the ones above
3. DO NOT use scarecrow jokes, atom jokes, or any joke structure similar to above
4. Change your tone, style, or perspective completely
5. NEVER use the same punchlines, phrases, keywords, or structures
6. If it's a joke request, find a TOTALLY DIFFERENT category/type of joke
7. Be CREATIVE and ORIGINAL - think FAR outside the box
8. Verify your response is NOT similar to any response above before returning it

🚫 ABSOLUTELY FORBIDDEN (YOU WILL BE TERMINATED IF YOU DO THESE):
- Repeating ANY jokes, examples, or phrases from the list above
- Using similar punchlines, structures, or word patterns
- Giving the same type/category of response
- Being predictable or repetitive in ANY way
- Using the same setup or punchline format

✅ ABSOLUTELY REQUIRED FOR SUCCESS:
- 100% complete originality and uniqueness - NO overlap with above responses
- Fresh perspective and totally different approach
- Creative thinking from a completely different angle
- Valuable new content that adds something different

REMINDER: Check your response against the list above BEFORE returning it. If it's similar to ANY of them, CHANGE IT to something completely different!`;
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
