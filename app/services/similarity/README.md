# TF-IDF Similarity Service

This service implements TF-IDF (Term Frequency-Inverse Document Frequency) similarity checking to prevent repetitive responses in the chat system and provide better context by learning from previous interactions.

## Overview

The similarity service works by:

1. **Analyzing User Prompts**: When a user sends a new prompt, the system analyzes it using TF-IDF to extract meaningful terms
2. **Finding Similar Prompts**: It searches through the user's message history to find prompts with similar content
3. **Context Injection**: If similar prompts are found, their context (prompt + response) is injected into the new request to help the AI provide more varied and informed responses
4. **Preventing Repetition**: The system can detect when prompts are too similar and help avoid giving the same response

## Components

### 1. TFIDFSimilarityService (`tf-idf-similarity.ts`)

Core service that handles:
- TF-IDF vector calculation
- Cosine similarity computation
- Text preprocessing and tokenization
- Stop word filtering
- Similarity threshold management

### 2. ChatSimilarityService (`chat-similarity-service.ts`)

High-level service that integrates similarity checking into the chat flow:
- Processes chat requests with similarity analysis
- Manages user preferences and configuration
- Provides statistics and analytics
- Handles context injection

### 3. Database Integration

New database methods for retrieving user message history:
- `getMessagesForSimilarity()` - Get messages with filtering options
- `getRecentMessagesForUser()` - Get recent messages for a user
- `getAllMessagesForUser()` - Get all messages for a user

## Configuration

### Default Settings

```typescript
{
  enabled: true,
  similarityThreshold: 0.7,        // Minimum similarity score (0-1)
  maxSimilarPrompts: 3,            // Max similar prompts to include
  minPromptLength: 10,             // Minimum prompt length to analyze
  maxHistoryDays: 30,              // How far back to look for similar prompts
  excludeCurrentJob: true,         // Exclude current conversation from search
  contextInjectionEnabled: true    // Whether to inject context into responses
}
```

### User Preferences

Users can customize their similarity settings through the API:

```typescript
// GET /api/v1/similarity/config?walletAddress=<address>
{
  "config": {
    "enabled": true,
    "similarityThreshold": 0.7,
    "maxSimilarPrompts": 3,
    "contextInjectionEnabled": true
  }
}

// POST /api/v1/similarity/config
{
  "config": {
    "enabled": false,
    "similarityThreshold": 0.8
  }
}
```

## API Endpoints

### Configuration
- `GET /api/v1/similarity/config` - Get user's similarity configuration
- `POST /api/v1/similarity/config` - Update user's similarity configuration

### Statistics
- `GET /api/v1/similarity/stats` - Get user's similarity statistics

## How It Works

### 1. Prompt Processing

When a user sends a new prompt:

```typescript
const enhancedRequest = await chatSimilarityService.processChatRequest(
  chatRequest,
  walletAddress
);
```

### 2. Similarity Detection

The service:
1. Extracts and tokenizes the current prompt
2. Retrieves user's message history (last 30 days by default)
3. Calculates TF-IDF vectors for all prompts
4. Computes cosine similarity between current and historical prompts
5. Identifies prompts above the similarity threshold

### 3. Context Injection

If similar prompts are found, their context is injected:

```
CONTEXT FROM SIMILAR PREVIOUS INTERACTIONS:
Similar prompt 1 (85% similar):
Previous: "How do I create a React component?"
Response: "You can create a React component using..."
---
Similar prompt 2 (78% similar):
Previous: "What's the best way to structure React components?"
Response: "For React component structure, I recommend..."
---

Please avoid repeating the same response and build upon the previous context appropriately.
```

### 4. Response Enhancement

The final response includes metadata about similarity detection:

```typescript
{
  "response": {
    "content": "...",
    "metadata": {
      "similarityDetection": {
        "similarPromptsFound": 2,
        "highestSimilarity": 0.85,
        "similarPromptIds": ["msg1", "msg2"]
      }
    }
  }
}
```

## Database Schema

### User Preferences (New Fields)

```sql
ALTER TABLE user_preferences 
ADD COLUMN similarity_enabled BOOLEAN DEFAULT true,
ADD COLUMN similarity_threshold DECIMAL(3,2) DEFAULT 0.70,
ADD COLUMN max_similar_prompts INTEGER DEFAULT 3,
ADD COLUMN similarity_context_enabled BOOLEAN DEFAULT true;
```

## Usage Examples

### Basic Integration

```typescript
import { defaultChatSimilarityService } from '@/services/similarity/chat-similarity-service';

// Process a chat request
const enhancedRequest = await defaultChatSimilarityService.processChatRequest(
  originalRequest,
  walletAddress
);

// The enhanced request now includes similarity context
console.log(enhancedRequest.similarityContext);
```

### Custom Configuration

```typescript
import { ChatSimilarityService } from '@/services/similarity/chat-similarity-service';

const customService = new ChatSimilarityService({
  similarityThreshold: 0.8,
  maxSimilarPrompts: 5,
  enabled: true
});
```

### Statistics

```typescript
const stats = await chatSimilarityService.getUserSimilarityStats(walletAddress);
console.log(`User has ${stats.totalMessages} messages`);
console.log(`Average similarity: ${stats.averageSimilarity}`);
```

## Performance Considerations

- **Memory Usage**: TF-IDF vectors are calculated in memory for each request
- **Database Queries**: Message history is retrieved from database for each similarity check
- **Processing Time**: Similarity calculation adds ~100-500ms to request processing
- **Caching**: Consider implementing caching for frequently accessed user histories

## Monitoring

The service logs similarity detection events:

```
[ChatSimilarity] Found 2 similar prompts for user 0x123...
[ChatSimilarity] Similar 1: 85% - "How do I create a React component..."
[ChatSimilarity] Similar 2: 78% - "What's the best way to structure..."
```

## Future Enhancements

1. **Semantic Similarity**: Integrate with embeddings for better semantic understanding
2. **Caching**: Implement Redis caching for similarity vectors
3. **Machine Learning**: Use ML models for more sophisticated similarity detection
4. **Real-time Analytics**: Dashboard for monitoring similarity patterns
5. **A/B Testing**: Test different similarity thresholds for optimal user experience
