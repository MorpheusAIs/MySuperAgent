import { BaseAgent } from '@/services/agents/core/base-agent';
import { AgentDefinition } from '@/services/agents/types';
import { UserMCPManager, MCPServerStatus, ToolDescriptor } from '@/services/mcp/user-mcp-manager';
import { UserA2AManager, A2AAgentStatus } from '@/services/a2a/user-a2a-manager';

class AgentRegistryClass {
  private agents: Map<string, BaseAgent> = new Map();
  private lazyAgents: Map<string, () => Promise<BaseAgent>> = new Map();
  private initialized = false;
  private coreAgentsLoaded = false;
  private userSpecificAgents: Map<string, Map<string, BaseAgent>> = new Map(); // walletAddress -> agentName -> agent
  private userMCPTools: Map<string, ToolDescriptor[]> = new Map(); // walletAddress -> tools
  private userA2AAgents: Map<string, A2AAgentStatus[]> = new Map(); // walletAddress -> agents

  register(agent: BaseAgent) {
    const definition = agent.getDefinition();
    this.agents.set(definition.name, agent);
  }

  registerLazy(
    name: string,
    loader: () => Promise<BaseAgent>,
    description?: string
  ) {
    this.lazyAgents.set(name, loader);
    if (description) {
      this.agentDescriptions.set(name, description);
    }
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

  /**
   * Get an agent instance for a specific request/job to ensure isolation
   * Note: Currently returns the same instance for performance, but could be
   * enhanced to create new instances if needed for complete isolation
   */
  async getForRequest(
    name: string,
    requestId?: string
  ): Promise<BaseAgent | undefined> {
    // For now, return the same instance but log the request for debugging
    if (requestId) {
      console.log(
        `[AgentRegistry] Getting agent ${name} for request ${requestId}`
      );
    }
    return this.get(name);
  }

  getAll(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  getDefinitions(): AgentDefinition[] {
    return Array.from(this.agents.values()).map((agent) =>
      agent.getDefinition()
    );
  }

  private agentDescriptions = new Map<string, string>();

  getAvailableAgents(): Array<{ name: string; description: string }> {
    // Return both loaded agents and lazy agents
    const loadedAgents = this.getDefinitions().map((def) => ({
      name: def.name,
      description: def.description,
    }));

    const lazyAgents = Array.from(this.agentDescriptions.entries()).map(
      ([name, description]) => ({
        name,
        description,
      })
    );

    // Combine and deduplicate
    const allAgents = new Map();
    loadedAgents.forEach((agent) => allAgents.set(agent.name, agent));
    lazyAgents.forEach((agent) => allAgents.set(agent.name, agent));

    return Array.from(allAgents.values());
  }

  /**
   * Get available agents for a specific user, including their custom MCP tools and A2A agents
   */
  async getUserAvailableAgents(walletAddress: string): Promise<Array<{ 
    name: string; 
    description: string; 
    type: 'core' | 'mcp' | 'a2a';
    capabilities?: string[];
    status?: string;
  }>> {
    const coreAgents = this.getAvailableAgents().map(agent => ({
      ...agent,
      type: 'core' as const
    }));

    // Get user's MCP tools
    const mcpTools = await this.getUserMCPTools(walletAddress);
    const mcpAgents = mcpTools.map(tool => ({
      name: `mcp_${tool.name}`,
      description: tool.description || `MCP tool: ${tool.name}`,
      type: 'mcp' as const,
      capabilities: [tool.name]
    }));

    // Get user's A2A agents
    const a2aAgents = await this.getUserA2AAgents(walletAddress);
    const a2aAgentsList = a2aAgents.map(agent => ({
      name: `a2a_${agent.agentId}`,
      description: `A2A Agent: ${agent.agentName}`,
      type: 'a2a' as const,
      capabilities: agent.capabilities,
      status: agent.connectionStatus
    }));

    return [...coreAgents, ...mcpAgents, ...a2aAgentsList];
  }

  /**
   * Get user's MCP tools with caching
   */
  async getUserMCPTools(walletAddress: string): Promise<ToolDescriptor[]> {
    // Check cache first
    const cached = this.userMCPTools.get(walletAddress);
    if (cached) {
      return cached;
    }

    try {
      const tools = await UserMCPManager.getUserAvailableTools(walletAddress);
      this.userMCPTools.set(walletAddress, tools);
      return tools;
    } catch (error) {
      console.error(`Failed to get MCP tools for user ${walletAddress}:`, error);
      return [];
    }
  }

  /**
   * Get user's A2A agents with caching
   */
  async getUserA2AAgents(walletAddress: string): Promise<A2AAgentStatus[]> {
    // Check cache first
    const cached = this.userA2AAgents.get(walletAddress);
    if (cached) {
      return cached;
    }

    try {
      const agents = await UserA2AManager.getUserA2AAgents(walletAddress);
      this.userA2AAgents.set(walletAddress, agents);
      return agents;
    } catch (error) {
      console.error(`Failed to get A2A agents for user ${walletAddress}:`, error);
      return [];
    }
  }

  /**
   * Refresh user-specific caches
   */
  async refreshUserData(walletAddress: string): Promise<void> {
    // Clear caches
    this.userMCPTools.delete(walletAddress);
    this.userA2AAgents.delete(walletAddress);

    // Reload data
    await Promise.all([
      this.getUserMCPTools(walletAddress),
      this.getUserA2AAgents(walletAddress)
    ]);
  }

  /**
   * Clear user data (on logout)
   */
  clearUserData(walletAddress: string): void {
    this.userMCPTools.delete(walletAddress);
    this.userA2AAgents.delete(walletAddress);
    this.userSpecificAgents.delete(walletAddress);
  }

  /**
   * Get comprehensive capability summary for a user
   */
  async getUserCapabilitySummary(walletAddress: string): Promise<{
    totalAgents: number;
    coreAgents: number;
    mcpTools: number;
    a2aAgents: number;
    connectedA2AAgents: number;
    allCapabilities: string[];
    mcpCapabilities: string[];
    a2aCapabilities: string[];
  }> {
    const userAgents = await this.getUserAvailableAgents(walletAddress);
    
    const coreAgents = userAgents.filter(a => a.type === 'core');
    const mcpAgents = userAgents.filter(a => a.type === 'mcp');
    const a2aAgents = userAgents.filter(a => a.type === 'a2a');
    const connectedA2AAgents = a2aAgents.filter(a => a.status === 'connected');
    
    const allCapabilities = new Set<string>();
    const mcpCapabilities = new Set<string>();
    const a2aCapabilities = new Set<string>();
    
    userAgents.forEach(agent => {
      if (agent.capabilities) {
        agent.capabilities.forEach(cap => {
          allCapabilities.add(cap);
          if (agent.type === 'mcp') mcpCapabilities.add(cap);
          if (agent.type === 'a2a') a2aCapabilities.add(cap);
        });
      }
    });
    
    return {
      totalAgents: userAgents.length,
      coreAgents: coreAgents.length,
      mcpTools: mcpAgents.length,
      a2aAgents: a2aAgents.length,
      connectedA2AAgents: connectedA2AAgents.length,
      allCapabilities: Array.from(allCapabilities),
      mcpCapabilities: Array.from(mcpCapabilities),
      a2aCapabilities: Array.from(a2aCapabilities)
    };
  }

  static getAllAgentDescriptions(): Array<{
    name: string;
    description: string;
  }> {
    // Static list of all agents to avoid dynamic import issues in API endpoints
    return [
      {
        name: 'default',
        description:
          'A general-purpose AI assistant that can help with a wide variety of tasks',
      },
      {
        name: 'research',
        description:
          'A specialized research assistant that can search the web and gather information on various topics',
      },
      {
        name: 'code',
        description:
          'A specialized coding assistant that can help with programming tasks, code analysis, and debugging',
      },
      {
        name: 'data',
        description:
          'A data analysis specialist that can process, analyze, and visualize data from various sources',
      },
      {
        name: 'math',
        description:
          'A mathematical computation expert that can solve complex equations and mathematical problems',
      },
      {
        name: 'crypto_data_backend',
        description:
          'Provides cryptocurrency market data, price analysis, and blockchain information',
      },
      {
        name: 'codex_backend',
        description:
          'Advanced code analysis and development assistance for complex programming tasks',
      },
      {
        name: 'elfa_backend',
        description: 'Social media sentiment and trend analysis specialist',
      },
      {
        name: 'rugcheck_backend',
        description:
          'Cryptocurrency security analysis and rug pull detection specialist',
      },
      {
        name: 'dexscreener_backend',
        description: 'Decentralized exchange data and trading pair analysis',
      },
      {
        name: 'news_backend',
        description:
          'Real-time news aggregation and analysis from multiple sources',
      },
      {
        name: 'tweet_sizzler_backend',
        description:
          'Twitter content creation and social media engagement specialist',
      },
      {
        name: 'mor_rewards_backend',
        description: 'Morpheus network rewards and token distribution analysis',
      },
      {
        name: 'imagen_backend',
        description:
          'AI image generation and visual content creation specialist',
      },
      {
        name: 'rag_backend',
        description:
          'Retrieval-augmented generation for enhanced knowledge retrieval',
      },
      {
        name: 'default_backend',
        description:
          'General-purpose backend agent for various tasks and integrations',
      },
      {
        name: 'mcp_reddit',
        description:
          'Reddit content analysis and community insights specialist',
      },
      {
        name: 'mcp_brave',
        description: 'Web search and information retrieval using Brave Search',
      },
      {
        name: 'mcp_hackernews',
        description: 'Hacker News content analysis and tech trend monitoring',
      },
      {
        name: 'mcp_googlemaps',
        description:
          'Location-based services and geographical information specialist',
      },
      {
        name: 'mcp_airbnb',
        description: 'Travel accommodation search and booking analysis',
      },
      {
        name: 'mcp_yt_transcripts',
        description: 'YouTube video transcript extraction and analysis',
      },
      {
        name: 'mcp_puppeteer',
        description: 'Web automation and scraping specialist using Puppeteer',
      },
      {
        name: 'research_backend',
        description: 'Advanced research and information gathering specialist',
      },
      {
        name: 'document_analyzer',
        description: 'Document analysis and text extraction specialist',
      },
      {
        name: 'web_extraction',
        description: 'Web content extraction and data scraping specialist',
      },
      {
        name: 'instagram_backend',
        description: 'Instagram content analysis and social media insights',
      },
      {
        name: 'tiktok_backend',
        description: 'TikTok content analysis and viral trend monitoring',
      },
      {
        name: 'twitter_analyst',
        description: 'Twitter sentiment analysis and social media monitoring',
      },
      {
        name: 'facebook_analyst',
        description: 'Facebook content analysis and social media insights',
      },
      {
        name: 'reddit_analyst',
        description: 'Reddit community analysis and discussion monitoring',
      },
      {
        name: 'social_media_intelligence',
        description:
          'Comprehensive social media intelligence and cross-platform analysis',
      },
      {
        name: 'business_analyst',
        description: 'Business intelligence and market analysis specialist',
      },
      {
        name: 'linkedin_intelligence',
        description:
          'LinkedIn professional network analysis and career insights',
      },
      {
        name: 'job_market_analyst',
        description: 'Job market trends and employment analysis specialist',
      },
      {
        name: 'ecommerce_analyst',
        description: 'E-commerce market analysis and online retail insights',
      },
      {
        name: 'travel_intelligence',
        description: 'Travel industry analysis and destination intelligence',
      },
      {
        name: 'real_estate_analyst',
        description: 'Real estate market analysis and property insights',
      },
      {
        name: 'youtube_analyst',
        description: 'YouTube content analysis and video performance insights',
      },
      {
        name: 'visual_content_creator',
        description: 'Visual content creation and graphic design specialist',
      },
      {
        name: 'content_discovery',
        description:
          'Content discovery and curation specialist across platforms',
      },
      {
        name: 'code_assistant_backend',
        description:
          'Advanced code assistance and software development support',
      },
    ];
  }

  getAgentsByCapability(capability: string): BaseAgent[] {
    return this.getAll().filter((agent) =>
      agent
        .getDefinition()
        .capabilities.some((cap) =>
          cap.toLowerCase().includes(capability.toLowerCase())
        )
    );
  }

  /**
   * Get agent descriptions for LLM-based selection (similar to Python's llm_choice_payload)
   */
  getLLMChoicePayload(): Array<{
    name: string;
    description: string;
    capabilities: string[];
  }> {
    return this.getDefinitions().map((def) => ({
      name: def.name,
      description: def.description,
      capabilities: def.capabilities,
    }));
  }

  /**
   * Use LLM to intelligently select the best agent for a task (enhanced with user-specific agents)
   */
  async selectBestAgentWithLLM(prompt: string, walletAddress?: string): Promise<{
    agent: BaseAgent | null, 
    reasoning: string,
    agentType?: 'core' | 'mcp' | 'a2a'
  }> {
    console.log('[AGENT SELECTION DEBUG] Starting LLM-based agent selection for prompt:', prompt.substring(0, 100) + '...');
    
    let agentDescriptions: Array<{name: string, description: string, capabilities: string[]}>;
    
    if (walletAddress) {
      // Include user-specific agents in selection
      const userAgents = await this.getUserAvailableAgents(walletAddress);
      agentDescriptions = userAgents
        .filter(agent => !agent.status || agent.status === 'connected') // Only include connected A2A agents
        .map(agent => ({
          name: agent.name,
          description: agent.description,
          capabilities: agent.capabilities || []
        }));
      console.log('[AGENT SELECTION DEBUG] Available agents (including user-specific):', agentDescriptions.map(a => a.name));
    } else {
      // Fallback to core agents only
      agentDescriptions = this.getLLMChoicePayload();
      console.log('[AGENT SELECTION DEBUG] Available core agents:', agentDescriptions.map(a => a.name));
    }
    try {
      // Import openai from ai-sdk
      const { openai } = await import('@ai-sdk/openai');
      const { generateObject } = await import('ai');
      const { z } = await import('zod');

      // Create structured output schema for agent selection
      const AgentSelectionSchema = z.object({
        selected_agent: z
          .string()
          .describe('The name of the best agent for this task'),
        reasoning: z
          .string()
          .describe('Explanation of why this agent was selected'),
      });

      // Build the selection prompt similar to Python backend
      const agentList = agentDescriptions.map(agent => 
        `- ${agent.name}: ${agent.description} (Capabilities: ${agent.capabilities.join(', ')})`
      ).join('\n');
      
      const selectionPrompt = `Select the best agent for this task. Match agent expertise to task requirements. Prefer specialized agents over generalists. User-specific MCP tools (mcp_*) and A2A agents (a2a_*) may provide more relevant capabilities.\n\nAvailable agents:\n${agentList}\n\nTask: ${prompt}`;
      
      console.log('[AGENT SELECTION DEBUG] Making LLM call with prompt:', selectionPrompt.substring(0, 200) + '...');
      // Make the LLM call using ai-sdk
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: AgentSelectionSchema,
        prompt: selectionPrompt,
      });

      console.log(
        '[AGENT SELECTION DEBUG] LLM selection result:',
        result.object
      );

      const selectedAgentName = result.object.selected_agent;
      let selectedAgent = await this.get(selectedAgentName);
      let agentType: 'core' | 'mcp' | 'a2a' | undefined = 'core';
      
      // Handle user-specific agents
      if (!selectedAgent && walletAddress) {
        if (selectedAgentName.startsWith('mcp_')) {
          agentType = 'mcp';
          // For MCP tools, we could create a dynamic agent or use a proxy
          console.log('[AGENT SELECTION DEBUG] Selected MCP tool:', selectedAgentName);
          // TODO: Create dynamic MCP agent or proxy
        } else if (selectedAgentName.startsWith('a2a_')) {
          agentType = 'a2a';
          // For A2A agents, we could create a proxy agent
          console.log('[AGENT SELECTION DEBUG] Selected A2A agent:', selectedAgentName);
          // TODO: Create dynamic A2A agent proxy
        }
      }
      if (selectedAgent) {
        console.log(
          '[AGENT SELECTION DEBUG] Successfully selected agent:',
          selectedAgentName
        );
        return {
          agent: selectedAgent,
          reasoning: result.object.reasoning,
          agentType
        };
      } else {
        console.warn(
          '[AGENT SELECTION DEBUG] LLM selected non-existent agent:',
          selectedAgentName
        );
        const fallbackAgent = await this.get('default');
        return {
          agent: fallbackAgent || null,
          reasoning: `LLM selected ${selectedAgentName} but agent not found, using default`,
          agentType: 'core'
        };
      }
    } catch (error) {
      console.error(
        '[AGENT SELECTION DEBUG] Error in LLM-based selection:',
        error
      );
      const fallbackAgent = await this.get('default');
      return {
        agent: fallbackAgent || null,
        reasoning: `Error in LLM selection: ${error instanceof Error ? error.message : 'Unknown error'}, using default`,
        agentType: 'core'
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
    const { DefaultAgent } = await import(
      '@/services/agents/agents/default-agent'
    );
    const { ResearchAgent } = await import(
      '@/services/agents/agents/research-agent'
    );
    this.register(new DefaultAgent());
    this.register(new ResearchAgent());

    this.coreAgentsLoaded = true;
  }

  private async registerLazyAgents() {
    // Register remaining core agents
    this.registerLazy(
      'code',
      async () => {
        const { CodeAgent } = await import(
          '@/services/agents/agents/code-agent'
        );
        return new CodeAgent();
      },
      'A specialized coding assistant that can help with programming tasks, code analysis, and debugging'
    );

    this.registerLazy(
      'data',
      async () => {
        const { DataAgent } = await import(
          '@/services/agents/agents/data-agent'
        );
        return new DataAgent();
      },
      'A data analysis specialist that can process, analyze, and visualize data from various sources'
    );

    this.registerLazy(
      'math',
      async () => {
        const { MathAgent } = await import(
          '@/services/agents/agents/math-agent'
        );
        return new MathAgent();
      },
      'A mathematical computation expert that can solve complex equations and mathematical problems'
    );

    // MCP Agents
    this.registerLazy(
      'crypto_data_backend',
      async () => {
        const { CryptoDataAgentBackend } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new CryptoDataAgentBackend();
      },
      'Provides cryptocurrency market data, price analysis, and blockchain information'
    );

    this.registerLazy(
      'codex_backend',
      async () => {
        const { CodexAgentBackend } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new CodexAgentBackend();
      },
      'Advanced code analysis and development assistance for complex programming tasks'
    );

    this.registerLazy(
      'elfa_backend',
      async () => {
        const { ElfaAgentBackend } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new ElfaAgentBackend();
      },
      'Social media sentiment and trend analysis specialist'
    );

    this.registerLazy(
      'rugcheck_backend',
      async () => {
        const { RugcheckAgentBackend } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new RugcheckAgentBackend();
      },
      'Cryptocurrency security analysis and rug pull detection specialist'
    );

    this.registerLazy(
      'dexscreener_backend',
      async () => {
        const { DexscreenerAgentBackend } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new DexscreenerAgentBackend();
      },
      'Decentralized exchange data and trading pair analysis'
    );

    this.registerLazy(
      'news_backend',
      async () => {
        const { NewsAgentBackend } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new NewsAgentBackend();
      },
      'Real-time news aggregation and analysis from multiple sources'
    );

    this.registerLazy(
      'tweet_sizzler_backend',
      async () => {
        const { TweetSizzlerAgentBackend } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new TweetSizzlerAgentBackend();
      },
      'Twitter content creation and social media engagement specialist'
    );

    this.registerLazy(
      'mor_rewards_backend',
      async () => {
        const { MorRewardsAgentBackend } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new MorRewardsAgentBackend();
      },
      'Morpheus network rewards and token distribution analysis'
    );

    this.registerLazy(
      'imagen_backend',
      async () => {
        const { ImagenAgentBackend } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new ImagenAgentBackend();
      },
      'AI image generation and visual content creation specialist'
    );

    this.registerLazy(
      'rag_backend',
      async () => {
        const { RagAgentBackend } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new RagAgentBackend();
      },
      'Retrieval-augmented generation for enhanced knowledge retrieval'
    );

    this.registerLazy(
      'default_backend',
      async () => {
        const { DefaultAgentBackend } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new DefaultAgentBackend();
      },
      'General-purpose backend agent for various tasks and integrations'
    );

    // MCP Agents
    this.registerLazy(
      'mcp_reddit',
      async () => {
        const { McpRedditAgent } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new McpRedditAgent();
      },
      'Reddit content analysis and community insights specialist'
    );

    this.registerLazy(
      'mcp_brave',
      async () => {
        const { McpBraveAgent } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new McpBraveAgent();
      },
      'Web search and information retrieval using Brave Search'
    );

    this.registerLazy(
      'mcp_hackernews',
      async () => {
        const { McpHackerNewsAgent } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new McpHackerNewsAgent();
      },
      'Hacker News content analysis and tech trend monitoring'
    );

    this.registerLazy(
      'mcp_googlemaps',
      async () => {
        const { McpGoogleMapsAgent } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new McpGoogleMapsAgent();
      },
      'Location-based services and geographical information specialist'
    );

    this.registerLazy(
      'mcp_airbnb',
      async () => {
        const { McpAirbnbAgent } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new McpAirbnbAgent();
      },
      'Travel accommodation search and booking analysis'
    );

    this.registerLazy(
      'mcp_yt_transcripts',
      async () => {
        const { McpYtTranscriptsAgent } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new McpYtTranscriptsAgent();
      },
      'YouTube video transcript extraction and analysis'
    );

    this.registerLazy(
      'mcp_puppeteer',
      async () => {
        const { McpPuppeteerAgent } = await import(
          '@/services/agents/agents/mcp-agents'
        );
        return new McpPuppeteerAgent();
      },
      'Web automation and scraping specialist using Puppeteer'
    );

    // BackendAgents.ts
    this.registerLazy(
      'research_backend',
      async () => {
        const { ResearchAgentBackend } = await import(
          '@/services/agents/agents/specialized-agents'
        );
        return new ResearchAgentBackend();
      },
      'Advanced research and information gathering specialist'
    );

    this.registerLazy(
      'document_analyzer',
      async () => {
        const { DocumentAnalyzer } = await import(
          '@/services/agents/agents/specialized-agents'
        );
        return new DocumentAnalyzer();
      },
      'Document analysis and text extraction specialist'
    );

    this.registerLazy(
      'web_extraction',
      async () => {
        const { WebExtractionSpecialist } = await import(
          '@/services/agents/agents/specialized-agents'
        );
        return new WebExtractionSpecialist();
      },
      'Web content extraction and data scraping specialist'
    );

    this.registerLazy(
      'instagram_backend',
      async () => {
        const { InstagramAgentBackend } = await import(
          '@/services/agents/agents/specialized-agents'
        );
        return new InstagramAgentBackend();
      },
      'Instagram content analysis and social media insights'
    );

    this.registerLazy(
      'tiktok_backend',
      async () => {
        const { TikTokAgent } = await import(
          '@/services/agents/agents/specialized-agents'
        );
        return new TikTokAgent();
      },
      'TikTok content analysis and viral trend monitoring'
    );

    this.registerLazy(
      'twitter_analyst',
      async () => {
        const { TwitterAnalystBackend } = await import(
          '@/services/agents/agents/specialized-agents'
        );
        return new TwitterAnalystBackend();
      },
      'Twitter sentiment analysis and social media monitoring'
    );

    this.registerLazy(
      'facebook_analyst',
      async () => {
        const { FacebookAnalyst } = await import(
          '@/services/agents/agents/specialized-agents'
        );
        return new FacebookAnalyst();
      },
      'Facebook content analysis and social media insights'
    );

    this.registerLazy(
      'reddit_analyst',
      async () => {
        const { RedditAnalyst } = await import(
          '@/services/agents/agents/specialized-agents'
        );
        return new RedditAnalyst();
      },
      'Reddit community analysis and discussion monitoring'
    );

    this.registerLazy(
      'social_media_intelligence',
      async () => {
        const { SocialMediaIntelligenceBackend } = await import(
          '@/services/agents/agents/specialized-agents'
        );
        return new SocialMediaIntelligenceBackend();
      },
      'Comprehensive social media intelligence and cross-platform analysis'
    );

    this.registerLazy(
      'business_analyst',
      async () => {
        const { BusinessAnalystBackend } = await import(
          '@/services/agents/agents/specialized-agents'
        );
        return new BusinessAnalystBackend();
      },
      'Business intelligence and market analysis specialist'
    );

    this.registerLazy(
      'linkedin_intelligence',
      async () => {
        const { LinkedInIntelligence } = await import(
          '@/services/agents/agents/specialized-agents'
        );
        return new LinkedInIntelligence();
      },
      'LinkedIn professional network analysis and career insights'
    );

    this.registerLazy(
      'job_market_analyst',
      async () => {
        const { JobMarketAnalyst } = await import(
          '@/services/agents/agents/specialized-agents'
        );
        return new JobMarketAnalyst();
      },
      'Job market trends and employment analysis specialist'
    );

    // BackendAgentsPartTwo.ts
    this.registerLazy(
      'ecommerce_analyst',
      async () => {
        const { EcommerceAnalystBackend } = await import(
          '@/services/agents/agents/crypto-agents'
        );
        return new EcommerceAnalystBackend();
      },
      'E-commerce market analysis and online retail insights'
    );

    this.registerLazy(
      'travel_intelligence',
      async () => {
        const { TravelIntelligenceBackend } = await import(
          '@/services/agents/agents/crypto-agents'
        );
        return new TravelIntelligenceBackend();
      },
      'Travel industry analysis and destination intelligence'
    );

    this.registerLazy(
      'real_estate_analyst',
      async () => {
        const { RealEstateAnalystBackend } = await import(
          '@/services/agents/agents/crypto-agents'
        );
        return new RealEstateAnalystBackend();
      },
      'Real estate market analysis and property insights'
    );

    this.registerLazy(
      'youtube_analyst',
      async () => {
        const { YouTubeAnalystBackend } = await import(
          '@/services/agents/agents/crypto-agents'
        );
        return new YouTubeAnalystBackend();
      },
      'YouTube content analysis and video performance insights'
    );

    this.registerLazy(
      'visual_content_creator',
      async () => {
        const { VisualContentCreatorBackend } = await import(
          '@/services/agents/agents/crypto-agents'
        );
        return new VisualContentCreatorBackend();
      },
      'Visual content creation and graphic design specialist'
    );

    this.registerLazy(
      'content_discovery',
      async () => {
        const { ContentDiscoverySpecialist } = await import(
          '@/services/agents/agents/crypto-agents'
        );
        return new ContentDiscoverySpecialist();
      },
      'Content discovery and curation specialist across platforms'
    );

    this.registerLazy(
      'code_assistant_backend',
      async () => {
        const { CodeAssistantBackend } = await import(
          '@/services/agents/agents/crypto-agents'
        );
        return new CodeAssistantBackend();
      },
      'Advanced code assistance and software development support'
    );
  }

  isInitialized() {
    return this.initialized;
  }
}

export const AgentRegistry = new AgentRegistryClass();
