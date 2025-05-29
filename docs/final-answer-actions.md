# Final Answer Actions

## Overview

Final Answer Actions is a feature that enables the orchestration flow to identify potential actionable items from agent responses and present them to users as interactive UI elements. This allows users to take specific actions directly from the chat interface based on the agents' recommendations.

The feature bridges the gap between information delivery and action execution, creating a more seamless user experience where suggestions from the AI can be directly implemented with minimal effort.

## How Orchestration Flow Identifies Potential Actions

The orchestration flow analyzes the final answer and subtask outputs during the synthesis phase to identify potential actions. This process occurs in the `_extract_final_answer_actions()` method of the `OrchestrationFlow` class.

### Action Detection Process

1. After generating the final synthesized answer, the system uses an LLM to analyze both the user request and the final answer
2. An efficient model (gemini-1.5-flash) evaluates the content using a structured prompt designed to identify possible actions
3. The prompt specifically looks for action opportunities like creating tweets, swapping tokens, transferring assets, generating images, or performing analyses
4. The LLM responds with structured JSON containing detected actions and their metadata
5. The system parses this JSON and creates strongly-typed `FinalAnswerAction` objects
6. These actions are attached to the orchestration state and emitted as events to the frontend

### Action Detection Prompt

The action detection prompt instructs the model to:
- Analyze the user request and final answer to identify specific actions
- Return structured JSON for any identified actions
- Consider only supported action types (tweet, swap, transfer, image_generation, analysis)

## Structure of FinalAnswerAction and Metadata

Final Answer Actions use a structured, extensible system of models to represent different action types.

### Base Structure

```typescript
// Action type enumeration
enum FinalAnswerActionType {
  TWEET = "tweet",
  SWAP = "swap",
  TRANSFER = "transfer",
  IMAGE_GENERATION = "image_generation",
  ANALYSIS = "analysis"
}

// Base action model
interface FinalAnswerAction {
  action_type: FinalAnswerActionType;
  metadata: FinalAnswerActionMetadata;
  description?: string; // Human-readable description
}

// Base metadata shared by all actions
interface FinalAnswerActionBaseMetadata {
  agent: string;           // Agent responsible for executing the action
  action_id?: string;      // Unique identifier
  timestamp?: number;      // Creation timestamp
}
```

### Action-Specific Metadata

Each action type has specialized metadata that extends the base metadata:

#### Tweet Action
```typescript
interface TweetActionMetadata extends FinalAnswerActionBaseMetadata {
  content: string;         // Tweet content
  hashtags?: string[];     // Optional hashtags to include
  image_url?: string;      // Optional image URL to attach
}
```

#### Swap Action
```typescript
interface SwapActionMetadata extends FinalAnswerActionBaseMetadata {
  from_token: string;      // Token to swap from
  to_token: string;        // Token to swap to
  amount: string;          // Amount to swap
  slippage?: number;       // Optional slippage tolerance
}
```

#### Transfer Action
```typescript
interface TransferActionMetadata extends FinalAnswerActionBaseMetadata {
  token: string;           // Token to transfer
  to_address: string;      // Recipient address
  amount: string;          // Amount to transfer
}
```

#### Image Generation Action
```typescript
interface ImageGenerationActionMetadata extends FinalAnswerActionBaseMetadata {
  prompt: string;          // Image generation prompt
  negative_prompt?: string; // Optional negative prompt
  style?: string;          // Optional style parameter
}
```

#### Analysis Action
```typescript
interface AnalysisActionMetadata extends FinalAnswerActionBaseMetadata {
  type: string;            // Analysis type (e.g., "token", "wallet")
  subject: string;         // Subject to analyze
  parameters?: Record<string, any>; // Additional parameters
}
```

## Transmitting Actions to the Frontend

Actions are transmitted to the frontend through server-sent events (SSE) as part of the streaming response mechanism.

### Event Types

The progress listener emits several events related to final answer actions:

1. `synthesis_complete` - Includes both the final answer and any final answer actions
2. `final_answer_actions` - Dedicated event specifically for the actions
3. `stream_complete` - Final event that also includes any actions

### Event Format

Actions are serialized to JSON using the `dict()` method of the Pydantic models before transmission:

```python
# Example of emitting final answer actions event
async def emit_final_answer_actions(request_id: str, final_answer_actions: List[FinalAnswerAction]):
    if request_id:
        queue = get_or_create_queue(request_id)
        actions_data = [action.dict() for action in final_answer_actions]
        await queue.put({
            "type": "final_answer_actions",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "actions": actions_data,
                "message": f"Identified {len(final_answer_actions)} action(s) to perform"
            },
        })
```

## Frontend Rendering and Handling

The frontend renders actions as interactive UI elements through dedicated components.

### Component Hierarchy

1. `CrewResponseMessage` - Main message component that includes the response content and metadata
2. `FinalAnswerActions` - Renders a collection of action buttons based on available actions
3. `ActionConfirmationModal` - Provides confirmation UI before executing an action

### Rendering Process

1. The `CrewResponseMessage` component receives metadata that includes `final_answer_actions`
2. If actions are present, they're rendered in a highlighted section below the main response
3. Each action is displayed as a button with an appropriate icon and label
4. Buttons trigger confirmation modals showing action-specific details
5. Upon confirmation, the action is executed via an API call to the appropriate agent

### Action Execution

When a user clicks an action button:
1. A confirmation dialog shows action-specific details
2. On confirmation, the `handleActionExecute` function is called
3. This function makes an API call to the appropriate agent endpoint
4. Success or failure is communicated to the user via toast notifications

## Adding New Action Types

To add a new action type to the system, follow these steps:

### 1. Update Orchestration State Models

Add the new action type to the `FinalAnswerActionType` enum and create a specialized metadata class:

```python
# In orchestration_state.py
class FinalAnswerActionType(str, Enum):
    TWEET = "tweet"
    SWAP = "swap"
    # ... existing types
    NEW_ACTION = "new_action"  # Add your new action type

class NewActionMetadata(FinalAnswerActionBaseMetadata):
    # Add required fields for your action
    field1: str
    field2: Optional[str] = None
    
# Update the Union type for all action metadata types
FinalAnswerActionMetadata = Union[
    TweetActionMetadata,
    # ... existing types
    NewActionMetadata  # Add your new metadata type
]

# Add to supported actions list
SUPPORTED_FINAL_ANSWER_ACTIONS.append({
    "type": FinalAnswerActionType.NEW_ACTION,
    "name": "New Action",
    "description": "Description of your new action",
    "agent": "agent_responsible",
})
```

### 2. Update Action Detection in Orchestration Flow

Add handling for the new action type in the `_extract_final_answer_actions` method:

```python
# In orchestration_flow.py - _extract_final_answer_actions method
if action_type == FinalAnswerActionType.NEW_ACTION:
    # For new action type
    metadata = NewActionMetadata(
        agent="responsible_agent",
        action_id=str(uuid.uuid4()),
        timestamp=timestamp,
        field1=metadata_dict.get("field1", ""),
        field2=metadata_dict.get("field2")
    )
    
    final_action = FinalAnswerAction(
        action_type=FinalAnswerActionType.NEW_ACTION,
        metadata=metadata,
        description=description
    )
    
    self.state.final_answer_actions.append(final_action)
```

### 3. Update Frontend Types

Add the new action type to the frontend TypeScript definitions:

```typescript
// In FinalAnswerAction.types.ts
export enum FinalAnswerActionType {
  // ... existing types
  NEW_ACTION = "new_action",
}

export interface NewActionMetadata extends FinalAnswerActionBaseMetadata {
  field1: string;
  field2?: string;
}

// Update union type
export type FinalAnswerActionMetadata =
  | TweetActionMetadata
  | // ... existing types
  | NewActionMetadata;

// Add to supported actions list
export const SUPPORTED_FINAL_ANSWER_ACTIONS = [
  // ... existing items
  {
    type: FinalAnswerActionType.NEW_ACTION,
    name: "New Action",
    description: "Description of your new action",
    agent: "agent_responsible",
  },
];
```

### 4. Update Action Rendering in Frontend

Modify the `FinalAnswerActions` component to handle your new action type:

```typescript
// In FinalAnswerActions.tsx - Update getActionIcon
const getActionIcon = (actionType: FinalAnswerActionType) => {
  switch (actionType) {
    // ... existing cases
    case FinalAnswerActionType.NEW_ACTION:
      return YourIconComponent;
    default:
      return null;
  }
};

// Update getActionColorScheme
const getActionColorScheme = (actionType: FinalAnswerActionType) => {
  switch (actionType) {
    // ... existing cases
    case FinalAnswerActionType.NEW_ACTION:
      return "yourColor";
    default:
      return "blue";
  }
};

// Update ActionConfirmationModal - getActionContent
const getActionContent = () => {
  switch (action.action_type) {
    // ... existing cases
    case FinalAnswerActionType.NEW_ACTION:
      const { field1, field2 } = action.metadata;
      return (
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <Text>Field 1:</Text>
            <Text fontWeight="bold">{field1}</Text>
          </HStack>
          {field2 && (
            <HStack justify="space-between">
              <Text>Field 2:</Text>
              <Text fontWeight="bold">{field2}</Text>
            </HStack>
          )}
        </VStack>
      );
    default:
      return <Text>Are you sure you want to execute this action?</Text>;
  }
};
```

### 5. Implement Action Execution

Create an execution endpoint in the appropriate agent to handle the new action type. The specific implementation will depend on the action's functionality.

## Examples of Different Action Types

### Tweet Action

```json
{
  "action_type": "tweet",
  "description": "Share this analysis on Twitter",
  "metadata": {
    "agent": "tweet_sizzler",
    "action_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": 1624539871,
    "content": "Just analyzed $ETH price movements and found a bullish pattern forming! #Ethereum #Crypto",
    "hashtags": ["Ethereum", "Crypto"],
    "image_url": null
  }
}
```

### Token Swap Action

```json
{
  "action_type": "swap",
  "description": "Swap ETH for USDC at current market rate",
  "metadata": {
    "agent": "token_swap",
    "action_id": "550e8400-e29b-41d4-a716-446655440001",
    "timestamp": 1624539872,
    "from_token": "ETH",
    "to_token": "USDC",
    "amount": "0.5",
    "slippage": 0.5
  }
}
```

### Token Transfer Action

```json
{
  "action_type": "transfer",
  "description": "Send USDC to specified address",
  "metadata": {
    "agent": "token_swap",
    "action_id": "550e8400-e29b-41d4-a716-446655440002",
    "timestamp": 1624539873,
    "token": "USDC",
    "to_address": "0x1234567890abcdef1234567890abcdef12345678",
    "amount": "100"
  }
}
```

### Image Generation Action

```json
{
  "action_type": "image_generation",
  "description": "Generate an image of a futuristic blockchain city",
  "metadata": {
    "agent": "imagen",
    "action_id": "550e8400-e29b-41d4-a716-446655440003",
    "timestamp": 1624539874,
    "prompt": "A futuristic cityscape with blockchain technology integrated into the architecture, glowing blue nodes connecting buildings",
    "negative_prompt": "blurry, low quality, distorted",
    "style": "realistic"
  }
}
```

### Analysis Action

```json
{
  "action_type": "analysis",
  "description": "Analyze this wallet's transaction history",
  "metadata": {
    "agent": "codex",
    "action_id": "550e8400-e29b-41d4-a716-446655440004",
    "timestamp": 1624539875,
    "type": "wallet",
    "subject": "0x1234567890abcdef1234567890abcdef12345678",
    "parameters": {
      "time_range": "30d",
      "include_tokens": true,
      "include_nfts": false
    }
  }
}
```

These examples illustrate how different action types are structured and can be used to enable a variety of interactive capabilities directly from the agent's responses.