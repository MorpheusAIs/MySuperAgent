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