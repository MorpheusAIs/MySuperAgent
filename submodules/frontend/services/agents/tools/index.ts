// Tool registry for all available tools
import { webSearchTool } from './web-search';
import { codeAnalyzerTool } from './code-analyzer';
import { dataProcessorTool } from './data-processor';
import { calculationTool } from './calculation';

export const toolRegistry = {
  webSearch: webSearchTool,
  codeAnalyzer: codeAnalyzerTool,
  dataProcessor: dataProcessorTool,
  calculation: calculationTool,
} as const;

export type ToolName = keyof typeof toolRegistry;

// Tool categories for organization
export const toolCategories = {
  research: ['webSearch'],
  development: ['codeAnalyzer'],
  data: ['dataProcessor'],
  math: ['calculation'],
} as const;

// Get tools by category
export function getToolsByCategory(category: keyof typeof toolCategories) {
  const toolNames = toolCategories[category];
  return Object.fromEntries(
    toolNames.map(name => [name, toolRegistry[name as ToolName]])
  );
}

// Get all tools
export function getAllTools() {
  return toolRegistry;
}

// Get specific tools by name
export function getTools(toolNames: ToolName[]) {
  return Object.fromEntries(
    toolNames.map(name => [name, toolRegistry[name]])
  );
}

// Export individual tools
export {
  webSearchTool,
  codeAnalyzerTool,
  dataProcessorTool,
  calculationTool,
};