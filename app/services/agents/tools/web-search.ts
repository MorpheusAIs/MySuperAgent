import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const webSearchTool = createTool({
  id: 'web-search',
  description: 'Search the web for information using a search query',
  inputSchema: z.object({
    query: z.string().describe('The search query to execute'),
    maxResults: z.number().optional().default(5).describe('Maximum number of results to return'),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    })),
    totalResults: z.number(),
  }),
  execute: async ({ context: { query, maxResults = 5 } }) => {
    // Mock implementation - replace with actual search API
    console.log(`Searching web for: ${query}`);
    
    const mockResults = [
      {
        title: `Search results for: ${query}`,
        url: `https://example.com/search?q=${encodeURIComponent(query)}`,
        snippet: `This is a mock search result for the query "${query}". In a real implementation, this would return actual search results from a search API.`,
      },
    ];

    return {
      results: mockResults.slice(0, maxResults),
      totalResults: mockResults.length,
    };
  },
});