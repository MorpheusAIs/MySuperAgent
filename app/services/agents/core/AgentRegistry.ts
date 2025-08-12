import { BaseAgent } from '@/services/agents/core/BaseAgent';
import { AgentDefinition } from '@/services/agents/types';

class AgentRegistryClass {
  private agents: Map<string, BaseAgent> = new Map();
  private initialized = false;

  register(agent: BaseAgent) {
    const definition = agent.getDefinition();
    this.agents.set(definition.name, agent);
  }

  get(name: string): BaseAgent | undefined {
    return this.agents.get(name);
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

  // Legacy keyword-based selection - DEPRECATED, use selectBestAgentWithLLM instead
  selectBestAgent(prompt: string): BaseAgent | null {
    console.warn('[AGENT SELECTION] Using deprecated keyword-based selection');
    // Fallback to default agent
    return this.get('default') || null;
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
      const selectedAgent = this.get(selectedAgentName);
      
      if (selectedAgent) {
        console.log('[AGENT SELECTION DEBUG] Successfully selected agent:', selectedAgentName);
        return {
          agent: selectedAgent,
          reasoning: result.object.reasoning
        };
      } else {
        console.warn('[AGENT SELECTION DEBUG] LLM selected non-existent agent:', selectedAgentName);
        const fallbackAgent = this.get('default');
        return {
          agent: fallbackAgent || null,
          reasoning: `LLM selected ${selectedAgentName} but agent not found, using default`
        };
      }
      
    } catch (error) {
      console.error('[AGENT SELECTION DEBUG] Error in LLM-based selection:', error);
      const fallbackAgent = this.get('default');
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
    
    // Import and register all agents
    const { DefaultAgent } = await import('@/services/agents/agents/DefaultAgent');
    const { ResearchAgent } = await import('@/services/agents/agents/ResearchAgent');
    const { CodeAgent } = await import('@/services/agents/agents/CodeAgent');
    const { DataAgent } = await import('@/services/agents/agents/DataAgent');
    const { MathAgent } = await import('@/services/agents/agents/MathAgent');
    
    // Import ALL backend agents
    const {
      McpRedditAgent, McpBraveAgent, McpHackerNewsAgent, McpGoogleMapsAgent,
      McpAirbnbAgent, McpYtTranscriptsAgent, McpPuppeteerAgent,
      CryptoDataAgentBackend, MorRewardsAgentBackend, RugcheckAgentBackend,
      CodexAgentBackend, ImagenAgentBackend, DexscreenerAgentBackend,
      DefaultAgentBackend, RagAgentBackend, ElfaAgentBackend,
      NewsAgentBackend, TweetSizzlerAgentBackend
    } = await import('@/services/agents/agents/AllBackendAgents');
    
    const {
      ResearchAgentBackend, DocumentAnalyzer, WebExtractionSpecialist,
      InstagramAgentBackend, TikTokAgent, TwitterAnalystBackend,
      FacebookAnalyst, RedditAnalyst, SocialMediaIntelligenceBackend,
      BusinessAnalystBackend, LinkedInIntelligence, JobMarketAnalyst
    } = await import('@/services/agents/agents/BackendAgents');
    
    const {
      EcommerceAnalystBackend, TravelIntelligenceBackend, RealEstateAnalystBackend,
      YouTubeAnalystBackend, VisualContentCreatorBackend, ContentDiscoverySpecialist,
      CodeAssistantBackend
    } = await import('@/services/agents/agents/BackendAgentsPartTwo');
    
    // Register original agents (keep for backward compatibility)
    this.register(new DefaultAgent());
    this.register(new ResearchAgent());
    this.register(new CodeAgent());
    this.register(new DataAgent());
    this.register(new MathAgent());
    
    // Register ALL backend agents
    // MCP Agents
    this.register(new McpRedditAgent());
    this.register(new McpBraveAgent());
    this.register(new McpHackerNewsAgent());
    this.register(new McpGoogleMapsAgent());
    this.register(new McpAirbnbAgent());
    this.register(new McpYtTranscriptsAgent());
    this.register(new McpPuppeteerAgent());
    
    // Crypto Agents
    this.register(new CryptoDataAgentBackend());
    this.register(new MorRewardsAgentBackend());
    this.register(new RugcheckAgentBackend());
    this.register(new CodexAgentBackend());
    this.register(new ImagenAgentBackend());
    this.register(new DexscreenerAgentBackend());
    this.register(new ElfaAgentBackend());
    
    // Core Agents
    this.register(new DefaultAgentBackend());
    this.register(new RagAgentBackend());
    this.register(new NewsAgentBackend());
    this.register(new TweetSizzlerAgentBackend());
    
    // Research & Analysis Agents
    this.register(new ResearchAgentBackend());
    this.register(new DocumentAnalyzer());
    this.register(new WebExtractionSpecialist());
    
    // Social Media Agents
    this.register(new InstagramAgentBackend());
    this.register(new TikTokAgent());
    this.register(new TwitterAnalystBackend());
    this.register(new FacebookAnalyst());
    this.register(new RedditAnalyst());
    this.register(new SocialMediaIntelligenceBackend());
    
    // Business Intelligence Agents
    this.register(new BusinessAnalystBackend());
    this.register(new LinkedInIntelligence());
    this.register(new JobMarketAnalyst());
    
    // Specialized Industry Agents
    this.register(new EcommerceAnalystBackend());
    this.register(new TravelIntelligenceBackend());
    this.register(new RealEstateAnalystBackend());
    
    // Content & Multimedia Agents
    this.register(new YouTubeAnalystBackend());
    this.register(new VisualContentCreatorBackend());
    this.register(new ContentDiscoverySpecialist());
    this.register(new CodeAssistantBackend());
    
    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }
}

export const AgentRegistry = new AgentRegistryClass();