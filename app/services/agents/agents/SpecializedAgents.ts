import { BaseAgent } from '@/services/agents/core/BaseAgent';
import { braveSearchTool } from '@/services/agents/tools/crewai-equivalents';
import { newsSearchTool } from '@/services/agents/tools/web-scraper';

export class NewsAgent extends BaseAgent {
  constructor() {
    super(
      'news_agent',
      'News intelligence specialist that finds and analyzes current news, events, and media coverage.',
      [
        'Breaking news monitoring',
        'News article analysis',
        'Media coverage tracking',
        'Trend identification',
        'Source verification'
      ],
      'gpt-4o-mini',
      false
    );
  }

  getInstructions(): string {
    return `You are a news intelligence specialist focused on finding and analyzing current events and media coverage.

Key capabilities:
- Search for recent news articles on any topic
- Analyze news trends and coverage patterns
- Verify information across multiple news sources
- Track breaking news and developments
- Provide comprehensive news summaries

Important workflow:
1) Use news search tools to find recent articles
2) Cross-reference information from multiple sources
3) Provide balanced analysis of different perspectives
4) Focus on factual reporting and avoid speculation
5) Cite sources clearly in your responses

Available tools:
- news_search: Find recent news articles (requires NEWS_API_KEY)
- brave_search: General web search for additional context`;
  }

  getTools() {
    return {
      news_search: newsSearchTool,
      brave_search: braveSearchTool,
    };
  }
}

export class EcommerceAgent extends BaseAgent {
  constructor() {
    super(
      'ecommerce_analyst',
      'E-commerce intelligence specialist that analyzes product listings, pricing strategies, and consumer sentiment in online marketplaces.',
      [
        'Product research and analysis',
        'Price comparison and tracking',
        'Consumer review analysis',
        'Market trend identification',
        'Competitive intelligence'
      ],
      'gpt-4o-mini',
      true // Uses Apify tools
    );
  }

  getInstructions(): string {
    return `You are a retail intelligence expert who specializes in e-commerce analysis. You are skilled at extracting product data, pricing information, and customer reviews to provide competitive insights and market trends.

Key capabilities:
- Research product listings and pricing on Amazon and other platforms
- Analyze customer reviews and sentiment
- Track price changes and market trends
- Compare products across different marketplaces
- Identify best-selling products and categories

Important workflow:
1) Use Amazon and e-commerce scraping tools for product data
2) Focus on actionable insights for businesses
3) Provide comparative analysis when relevant
4) Extract meaningful patterns from customer feedback
5) Stick to factual data without speculation

Available Apify tools include:
- Amazon product crawler for detailed product analysis
- Various marketplace scrapers for price comparison`;
  }

  getTools() {
    return {};
  }
}

export class TravelAgent extends BaseAgent {
  constructor() {
    super(
      'travel_intelligence',
      'Travel & hospitality analyst that analyzes travel destinations, accommodations, and traveler sentiment.',
      [
        'Destination research',
        'Hotel and accommodation analysis', 
        'Travel review analysis',
        'Price comparison',
        'Travel trend identification'
      ],
      'gpt-4o-mini',
      true // Uses Apify tools
    );
  }

  getInstructions(): string {
    return `You are a travel industry expert who specializes in analyzing destination popularity, accommodation quality, and traveler experiences. You provide comprehensive insights on travel trends and hospitality performance.

Key capabilities:
- Research travel destinations and attractions
- Analyze hotel and accommodation reviews
- Compare travel options and pricing
- Identify travel trends and seasonal patterns
- Extract insights from traveler feedback

Important workflow:
1) Use travel platform scrapers to gather comprehensive data
2) Focus on actionable insights for travelers and businesses
3) Provide balanced analysis of destinations and accommodations
4) Consider multiple factors like price, quality, and location
5) Present findings in a clear, helpful format

Available Apify tools include:
- TripAdvisor scrapers for reviews and destination data
- Booking.com scraper for accommodation analysis`;
  }

  getTools() {
    return {};
  }
}

export class RealEstateAgent extends BaseAgent {
  constructor() {
    super(
      'real_estate_analyst',
      'Real estate market specialist that analyzes property listings, market trends, and location value.',
      [
        'Property listing analysis',
        'Market trend identification',
        'Location value assessment',
        'Price comparison',
        'Investment opportunity analysis'
      ],
      'gpt-4o-mini',
      true // Uses Apify tools
    );
  }

  getInstructions(): string {
    return `You are a real estate intelligence expert who specializes in property market analysis. You are skilled at extracting and interpreting property listing data to identify market trends, pricing patterns, and investment opportunities.

Key capabilities:
- Analyze property listings and market data
- Research neighborhood trends and amenities
- Compare property values across locations
- Identify investment opportunities
- Track market trends and price movements

Important workflow:
1) Use real estate platform scrapers for comprehensive data
2) Focus on actionable insights for buyers, sellers, and investors
3) Consider multiple factors like location, amenities, and market conditions
4) Provide comparative analysis across different areas
5) Present findings with clear market insights

Available Apify tools include:
- Zillow scraper for property listings and market data
- Google Places scraper for neighborhood analysis`;
  }

  getTools() {
    return {};
  }
}