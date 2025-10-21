# Scheduling System Fix - Self-Awareness & Repetition Prevention

## Problem

The AI was generating the same joke (or other repeated content) on every scheduled run, despite implementing multi-item optimization. The system wasn't aware it was a scheduling platform and kept repeating itself.

## Root Causes

### 1. **Orchestrator Not Passing scheduledJobContext**
The orchestrator was only passing `prompt` and `conversationId` to agents, dropping critical fields like `scheduledJobContext`, `chatHistory`, and `similarPrompts`.

**Location:** `app/services/agents/orchestrator/index.ts`

**Before:**
```typescript
response = await selectedAgent.chat({
  prompt: request.prompt,
  conversationId: request.conversationId || 'default',
});
```

**After:**
```typescript
response = await selectedAgent.chat({
  prompt: request.prompt,
  conversationId: request.conversationId || 'default',
  chatHistory: request.chatHistory,
  similarityContext: request.similarityContext,
  similarPrompts: request.similarPrompts,
  scheduledJobContext: request.scheduledJobContext, // CRITICAL FIX
  requestId: request.requestId,
  useResearch: request.useResearch,
  selectedAgents: request.selectedAgents,
});
```

### 2. **Weak Self-Awareness Context**
The system message wasn't forceful enough about FreeAI being a scheduling platform.

**Location:** `app/services/agents/core/self-awareness-context.ts`

**Changes:**
- Changed identity from "helpful AI assistant" to **"SCHEDULING-FIRST AI platform"**
- Added explicit warnings: "YOU MUST NEVER REPEAT YOURSELF"
- Emphasized: "You are NOT a one-time chat assistant"
- Made rules more forceful: "FAILURE TO FOLLOW = SYSTEM FAILURE"

### 3. **Instructions Only in System Message**
The scheduling context was only in the system message, not in the actual user prompt where the LLM pays more attention.

**Location:** `app/services/agents/core/base-agent.ts`

**Added:** Direct injection into user prompt content:

For **first runs**:
```
🚨 CRITICAL SCHEDULING CONTEXT 🚨

This is a daily SCHEDULED JOB. This prompt will run repeatedly daily.

YOU MUST PREVENT REPETITION. If this is a request for repeated content:
1. Generate 50-100 DIFFERENT items NOW
2. Format as JSON: {"current_item": "...", "future_items": [...]}
3. We will automatically serve one item per scheduled run

DO NOT generate just one response - it will repeat every daily!
```

For **subsequent runs**:
```
🚨 SCHEDULED JOB RUN #2 🚨

This is a daily scheduled job. You have ALREADY responded to this 1 time(s) before.

⚠️  DO NOT REPEAT previous responses. Generate COMPLETELY NEW content.
```

## Complete Fix Summary

### Files Modified

1. **`app/services/agents/orchestrator/index.ts`**
   - ✅ Pass all ChatRequest fields to agents (2 locations: regular + streaming fallback)
   - ✅ Preserve scheduledJobContext through orchestration layer

2. **`app/services/agents/core/base-agent.ts`**
   - ✅ Inject scheduling instructions directly into user prompt content
   - ✅ Different messages for first run vs subsequent runs
   - ✅ Make instructions HIGHLY visible with emojis and warnings

3. **`app/services/agents/core/self-awareness-context.ts`**
   - ✅ Redefine FreeAI as "SCHEDULING-FIRST AI platform"
   - ✅ Add forceful language about preventing repetition
   - ✅ Emphasize batch generation as mandatory for first runs
   - ✅ Stronger scheduled job context messages

## How It Works Now

### First Run of Scheduled Job

1. Job processor creates `scheduledJobContext`:
   ```typescript
   {
     isScheduled: true,
     isFirstRun: true,
     runCount: 0,
     scheduleType: 'daily',
     parentJobId: 'abc-123'
   }
   ```

2. Orchestrator **PASSES IT THROUGH** to agent (this was broken before!)

3. BaseAgent receives it and:
   - Adds scheduling-focused system message
   - Adds scheduled job context to system message
   - **Injects critical instructions directly into user prompt**

4. LLM sees:
   - System message: "You are a SCHEDULING-FIRST AI platform"
   - Scheduled context: "FIRST RUN - Generate 50-100 items"
   - User prompt: "🚨 CRITICAL SCHEDULING CONTEXT 🚨 [instructions]... Tell me a joke"

5. LLM should generate multi-item response:
   ```json
   {
     "current_item": "Joke #1",
     "future_items": ["Joke #2", "Joke #3", ..., "Joke #50"],
     "item_type": "joke"
   }
   ```

6. Job processor extracts current_item and stores future_items

### Subsequent Runs

1. Job processor checks for stored items
2. If found: delivers next item WITHOUT calling LLM
3. If not found: 
   - Passes `isFirstRun: false` in scheduledJobContext
   - LLM sees: "⚠️ You have ALREADY responded before. DO NOT REPEAT"
   - Generates new, unique content

## Testing

### Test 1: Create New Daily Joke

1. Create a daily scheduled job: "Tell me a joke"
2. Wait for first run
3. Check logs for: `[BaseAgent] Added scheduling instructions to user prompt - First run: true`
4. Check response - should see multi-item JSON in backend logs
5. User should see only ONE joke (current_item)
6. Check parent job metadata for stored items

### Test 2: Subsequent Run Delivers Different Content

1. Wait for next day's scheduled run
2. Check logs for: `[JOB PROCESSOR] Found stored multi-item data`
3. Check logs for: `[JOB PROCESSOR] Using stored item 2/50`
4. Verify user sees DIFFERENT joke
5. No LLM API call should be made

### Test 3: Exhaustion Fallback

1. Let all 50 items be delivered (or manually set index = 50)
2. Next run should call LLM again
3. Check logs for: `[BaseAgent] Added scheduling instructions` (meaning LLM called)
4. Should see "RUN #51" in injected prompt

### Console Log Validation

Look for these logs to confirm it's working:

```
[JOB PROCESSOR] Prepared scheduled job context - First run: true
[Orchestrator] Selected agent: default via llm_primary
[BaseAgent] Added scheduling instructions to user prompt - First run: true
[BaseAgent] Total messages: 2
[BaseAgent] Message 1 (system): Content: # FreeAI Context (YOU ARE A SCHEDULING-BASED LLM SYSTEM)...
[BaseAgent] Message 2 (user): Content: 🚨 CRITICAL SCHEDULING CONTEXT 🚨...
[JOB PROCESSOR] Detected multi-item response with 50 future items
[JOB PROCESSOR] Stored 50 future items in parent job metadata
```

Next run:
```
[JOB PROCESSOR] Found stored multi-item data for job xxx, 49 items remaining
[JOB PROCESSOR] Using stored item 2/50, hasMore: true
[JOB PROCESSOR] Using pre-generated content for job xxx
[JOB PROCESSOR] Job xxx completed using stored item
```

## Why This Fix Works

1. **Context Actually Reaches the AI**: Fixed orchestrator to pass scheduledJobContext
2. **AI Knows Its Identity**: System message establishes it's a scheduling platform
3. **AI Sees Scheduling Instructions**: User prompt has highly visible warnings
4. **First Run Optimization**: Clear instructions to generate batch items
5. **Subsequent Run Awareness**: Explicit warnings not to repeat
6. **Efficient Delivery**: Stored items served without LLM calls

## Expected Behavior

✅ **First run**: AI generates 50-100 items, user sees one
✅ **Runs 2-50**: Pre-generated items delivered instantly
✅ **Run 51+**: AI called again, generates new batch
✅ **All runs**: Different content every time
✅ **Self-awareness**: AI understands scheduling when asked

## Debugging

If still repeating:

1. **Check orchestrator logs**: Is scheduledJobContext being passed?
   ```
   Search logs for: "scheduledJobContext"
   ```

2. **Check base-agent logs**: Are scheduling instructions being added?
   ```
   Search logs for: "Added scheduling instructions to user prompt"
   ```

3. **Check message content**: Is the warning actually in the prompt?
   ```
   Search logs for: "CRITICAL SCHEDULING CONTEXT"
   ```

4. **Check multi-item detection**: Is JSON being parsed?
   ```
   Search logs for: "Detected multi-item response"
   ```

5. **Check storage**: Are items being saved?
   ```
   Query: SELECT metadata->'multi_item_storage' FROM jobs WHERE id = 'parent_job_id';
   ```

## Migration Required

Run the metadata migration:
```bash
npm run migrate:up -- 017-add-jobs-metadata.sql
```

Or manually:
```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_jobs_metadata ON jobs USING gin (metadata);
```

## Rollback Plan

If issues occur, you can disable the scheduling context injection:

1. Comment out in `base-agent.ts`:
   ```typescript
   // if (request.scheduledJobContext?.isScheduled) {
   //   ... all the injection code ...
   // }
   ```

2. Revert orchestrator changes (but this will break other features)

## Performance Impact

- **Positive**: 98% reduction in LLM calls for repeated content
- **Positive**: Instant delivery of pre-generated items
- **Neutral**: Slightly longer first run (generates 50-100 items vs 1)
- **Neutral**: ~5-10KB metadata storage per parent job

