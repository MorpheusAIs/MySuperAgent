import { BaseAgent } from '@/services/agents/core/BaseAgent';
import { AgentDefinition } from '@/services/agents/types';

class AgentRegistryClass {
  private agents: Map<string, BaseAgent> = new Map();
  private lazyAgents: Map<string, () => Promise<BaseAgent>> = new Map();
  private initialized = false;
  private coreAgentsLoaded = false;

  register(agent: BaseAgent) {
    const definition = agent.getDefinition();
    this.agents.set(definition.name, agent);
  }

  registerLazy(name: string, loader: () => Promise<BaseAgent>) {
    this.lazyAgents.set(name, loader);
  }

  async get(name: string): Promise<BaseAgent | undefined> {
    // Check if agent is already loaded
    let agent = this.agents.get(name);
    if (agent) return agent;

    // Check if agent can be lazy loaded
    const loader = this.lazyAgents.get(name);
    if (loader) {
      try {
        agent = await loader();
        this.register(agent);
        this.lazyAgents.delete(name);
        return agent;
      } catch (error) {
        console.error(`Failed to lazy load agent ${name}:`, error);
      }
    }

    return undefined;
  }

  getAll(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  getDefinitions(): AgentDefinition[] {
    return Array.from(this.agents.values()).map(agent => agent.getDefinition());
  }

  getAvailableAgents(): Array<{ name: string; description: string }> {
    return this.getDefinitions().map(def => ({
      name: def.name,
      description: def.description,
    }));
  }

  getAgentsByCapability(capability: string): BaseAgent[] {
    return this.getAll().filter(agent => 
      agent.getDefinition().capabilities.some(cap => 
        cap.toLowerCase().includes(capability.toLowerCase())
      )
    );
  }


  /**
   * Get agent descriptions for LLM-based selection (similar to Python's llm_choice_payload)
   */
  getLLMChoicePayload(): Array<{name: string, description: string, capabilities: string[]}> {
    return this.getDefinitions().map(def => ({
      name: def.name,
      description: def.description,
      capabilities: def.capabilities
    }));
  }

  /**
   * Use LLM to intelligently select the best agent for a task (proper implementation)
   */
  async selectBestAgentWithLLM(prompt: string): Promise<{agent: BaseAgent | null, reasoning: string}> {
    console.log('[AGENT SELECTION DEBUG] Starting LLM-based agent selection for prompt:', prompt.substring(0, 100) + '...');
    
    const agentDescriptions = this.getLLMChoicePayload();
    console.log('[AGENT SELECTION DEBUG] Available agents:', agentDescriptions.map(a => a.name));
    
    try {
      // Import openai from ai-sdk
      const { openai } = await import('@ai-sdk/openai');
      const { generateObject } = await import('ai');
      const { z } = await import('zod');
      
      // Create structured output schema for agent selection
      const AgentSelectionSchema = z.object({
        selected_agent: z.string().describe('The name of the best agent for this task'),
        reasoning: z.string().describe('Explanation of why this agent was selected')
      });
      
      // Build the selection prompt similar to Python backend
      const agentList = agentDescriptions.map(agent => 
        `- ${agent.name}: ${agent.description} (Capabilities: ${agent.capabilities.join(', ')})`
      ).join('\n');
      
      const selectionPrompt = `Select the best agent for this task. Match agent expertise to task requirements. Prefer specialized agents over generalists.\n\nAvailable agents:\n${agentList}\n\nTask: ${prompt}`;
      
      console.log('[AGENT SELECTION DEBUG] Making LLM call with prompt:', selectionPrompt.substring(0, 200) + '...');
      
      // Make the LLM call using ai-sdk
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: AgentSelectionSchema,
        prompt: selectionPrompt,
      });
      
      console.log('[AGENT SELECTION DEBUG] LLM selection result:', result.object);
      
      const selectedAgentName = result.object.selected_agent;
      const selectedAgent = await this.get(selectedAgentName);
      
      if (selectedAgent) {
        console.log('[AGENT SELECTION DEBUG] Successfully selected agent:', selectedAgentName);
        return {
          agent: selectedAgent,
          reasoning: result.object.reasoning
        };
      } else {
        console.warn('[AGENT SELECTION DEBUG] LLM selected non-existent agent:', selectedAgentName);
        const fallbackAgent = await this.get('default');
        return {
          agent: fallbackAgent || null,
          reasoning: `LLM selected ${selectedAgentName} but agent not found, using default`
        };
      }
      
    } catch (error) {
      console.error('[AGENT SELECTION DEBUG] Error in LLM-based selection:', error);
      const fallbackAgent = await this.get('default');
      return {
        agent: fallbackAgent || null,
        reasoning: `Error in LLM selection: ${error instanceof Error ? error.message : 'Unknown error'}, using default`
      };
    }
  }

  parseCommand(prompt: string): { agentName: string | null; message: string } {
    const commandPattern = /^@(\w+)\s+(.*)$/;
    const match = prompt.match(commandPattern);
    
    if (match) {
      const agentName = match[1];
      const message = match[2];
      
      if (this.agents.has(agentName)) {
        return { agentName, message };
      }
    }
    
    return { agentName: null, message: prompt };
  }

  async initialize() {
    if (this.initialized) return;
    
    // Load only core agents immediately for fast startup
    await this.loadCoreAgents();
    
    // Register all other agents for lazy loading
    await this.registerLazyAgents();
    
    this.initialized = true;
  }

  private async loadCoreAgents() {
    if (this.coreAgentsLoaded) return;
    
    // Load only the most essential agents immediately
    const { DefaultAgent } = await import('@/services/agents/agents/DefaultAgent');
    const { ResearchAgent } = await import('@/services/agents/agents/ResearchAgent');
    
    this.register(new DefaultAgent());
    this.register(new ResearchAgent());
    
    this.coreAgentsLoaded = true;
  }

  private async registerLazyAgents() {
    // Register remaining core agents
    this.registerLazy('code', async () => {
      const { CodeAgent } = await import('@/services/agents/agents/CodeAgent');
      return new CodeAgent();
    });
    
    this.registerLazy('data', async () => {
      const { DataAgent } = await import('@/services/agents/agents/DataAgent');
      return new DataAgent();
    });
    
    this.registerLazy('math', async () => {
      const { MathAgent } = await import('@/services/agents/agents/MathAgent');
      return new MathAgent();
    });

    // Register most commonly used backend agents
    this.registerLazy('crypto_data_backend', async () => {
      const { CryptoDataAgentBackend } = await import('@/services/agents/agents/AllBackendAgents');
      return new CryptoDataAgentBackend();
    });

    this.registerLazy('codex_backend', async () => {
      const { CodexAgentBackend } = await import('@/services/agents/agents/AllBackendAgents');
      return new CodexAgentBackend();
    });

    this.registerLazy('elfa_backend', async () => {
      const { ElfaAgentBackend } = await import('@/services/agents/agents/AllBackendAgents');
      return new ElfaAgentBackend();
    });

    this.registerLazy('research_backend', async () => {
      const { ResearchAgentBackend } = await import('@/services/agents/agents/BackendAgents');
      return new ResearchAgentBackend();
    });

    // Register specialized agents for lazy loading only when needed
    this.registerLazy('rugcheck_backend', async () => {
      const { RugcheckAgentBackend } = await import('@/services/agents/agents/AllBackendAgents');
      return new RugcheckAgentBackend();
    });

    this.registerLazy('dexscreener_backend', async () => {
      const { DexscreenerAgentBackend } = await import('@/services/agents/agents/AllBackendAgents');
      return new DexscreenerAgentBackend();
    });

    this.registerLazy('news_backend', async () => {
      const { NewsAgentBackend } = await import('@/services/agents/agents/AllBackendAgents');
      return new NewsAgentBackend();
    });

    // Add more lazy agents as needed
    // This approach reduces initial bundle size and startup time
  }

  isInitialized() {
    return this.initialized;
  }
}

export const AgentRegistry = new AgentRegistryClass();