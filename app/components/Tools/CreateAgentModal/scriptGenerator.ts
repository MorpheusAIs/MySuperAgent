import { MCPConfig } from "./types";

/**
 * Generate a shell script based on the provided MCP configuration
 * @param config - The MCP server configuration
 * @returns A shell script string that will run the MCP server and create a public URL
 */
export const generateShellScript = (config: MCPConfig): string => {
  // Format environment variables
  const envVars = config.env
    .filter((env) => env.key.trim() && env.value.trim())
    .map((env) => `export ${env.key}="${env.value}"`)
    .join("\n");

  // Format arguments without quotes for display purposes
  const displayArgs = config.args.filter((arg) => arg.trim()).join(" ");

  // Format command and arguments properly for the supergateway --stdio option
  // This needs proper shell quoting to work correctly
  const shellCommand = [
    config.command,
    ...config.args.filter((arg) => arg.trim()),
  ]
    .map((part) => `"${part.replace(/"/g, '\\"')}"`)
    .join(" ");

  // Current date for script header
  const currentDate = new Date().toLocaleString();

  // Build the script directly
  const script = `#!/bin/bash

# Script to start MCP server, expose via supergateway, and create ngrok tunnel
# Generated on ${currentDate}

echo "🚀 Starting MCP server and creating tunnel..."

# Check if required tools are installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install it first."
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo "❌ npx is not installed. Please install Node.js first."
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo "📞 Cleaning up processes..."
    [[ -n $SUPERGATEWAY_PID ]] && kill $SUPERGATEWAY_PID
    exit 0
}

# Setup cleanup on script exit
trap cleanup EXIT INT TERM

# Set environment variables
${envVars ? envVars : "# No environment variables specified"}

# Generate a random port for supergateway to avoid collisions
GATEWAY_PORT=$(( 8000 + RANDOM % 1000 ))

# Start the MCP server via supergateway in the background
echo "🔧 Starting MCP server via supergateway: ${config.command} ${displayArgs}"
npx -y supergateway --stdio "${
    config.command
  } ${displayArgs}" --port $GATEWAY_PORT &
SUPERGATEWAY_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to initialize (5 seconds)..."
sleep 5

# Get the ngrok URL using the ngrok API
echo "🔗 Creating ngrok tunnel..."
echo "✅ Your MCP server will be accessible via the ngrok URL shown below"
echo "📋 Copy the https:// URL and paste it in the MCP Server URL field"
echo "💡 Press Ctrl+C to stop the server and tunnel when you're done"
echo

# Start ngrok in the foreground
ngrok http $GATEWAY_PORT

# The script will not reach here unless ngrok exits unexpectedly
echo "❌ ngrok has exited. The MCP server may still be running in the background."
echo "Run 'ps aux | grep supergateway' to find and kill the process if needed."

# Keep the script running until supergateway exits
wait $SUPERGATEWAY_PID`;

  return script;
};
