/**
 * Interface for MCP environment variables
 */
export interface EnvVar {
  key: string;
  value: string;
}

/**
 * Interface for MCP configuration
 */
export interface MCPConfig {
  command: string;
  args: string[];
  env: EnvVar[];
}

/**
 * Interface for form validation errors
 */
export interface FormErrors {
  human_readable_name?: string;
  description?: string;
  mcp_server_url?: string;
  command?: string;
  args?: string;
  env?: { [key: string]: string };
}

/**
 * Interface for agent form data
 */
export interface AgentFormData {
  human_readable_name: string;
  description: string;
  mcp_server_url: string;
  is_enabled: boolean;
}
