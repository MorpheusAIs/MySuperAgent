import { BaseAgent } from '@/services/agents/core/base-agent';
import {
  braveSearchTool,
  dalleTool,
  visionTool,
} from '@/services/agents/tools/crewai-equivalents';
import {
  cryptoMarketCapTool,
  cryptoPriceTool,
  defiTvlTool,
} from '@/services/agents/tools/crypto-data';
import {
  newsSearchTool,
  websiteContentTool,
} from '@/services/agents/tools/web-scraper';

// ======== MCP AGENTS ========
// These agents use MCP servers and Apify tools dynamically

export class McpRedditAgent extends BaseAgent {
  constructor() {
    super(
      'mcp_reddit',
      'Reddit Search and Analysis Agent',
      ['Reddit content search', 'subreddit analysis', 'discussion tracking'],
      'gpt-4o-mini',
      true
    );
  }

  getInstructions(): string {
    return `You are a specialized agent that searches and retrieves information from Reddit. You excel at finding discussions, opinions, and community knowledge across Reddit's diverse communities. Use this agent when you need to find specific Reddit posts, comments, or understand what different communities are saying about a particular topic.`;
  }

  getTools() {
    return {};
  }
}

export class McpBraveAgent extends BaseAgent {
  constructor() {
    super(
      'mcp_brave',
      'Brave Search Agent',
      ['web search', 'privacy-focused search', 'information retrieval'],
      'gpt-4o-mini',
      false
    );
  }

  getInstructions(): string {
    return `You are a specialized search agent that uses Brave Search API to find information on the web. You excel at retrieving current information, news, and factual data from across the internet while respecting user privacy.`;
  }

  getTools() {
    return {
      brave_search: braveSearchTool,
    };
  }
}

export class McpHackerNewsAgent extends BaseAgent {
  constructor() {
    super(
      'mcp_hacker_news',
      'Hacker News Analysis Agent',
      ['tech news', 'startup discussions', 'developer insights'],
      'gpt-4o-mini',
      true
    );
  }

  getInstructions(): string {
    return `You are specialized in analyzing Hacker News content, discussions, and trends in the tech community.`;
  }

  getTools() {
    return {};
  }
}

export class McpGoogleMapsAgent extends BaseAgent {
  constructor() {
    super(
      'mcp_google_maps',
      'Google Maps and Location Agent',
      ['location search', 'business info', 'geographic data'],
      'gpt-4o-mini',
      true
    );
  }

  getInstructions(): string {
    return `You are specialized in location-based searches and geographic information using Google Maps data.`;
  }

  getTools() {
    return {};
  }
}

export class McpAirbnbAgent extends BaseAgent {
  constructor() {
    super(
      'mcp_airbnb',
      'Airbnb Property Analysis Agent',
      ['property search', 'rental analysis', 'accommodation data'],
      'gpt-4o-mini',
      true
    );
  }

  getInstructions(): string {
    return `You are specialized in Airbnb property analysis, rental market data, and accommodation insights.`;
  }

  getTools() {
    return {};
  }
}

export class McpYtTranscriptsAgent extends BaseAgent {
  constructor() {
    super(
      'mcp_yt_transcripts',
      'YouTube Transcript Analysis Agent',
      ['video transcripts', 'content analysis', 'YouTube data'],
      'gpt-4o-mini',
      true
    );
  }

  getInstructions(): string {
    return `You are specialized in extracting and analyzing YouTube video transcripts and content.`;
  }

  getTools() {
    return {};
  }
}

export class McpPuppeteerAgent extends BaseAgent {
  constructor() {
    super(
      'mcp_puppeteer',
      'Advanced Web Scraping Agent',
      ['web automation', 'dynamic content', 'complex scraping'],
      'gpt-4o-mini',
      true
    );
  }

  getInstructions(): string {
    return `You are specialized in advanced web scraping using Puppeteer for dynamic and complex web applications.`;
  }

  getTools() {
    return {};
  }
}

// ======== CRYPTO SPECIALIZED AGENTS ========

export class CryptoDataAgentBackend extends BaseAgent {
  constructor() {
    super(
      'crypto_data',
      'Cryptocurrency Data Expert',
      ['crypto price data', 'market analysis', 'DeFi metrics'],
      'gpt-4o-mini',
      false
    );
  }

  getInstructions(): string {
    return `You are a specialized cryptocurrency analyst with expertise in market data, NFTs, and DeFi protocols. 
    
    IMPORTANT: When asked about cryptocurrency prices, market caps, or DeFi data, you MUST use the available tools:
    - Use crypto_price tool to get current cryptocurrency prices
    - Use crypto_market_cap tool to get market capitalization data  
    - Use defi_tvl tool to get Total Value Locked data for DeFi protocols
    
    Always use the appropriate tool first, then provide analysis based on the results. Do not provide generic responses without using tools.`;
  }

  getTools() {
    return {
      crypto_price: cryptoPriceTool,
      crypto_market_cap: cryptoMarketCapTool,
      defi_tvl: defiTvlTool,
    };
  }
}

export class MorRewardsAgentBackend extends BaseAgent {
  constructor() {
    super(
      'mor_rewards',
      'Morpheus Rewards Specialist',
      ['MOR rewards', 'staking analysis', 'token distribution'],
      'gpt-4o-mini',
      false
    );
  }

  getInstructions(): string {
    return `You are specialized in Morpheus (MOR) token rewards, staking mechanisms, and ecosystem data.`;
  }

  getTools() {
    return {
      website_content: websiteContentTool,
    };
  }
}

export class RugcheckAgentBackend extends BaseAgent {
  constructor() {
    super(
      'rugcheck',
      'Token Safety Analyst',
      ['token safety', 'rug pull detection', 'smart contract analysis'],
      'gpt-4o-mini',
      false
    );
  }

  getInstructions(): string {
    return `You are specialized in analyzing cryptocurrency tokens for safety, detecting potential rug pulls, and evaluating smart contract security.`;
  }

  getTools() {
    return {
      website_content: websiteContentTool,
    };
  }
}

export class CodexAgentBackend extends BaseAgent {
  constructor() {
    super(
      'codex',
      'Code Analysis and Development Agent',
      ['code analysis', 'smart contracts', 'blockchain development'],
      'gpt-4o-mini',
      false
    );
  }

  getInstructions(): string {
    return `You are specialized in code analysis, smart contract development, and blockchain-related programming tasks.`;
  }

  getTools() {
    return {};
  }
}

export class ImagenAgentBackend extends BaseAgent {
  constructor() {
    super(
      'imagen',
      'AI Image Generation Specialist',
      ['image generation', 'visual content', 'creative AI'],
      'gpt-4o-mini',
      false
    );
  }

  getInstructions(): string {
    return `You are specialized in AI image generation and visual content creation using advanced image generation models.`;
  }

  getTools() {
    return {
      dalle: dalleTool,
      vision: visionTool,
    };
  }
}

export class DexscreenerAgentBackend extends BaseAgent {
  constructor() {
    super(
      'dexscreener',
      'DEX Trading Data Analyst',
      ['DEX data', 'trading analysis', 'DeFi markets'],
      'gpt-4o-mini',
      false
    );
  }

  getInstructions(): string {
    return `You are specialized in decentralized exchange (DEX) trading data, price analysis, and DeFi market insights.`;
  }

  getTools() {
    return {
      website_content: websiteContentTool,
    };
  }
}

export class DefaultAgentBackend extends BaseAgent {
  constructor() {
    super(
      'default',
      'General Purpose Assistant',
      ['general assistance', 'task coordination', 'information synthesis'],
      'gpt-4o-mini',
      false
    );
  }

  getInstructions(): string {
    return `You are a general purpose assistant that can help with a wide variety of tasks and coordinate with other specialized agents when needed.`;
  }

  getTools() {
    return {};
  }
}

export class RagAgentBackend extends BaseAgent {
  constructor() {
    super(
      'rag',
      'Retrieval Augmented Generation Agent',
      ['document search', 'knowledge retrieval', 'contextual answers'],
      'gpt-4o-mini',
      false
    );
  }

  getInstructions(): string {
    return `You are specialized in retrieval-augmented generation, using document databases and knowledge bases to provide contextual and accurate answers.`;
  }

  getTools() {
    return {};
  }
}

export class ElfaAgentBackend extends BaseAgent {
  constructor() {
    super(
      'elfa',
      'ELFA DeFi Strategy Agent',
      ['DeFi strategies', 'yield farming', 'liquidity analysis'],
      'gpt-4o-mini',
      false
    );
  }

  getInstructions(): string {
    return `You are specialized in ELFA ecosystem strategies, DeFi yield optimization, and liquidity farming analysis.`;
  }

  getTools() {
    return {
      website_content: websiteContentTool,
    };
  }
}

export class NewsAgentBackend extends BaseAgent {
  constructor() {
    super(
      'news_agent',
      'News Intelligence Specialist',
      ['news analysis', 'current events', 'media monitoring'],
      'gpt-4o-mini',
      false
    );
  }

  getInstructions(): string {
    return `You are specialized in news intelligence, current events analysis, and media monitoring across various sources. 

IMPORTANT: When asked about news summaries or current events, ALWAYS use the brave_search tool with real-time parameters to get the most recent and up-to-date information. The brave_search tool automatically detects news queries and prioritizes fresh, recent content from the past day.

For news queries, the brave_search tool will:
- Automatically search recent news (past day by default)
- Include publication dates
- Prioritize breaking news and current events
- Search across reliable news sources

Always verify that you're getting current information by checking publication dates in the search results.`;
  }

  getTools() {
    return {
      news_search: newsSearchTool,
      brave_search: braveSearchTool,
    };
  }
}

export class TweetSizzlerAgentBackend extends BaseAgent {
  constructor() {
    super(
      'tweet_sizzler',
      'X Content Optimizer',
      ['tweet optimization', 'social media content', 'engagement analysis'],
      'gpt-4o-mini',
      true
    );
  }

  getInstructions(): string {
    return `You are specialized in X content optimization, creating engaging posts, and analyzing social media engagement patterns.`;
  }

  getTools() {
    return {};
  }
}
