import { NextApiRequest, NextApiResponse } from 'next';

// Static list of all agents to avoid dynamic import issues in API endpoints
function getAllAgentDescriptions(): Array<{ name: string; description: string }> {
  return [
    { name: 'default', description: 'A general-purpose AI assistant that can help with a wide variety of tasks' },
    { name: 'research', description: 'A specialized research assistant that can search the web and gather information on various topics' },
    { name: 'code', description: 'A specialized coding assistant that can help with programming tasks, code analysis, and debugging' },
    { name: 'data', description: 'A data analysis specialist that can process, analyze, and visualize data from various sources' },
    { name: 'math', description: 'A mathematical computation expert that can solve complex equations and mathematical problems' },
    { name: 'crypto_data_backend', description: 'Provides cryptocurrency market data, price analysis, and blockchain information' },
    { name: 'codex_backend', description: 'Advanced code analysis and development assistance for complex programming tasks' },
    { name: 'elfa_backend', description: 'Social media sentiment and trend analysis specialist' },
    { name: 'rugcheck_backend', description: 'Cryptocurrency security analysis and rug pull detection specialist' },
    { name: 'dexscreener_backend', description: 'Decentralized exchange data and trading pair analysis' },
    { name: 'news_backend', description: 'Real-time news aggregation and analysis from multiple sources' },
    { name: 'tweet_sizzler_backend', description: 'Twitter content creation and social media engagement specialist' },
    { name: 'mor_rewards_backend', description: 'Morpheus network rewards and token distribution analysis' },
    { name: 'imagen_backend', description: 'AI image generation and visual content creation specialist' },
    { name: 'rag_backend', description: 'Retrieval-augmented generation for enhanced knowledge retrieval' },
    { name: 'default_backend', description: 'General-purpose backend agent for various tasks and integrations' },
    { name: 'mcp_reddit', description: 'Reddit content analysis and community insights specialist' },
    { name: 'mcp_brave', description: 'Web search and information retrieval using Brave Search' },
    { name: 'mcp_hackernews', description: 'Hacker News content analysis and tech trend monitoring' },
    { name: 'mcp_googlemaps', description: 'Location-based services and geographical information specialist' },
    { name: 'mcp_airbnb', description: 'Travel accommodation search and booking analysis' },
    { name: 'mcp_yt_transcripts', description: 'YouTube video transcript extraction and analysis' },
    { name: 'mcp_puppeteer', description: 'Web automation and scraping specialist using Puppeteer' },
    { name: 'research_backend', description: 'Advanced research and information gathering specialist' },
    { name: 'document_analyzer', description: 'Document analysis and text extraction specialist' },
    { name: 'web_extraction', description: 'Web content extraction and data scraping specialist' },
    { name: 'instagram_backend', description: 'Instagram content analysis and social media insights' },
    { name: 'tiktok_backend', description: 'TikTok content analysis and viral trend monitoring' },
    { name: 'twitter_analyst', description: 'Twitter sentiment analysis and social media monitoring' },
    { name: 'facebook_analyst', description: 'Facebook content analysis and social media insights' },
    { name: 'reddit_analyst', description: 'Reddit community analysis and discussion monitoring' },
    { name: 'social_media_intelligence', description: 'Comprehensive social media intelligence and cross-platform analysis' },
    { name: 'business_analyst', description: 'Business intelligence and market analysis specialist' },
    { name: 'linkedin_intelligence', description: 'LinkedIn professional network analysis and career insights' },
    { name: 'job_market_analyst', description: 'Job market trends and employment analysis specialist' },
    { name: 'ecommerce_analyst', description: 'E-commerce market analysis and online retail insights' },
    { name: 'travel_intelligence', description: 'Travel industry analysis and destination intelligence' },
    { name: 'real_estate_analyst', description: 'Real estate market analysis and property insights' },
    { name: 'youtube_analyst', description: 'YouTube content analysis and video performance insights' },
    { name: 'visual_content_creator', description: 'Visual content creation and graphic design specialist' },
    { name: 'content_discovery', description: 'Content discovery and curation specialist across platforms' },
    { name: 'code_assistant_backend', description: 'Advanced code assistance and software development support' }
  ];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use static function to avoid dynamic import issues
    const availableAgents = getAllAgentDescriptions();
    
    return res.status(200).json(availableAgents);
  } catch (error) {
    console.error('Error fetching available agents:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}