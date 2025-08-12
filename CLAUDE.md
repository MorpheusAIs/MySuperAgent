# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MySuperAgent is a platform for building, deploying, and leveraging AI agents. It consists of:
- **React Frontend**: Next.js-based web interface with Web3 capabilities and built-in agent system
- **Multi-Agent Framework**: Client-side architecture supporting various specialized agents

## Architecture

### Application Architecture
- **Components** (`app/components/`): React components for UI
- **Contexts** (`app/contexts/`): State management with React Context
- **Services** (`app/services/`): Agent system, API clients and utilities
- **Agent System** (`app/services/agents/`): Client-side agent orchestration and execution
- **Database**: Local SQLite for client-side data storage

## Common Development Commands

### Application Development
```bash
cd app

# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build for production
pnpm run build

# Run linter
pnpm run lint

# Run type check
pnpm run type-check
```

### Testing
```bash
# Run tests (when implemented)
cd app
pnpm run test
```

## Agent Development

To create a new agent:

1. Create agent class in `app/services/agents/agents/`:
   ```typescript
   export class YourAgent extends BaseAgent {
     // Implementation
   }
   ```

2. Register agent in `app/services/agents/core/AgentRegistry.ts`
3. Define tools in `app/services/agents/tools/`
4. Add agent configuration and routing logic

### Agent Response Types
- Standard message responses with content
- Error responses with error messages
- Tool execution results

## Environment Variables

### Application
- Various API keys for external services (stored in environment variables)

## MCP Agent Creation

For Model Context Protocol (MCP) agents:
1. Create agent in `app/services/agents/agents/`
2. Follow MCP integration patterns in the client-side agent system
3. Configure MCP connections in the agent configuration

## Deployment

### Deployment

Deploy to Vercel:
```bash
# Automatic deployment via Vercel integration
# Push to main branch triggers production deployment
```

## Key Files and Patterns

### Agent Implementation Pattern
```typescript
export class YourAgent extends BaseAgent {
  async processMessage(message: string): Promise<AgentResponse> {
    // Process message logic
  }
  
  async executeTool(toolName: string, args: any): Promise<any> {
    // Tool execution logic
  }
}
```

### Error Handling
- Use try-catch blocks for error handling
- Return appropriate error responses
- Log errors for debugging

### Testing Pattern
```typescript
describe('YourAgent', () => {
  it('should process messages correctly', async () => {
    const agent = new YourAgent();
    const response = await agent.processMessage('test');
    expect(response).toBeDefined();
  });
});
```