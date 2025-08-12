import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const codeAnalyzerTool = createTool({
  id: 'code-analyzer',
  description: 'Analyze code snippets for syntax, structure, and potential issues',
  inputSchema: z.object({
    code: z.string().describe('The code snippet to analyze'),
    language: z.string().optional().describe('Programming language (auto-detected if not provided)'),
  }),
  outputSchema: z.object({
    language: z.string(),
    analysis: z.object({
      syntaxValid: z.boolean(),
      complexity: z.enum(['low', 'medium', 'high']),
      issues: z.array(z.string()),
      suggestions: z.array(z.string()),
    }),
    metrics: z.object({
      lines: z.number(),
      characters: z.number(),
      functions: z.number(),
    }),
  }),
  execute: async ({ context: { code, language } }) => {
    console.log(`Analyzing code in ${language || 'auto-detected'} language`);
    
    // Basic analysis - in real implementation would use proper code analysis tools
    const lines = code.split('\n').length;
    const characters = code.length;
    const functions = (code.match(/function|def|const\s+\w+\s*=/g) || []).length;
    
    const detectedLanguage = language || detectLanguage(code);
    
    return {
      language: detectedLanguage,
      analysis: {
        syntaxValid: true, // Mock - would use actual parser
        complexity: (lines > 50 ? 'high' : lines > 20 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        issues: [],
        suggestions: [
          'Consider adding comments for better readability',
          'Review variable naming conventions',
        ],
      },
      metrics: {
        lines,
        characters,
        functions,
      },
    };
  },
});

function detectLanguage(code: string): string {
  if (code.includes('function') || code.includes('const') || code.includes('let')) {
    return 'javascript';
  }
  if (code.includes('def ') || code.includes('import ')) {
    return 'python';
  }
  if (code.includes('public class') || code.includes('System.out')) {
    return 'java';
  }
  return 'unknown';
}