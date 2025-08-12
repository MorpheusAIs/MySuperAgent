# Multi-Agent System

A sophisticated multi-agent system built with Mastra framework, featuring specialized agents with custom tools and intelligent orchestration.

## Directory Structure

```
agents/
├── agents/          # Individual agent implementations
│   ├── DefaultAgent.ts     # General purpose assistant
│   ├── ResearchAgent.ts    # Web search and research specialist
│   ├── CodeAgent.ts        # Code analysis and programming helper
│   ├── DataAgent.ts        # Data processing and analysis expert
│   └── MathAgent.ts        # Mathematical calculations and solutions
├── tools/           # Tool implementations and registry
│   ├── web-search.ts       # Web search tool
│   ├── code-analyzer.ts    # Code analysis tool
│   ├── data-processor.ts   # Data processing tool
│   ├── calculation.ts      # Mathematical calculation tool
│   └── index.ts           # Tool registry and categorization
├── core/           # Core agent infrastructure  
│   ├── BaseAgent.ts        # Abstract base class for all agents
│   └── AgentRegistry.ts    # Agent registration and intelligent selection
├── orchestrator/   # Request orchestration and streaming
│   └── index.ts           # Multi-agent orchestrator with streaming
├── schemas/        # Zod validation schemas
│   └── index.ts           # All validation schemas
├── config.ts       # Mastra configuration  
├── types.ts        # TypeScript interfaces
└── README.md       # This file
```

## Available Agents

### 🔍 ResearchAgent (`research`)
- **Tools**: Web search
- **Capabilities**: Information gathering, fact checking, source evaluation
- **Triggers**: "search", "find", "research", "investigate", "information"

### 💻 CodeAgent (`code`) 
- **Tools**: Code analyzer
- **Capabilities**: Code review, bug detection, optimization suggestions
- **Triggers**: "code", "program", "function", "bug", "debug", "syntax"

### 📊 DataAgent (`data`)
- **Tools**: Data processor 
- **Capabilities**: Data analysis, format conversion, statistical insights
- **Triggers**: "data", "analyze", "csv", "json", "statistics", "dataset"

### 🔢 MathAgent (`math`)
- **Tools**: Mathematical calculator
- **Capabilities**: Complex calculations, equation solving, step-by-step solutions
- **Triggers**: "calculate", "math", "equation", "solve", "formula"

### 🤖 DefaultAgent (`default`)
- **Tools**: None (pure LLM)
- **Capabilities**: General conversation, basic assistance
- **Fallback**: Used when no specialized agent matches

## Intelligent Agent Selection

The system automatically selects the most appropriate agent based on:

1. **Explicit Selection**: `@agent_name` commands (e.g., `@research find information about AI`)
2. **Keyword Matching**: Analyzes user input for relevant keywords
3. **Context Awareness**: Considers conversation history and metadata
4. **Fallback Strategy**: Defaults to DefaultAgent if no match found

## Tool System

### Tool Categories
- **Research**: Web search and information gathering
- **Development**: Code analysis and programming assistance  
- **Data**: Data processing and statistical analysis
- **Math**: Mathematical computations and problem solving

### Tool Registry
```typescript
import { toolRegistry, getToolsByCategory } from '@/services/agents/tools';

// Get all research tools
const researchTools = getToolsByCategory('research');

// Get specific tools
const specificTools = getTools(['webSearch', 'calculation']);
```

## Usage Examples

### Basic Chat (Auto-Selection)
```typescript
// System automatically selects MathAgent for math queries
const response = await orchestrator.runOrchestration({
  prompt: { role: 'user', content: 'Calculate 25 * 34 + 156' },
  conversationId: 'chat-123'
});
```

### Explicit Agent Selection
```typescript
// Force use of ResearchAgent
const response = await orchestrator.runOrchestration({
  prompt: { role: 'user', content: 'Find latest AI news' },
  selectedAgents: ['research'],
  conversationId: 'chat-123'
});
```

### Streaming with Tools
```typescript
// Stream responses with real-time tool execution
await orchestrator.streamOrchestration(request, (res) => {
  // Handle streaming events: tool_call, tool_result, text chunks
});
```

## Agent Development

### Creating New Agents
1. Extend `BaseAgent` class
2. Define specialized instructions
3. Assign relevant tools from registry
4. Register in `AgentRegistry.initialize()`

### Creating New Tools
1. Use `createTool()` from Mastra
2. Define input/output schemas with Zod
3. Implement execution logic
4. Add to tool registry and categories

## API Integration

The multi-agent system integrates with:
- `/api/v1/chat` - Regular chat with intelligent agent selection
- `/api/v1/chat/stream` - Streaming chat with real-time tool execution
- Agent selection metadata included in all responses