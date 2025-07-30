import { MCPClient } from '@mastra/mcp';

// Apify MCP Client configuration - connects to Apify's MCP server to access all Apify actors as tools
export const apifyMcpClient = new MCPClient({
  servers: {
    apify: {
      url: new URL('https://mcp.apify.com/sse'),
      requestInit: {
        headers: { 
          Authorization: `Bearer ${process.env.APIFY_TOKEN}` 
        }
      },
      // Additional configuration for EventSource
      eventSourceInit: {
        async fetch(input: Request | URL | string, init?: RequestInit) {
          const headers = new Headers(init?.headers || {});
          headers.set('authorization', `Bearer ${process.env.APIFY_TOKEN}`);
          return fetch(input, { ...init, headers });
        }
      }
    },
  },
});

// Get tools from Apify MCP server
export async function getApifyTools() {
  try {
    if (!process.env.APIFY_TOKEN) {
      console.warn('APIFY_TOKEN not found - Apify tools will not be available');
      return {};
    }
    
    console.log('Connecting to Apify MCP server...');
    await apifyMcpClient.connect();
    console.log('Fetching Apify tools...');
    const tools = await apifyMcpClient.getTools();
    console.log(`Retrieved ${Object.keys(tools).length} Apify tools`);
    return tools;
  } catch (error) {
    console.error('Failed to get Apify tools:', error);
    return {};
  }
}

// Get Apify toolsets dynamically (for per-request scenarios)
export async function getApifyToolsets() {
  try {
    if (!process.env.APIFY_TOKEN) {
      console.warn('APIFY_TOKEN not found - Apify toolsets will not be available');
      return {};
    }
    
    await apifyMcpClient.connect();
    const toolsets = await apifyMcpClient.getToolsets();
    return { apify: toolsets };
  } catch (error) {
    console.error('Failed to get Apify toolsets:', error);
    return {};
  }
}

// Disconnect from Apify MCP server
export async function disconnectApify() {
  try {
    await apifyMcpClient.disconnect();
    console.log('Disconnected from Apify MCP server');
  } catch (error) {
    console.error('Error disconnecting from Apify MCP:', error);
  }
}

// List of Apify actors that were configured in the backend tool_bootstrap.py
export const BACKEND_APIFY_ACTORS = [
  'apify/instagram-scraper',
  'clockworks/tiktok-scraper', 
  'apidojo/twitter-scraper-lite',
  'apify/facebook-posts-scraper',
  'trudax/reddit-scraper-lite',
  'streamers/youtube-comments-scraper',
  'muhammetakkurtt/truth-social-scraper',
  'dev_fusion/Linkedin-Profile-Scraper',
  'anchor/LinkedIn-people-finder',
  'compass/crawler-google-places',
  'vdrmota/contact-info-scraper',
  'code_crafter/apollo-io-scraper',
  'tri_angle/similarweb-scraper',
  'apimaestro/linkedin-company-posts',
  'junglee/Amazon-crawler',
  'maxcopell/tripadvisor-reviews',
  'maxcopell/tripadvisor',
  'voyager/booking-reviews-scraper',
  'maxcopell/zillow-scraper',
  'bebity/glassdoor-jobs-scraper',
  'lukaskrivka/article-extractor-smart',
  'pintostudio/youtube-transcript-scraper',
];