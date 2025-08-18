// Registry of available MCP servers with their configurations
// Based on the Mastra MCP registry and popular MCP servers

export interface MCPServerDefinition {
  name: string;
  displayName: string;
  description: string;
  category: 'productivity' | 'development' | 'social' | 'data' | 'ai' | 'system';
  serverUrl: string;
  requiredCredentials: Array<{
    name: string;
    displayName: string;
    type: 'api_key' | 'access_token' | 'bot_token' | 'connection_string' | 'url';
    description: string;
    required: boolean;
    placeholder?: string;
    validationUrl?: string; // URL to validate the credential
  }>;
  connectionConfig?: Record<string, any>; // Additional connection parameters
  capabilities: string[];
  isPopular: boolean;
  documentationUrl?: string;
  setupInstructions?: string;
}

export const MCP_SERVER_REGISTRY: MCPServerDefinition[] = [
  // Essential - No API keys needed
  {
    name: 'filesystem',
    displayName: 'File System',
    description: 'Local file operations - read, write, and manage files',
    category: 'system',
    serverUrl: 'builtin://filesystem',
    requiredCredentials: [],
    capabilities: ['file_read', 'file_write', 'directory_list', 'file_search'],
    isPopular: true,
    setupInstructions: 'No setup required - works with local file system'
  },
  {
    name: 'sqlite',
    displayName: 'SQLite Database',
    description: 'Query and manage SQLite databases',
    category: 'data',
    serverUrl: 'builtin://sqlite',
    requiredCredentials: [
      {
        name: 'database_path',
        displayName: 'Database File Path',
        type: 'url',
        description: 'Path to your SQLite database file',
        required: true,
        placeholder: '/path/to/database.db'
      }
    ],
    capabilities: ['database_query', 'data_analysis', 'schema_inspection'],
    isPopular: true,
    setupInstructions: 'Provide the path to your SQLite database file'
  },

  // High Value - API keys required
  {
    name: 'github',
    displayName: 'GitHub',
    description: 'GitHub repository management, issues, PRs, and code analysis',
    category: 'development',
    serverUrl: 'https://mcp.github.com',
    requiredCredentials: [
      {
        name: 'personal_access_token',
        displayName: 'Personal Access Token',
        type: 'access_token',
        description: 'GitHub Personal Access Token with repo permissions',
        required: true,
        placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        validationUrl: 'https://api.github.com/user'
      }
    ],
    capabilities: ['repository_management', 'issue_tracking', 'code_analysis', 'pull_requests'],
    isPopular: true,
    documentationUrl: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token',
    setupInstructions: 'Create a Personal Access Token in GitHub Settings → Developer settings → Personal access tokens'
  },
  {
    name: 'slack',
    displayName: 'Slack',
    description: 'Send messages, manage channels, and interact with Slack workspaces',
    category: 'social',
    serverUrl: 'https://mcp.slack.com',
    requiredCredentials: [
      {
        name: 'bot_token',
        displayName: 'Bot User OAuth Token',
        type: 'bot_token',
        description: 'Slack Bot User OAuth Token (starts with xoxb-)',
        required: true,
        placeholder: 'xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx',
        validationUrl: 'https://slack.com/api/auth.test'
      }
    ],
    capabilities: ['messaging', 'channel_management', 'file_sharing', 'user_lookup'],
    isPopular: true,
    documentationUrl: 'https://api.slack.com/authentication/token-types#bot',
    setupInstructions: 'Create a Slack app, install it to your workspace, and copy the Bot User OAuth Token'
  },
  {
    name: 'notion',
    displayName: 'Notion',
    description: 'Create, read, and update Notion pages and databases',
    category: 'productivity',
    serverUrl: 'https://mcp.notion.com',
    requiredCredentials: [
      {
        name: 'integration_token',
        displayName: 'Integration Token',
        type: 'access_token',
        description: 'Notion Integration Token (starts with secret_)',
        required: true,
        placeholder: 'secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        validationUrl: 'https://api.notion.com/v1/users/me'
      }
    ],
    capabilities: ['document_creation', 'database_management', 'content_search', 'page_updates'],
    isPopular: true,
    documentationUrl: 'https://developers.notion.com/docs/create-a-notion-integration',
    setupInstructions: 'Create a Notion integration in your workspace settings and copy the integration token'
  },
  {
    name: 'google_maps',
    displayName: 'Google Maps',
    description: 'Location services, geocoding, and mapping functionality',
    category: 'data',
    serverUrl: 'https://mcp.googleapis.com/maps',
    requiredCredentials: [
      {
        name: 'api_key',
        displayName: 'Google Maps API Key',
        type: 'api_key',
        description: 'Google Cloud Console API key with Maps API enabled',
        required: true,
        placeholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      }
    ],
    capabilities: ['geocoding', 'place_search', 'directions', 'location_data'],
    isPopular: true,
    documentationUrl: 'https://developers.google.com/maps/documentation/javascript/get-api-key',
    setupInstructions: 'Enable Google Maps API in Google Cloud Console and create an API key'
  },

  // AI and Content Services
  {
    name: 'openai',
    displayName: 'OpenAI',
    description: 'Access to OpenAI GPT models and embeddings',
    category: 'ai',
    serverUrl: 'https://mcp.openai.com',
    requiredCredentials: [
      {
        name: 'api_key',
        displayName: 'OpenAI API Key',
        type: 'api_key',
        description: 'OpenAI API key from your account dashboard',
        required: true,
        placeholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      }
    ],
    capabilities: ['text_generation', 'embeddings', 'chat_completion', 'content_analysis'],
    isPopular: true,
    documentationUrl: 'https://platform.openai.com/api-keys',
    setupInstructions: 'Create an API key in your OpenAI account dashboard'
  },
  {
    name: 'anthropic',
    displayName: 'Anthropic Claude',
    description: 'Access to Anthropic Claude models',
    category: 'ai',
    serverUrl: 'https://mcp.anthropic.com',
    requiredCredentials: [
      {
        name: 'api_key',
        displayName: 'Anthropic API Key',
        type: 'api_key',
        description: 'Anthropic API key from your console',
        required: true,
        placeholder: 'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      }
    ],
    capabilities: ['text_generation', 'content_analysis', 'reasoning', 'code_assistance'],
    isPopular: true,
    documentationUrl: 'https://docs.anthropic.com/claude/reference/getting-started',
    setupInstructions: 'Create an API key in the Anthropic Console'
  },

  // Database and Storage
  {
    name: 'postgres',
    displayName: 'PostgreSQL',
    description: 'Connect to and query PostgreSQL databases',
    category: 'data',
    serverUrl: 'https://mcp.postgresql.org',
    requiredCredentials: [
      {
        name: 'connection_url',
        displayName: 'Connection URL',
        type: 'connection_string',
        description: 'PostgreSQL connection string',
        required: true,
        placeholder: 'postgresql://username:password@host:port/database'
      }
    ],
    capabilities: ['database_query', 'schema_management', 'data_analysis', 'migrations'],
    isPopular: false,
    setupInstructions: 'Provide your PostgreSQL connection string with appropriate permissions'
  },
  {
    name: 'redis',
    displayName: 'Redis',
    description: 'Redis key-value store operations and pub/sub',
    category: 'data',
    serverUrl: 'https://mcp.redis.io',
    requiredCredentials: [
      {
        name: 'connection_url',
        displayName: 'Redis URL',
        type: 'connection_string',
        description: 'Redis connection URL',
        required: true,
        placeholder: 'redis://username:password@host:port'
      }
    ],
    capabilities: ['key_value_operations', 'pub_sub', 'caching', 'data_structures'],
    isPopular: false,
    setupInstructions: 'Provide your Redis connection URL'
  },

  // Web Search and Content
  {
    name: 'brave_search',
    displayName: 'Brave Search',
    description: 'Web search using Brave Search API',
    category: 'data',
    serverUrl: 'https://mcp.brave.com',
    requiredCredentials: [
      {
        name: 'api_key',
        displayName: 'Brave Search API Key',
        type: 'api_key',
        description: 'Brave Search API subscription key',
        required: true,
        placeholder: 'BSAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      }
    ],
    capabilities: ['web_search', 'content_discovery', 'fact_checking', 'research'],
    isPopular: true,
    documentationUrl: 'https://brave.com/search/api/',
    setupInstructions: 'Subscribe to Brave Search API and get your API key'
  },

  // Development Tools
  {
    name: 'docker',
    displayName: 'Docker',
    description: 'Container management and Docker operations',
    category: 'development',
    serverUrl: 'builtin://docker',
    requiredCredentials: [],
    capabilities: ['container_management', 'image_operations', 'service_deployment'],
    isPopular: false,
    setupInstructions: 'Requires Docker to be installed and running locally'
  },

  // Cloud Services
  {
    name: 'aws_s3',
    displayName: 'AWS S3',
    description: 'Amazon S3 bucket operations and file storage',
    category: 'data',
    serverUrl: 'https://mcp.amazonaws.com/s3',
    requiredCredentials: [
      {
        name: 'access_key_id',
        displayName: 'AWS Access Key ID',
        type: 'api_key',
        description: 'AWS IAM Access Key ID',
        required: true,
        placeholder: 'AKIA...'
      },
      {
        name: 'secret_access_key',
        displayName: 'AWS Secret Access Key',
        type: 'api_key',
        description: 'AWS IAM Secret Access Key',
        required: true,
        placeholder: '...'
      },
      {
        name: 'region',
        displayName: 'AWS Region',
        type: 'api_key',
        description: 'AWS region for S3 operations',
        required: true,
        placeholder: 'us-east-1'
      }
    ],
    capabilities: ['file_storage', 'bucket_management', 'object_operations', 'presigned_urls'],
    isPopular: false,
    documentationUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html',
    setupInstructions: 'Create AWS IAM credentials with S3 permissions'
  }
];

export class MCPServerRegistry {
  /**
   * Get all available MCP servers
   */
  static getAllServers(): MCPServerDefinition[] {
    return MCP_SERVER_REGISTRY;
  }

  /**
   * Get popular MCP servers
   */
  static getPopularServers(): MCPServerDefinition[] {
    return MCP_SERVER_REGISTRY.filter(server => server.isPopular);
  }

  /**
   * Get servers by category
   */
  static getServersByCategory(category: MCPServerDefinition['category']): MCPServerDefinition[] {
    return MCP_SERVER_REGISTRY.filter(server => server.category === category);
  }

  /**
   * Get server definition by name
   */
  static getServer(name: string): MCPServerDefinition | null {
    return MCP_SERVER_REGISTRY.find(server => server.name === name) || null;
  }

  /**
   * Search servers by name or description
   */
  static searchServers(query: string): MCPServerDefinition[] {
    const lowerQuery = query.toLowerCase();
    return MCP_SERVER_REGISTRY.filter(server => 
      server.name.toLowerCase().includes(lowerQuery) ||
      server.displayName.toLowerCase().includes(lowerQuery) ||
      server.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get servers that require no credentials (can be enabled immediately)
   */
  static getNoCredentialServers(): MCPServerDefinition[] {
    return MCP_SERVER_REGISTRY.filter(server => server.requiredCredentials.length === 0);
  }

  /**
   * Get available categories
   */
  static getCategories(): Array<{category: MCPServerDefinition['category'], count: number}> {
    const categoryMap = new Map<MCPServerDefinition['category'], number>();
    
    MCP_SERVER_REGISTRY.forEach(server => {
      const current = categoryMap.get(server.category) || 0;
      categoryMap.set(server.category, current + 1);
    });

    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    }));
  }
}