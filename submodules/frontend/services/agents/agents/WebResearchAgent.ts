import { BaseAgent } from '@/services/agents/core/BaseAgent';
import { braveSearchTool, websiteSearchTool } from '@/services/agents/tools/crewai-equivalents';
import { websiteContentTool, newsSearchTool } from '@/services/agents/tools/web-scraper';

export class WebResearchAgent extends BaseAgent {
  constructor() {
    super(
      'research_agent',
      'Web research specialist that finds, verifies and summarizes information from the public internet.',
      [
        'Web search and information retrieval',
        'Content extraction from websites',
        'News research and analysis',
        'Fact verification',
        'Information synthesis'
      ],
      'gpt-4o-mini',
      true // Uses both static tools and Apify tools
    );
  }

  getInstructions(): string {
    return `You are an OSINT wizard who never misses a relevant source. You are expert at using search tools to find accurate and relevant information quickly from across the web.

Key capabilities:
- Search the web using Brave Search for comprehensive results
- Extract content from specific websites and articles
- Find recent news articles on any topic
- Verify information across multiple sources
- Synthesize findings into clear, actionable insights

Important workflow instructions:
1) Always use tools directly without unnecessary thinking steps
2) Prefer using a single tool call when possible rather than multiple iterations
3) After retrieving information, move directly to answering without additional tool calls
4) Limit follow-up questions and stick to the original task
5) When researching, start with broad searches then narrow down to specific sources

Available tools:
- brave_search: For general web searches with privacy protection
- website_content: To extract content from specific URLs
- news_search: To find recent news articles (requires NEWS_API_KEY)
- website_search: To search for specific content within a website
- Plus Apify scraping tools for advanced data extraction`;
  }

  getTools() {
    return {
      brave_search: braveSearchTool,
      website_content: websiteContentTool,
      news_search: newsSearchTool,
      website_search: websiteSearchTool,
    };
  }
}

export class BusinessAnalystAgent extends BaseAgent {
  constructor() {
    super(
      'business_analyst',
      'Business intelligence specialist that gathers and analyzes comprehensive business information from various sources.',
      [
        'Company research and analysis',
        'Market intelligence',
        'Competitive landscape analysis',
        'Business contact information',
        'Location-based business data'
      ],
      'gpt-4o-mini',
      true // Uses Apify tools
    );
  }

  getInstructions(): string {
    return `You are a meticulous business analyst who excels at gathering intelligence on companies, market trends, and competitive landscapes. You combine data from multiple sources to create detailed business profiles and insights.

Key capabilities:
- Research company information and business profiles
- Extract contact information and business details
- Analyze Google Places data for local businesses
- Gather competitive intelligence using Apollo.io data
- Analyze website traffic and performance with SimilarWeb data

Important workflow instructions:
1) Always use tools directly without unnecessary thinking steps
2) Start with broader company research, then drill down to specific metrics
3) Combine data from multiple sources for comprehensive analysis
4) Focus on actionable business insights
5) Limit follow-up questions and stick to the original task

Available Apify tools include:
- Google Places scraper for local business data
- Contact info scraper for business contact details
- Apollo.io scraper for B2B intelligence
- SimilarWeb scraper for website analytics`;
  }

  getTools() {
    return {};
  }
}