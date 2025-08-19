// Registry of available built-in agents
export interface AgentDefinition {
  name: string;
  displayName: string;
  description: string;
  category: 'productivity' | 'development' | 'research' | 'content' | 'analysis' | 'automation';
  capabilities: string[];
  isPopular: boolean;
  isBuiltIn: boolean;
  version: string;
  documentationUrl?: string;
  setupInstructions?: string;
}

export const BUILT_IN_AGENTS: AgentDefinition[] = [
  // Productivity Agents
  {
    name: 'task_manager',
    displayName: 'Task Manager',
    description: 'Helps organize, prioritize, and track tasks and projects with intelligent scheduling',
    category: 'productivity',
    capabilities: ['task_creation', 'priority_management', 'deadline_tracking', 'progress_monitoring'],
    isPopular: true,
    isBuiltIn: true,
    version: '1.0.0',
    setupInstructions: 'No setup required - ready to use immediately'
  },
  {
    name: 'email_assistant',
    displayName: 'Email Assistant',
    description: 'Drafts, summarizes, and manages email communications with professional tone',
    category: 'productivity',
    capabilities: ['email_drafting', 'text_summarization', 'tone_adjustment', 'language_translation'],
    isPopular: true,
    isBuiltIn: true,
    version: '1.2.0',
    setupInstructions: 'No setup required - ready to use immediately'
  },
  {
    name: 'meeting_coordinator',
    displayName: 'Meeting Coordinator',
    description: 'Schedules meetings, creates agendas, and summarizes meeting notes',
    category: 'productivity',
    capabilities: ['scheduling', 'agenda_creation', 'meeting_summaries', 'action_item_tracking'],
    isPopular: false,
    isBuiltIn: true,
    version: '1.1.0'
  },

  // Development Agents
  {
    name: 'code_reviewer',
    displayName: 'Code Reviewer',
    description: 'Reviews code for bugs, performance issues, and best practices',
    category: 'development',
    capabilities: ['code_analysis', 'bug_detection', 'performance_optimization', 'security_review'],
    isPopular: true,
    isBuiltIn: true,
    version: '2.0.0',
    documentationUrl: 'https://docs.example.com/code-reviewer'
  },
  {
    name: 'api_developer',
    displayName: 'API Developer',
    description: 'Generates API endpoints, documentation, and tests for web services',
    category: 'development',
    capabilities: ['api_generation', 'documentation_creation', 'test_writing', 'endpoint_design'],
    isPopular: true,
    isBuiltIn: true,
    version: '1.5.0'
  },
  {
    name: 'database_optimizer',
    displayName: 'Database Optimizer',
    description: 'Analyzes and optimizes database queries, schemas, and performance',
    category: 'development',
    capabilities: ['query_optimization', 'schema_design', 'index_recommendations', 'performance_analysis'],
    isPopular: false,
    isBuiltIn: true,
    version: '1.3.0'
  },

  // Research Agents
  {
    name: 'research_analyst',
    displayName: 'Research Analyst',
    description: 'Conducts comprehensive research on topics and compiles detailed reports',
    category: 'research',
    capabilities: ['data_gathering', 'source_verification', 'report_generation', 'trend_analysis'],
    isPopular: true,
    isBuiltIn: true,
    version: '1.4.0'
  },
  {
    name: 'fact_checker',
    displayName: 'Fact Checker',
    description: 'Verifies claims and statements against reliable sources',
    category: 'research',
    capabilities: ['fact_verification', 'source_validation', 'credibility_assessment', 'bias_detection'],
    isPopular: true,
    isBuiltIn: true,
    version: '1.1.0'
  },
  {
    name: 'market_researcher',
    displayName: 'Market Researcher',
    description: 'Analyzes market trends, competitor data, and consumer behavior',
    category: 'research',
    capabilities: ['market_analysis', 'competitor_research', 'trend_forecasting', 'consumer_insights'],
    isPopular: false,
    isBuiltIn: true,
    version: '1.0.0'
  },

  // Content Agents
  {
    name: 'content_writer',
    displayName: 'Content Writer',
    description: 'Creates engaging content for blogs, social media, and marketing materials',
    category: 'content',
    capabilities: ['copywriting', 'seo_optimization', 'brand_voice_matching', 'content_planning'],
    isPopular: true,
    isBuiltIn: true,
    version: '1.6.0'
  },
  {
    name: 'social_media_manager',
    displayName: 'Social Media Manager',
    description: 'Plans, creates, and schedules social media content across platforms',
    category: 'content',
    capabilities: ['content_scheduling', 'hashtag_optimization', 'engagement_analysis', 'platform_optimization'],
    isPopular: true,
    isBuiltIn: true,
    version: '1.2.0'
  },
  {
    name: 'video_scripter',
    displayName: 'Video Scripter',
    description: 'Writes engaging scripts for videos, presentations, and multimedia content',
    category: 'content',
    capabilities: ['script_writing', 'storyboard_creation', 'dialogue_crafting', 'pacing_optimization'],
    isPopular: false,
    isBuiltIn: true,
    version: '1.0.0'
  },

  // Analysis Agents
  {
    name: 'data_analyst',
    displayName: 'Data Analyst',
    description: 'Analyzes datasets and generates insights with visualizations',
    category: 'analysis',
    capabilities: ['statistical_analysis', 'data_visualization', 'pattern_recognition', 'predictive_modeling'],
    isPopular: true,
    isBuiltIn: true,
    version: '2.1.0'
  },
  {
    name: 'financial_analyst',
    displayName: 'Financial Analyst',
    description: 'Analyzes financial data, creates reports, and provides investment insights',
    category: 'analysis',
    capabilities: ['financial_modeling', 'risk_assessment', 'portfolio_analysis', 'market_valuation'],
    isPopular: false,
    isBuiltIn: true,
    version: '1.3.0'
  },
  {
    name: 'sentiment_analyzer',
    displayName: 'Sentiment Analyzer',
    description: 'Analyzes text sentiment and emotional tone in communications',
    category: 'analysis',
    capabilities: ['sentiment_detection', 'emotion_analysis', 'text_classification', 'mood_tracking'],
    isPopular: false,
    isBuiltIn: true,
    version: '1.1.0'
  },

  // Automation Agents
  {
    name: 'workflow_automator',
    displayName: 'Workflow Automator',
    description: 'Creates and manages automated workflows between different tools and services',
    category: 'automation',
    capabilities: ['process_automation', 'integration_management', 'trigger_setup', 'workflow_optimization'],
    isPopular: true,
    isBuiltIn: true,
    version: '1.4.0'
  },
  {
    name: 'report_generator',
    displayName: 'Report Generator',
    description: 'Automatically generates reports from data sources with custom formatting',
    category: 'automation',
    capabilities: ['automated_reporting', 'data_aggregation', 'template_creation', 'schedule_management'],
    isPopular: false,
    isBuiltIn: true,
    version: '1.2.0'
  },
  {
    name: 'notification_manager',
    displayName: 'Notification Manager',
    description: 'Manages and routes notifications based on importance and user preferences',
    category: 'automation',
    capabilities: ['notification_filtering', 'priority_routing', 'alert_customization', 'delivery_optimization'],
    isPopular: false,
    isBuiltIn: true,
    version: '1.0.0'
  }
];

export class AgentRegistry {
  /**
   * Get all available built-in agents
   */
  static getAllAgents(): AgentDefinition[] {
    return BUILT_IN_AGENTS;
  }

  /**
   * Get popular agents
   */
  static getPopularAgents(): AgentDefinition[] {
    return BUILT_IN_AGENTS.filter(agent => agent.isPopular);
  }

  /**
   * Get agents by category
   */
  static getAgentsByCategory(category: AgentDefinition['category']): AgentDefinition[] {
    return BUILT_IN_AGENTS.filter(agent => agent.category === category);
  }

  /**
   * Get agent definition by name
   */
  static getAgent(name: string): AgentDefinition | null {
    return BUILT_IN_AGENTS.find(agent => agent.name === name) || null;
  }

  /**
   * Search agents by name or description
   */
  static searchAgents(query: string): AgentDefinition[] {
    const lowerQuery = query.toLowerCase();
    return BUILT_IN_AGENTS.filter(agent => 
      agent.name.toLowerCase().includes(lowerQuery) ||
      agent.displayName.toLowerCase().includes(lowerQuery) ||
      agent.description.toLowerCase().includes(lowerQuery) ||
      agent.capabilities.some(cap => cap.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get available categories
   */
  static getCategories(): Array<{category: AgentDefinition['category'], count: number}> {
    const categoryMap = new Map<AgentDefinition['category'], number>();
    
    BUILT_IN_AGENTS.forEach(agent => {
      const current = categoryMap.get(agent.category) || 0;
      categoryMap.set(agent.category, current + 1);
    });

    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    }));
  }
}