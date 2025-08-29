import { createTool } from '@mastra/core';
import { z } from 'zod';

// BraveSearchTool equivalent - Enhanced for real-time news
export const braveSearchTool = createTool({
  id: 'brave_search',
  description: 'Search the web using Brave Search API for comprehensive results with privacy protection. Automatically prioritizes recent news for news-related queries.',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
    count: z.number().optional().default(10).describe('Number of search results to return'),
    search_type: z.enum(['web', 'news']).optional().describe('Type of search - use "news" for current events and news queries'),
    freshness: z.enum(['pd', 'pw', 'pm', 'py']).optional().describe('Freshness filter: pd=past day, pw=past week, pm=past month, py=past year'),
  }),
  execute: async ({ context: { query, count = 10, search_type, freshness } }) => {
    try {
      const braveApiKey = process.env.BRAVE_API_KEY;
      if (!braveApiKey) {
        return 'Brave Search requires BRAVE_API_KEY environment variable. Please configure this.';
      }

      // Auto-detect news queries
      const isNewsQuery = search_type === 'news' || 
        query.toLowerCase().includes('news') ||
        query.toLowerCase().includes('latest') ||
        query.toLowerCase().includes('recent') ||
        query.toLowerCase().includes('today') ||
        query.toLowerCase().includes('breaking') ||
        query.toLowerCase().includes('current events') ||
        query.toLowerCase().includes('summary');

      // Build URL with appropriate parameters for real-time results
      let searchUrl;
      let searchParams = new URLSearchParams({
        q: query,
        count: count.toString()
      });

      // For news queries, prioritize freshness
      if (isNewsQuery) {
        searchParams.append('freshness', freshness || 'pd'); // Default to past day for news
        searchParams.append('search_type', 'news');
        // Use news endpoint for better news results
        searchUrl = `https://api.search.brave.com/res/v1/news/search?${searchParams.toString()}`;
      } else {
        // For regular queries, still use freshness if specified
        if (freshness) {
          searchParams.append('freshness', freshness);
        }
        searchUrl = `https://api.search.brave.com/res/v1/web/search?${searchParams.toString()}`;
      }

      const response = await fetch(searchUrl, {
        headers: {
          'X-Subscription-Token': braveApiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Brave Search API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both news and web results
      const results = data.results || data.web?.results || data.news?.results;
      
      if (!results || results.length === 0) {
        return `No search results found for: "${query}"${isNewsQuery ? ' (searched recent news)' : ''}`;
      }

      const formattedResults = results.slice(0, count).map((result: any, index: number) => {
        let resultText = `${index + 1}. ${result.title}\n   URL: ${result.url}`;
        
        if (result.description) {
          resultText += `\n   Description: ${result.description}`;
        }
        
        // Include published date for news results
        if (result.published_date || result.age) {
          resultText += `\n   Published: ${result.published_date || result.age}`;
        }

        return resultText + '\n';
      }).join('\n');

      const searchTypeNote = isNewsQuery ? ' (Recent News)' : '';
      const freshnessNote = freshness ? ` (${freshness === 'pd' ? 'Past Day' : freshness === 'pw' ? 'Past Week' : freshness === 'pm' ? 'Past Month' : 'Past Year'})` : '';
      
      return `Search results for "${query}"${searchTypeNote}${freshnessNote}:\n\n${formattedResults}`;
    } catch (error) {
      return `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

// CodeInterpreterTool equivalent
export const codeInterpreterTool = createTool({
  id: 'code_interpreter',
  description: 'Execute Python code in a secure environment',
  inputSchema: z.object({
    code: z.string().describe('Python code to execute'),
  }),
  execute: async ({ context: { code } }) => {
    // Note: In production, this should connect to a secure Python execution environment
    return `Code execution requested:\n\n\`\`\`python\n${code}\n\`\`\`\n\nNote: Code execution requires a secure Python environment. This would execute in a sandboxed container in production.`;
  },
});

// DallETool equivalent  
export const dalleTool = createTool({
  id: 'dalle_image_generation',
  description: 'Generate images using DALL-E API',
  inputSchema: z.object({
    prompt: z.string().describe('Description of the image to generate'),
    size: z.enum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']).optional().default('1024x1024'),
    quality: z.enum(['standard', 'hd']).optional().default('standard'),
  }),
  execute: async ({ context: { prompt, size = '1024x1024', quality = 'standard' } }) => {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return 'DALL-E requires OPENAI_API_KEY environment variable. Please configure this.';
      }

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size,
          quality,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.data[0]?.url;

      if (!imageUrl) {
        return 'Failed to generate image';
      }

      return `Image generated successfully for prompt: "${prompt}"\nImage URL: ${imageUrl}`;
    } catch (error) {
      return `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

// VisionTool equivalent
export const visionTool = createTool({
  id: 'vision_analysis',
  description: 'Analyze images and extract text/information using GPT-4 Vision',
  inputSchema: z.object({
    image_url: z.string().url().describe('URL of the image to analyze'),
    question: z.string().optional().describe('Specific question about the image'),
  }),
  execute: async ({ context: { image_url, question } }) => {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return 'Vision analysis requires OPENAI_API_KEY environment variable. Please configure this.';
      }

      const prompt = question || 'Describe this image in detail and extract any text content.';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: image_url } }
              ]
            }
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const analysis = data.choices[0]?.message?.content;

      if (!analysis) {
        return 'Failed to analyze image';
      }

      return `Image Analysis:\n${analysis}`;
    } catch (error) {
      return `Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

// WebsiteSearchTool equivalent
export const websiteSearchTool = createTool({
  id: 'website_search',
  description: 'Search for specific content within a website',
  inputSchema: z.object({
    url: z.string().url().describe('Website URL to search'),
    query: z.string().describe('Search query to find within the website'),
  }),
  execute: async ({ context: { url, query } }) => {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MySuperAgent/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const cleanText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const lowerQuery = query.toLowerCase();
      const lowerText = cleanText.toLowerCase();
      
      if (!lowerText.includes(lowerQuery)) {
        return `Query "${query}" not found on ${url}`;
      }

      // Find context around the query
      const index = lowerText.indexOf(lowerQuery);
      const start = Math.max(0, index - 200);
      const end = Math.min(cleanText.length, index + 200);
      const context = cleanText.substring(start, end);

      return `Found "${query}" on ${url}:\n\n...${context}...`;
    } catch (error) {
      return `Website search failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

// YouTubeVideoSearchTool equivalent
export const youtubeVideoSearchTool = createTool({
  id: 'youtube_video_search',
  description: 'Search for YouTube videos',
  inputSchema: z.object({
    query: z.string().describe('Search query for YouTube videos'),
    max_results: z.number().optional().default(10).describe('Maximum number of results'),
  }),
  execute: async ({ context: { query, max_results = 10 } }) => {
    try {
      const youtubeApiKey = process.env.YOUTUBE_API_KEY;
      if (!youtubeApiKey) {
        return 'YouTube search requires YOUTUBE_API_KEY environment variable. Please configure this.';
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${max_results}&key=${youtubeApiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return `No YouTube videos found for: "${query}"`;
      }

      const videos = data.items.map((item: any, index: number) => {
        return `${index + 1}. ${item.snippet.title}\n   Channel: ${item.snippet.channelTitle}\n   URL: https://www.youtube.com/watch?v=${item.id.videoId}\n   Description: ${item.snippet.description.substring(0, 100)}...\n`;
      }).join('\n');

      return `YouTube videos for "${query}":\n\n${videos}`;
    } catch (error) {
      return `YouTube search failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

// YouTubeChannelSearchTool equivalent
export const youtubeChannelSearchTool = createTool({
  id: 'youtube_channel_search',
  description: 'Search for YouTube channels',
  inputSchema: z.object({
    query: z.string().describe('Search query for YouTube channels'),
    max_results: z.number().optional().default(10).describe('Maximum number of results'),
  }),
  execute: async ({ context: { query, max_results = 10 } }) => {
    try {
      const youtubeApiKey = process.env.YOUTUBE_API_KEY;
      if (!youtubeApiKey) {
        return 'YouTube search requires YOUTUBE_API_KEY environment variable. Please configure this.';
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=${max_results}&key=${youtubeApiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return `No YouTube channels found for: "${query}"`;
      }

      const channels = data.items.map((item: any, index: number) => {
        return `${index + 1}. ${item.snippet.channelTitle}\n   URL: https://www.youtube.com/channel/${item.id.channelId}\n   Description: ${item.snippet.description.substring(0, 100)}...\n`;
      }).join('\n');

      return `YouTube channels for "${query}":\n\n${channels}`;
    } catch (error) {
      return `YouTube channel search failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});