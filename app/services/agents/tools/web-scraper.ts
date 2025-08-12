import { createTool } from '@mastra/core';
import { z } from 'zod';

export const websiteContentTool = createTool({
  id: 'website_content',
  description: 'Extract content from a website URL',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to extract content from'),
  }),
  execute: async ({ context: { url } }) => {
    try {
      // Use a free web scraping API or implement basic fetch
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MySuperAgent/1.0)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Basic HTML content extraction (remove scripts, styles, etc.)
      const cleanText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 2000); // Limit to 2000 chars
      
      return `Content from ${url}:\n\n${cleanText}`;
    } catch (error) {
      return `Failed to extract content from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

export const newsSearchTool = createTool({
  id: 'news_search',
  description: 'Search for recent news articles',
  inputSchema: z.object({
    query: z.string().describe('The search query for news articles'),
    limit: z.number().optional().default(5).describe('Number of articles to return (max 10)'),
  }),
  execute: async ({ context: { query, limit = 5 } }) => {
    try {
      // Use a free news API - NewsAPI has a free tier
      const apiKey = process.env.NEWS_API_KEY;
      
      if (!apiKey) {
        return 'News search requires NEWS_API_KEY environment variable to be set. Please configure this in your environment.';
      }
      
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${Math.min(limit, 10)}&apiKey=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.articles || data.articles.length === 0) {
        return `No news articles found for query: "${query}"`;
      }
      
      const articles = data.articles.slice(0, limit).map((article: any, index: number) => {
        return `${index + 1}. ${article.title}\n   Source: ${article.source.name}\n   Published: ${new Date(article.publishedAt).toLocaleDateString()}\n   URL: ${article.url}\n   Summary: ${article.description || 'No description available'}\n`;
      }).join('\n');
      
      return `Recent news articles for "${query}":\n\n${articles}`;
    } catch (error) {
      return `Failed to search news for "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});