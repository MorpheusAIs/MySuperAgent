import { MCPClient } from '@mastra/mcp';

// MCP Client configuration for connecting to local/available MCP servers
export const mcpClient = new MCPClient({
  servers: {
    // Add local MCP servers here when available
    // Example:
    // filesystem: {
    //   command: "npx",
    //   args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"],
    // },
  },
});

// Get tools from all MCP servers
export async function getMCPTools() {
  try {
    return await mcpClient.getTools();
  } catch (error) {
    console.error('Failed to get MCP tools:', error);
    return {};
  }
}

// Get tools dynamically (for per-request scenarios)
export async function getMCPToolsets() {
  try {
    return await mcpClient.getToolsets();
  } catch (error) {
    console.error('Failed to get MCP toolsets:', error);
    return {};
  }
}