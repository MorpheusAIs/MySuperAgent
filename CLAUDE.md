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

## Codebase Organization Changes (2025-08-18)

### Services Directory Structure
The services directory has been reorganized for consistency and clarity:

#### Directory Naming Convention
- All service directories now use **kebab-case** naming:
  - `Database` → `database`
  - `LitProtocol` → `lit-protocol`
  - `LocalStorage` → `local-storage`
  - `SessionSync` → `session-sync`
  - `Wallet` → `wallet`
  - `API` → `api`
  - `ChatManagement` → `chat-management`

#### File Organization
- **Utilities consolidated** into `services/utils/`:
  - `agent-utils.ts` - Agent-related utility functions
  - `file-utils.ts` - File handling utilities
  - `errors.ts` - Error handling and custom error classes
  
- **Configuration consolidated** into `services/config/`:
  - `constants.ts` - Application constants and configurations
  - `env.ts` - Environment variable validation and management

#### Agent Files Reorganization
Agent files in `services/agents/agents/` have been renamed for clarity:
- `AllBackendAgents.ts` → `mcp-agents.ts` (MCP protocol agents)
- `BackendAgents.ts` → `specialized-agents.ts` (Specialized backend agents)
- `BackendAgentsPartTwo.ts` → `crypto-agents.ts` (Crypto and e-commerce agents)
- `CodeAgent.ts` → `code-agent.ts`
- `DataAgent.ts` → `data-agent.ts`
- `DefaultAgent.ts` → `default-agent.ts`
- `MathAgent.ts` → `math-agent.ts`
- `ResearchAgent.ts` → `research-agent.ts`

Agent core files also renamed:
- `AgentRegistry.ts` → `agent-registry.ts`
- `BaseAgent.ts` → `base-agent.ts`

### Components Directory
- `CDPWallets` → `CdpWallets` (Consistent PascalCase for React components)

### Import Path Updates
All import paths have been updated throughout the codebase to reflect the new structure:
- `@/services/API/` → `@/services/api/`
- `@/services/Database/` → `@/services/database/`
- `@/services/LitProtocol/` → `@/services/lit-protocol/`
- `@/services/LocalStorage/` → `@/services/local-storage/`
- `@/services/SessionSync/` → `@/services/session-sync/`
- `@/services/Wallet/` → `@/services/wallet/`
- `@/services/ChatManagement/` → `@/services/chat-management/`
- `@/services/utils` → `@/services/utils/agent-utils`
- `@/services/fileUtils` → `@/services/utils/file-utils`
- `@/services/constants` → `@/services/config/constants`

### Benefits of These Changes
1. **Consistent naming** - All service directories now follow the same kebab-case convention
2. **Better organization** - Related files are grouped together (utils, config)
3. **Clearer purpose** - File names better describe their contents
4. **Easier navigation** - Logical structure makes finding files easier
5. **Maintainability** - Consistent patterns make the codebase easier to maintain

## Navigation and Routing Updates (2025-08-18)

### Agent Teams → Teams Rename
The agent-teams feature has been renamed to simply "teams" for cleaner URLs and better user experience:

#### URL Changes
- `/agent-teams` → `/teams`
- `/api/agent-teams/` → `/api/teams/`

#### File Structure Changes
- `pages/agent-teams.tsx` → `pages/teams.tsx`
- `pages/api/agent-teams/` → `pages/api/teams/`
- `components/AgentTeams/` → `components/Teams/`
- `migrations/003-add-agent-teams.js` → `migrations/003-add-teams.js`

#### Database Updates
- Table name: `agent_teams` → `teams`
- Index name: `idx_agent_teams_wallet` → `idx_teams_wallet`
- Trigger name: `update_agent_teams_updated_at` → `update_teams_updated_at`

### Dashboard Navigation
Added a new Dashboard entry in the Advanced section of the left sidebar:

#### New Component
- `components/Dashboard/Button.tsx` - Dashboard navigation button
- `components/Dashboard/Button.module.css` - Styling for the button

#### Navigation Behavior
- Dashboard button routes to the root page (`/`)
- Shows all jobs and chat UI (main application interface)
- Positioned at the top of the Advanced section for easy access

#### Integration
- Added to `LeftSidebar` component in the Advanced section
- Uses `LayoutDashboard` icon from Lucide React
- Consistent styling with other navigation buttons

## Recent UI/UX Improvements (2025-08-21)

### Scheduling System Enhancements
- **Default Schedule Type**: Changed from 'hourly' to 'daily' for better user experience
- **Schedule Button Context Awareness**: Button becomes green and shows "Create Schedule" when job name is filled
- **Improved Day Selection UI**: Active days use bright green (#48BB78) with enhanced visual feedback

### Jobs Management Features
- **Time-Based Filtering**: Added filters for Today, Yesterday, Past Week, Past Month, Older
- **Enhanced Filter UI**: Glassmorphic design with backdrop blur effects
- **Smart Pagination**: Maintains separate pagination for current, scheduled, and previous jobs

### Settings Page Transformation
- **From Modal to Page**: Settings now opens as full page at `/settings` instead of cramped modal
- **Professional Layout**: Tab-based interface with proper spacing and sections
- **Better Organization**: More space for complex configurations and settings management

### Design System Consistency
- **Model Selector**: Updated to match app's design language (#27292c background, consistent borders)
- **Color Scheme**: Standardized dark surfaces (#27292c), borders (rgba(255,255,255,0.1))
- **Interactive States**: Subtle hover animations with translateY(-1px) and box shadows
- **Typography**: Consistent font weights and sizes across all components

### Database Enhancements
- **Jobs Count Tracking**: Added `getTotalCompletedJobsCount()` method
- **Message Counter Update**: Changed from "processed messages" to "completed jobs"
- **Default Conversation Fix**: Removed automatic creation of default "Hello! How can I help you today?" conversations

## Action States and Message Types

### Agent Response Action States
Agents can return responses with specific action states that trigger unique UI behaviors:

#### Supported Action Types
- **requires_approval**: User confirmation needed before proceeding
- **requires_input**: Additional user input required
- **transaction_pending**: Blockchain transaction awaiting confirmation
- **streaming**: Real-time data streaming in progress
- **tool_execution**: External tool being executed
- **error**: Error state with recovery options

#### Implementation Pattern
```typescript
interface AgentResponse {
  content: string;
  requires_action?: boolean;
  action_type?: string;
  action_data?: any;
  metadata?: Record<string, any>;
}
```

### Message Type Components
Different message types have specialized rendering components:
- `CrewResponseMessage` - Multi-agent task execution results
- `TweetMessage` - Twitter/social media post previews
- `TransactionMessage` - Blockchain transaction details
- `CodeMessage` - Syntax-highlighted code blocks
- `DataVisualizationMessage` - Charts and data visualizations

## Pending Improvements (TODO)

### High Priority
1. **Schedule Editing Modal** (`components/JobsList/index.tsx:481`)
   - Implement modal for editing existing job schedules
   - Allow modification of schedule type, time, and frequency

2. **MCP Tool Execution** (`services/mcp/user-mcp-manager.ts`)
   - Implement missing `callTool` method for MCP client
   - Handle tool execution responses properly

3. **LLM-based Title Generation** (`pages/api/v1/generate-title.ts`)
   - Replace placeholder logic with actual LLM calls
   - Generate contextually relevant conversation titles

### Medium Priority
4. **Agent Selection UX** (`services/chat-management/api.ts`)
   - Allow users to explicitly select agents for requests
   - Add agent selection UI in chat interface

5. **Tweet Regeneration** (`components/Agents/Tweet/CustomMessages/TweetMessage.tsx`)
   - Restore regeneration functionality for tweet drafts
   - Add variation generation options

6. **Dynamic MCP/A2A Agents** (`services/agents/core/agent-registry.ts`)
   - Implement proxy agents for external MCP servers
   - Create dynamic agent instances for A2A connections

## Testing Guidelines

### Component Testing
```typescript
// Test action state detection
it('should detect action states in agent responses', () => {
  const response = { requires_action: true, action_type: 'approval' };
  expect(detectActionState(response)).toBe('approval');
});
```

### Integration Testing
- Test agent selection flow with user preferences
- Verify action state triggers correct UI components
- Ensure schedule editing preserves job data

## Development Best Practices

### State Management
- Use React Context for global state (chat, user preferences)
- Implement proper loading and error states
- Handle wallet connection/disconnection gracefully

### Performance Optimization
- Lazy load heavy components (agents, visualizations)
- Implement virtual scrolling for large message lists
- Cache agent responses when appropriate

### Security Considerations
- Never expose API keys in client-side code
- Validate all user inputs before processing
- Implement rate limiting for API calls
- Sanitize HTML content in messages

## Debugging Tips

### Common Issues
1. **Agent not responding**: Check agent registration in AgentRegistry
2. **Schedule not saving**: Verify wallet connection and database access
3. **Action states not triggering**: Ensure metadata includes requires_action flag
4. **MCP tools failing**: Check server connection and tool availability

### Debug Logging
Enable debug logging with console statements prefixed with component name:
```typescript
console.log('[ComponentName] Debug message', data);
```

## Build and Deployment

### Pre-deployment Checklist
- [ ] Run `pnpm run lint` and fix all warnings
- [ ] Run `pnpm run build` successfully
- [ ] Test all critical user flows
- [ ] Verify environment variables are set
- [ ] Check database migrations are up to date

### Vercel Deployment
The app auto-deploys to Vercel on push to main branch. Environment variables must be configured in Vercel dashboard for production.

## New Orchestration Flow Architecture (2025-09-01)

### Overview of Changes (Commit c9cc0cd)
This commit represents a major architectural upgrade to the orchestration system, introducing non-streaming orchestration, fixing conversation isolation, and implementing comprehensive MCP/A2A integration. The changes enable users to have isolated job conversations with rich orchestration metadata display.

### Critical Bug Fix: Conversation Cross-Contamination
**Problem**: When creating new jobs, ALL messages from localStorage were being loaded into that conversation, causing cross-contamination between different jobs.

**Root Cause**: `loadLocalStorageData()` in `ChatProviderDB.tsx:127-146` was loading ALL conversations from localStorage instead of only the "default" conversation.

**Solution**: Modified to only load the "default" conversation:
```typescript
// BEFORE: Loaded ALL conversations (causing cross-contamination)
Object.entries(data.conversations).forEach(([id, conversation]) => {
  const messages = getMessagesHistory(id);
  dispatch({ type: "SET_MESSAGES", payload: { conversationId: id, messages } });
});

// AFTER: Only load default conversation (isolated conversations)
const messages = getMessagesHistory("default");
dispatch({ type: "SET_MESSAGES", payload: { conversationId: "default", messages } });
```

### New Orchestration API Architecture

#### 1. Non-Streaming Orchestration Endpoint
**File**: `pages/api/v1/chat/orchestrate.ts`
- **Purpose**: Direct orchestration without streaming for more reliable responses
- **Key Features**:
  - Agent initialization with `initializeAgents()`
  - Per-request orchestrator instances via `createOrchestrator(requestId)`
  - Wallet address-aware agent selection
  - Comprehensive error handling with `createSafeErrorResponse()`

```typescript
// Core orchestration flow
const requestOrchestrator = createOrchestrator(chatRequest.requestId);
const [currentAgent, agentResponse] = await requestOrchestrator.runOrchestration(
  chatRequest,
  walletAddress
);
```

#### 2. Database vs LocalStorage Separation
**Critical Architecture Pattern**: The system now has complete separation between logged-in and anonymous users:

**Logged-in Users (Database Flow)**:
```typescript
// ChatProviderDB.tsx:148-330
const walletAddress = getAddress();
if (walletAddress) {
  // Use database + orchestration API directly
  const response = await httpClient.post("/api/v1/chat/orchestrate", {
    prompt: { role: "user", content: messageToSend },
    chatHistory: state.messages[currentConvId] || [],
    conversationId: currentConvId,
    useResearch: true, // Always use orchestration
    walletAddress: walletAddress,
  });
}
```

**Anonymous Users (LocalStorage Flow)**:
```typescript
// ChatProviderDB.tsx:332-406
else {
  // Use localStorage + writeOrchestratedMessage
  const updatedMessages = await writeOrchestratedMessage(
    messageToSend,
    httpClient,
    chainId,
    'temp-address',
    convId,
    true  // Always use orchestration (research mode)
  );
}
```

### 3. Orchestrator Core Engine

#### Agent Selection Intelligence
**File**: `services/agents/orchestrator/index.ts:18-88`

The orchestrator implements sophisticated agent selection:

1. **User-Selected Agents**: If user explicitly selects agents, try those first
2. **LLM-Intelligent Selection**: Uses OpenAI GPT-4o-mini to analyze task and select best agent
3. **User-Specific Context**: Includes MCP tools and A2A agents in selection process
4. **Fallback Logic**: Graceful degradation to default agent if errors occur

```typescript
// LLM-based selection with user context
const selectionResult = await AgentRegistry.selectBestAgentWithLLM(
  request.prompt.content, 
  walletAddress
);
selectedAgent = selectionResult.agent;
agentType = selectionResult.agentType || 'core';
selectionReasoning = selectionResult.reasoning;
```

#### Rich Metadata Generation
The orchestrator generates comprehensive metadata for UI display:
```typescript
const agentResponse: AgentResponse = {
  responseType: ResponseType.SUCCESS,
  content: response.content || 'No response generated',
  metadata: {
    selectedAgent: agentName,
    agentType,
    selectionReasoning,
    availableAgents,
    userSpecificAgents: walletAddress ? true : false,
  },
};
```

### 4. Message Rendering System Overhaul

#### Simplified Custom Message Renderers
**File**: `components/MessageItem/CustomMessageRenderers.tsx`

**Major Change**: Removed ALL agent-specific renderers. Now uses unified orchestration rendering:

```typescript
// SINGLE RENDERER FOR ALL ASSISTANT RESPONSES
{
  check: (message) => 
    message.role === "assistant" &&
    typeof message.content === "string",
  render: (message) => {
    const content = message.content as string;
    const metadata = message.metadata || {};
    
    // Always use CrewResponseMessage for assistant responses
    return (
      <CrewResponseMessage
        content={content}
        metadata={metadata}
      />
    );
  },
}
```

**Benefits**:
- Consistent UI for all agent responses
- Rich orchestration metadata display
- Agent selection reasoning visible to users
- Available agents listing
- Performance metrics (tokens, timing)

### 5. MCP (Model Context Protocol) Integration

#### Database Schema
**File**: `migrations/008-create-mcp-tables.sql`

```sql
CREATE TABLE user_available_tools (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    mcp_server_id VARCHAR(255) NOT NULL,
    tool_name VARCHAR(255) NOT NULL,
    tool_description TEXT,
    tool_schema JSONB,
    is_available BOOLEAN DEFAULT true,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_address, mcp_server_id, tool_name)
);
```

#### User MCP Manager
**File**: `services/mcp/user-mcp-manager.ts`

**Key Features**:
- **Connection Management**: Enable/disable MCP servers with user credentials
- **Health Monitoring**: Track server status and availability
- **Tool Discovery**: Automatically discover available tools from connected servers
- **Credential Security**: Encrypted credential storage via `UserCredentialManager`
- **Client Caching**: Efficient MCP client reuse with `Map<string, MCPClient>`

```typescript
// Enable MCP server with credentials
static async enableMCPServer(request: MCPConnectionRequest): Promise<MCPServerStatus> {
  // Validate credentials, test connection, cache client
  const mcpClient = await this.createMCPClient(serverDef, credentials);
  const tools = await mcpClient.getTools();
  this.mcpClients.set(clientKey, mcpClient);
}
```

### 6. A2A (Agent-to-Agent) Integration

#### Database Schema
**File**: `migrations/009-create-a2a-tables.sql`

```sql
CREATE TABLE user_a2a_agents (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    agent_url VARCHAR(500) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    connection_status VARCHAR(50) DEFAULT 'pending',
    last_ping TIMESTAMP,
    UNIQUE(wallet_address, agent_id)
);
```

#### User A2A Manager
**File**: `services/a2a/user-a2a-manager.ts`

**Key Features**:
- **Agent Connection**: Connect to external A2A agents with endpoint validation
- **Health Monitoring**: Ping agents to verify connectivity
- **Communication**: Message and task exchange between agents
- **Status Tracking**: Real-time connection status monitoring

```typescript
// Connect to external A2A agent
static async connectToA2AAgent(request: A2AConnectionRequest): Promise<A2AAgentStatus> {
  const a2aClient = new A2AClient({
    serverUrl: endpoint,
    agentId: `mysuperagent-${walletAddress}`,
    agentName: 'MySuperAgent'
  });
  const pingResult = await a2aClient.pingAgent(agentCard.id);
}
```

### 7. Enhanced Agent Registry with User Context

#### User-Aware Agent Selection
**File**: `services/agents/core/agent-registry.ts:107-198`

The Agent Registry now supports user-specific agents:

```typescript
async getUserAvailableAgents(walletAddress: string): Promise<Array<{ 
  name: string; 
  description: string; 
  type: 'core' | 'mcp' | 'a2a';
  capabilities?: string[];
  status?: string;
}>> {
  const coreAgents = this.getAvailableAgents().map(agent => ({ ...agent, type: 'core' }));
  
  // Get user's MCP tools
  const mcpTools = await this.getUserMCPTools(walletAddress);
  const mcpAgents = mcpTools.map(tool => ({
    name: `mcp_${tool.name}`,
    description: tool.description || `MCP tool: ${tool.name}`,
    type: 'mcp' as const,
    capabilities: [tool.name]
  }));

  // Get user's A2A agents
  const a2aAgents = await this.getUserA2AAgents(walletAddress);
  const a2aAgentsList = a2aAgents.map(agent => ({
    name: `a2a_${agent.agentId}`,
    description: `A2A Agent: ${agent.agentName}`,
    type: 'a2a' as const,
    capabilities: agent.capabilities,
    status: agent.connectionStatus
  }));

  return [...coreAgents, ...mcpAgents, ...a2aAgentsList];
}
```

#### LLM-Enhanced Agent Selection
**Key Enhancement**: LLM now considers user-specific MCP tools and A2A agents:

```typescript
// Include user-specific agents in LLM selection
if (walletAddress) {
  const userAgents = await this.getUserAvailableAgents(walletAddress);
  agentDescriptions = userAgents
    .filter(agent => !agent.status || agent.status === 'connected')
    .map(agent => ({
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities || []
    }));
}
```

### 8. Job and Conversation Management

#### Database Integration
**File**: `contexts/chat/ChatProviderDB.tsx:72-122`

**Key Changes**:
- **Per-Job Message Loading**: Each job maintains isolated message history
- **Job Status Tracking**: Proper status updates (running → completed/failed)
- **Order Index Management**: Sequential message ordering within jobs
- **Title Generation**: Automatic conversation title generation for new jobs

```typescript
// Load messages for each job and set up state
for (const job of jobs) {
  const messages = await JobsAPI.getMessages(walletAddress, job.id);
  const chatMessages = messages.map(convertMessageToChatMessage);
  
  dispatch({
    type: "SET_MESSAGES",
    payload: { conversationId: job.id, messages: chatMessages },
  });
}
```

#### Message Flow Architecture
1. **User Message**: Optimistically added to UI, saved to database
2. **Job Status Update**: Set to 'running'
3. **Orchestration Call**: Direct call to `/api/v1/chat/orchestrate`
4. **Response Processing**: Extract agent response and metadata
5. **Database Save**: Save assistant message with order_index
6. **Job Completion**: Update status to 'completed' or 'failed'
7. **UI Update**: Add message to state with orchestration metadata

### 9. Database Query Enhancements

#### User Tools Query Fix
**File**: `services/database/db.ts:1165` (resolved merge conflict)

**Issue**: Query was attempting JOIN with non-existent `user_mcp_servers` table
**Solution**: Direct query with server_name mapping to mcp_server_id for interface compatibility

```typescript
static async getUserTools(walletAddress: string): Promise<UserAvailableTool[]> {
  const query = `
    SELECT *, server_name as mcp_server_id
    FROM user_available_tools
    WHERE wallet_address = $1 AND (is_available = TRUE OR enabled = TRUE)
    ORDER BY server_name, tool_name;
  `;
  // Map server_name to mcp_server_id for interface compatibility
}
```

### 10. Error Handling and Resilience

#### Graceful Degradation
- **MCP Connection Failures**: Cache empty results to avoid repeated failures
- **A2A Agent Unavailability**: Filter out disconnected agents from selection
- **Database Errors**: Fallback to localStorage for error resilience
- **Agent Selection Failures**: Always fallback to default agent

#### Comprehensive Error Tracking
```typescript
// In agent registry
try {
  const tools = await UserMCPManager.getUserAvailableTools(walletAddress);
  this.userMCPTools.set(walletAddress, tools);
  return tools;
} catch (error) {
  console.error(`Failed to get MCP tools for user ${walletAddress}:`, error);
  // Cache empty result to avoid repeated failures
  this.userMCPTools.set(walletAddress, []);
  return [];
}
```

### 11. UI Components and User Experience

#### CrewResponseMessage Enhancement
**File**: `components/Agents/Crew/CrewResponseMessage.tsx`

**Enhanced to display**:
- Agent selection reasoning
- Available agents list (core, MCP, A2A)
- Performance metrics (token usage, processing time)
- Agent type indicators (core/mcp/a2a)
- Connection status for user-specific agents

#### Job Management Integration
- **Isolated Conversations**: Each job maintains its own message history
- **Status Indicators**: Visual feedback for job states (running/completed/failed)
- **Message Counter**: Tracks completed jobs instead of processed messages
- **Title Generation**: Automatic generation for better job organization

### 12. Development and Debugging

#### Debug Logging Strategy
Comprehensive logging throughout the orchestration flow:
```typescript
console.log('[AGENT SELECTION DEBUG] Starting LLM-based agent selection');
console.log('[ORCHESTRATOR] Starting runOrchestration for request:', requestId);
console.log('[FINAL RESPONSE DEBUG] Stream complete event data:', event.data);
```

#### Common Issues and Solutions
1. **"No response generated"**: Check orchestrator agent execution and error handling
2. **Cross-contamination**: Verify localStorage loading only loads intended conversation
3. **Tool failures**: Check MCP/A2A connection status and user credentials
4. **Database errors**: Verify table existence and migration completion

### 13. Performance Optimizations

#### Client Caching
- **MCP Clients**: Cached per `${walletAddress}:${serverName}`
- **A2A Clients**: Cached per `${walletAddress}:${agentId}`
- **User Agent Data**: Cached in AgentRegistry to avoid repeated DB queries

#### Lazy Loading
- **Agent Registration**: Non-essential agents loaded on-demand
- **MCP Tools**: Fetched only when needed for agent selection
- **A2A Agents**: Loaded per user as required

### 14. Migration and Database Structure

#### New Tables
1. **user_available_tools**: Stores MCP tools per user with schema and availability
2. **user_a2a_agents**: Stores A2A agent connections with status and capabilities

#### Key Indexes
```sql
-- Efficient wallet-based lookups
CREATE INDEX idx_user_available_tools_wallet ON user_available_tools(wallet_address);
CREATE INDEX idx_user_a2a_agents_wallet ON user_a2a_agents(wallet_address);

-- Status-based filtering
CREATE INDEX idx_user_available_tools_enabled ON user_available_tools(wallet_address, is_available);
CREATE INDEX idx_user_a2a_agents_status ON user_a2a_agents(connection_status);
```

### 15. Analytics and Monitoring

#### Event Tracking
**File**: `services/chat-management/api.ts:74-141`

Comprehensive analytics for orchestration flow:
```typescript
// Track message sent
trackEvent('agent.message_sent', {
  conversationId,
  researchMode: useResearch,
  messageLength: message.length,
});

// Track response received
trackEvent('agent.response_received', {
  conversationId,
  agentName: current_agent,
  hasError: !!agentResponse.error_message,
  requiresAction: !!agentResponse.requires_action,
});
```

### 16. Security Considerations

#### Credential Management
- **Encrypted Storage**: All MCP server credentials encrypted with user master key
- **Scoped Access**: Tools and agents scoped to specific wallet addresses
- **Connection Validation**: Health checks before exposing tools to users

#### Input Validation
```typescript
// Validate required fields in orchestration API
validateRequired(chatRequest, ['prompt'] as (keyof ChatRequest)[]);
if (!chatRequest.prompt?.content) {
  throw new ValidationError('Missing prompt content');
}
```

### 17. Testing Strategy

#### Integration Testing Focus Areas
1. **Conversation Isolation**: Verify each job maintains separate message history
2. **Database/LocalStorage Separation**: Test logged-in vs anonymous user flows
3. **Agent Selection**: Verify LLM selection includes user-specific agents
4. **MCP/A2A Integration**: Test tool availability and agent connectivity
5. **Error Resilience**: Verify graceful degradation when services unavailable

#### Performance Testing
- **Agent Selection Latency**: Monitor LLM selection response times
- **Database Query Performance**: Check message loading efficiency for large histories
- **MCP/A2A Response Times**: Monitor external service integration performance

### 18. Future Enhancement Roadmap

#### Immediate Priorities
1. **Dynamic MCP/A2A Proxies** (`agent-registry.ts:549-557`): Create proxy agents for external tools
2. **Tool Execution Implementation** (`user-mcp-manager.ts`): Implement `callTool` method
3. **Enhanced Agent Selection UX**: Allow explicit agent selection in chat interface

#### Medium-Term Goals
- **Agent Composition**: Multi-agent workflows for complex tasks
- **Tool Chaining**: Sequential tool execution across MCP servers
- **A2A Task Delegation**: Complex task distribution to external agents

### 19. Configuration and Environment

#### Environment Variables
- **MCP Server Endpoints**: Configurable via environment variables
- **Database Connection**: PostgreSQL connection string for user data
- **API Keys**: Secure storage for external service integrations

#### Development Commands (Updated)
```bash
# Test orchestration specifically
curl -X POST http://localhost:3002/api/v1/chat/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"prompt":{"role":"user","content":"test"},"useResearch":true}'

# Database migrations for MCP/A2A
pnpm run db:migrate # Runs migrations 008 and 009
```

## MCP Integration Deep Dive

### Model Context Protocol (MCP) Overview
MCP enables users to connect external tools and services to their agent ecosystem. Each user can have personalized tool availability based on their connected MCP servers.

### MCP Server Registry
**File**: `services/mcp/server-registry.ts`

Centralized registry of available MCP servers with their connection requirements:
```typescript
interface MCPServerDefinition {
  name: string;
  displayName: string;
  description: string;
  endpoint: string;
  requiredCredentials: Array<{
    name: string;
    displayName: string;
    description: string;
    required: boolean;
    type: 'text' | 'password' | 'token';
  }>;
  healthCheckConfig?: {
    timeoutMs: number;
    retryAttempts: number;
  };
}
```

### User Credential Management
**File**: `services/credentials/user-credential-manager.ts`

**Security Model**:
- All credentials encrypted with user-specific master key
- Scoped storage per wallet address and service
- No plain-text credential storage
- Automatic credential rotation support

```typescript
interface UserCredential {
  walletAddress: string;
  serviceType: 'mcp_server' | 'a2a_agent' | 'external_api';
  serviceName: string;
  credentialName: string;
  value: string; // Encrypted
  masterKey: string; // For decryption
}
```

### MCP Tool Discovery Flow
1. **User Connects MCP Server**: Provides credentials via settings UI
2. **Connection Validation**: Test connection and discover available tools
3. **Tool Registration**: Store tools in `user_available_tools` table with JSONB schema
4. **Agent Selection Enhancement**: Tools become available in orchestration selection
5. **Runtime Tool Execution**: MCP clients cached and reused for tool calls

### MCP Health Monitoring
Continuous monitoring ensures tool availability:
```typescript
interface MCPServerStatus {
  serverName: string;
  isEnabled: boolean;
  healthStatus: 'healthy' | 'error' | 'timeout' | 'unknown';
  lastHealthCheck: Date | null;
  availableTools: number;
  connectionConfig: Record<string, any>;
}
```

## A2A Integration Deep Dive

### Agent-to-Agent Communication Protocol
A2A enables MySuperAgent to communicate with external agent networks for distributed task execution.

### A2A Client Architecture
**File**: `services/a2a/a2a-client.ts`

Core communication primitives:
```typescript
interface A2AAgentCard {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  version: string;
  endpoint: string;
}

interface A2AMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  messageType: 'text' | 'task' | 'result' | 'error';
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

### A2A Connection Flow
1. **Agent Discovery**: Find external agents via network discovery or manual entry
2. **Connection Test**: Ping agent to verify availability and capabilities
3. **Registration**: Store agent in `user_a2a_agents` table
4. **Integration**: Agent becomes available in orchestration selection
5. **Communication**: Messages and tasks exchanged via A2A protocol

### A2A Task Delegation
```typescript
interface A2ATask {
  id: string;
  fromAgent: string;
  toAgent: string;
  taskType: string;
  taskData: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  deadline?: Date;
  dependencies?: string[];
}
```

## User Settings and Configuration Coordination

### Settings Architecture
User preferences now coordinate across multiple systems:

#### MCP Server Settings
- **Connection Management**: Enable/disable specific MCP servers
- **Credential Management**: Secure credential storage and updates
- **Tool Preferences**: User can enable/disable specific tools
- **Health Monitoring**: View connection status and diagnostics

#### A2A Agent Settings
- **Agent Discovery**: Browse and connect to external agent networks
- **Connection Management**: Monitor and manage agent connections
- **Capability Mapping**: View capabilities and specializations
- **Communication Preferences**: Configure message routing and priorities

#### Orchestration Preferences
- **Default Behavior**: Choose between intelligent selection vs user control
- **Agent Priorities**: Prefer certain agent types (core/MCP/A2A)
- **Fallback Strategy**: Configure behavior when preferred agents unavailable
- **Performance Monitoring**: Track and optimize selection performance

### Settings-to-Orchestration Coordination
The orchestration system dynamically adapts based on user settings:

1. **Agent Pool Construction**: Orchestrator queries user's available tools and agents
2. **Selection Algorithm**: LLM considers user-specific capabilities in selection
3. **Execution Context**: Tools and agents executed with user credentials
4. **Performance Tracking**: Analytics scoped to user preferences and usage patterns

## Advanced Orchestration Features

### Intelligent Agent Routing
**File**: `services/agents/orchestrator/index.ts:18-88`

The orchestrator implements multi-tier agent selection:

#### Selection Priority Order
1. **Explicit User Selection**: `request.selectedAgents` takes priority
2. **LLM Intelligent Selection**: AI-powered best match analysis
3. **Capability Matching**: Match task requirements to agent capabilities
4. **Fallback Strategy**: Default agent if all else fails

#### User Context Integration
```typescript
// Orchestrator considers user-specific agents
if (walletAddress) {
  const userAgents = await AgentRegistry.getUserAvailableAgents(walletAddress);
  availableAgents = userAgents.map(a => ({ name: a.name, type: a.type }));
} else {
  availableAgents = AgentRegistry.getAvailableAgents().map(a => ({ name: a.name, type: 'core' }));
}
```

### Metadata Enrichment
Every orchestration response includes comprehensive metadata:
```typescript
metadata: {
  selectedAgent: agentName,           // Which agent was chosen
  agentType: 'core' | 'mcp' | 'a2a', // Agent type classification
  selectionReasoning: string,         // Why this agent was selected
  availableAgents: AgentInfo[],       // All agents user has access to
  userSpecificAgents: boolean,        // Whether user has custom agents
  isOrchestration: true,              // Flag for UI rendering
}
```

This metadata enables the `CrewResponseMessage` component to provide rich, informative displays about the orchestration process, giving users insight into how their requests are being handled and what capabilities they have access to.