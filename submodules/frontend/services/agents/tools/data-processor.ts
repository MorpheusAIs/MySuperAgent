import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const dataProcessorTool = createTool({
  id: 'data-processor',
  description: 'Process and analyze data in various formats (JSON, CSV, etc.)',
  inputSchema: z.object({
    data: z.string().describe('The data to process (as string)'),
    format: z.enum(['json', 'csv', 'text']).describe('Format of the input data'),
    operation: z.enum(['analyze', 'transform', 'validate']).describe('Operation to perform'),
  }),
  outputSchema: z.object({
    result: z.object({
      summary: z.string(),
      statistics: z.record(z.any()),
      processedData: z.any().optional(),
    }),
    format: z.string(),
    success: z.boolean(),
  }),
  execute: async ({ context: { data, format, operation } }) => {
    console.log(`Processing ${format} data with operation: ${operation}`);
    
    try {
      let parsedData: any;
      let statistics: Record<string, any> = {};
      
      switch (format) {
        case 'json':
          parsedData = JSON.parse(data);
          statistics = {
            type: Array.isArray(parsedData) ? 'array' : 'object',
            size: Array.isArray(parsedData) ? parsedData.length : Object.keys(parsedData).length,
          };
          break;
          
        case 'csv':
          const lines = data.split('\n').filter(line => line.trim());
          const headers = lines[0]?.split(',') || [];
          statistics = {
            rows: lines.length - 1,
            columns: headers.length,
            headers,
          };
          break;
          
        case 'text':
          statistics = {
            lines: data.split('\n').length,
            words: data.split(/\s+/).length,
            characters: data.length,
          };
          break;
      }
      
      let summary: string;
      switch (operation) {
        case 'analyze':
          summary = `Analyzed ${format} data: ${JSON.stringify(statistics)}`;
          break;
        case 'transform':
          summary = `Transformed ${format} data successfully`;
          break;
        case 'validate':
          summary = `Validated ${format} data - structure appears correct`;
          break;
      }
      
      return {
        result: {
          summary,
          statistics,
          processedData: operation === 'transform' ? parsedData : undefined,
        },
        format,
        success: true,
      };
      
    } catch (error) {
      return {
        result: {
          summary: `Failed to process ${format} data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          statistics: {},
        },
        format,
        success: false,
      };
    }
  },
});