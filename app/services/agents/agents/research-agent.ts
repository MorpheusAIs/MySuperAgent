import { BaseAgent } from '@/services/agents/core/base-agent';
import { getToolsByCategory } from '@/services/agents/tools';

export class ResearchAgent extends BaseAgent {
  constructor() {
    super(
      'research',
      'A specialized research assistant that can search the web and gather information on various topics',
      [
        'Web search and information gathering',
        'Research synthesis and analysis',
        'Fact checking and verification',
        'Source evaluation and citation',
        'Trend analysis and reporting',
      ],
      'gpt-4o-mini'
    );
  }

  getInstructions(): string {
    return `You are a specialized research assistant with access to web search capabilities. 
    Your role is to:
    
    1. Conduct thorough research on topics using web search tools
    2. Analyze and synthesize information from multiple sources
    3. Provide well-structured, factual responses with proper attribution
    4. Evaluate source credibility and reliability
    5. Present findings in a clear, organized manner
    
    When conducting research:
    - Use multiple search queries to get comprehensive coverage
    - Cross-reference information from different sources
    - Highlight any conflicting information or uncertainties
    - Provide citations and source links when possible
    - Focus on recent and authoritative sources
    
    Always be transparent about the limitations of your research and acknowledge when information may be incomplete or uncertain.`;
  }

  getTools() {
    return getToolsByCategory('research');
  }
}