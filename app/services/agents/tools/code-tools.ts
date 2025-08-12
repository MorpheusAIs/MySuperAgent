import { createTool } from '@mastra/core';
import { z } from 'zod';

export const codeExecutorTool = createTool({
  id: 'code_executor',
  description: 'Execute Python code in a safe sandbox environment',
  inputSchema: z.object({
    code: z.string().describe('The Python code to execute'),
    language: z.string().optional().default('python').describe('Programming language (currently supports python)'),
  }),
  execute: async ({ context: { code, language = 'python' } }) => {
    if (language !== 'python') {
      return `Unsupported language: ${language}. Currently only Python is supported.`;
    }

    try {
      // For now, return a message indicating code would be executed
      // In a real implementation, you'd use a sandbox like Pyodide or a secure container
      return `Code execution request received:\n\n\`\`\`python\n${code}\n\`\`\`\n\nNote: Code execution is currently disabled for security reasons. In a production environment, this would run in a secure sandbox.`;
    } catch (error) {
      return `Code execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

export const codeAnalyzerTool = createTool({
  id: 'code_analyzer_enhanced',
  description: 'Analyze code for potential issues, complexity, and best practices',
  inputSchema: z.object({
    code: z.string().describe('The code to analyze'),
    language: z.string().describe('Programming language of the code'),
    analysis_type: z.enum(['security', 'performance', 'style', 'all']).optional().default('all').describe('Type of analysis to perform'),
  }),
  execute: async ({ context: { code, language, analysis_type = 'all' } }) => {
    try {
      const lines = code.split('\n');
      const analysis = {
        line_count: lines.length,
        character_count: code.length,
        language: language,
        issues: [] as string[],
        suggestions: [] as string[],
      };

      // Basic static analysis based on common patterns
      if (analysis_type === 'security' || analysis_type === 'all') {
        // Security checks
        if (code.includes('eval(') || code.includes('exec(')) {
          analysis.issues.push('⚠️ Security: Use of eval() or exec() detected - potential security risk');
        }
        if (code.includes('import os') && code.includes('os.system')) {
          analysis.issues.push('⚠️ Security: Direct system calls detected - potential security risk');
        }
        if (code.match(/password.*=.*['"]/i)) {
          analysis.issues.push('⚠️ Security: Hardcoded credentials detected');
        }
      }

      if (analysis_type === 'style' || analysis_type === 'all') {
        // Style checks
        if (language === 'python') {
          const longLines = lines.filter(line => line.length > 100);
          if (longLines.length > 0) {
            analysis.suggestions.push(`📝 Style: ${longLines.length} lines exceed 100 characters (PEP 8 recommendation: 79)`);
          }
          
          if (!code.includes('"""') && !code.includes("'''") && lines.length > 10) {
            analysis.suggestions.push('📝 Style: Consider adding docstrings for better documentation');
          }
        }
      }

      if (analysis_type === 'performance' || analysis_type === 'all') {
        // Performance checks
        if (code.includes('for ') && code.includes('append(')) {
          analysis.suggestions.push('⚡ Performance: Consider using list comprehension instead of for-loop with append()');
        }
      }

      const result = `Code Analysis Report for ${language}:
      
📊 **Metrics:**
- Lines: ${analysis.line_count}
- Characters: ${analysis.character_count}

${analysis.issues.length > 0 ? `🚨 **Issues Found:**\n${analysis.issues.map(issue => `- ${issue}`).join('\n')}\n` : '✅ **No issues found**\n'}

${analysis.suggestions.length > 0 ? `💡 **Suggestions:**\n${analysis.suggestions.map(suggestion => `- ${suggestion}`).join('\n')}` : '👍 **No suggestions at this time**'}`;

      return result;
    } catch (error) {
      return `Code analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});