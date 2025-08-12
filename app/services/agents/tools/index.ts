// Tool registry for all available tools
import { webSearchTool } from './web-search';
import { codeAnalyzerTool } from './code-analyzer';
import { dataProcessorTool } from './data-processor';
import { calculationTool } from './calculation';
import { cryptoPriceTool, cryptoMarketCapTool, defiTvlTool } from './crypto-data';
import { websiteContentTool, newsSearchTool } from './web-scraper';
import { codeExecutorTool, codeAnalyzerTool as codeAnalyzerEnhancedTool } from './code-tools';
import {
  braveSearchTool,
  codeInterpreterTool,
  dalleTool,
  visionTool,
  websiteSearchTool,
  youtubeVideoSearchTool,
  youtubeChannelSearchTool,
} from './crewai-equivalents';

export const toolRegistry = {
  // Original tools
  webSearch: webSearchTool,
  codeAnalyzer: codeAnalyzerTool,
  dataProcessor: dataProcessorTool,
  calculation: calculationTool,
  
  // Crypto tools
  cryptoPrice: cryptoPriceTool,
  cryptoMarketCap: cryptoMarketCapTool,
  defiTvl: defiTvlTool,
  
  // Web scraping tools
  websiteContent: websiteContentTool,
  newsSearch: newsSearchTool,
  
  // Code tools
  codeExecutor: codeExecutorTool,
  codeAnalyzerEnhanced: codeAnalyzerEnhancedTool,
  
  // CrewAI equivalent tools
  braveSearch: braveSearchTool,
  codeInterpreter: codeInterpreterTool,
  dalle: dalleTool,
  vision: visionTool,
  websiteSearch: websiteSearchTool,
  youtubeVideoSearch: youtubeVideoSearchTool,
  youtubeChannelSearch: youtubeChannelSearchTool,
} as const;

export type ToolName = keyof typeof toolRegistry;

// Tool categories for organization
export const toolCategories = {
  research: ['webSearch', 'braveSearch', 'newsSearch', 'websiteSearch', 'websiteContent'],
  development: ['codeAnalyzer', 'codeAnalyzerEnhanced', 'codeExecutor', 'codeInterpreter'],
  data: ['dataProcessor'],
  math: ['calculation'],
  crypto: ['cryptoPrice', 'cryptoMarketCap', 'defiTvl'],
  multimedia: ['dalle', 'vision', 'youtubeVideoSearch', 'youtubeChannelSearch'],
  social: [], // Apify tools will be added dynamically
  business: [], // Apify tools will be added dynamically
  ecommerce: [], // Apify tools will be added dynamically
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

// Export individual tools for backward compatibility
export {
  webSearchTool,
  codeAnalyzerTool,
  dataProcessorTool,
  calculationTool,
  cryptoPriceTool,
  cryptoMarketCapTool,
  defiTvlTool,
  websiteContentTool,
  newsSearchTool,
  codeExecutorTool,
  braveSearchTool,
  codeInterpreterTool,
  dalleTool,
  visionTool,
  websiteSearchTool,
  youtubeVideoSearchTool,
  youtubeChannelSearchTool,
};