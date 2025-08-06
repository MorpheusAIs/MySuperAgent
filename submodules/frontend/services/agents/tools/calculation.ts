import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const calculationTool = createTool({
  id: 'calculation',
  description: 'Perform mathematical calculations and evaluations',
  inputSchema: z.object({
    expression: z.string().describe('Mathematical expression to evaluate'),
    precision: z.number().optional().default(4).describe('Decimal precision for results'),
  }),
  outputSchema: z.object({
    result: z.number(),
    expression: z.string(),
    steps: z.array(z.string()).optional(),
  }),
  execute: async ({ context: { expression, precision = 4 } }) => {
    console.log(`Calculating: ${expression}`);
    
    try {
      // Basic math expression evaluation (be careful with eval in production!)
      // In a real implementation, use a proper math parser like mathjs
      const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
      
      if (sanitizedExpression !== expression) {
        throw new Error('Invalid characters in expression');
      }
      
      const result = eval(sanitizedExpression);
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid mathematical result');
      }
      
      return {
        result: Math.round(result * Math.pow(10, precision)) / Math.pow(10, precision),
        expression: sanitizedExpression,
        steps: [`Evaluated: ${sanitizedExpression}`, `Result: ${result}`],
      };
      
    } catch (error) {
      throw new Error(`Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});