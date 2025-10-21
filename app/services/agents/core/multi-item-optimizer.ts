/**
 * Multi-Item Optimizer for Scheduled Jobs
 *
 * Handles intelligent batch generation and sequential delivery
 * for repeated scheduled tasks (e.g., daily jokes, quotes, facts)
 */

export interface MultiItemResponse {
  current_item: string;
  future_items: string[];
  item_type: 'joke' | 'quote' | 'fact' | 'summary' | 'tip' | 'news' | 'other';
  metadata?: Record<string, any>;
}

export interface StoredMultiItemData {
  items: string[];
  item_type: string;
  current_index: number;
  total_items: number;
  created_at: Date;
  last_delivered_at: Date;
  metadata?: Record<string, any>;
}

/**
 * Parse a response to check if it contains multi-item data
 */
export function parseMultiItemResponse(
  content: string
): MultiItemResponse | null {
  try {
    console.log(
      '[MULTI-ITEM] Attempting to parse content:',
      content.substring(0, 200) + '...'
    );

    // Try to find JSON in the response
    const jsonMatch = content.match(
      /\{[\s\S]*"current_item"[\s\S]*"future_items"[\s\S]*\}/
    );

    if (!jsonMatch) {
      console.log('[MULTI-ITEM] No JSON pattern found in content');
      return null;
    }

    console.log(
      '[MULTI-ITEM] Found JSON match:',
      jsonMatch[0].substring(0, 200) + '...'
    );

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!parsed.current_item || !Array.isArray(parsed.future_items)) {
      console.log(
        '[MULTI-ITEM] Invalid structure - missing current_item or future_items'
      );
      return null;
    }

    console.log(
      `[MULTI-ITEM] Successfully parsed - current_item: "${parsed.current_item}", future_items count: ${parsed.future_items.length}`
    );

    return {
      current_item: parsed.current_item,
      future_items: parsed.future_items,
      item_type: parsed.item_type || 'other',
      metadata: parsed.metadata,
    };
  } catch (error) {
    console.log('[MULTI-ITEM] Failed to parse multi-item response:', error);
    return null;
  }
}

/**
 * Extract the current item from a multi-item response for user display
 */
export function extractCurrentItem(
  multiItemResponse: MultiItemResponse
): string {
  return multiItemResponse.current_item;
}

/**
 * Store multi-item data in job metadata
 */
export function createMultiItemStorage(
  multiItemResponse: MultiItemResponse
): StoredMultiItemData {
  return {
    items: multiItemResponse.future_items,
    item_type: multiItemResponse.item_type,
    current_index: 0,
    total_items: multiItemResponse.future_items.length,
    created_at: new Date(),
    last_delivered_at: new Date(),
    metadata: multiItemResponse.metadata,
  };
}

/**
 * Get the next item from stored multi-item data
 */
export function getNextItem(storage: StoredMultiItemData): {
  item: string;
  hasMore: boolean;
  updatedStorage: StoredMultiItemData;
} {
  const { items, current_index } = storage;

  if (current_index >= items.length) {
    // No more items
    return {
      item: '',
      hasMore: false,
      updatedStorage: storage,
    };
  }

  const item = items[current_index];
  const updatedStorage: StoredMultiItemData = {
    ...storage,
    current_index: current_index + 1,
    last_delivered_at: new Date(),
  };

  return {
    item,
    hasMore: current_index + 1 < items.length,
    updatedStorage,
  };
}

/**
 * Check if stored multi-item data is still valid
 */
export function isMultiItemStorageValid(
  storage: any
): storage is StoredMultiItemData {
  return (
    storage &&
    typeof storage === 'object' &&
    Array.isArray(storage.items) &&
    typeof storage.current_index === 'number' &&
    storage.current_index >= 0 &&
    storage.items.length > 0
  );
}

/**
 * Format a scheduled job prompt to encourage multi-item generation
 */
export function formatScheduledJobPrompt(
  originalPrompt: string,
  scheduleType: string,
  isFirstRun: boolean
): string {
  if (!isFirstRun) {
    return originalPrompt; // Don't modify subsequent runs
  }

  // Detect if this is a repeated content request (jokes, quotes, facts, etc.)
  const repeatedContentPatterns = [
    /joke/i,
    /quote/i,
    /fact/i,
    /tip/i,
    /affirmation/i,
    /wisdom/i,
    /trivia/i,
    /riddle/i,
  ];

  const isRepeatedContent = repeatedContentPatterns.some((pattern) =>
    pattern.test(originalPrompt)
  );

  if (!isRepeatedContent) {
    return originalPrompt;
  }

  // Suggest batch generation for efficiency
  const batchSuggestion = `
  
🎯 OPTIMIZATION OPPORTUNITY: This is a ${scheduleType} scheduled job for repeated content.

Instead of generating one item per run, consider generating MULTIPLE items now to ensure variety:
- Generate 30-100 items upfront
- Each run will automatically deliver the next item
- Prevents repetition and ensures fresh content

If you want to do this, format your response as JSON:
{
  "current_item": "The ${getItemType(originalPrompt)} for this run",
  "future_items": ["item 1", "item 2", ... up to 100 items],
  "item_type": "${getItemType(originalPrompt)}"
}

Original request: ${originalPrompt}`;

  return batchSuggestion;
}

function getItemType(prompt: string): string {
  if (/joke/i.test(prompt)) return 'joke';
  if (/quote/i.test(prompt)) return 'quote';
  if (/fact/i.test(prompt)) return 'fact';
  if (/tip/i.test(prompt)) return 'tip';
  if (/affirmation/i.test(prompt)) return 'affirmation';
  return 'item';
}

/**
 * Generate context message about multi-item optimization for the AI
 */
export function getMultiItemOptimizationContext(
  isScheduled: boolean,
  isFirstRun: boolean,
  scheduleType: string,
  hasStoredItems: boolean,
  itemsRemaining?: number
): string {
  if (!isScheduled) {
    return '';
  }

  if (isFirstRun) {
    return `
## 🎯 SCHEDULED JOB OPTIMIZATION

This is the FIRST RUN of a ${scheduleType} scheduled job.

For maximum efficiency and user value, consider generating MULTIPLE items at once:
- **Why?** Prevents repetition, ensures variety, saves compute
- **How many?** Generate 30-100 items (jokes, quotes, facts, etc.)
- **Format:** Use JSON structure with "current_item" and "future_items"

This way, each scheduled run delivers fresh content without re-running the same prompt!
`;
  }

  if (hasStoredItems && itemsRemaining) {
    return `
## 📦 Using Pre-Generated Content

This scheduled job has ${itemsRemaining} pre-generated items remaining.
The next item will be automatically delivered from the batch.
`;
  }

  return '';
}
