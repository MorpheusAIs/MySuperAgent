import { BaseAgent } from '@/services/agents/core/BaseAgent';
import { AgentDefinition } from '@/services/agents/types';

class AgentRegistryClass {
  private agents: Map<string, BaseAgent> = new Map();
  private initialized = false;

  register(agent: BaseAgent) {
    const definition = agent.getDefinition();
    this.agents.set(definition.name, agent);
    console.log(`Registered agent: ${definition.name}`, definition);
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

  selectBestAgent(prompt: string): BaseAgent | null {
    console.log('Selecting best agent for prompt:', prompt);
    console.log('Available agents:', Array.from(this.agents.keys()));
    
    // Simple heuristic-based agent selection
    const lowerPrompt = prompt.toLowerCase();
    
    // Keyword mapping for agent selection
    const agentKeywords = {
      // Original agents
      research: ['search', 'find', 'research', 'investigate', 'information', 'web', 'internet'],
      code: ['code', 'program', 'function', 'bug', 'debug', 'syntax', 'algorithm', 'development'],
      data: ['data', 'analyze', 'csv', 'json', 'statistics', 'dataset', 'process'],
      math: ['calculate', 'math', 'equation', 'solve', 'formula', 'computation', 'number'],
      
      // All backend agents with their specific keywords
      // MCP Agents
      mcp_reddit: ['reddit', 'subreddit', 'reddit posts', 'reddit comments', 'reddit discussion'],
      mcp_brave: ['brave search', 'web search', 'search engine', 'find information'],
      mcp_hacker_news: ['hacker news', 'hn', 'tech news', 'startup news', 'developer news'],
      mcp_google_maps: ['google maps', 'location', 'address', 'directions', 'places', 'map'],
      mcp_airbnb: ['airbnb', 'vacation rental', 'accommodation', 'short term rental'],
      mcp_yt_transcripts: ['youtube transcript', 'video transcript', 'youtube captions'],
      mcp_puppeteer: ['web scraping', 'puppeteer', 'automation', 'dynamic content'],
      
      // Crypto Agents
      crypto_data: ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'price', 'market cap', 'tvl', 'defi', 'token'],
      mor_rewards: ['mor', 'morpheus', 'mor rewards', 'mor staking', 'morpheus rewards'],
      rugcheck: ['rug check', 'token safety', 'rug pull', 'scam token', 'token analysis'],
      codex: ['codex', 'smart contract', 'blockchain code', 'solidity', 'code analysis'],
      imagen: ['imagen', 'image generation', 'ai image', 'create image'],
      dexscreener: ['dexscreener', 'dex', 'decentralized exchange', 'trading pairs', 'dex data'],
      elfa: ['elfa', 'yield farming', 'liquidity farming', 'defi strategy'],
      
      // Core Agents
      default: ['help', 'general', 'assistance', 'question'],
      rag: ['document search', 'knowledge base', 'retrieval', 'context search'],
      news_agent: ['news', 'breaking', 'current events', 'media', 'journalism', 'headlines'],
      tweet_sizzler: ['tweet', 'twitter content', 'social media content', 'tweet optimization'],
      
      // Research & Analysis
      research_agent: ['research', 'web research', 'find information', 'investigate', 'verify'],
      document_analyzer: ['document', 'pdf', 'text analysis', 'file analysis'],
      web_extraction_specialist: ['web scraping', 'extract data', 'website data', 'scrape website'],
      
      // Social Media
      instagram_agent: ['instagram', 'insta', 'ig', 'instagram posts', 'instagram profile'],
      tiktok_agent: ['tiktok', 'tik tok', 'short video', 'tiktok trends'],
      twitter_analyst: ['twitter', 'tweet', 'x.com', 'social listening', 'twitter trends'],
      facebook_analyst: ['facebook', 'fb', 'facebook posts', 'facebook pages'],
      reddit_analyst: ['reddit', 'subreddit', 'reddit analysis', 'reddit trends'],
      social_media_intelligence: ['social media', 'cross platform', 'social trends', 'social analysis'],
      
      // Business Intelligence
      business_analyst: ['business', 'company', 'market analysis', 'competitive intelligence'],
      linkedin_intelligence: ['linkedin', 'professional network', 'linkedin profile', 'linkedin company'],
      job_market_analyst: ['jobs', 'employment', 'job market', 'hiring', 'career', 'glassdoor'],
      
      // Industry Specialists
      ecommerce_analyst: ['ecommerce', 'amazon', 'shopping', 'product', 'retail', 'marketplace'],
      travel_intelligence: ['travel', 'hotel', 'destination', 'vacation', 'tourism', 'booking'],
      real_estate_analyst: ['real estate', 'property', 'house', 'apartment', 'zillow', 'rent'],
      
      // Content & Multimedia
      youtube_analyst: ['youtube', 'video', 'channel', 'youtube comments', 'video analysis'],
      visual_content_creator: ['image', 'generate image', 'create visual', 'dalle', 'picture'],
      content_discovery_specialist: ['content discovery', 'find content', 'content search'],
      code_assistant: ['code', 'programming', 'development', 'coding help', 'debug'],
    };
    
    let bestAgent: BaseAgent | null = null;
    let maxScore = 0;
    
    for (const [agentType, keywords] of Object.entries(agentKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (lowerPrompt.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestAgent = this.get(agentType);
      }
    }
    
    // Fallback to default agent if no specific match
    return bestAgent || this.get('default');
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