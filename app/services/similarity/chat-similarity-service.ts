/**
 * Chat Similarity Service
 *
 * This service integrates TF-IDF similarity checking into the chat flow
 * to prevent repetitive responses and provide better context.
 */

import { AgentResponse, ChatRequest } from '@/services/agents/types';
import { MessageDB } from '@/services/database/db';
import { SimilarPrompt, TFIDFSimilarityService } from './tf-idf-similarity';

export interface ChatSimilarityConfig {
  enabled: boolean;
  similarityThreshold: number;
  maxSimilarPrompts: number;
  minPromptLength: number;
  maxHistoryDays: number;
  excludeCurrentJob: boolean;
  contextInjectionEnabled: boolean;
}

export interface EnhancedChatRequest extends ChatRequest {
  similarityContext?: string;
  similarPrompts?: SimilarPrompt[];
}

export class ChatSimilarityService {
  private similarityService: TFIDFSimilarityService;
  private config: ChatSimilarityConfig;
  private messageCache: Map<string, { messages: any[]; timestamp: number }> =
    new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(config: Partial<ChatSimilarityConfig> = {}) {
    this.config = {
      enabled: true, // Re-enabled with better error handling
      similarityThreshold: 0.5, // Lowered threshold to catch more similar content
      maxSimilarPrompts: 3, // Increased to get more context
      minPromptLength: 8, // Lowered to catch shorter similar prompts
      maxHistoryDays: 14, // Increased to 14 days for more context
      excludeCurrentJob: true,
      contextInjectionEnabled: true,
      ...config,
    };

    this.similarityService = new TFIDFSimilarityService({
      similarityThreshold: this.config.similarityThreshold,
      maxSimilarPrompts: this.config.maxSimilarPrompts,
      minPromptLength: this.config.minPromptLength,
    });
  }

  /**
   * Process a chat request and enhance it with similarity context
   */
  async processChatRequest(
    chatRequest: ChatRequest,
    walletAddress: string
  ): Promise<EnhancedChatRequest> {
    console.log(
      `[ChatSimilarity] Processing request for wallet: ${walletAddress}`
    );
    console.log(`[ChatSimilarity] Service enabled: ${this.config.enabled}`);

    if (!this.config.enabled || !walletAddress) {
      console.log(
        '[ChatSimilarity] Service disabled or no wallet address, returning original request'
      );
      return chatRequest;
    }

    try {
      // Extract the prompt text
      const promptText = this.extractPromptText(chatRequest.prompt.content);
      console.log(`[ChatSimilarity] Extracted prompt text: "${promptText}"`);
      console.log(
        `[ChatSimilarity] Prompt length: ${promptText.length}, min required: ${this.config.minPromptLength}`
      );

      if (promptText.length < this.config.minPromptLength) {
        console.log(
          '[ChatSimilarity] Prompt too short, returning original request'
        );
        return chatRequest;
      }

      // Add timeout to prevent blocking chat requests
      const similarityPromise = this.processSimilarityWithTimeout(
        promptText,
        walletAddress,
        chatRequest.jobId
      );

      const result = await Promise.race([
        similarityPromise,
        new Promise<EnhancedChatRequest>((resolve) => {
          setTimeout(() => {
            console.log(
              '[ChatSimilarity] Timeout reached, returning original request'
            );
            resolve(chatRequest);
          }, 500);
        }),
      ]);

      console.log(
        `[ChatSimilarity] Final result - hasSimilarityContext: ${!!result.similarityContext}, similarPromptsCount: ${
          result.similarPrompts?.length || 0
        }`
      );
      return result;
    } catch (error) {
      console.error('[ChatSimilarity] Error processing chat request:', error);
      // Return original request if similarity processing fails
      return chatRequest;
    }
  }

  /**
   * Process similarity checking with timeout protection
   */
  private async processSimilarityWithTimeout(
    promptText: string,
    walletAddress: string,
    jobId?: string
  ): Promise<EnhancedChatRequest> {
    // Get user's message history for similarity checking
    console.log(
      `[ChatSimilarity] Getting user message history for wallet: ${walletAddress}, jobId: ${jobId}`
    );
    const userMessages = await this.getUserMessageHistory(walletAddress, jobId);
    console.log(`[ChatSimilarity] Found ${userMessages.length} user messages`);

    if (userMessages.length === 0) {
      console.log(
        '[ChatSimilarity] No user messages found, using test data for debugging'
      );

      // For debugging: use test data when no real user messages found
      const testMessages = [
        {
          id: 'test1',
          role: 'user' as const,
          content: 'Tell me a joke about crypto wallets',
          job_id: 'test-job1',
          created_at: new Date('2024-01-01'),
          order_index: 1,
          metadata: {},
          requires_action: false,
          is_streaming: false,
        },
        {
          id: 'test2',
          role: 'assistant' as const,
          content:
            'Why did the crypto wallet go to therapy? Because it had too many trust issues! 😄',
          job_id: 'test-job1',
          created_at: new Date('2024-01-01'),
          order_index: 2,
          metadata: {},
          requires_action: false,
          is_streaming: false,
        },
        {
          id: 'test3',
          role: 'user' as const,
          content: 'Can you tell me a crypto wallet joke?',
          job_id: 'test-job2',
          created_at: new Date('2024-01-02'),
          order_index: 3,
          metadata: {},
          requires_action: false,
          is_streaming: false,
        },
        {
          id: 'test4',
          role: 'assistant' as const,
          content:
            "What do you call a crypto wallet that lost its keys? A hardware wallet! (Because it's now just a paperweight) 🗝️",
          job_id: 'test-job2',
          created_at: new Date('2024-01-02'),
          order_index: 4,
          metadata: {},
          requires_action: false,
          is_streaming: false,
        },
        {
          id: 'test5',
          role: 'user' as const,
          content: 'Give me a crypto wallet joke',
          job_id: 'test-job3',
          created_at: new Date('2024-01-03'),
          order_index: 5,
          metadata: {},
          requires_action: false,
          is_streaming: false,
        },
        {
          id: 'test6',
          role: 'assistant' as const,
          content:
            'Why did the crypto wallet break up with its partner? Because it couldnt handle all the emotional transactions! 😄',
          job_id: 'test-job3',
          created_at: new Date('2024-01-03'),
          order_index: 6,
          metadata: {},
          requires_action: false,
          is_streaming: false,
        },
      ];

      console.log(
        `[ChatSimilarity] Using ${testMessages.length} test messages for similarity checking`
      );
      console.log(
        `[ChatSimilarity] Test messages:`,
        testMessages.map((m) => ({
          role: m.role,
          content: m.content.substring(0, 50) + '...',
        }))
      );
      const similarPrompts = await this.similarityService.findSimilarPrompts(
        promptText,
        testMessages,
        walletAddress
      );
      console.log(
        `[ChatSimilarity] Found ${similarPrompts.length} similar prompts in test data`
      );
      similarPrompts.forEach((similar, index) => {
        console.log(
          `[ChatSimilarity] Test similar ${index + 1}: ${Math.round(
            similar.similarity * 100
          )}% - "${similar.prompt}"`
        );
      });

      const enhancedRequest: EnhancedChatRequest = {
        prompt: { role: 'user', content: promptText },
        conversationId: jobId || '',
        similarPrompts,
      };

      // Add similarity context if enabled and similar prompts found
      if (this.config.contextInjectionEnabled && similarPrompts.length > 0) {
        enhancedRequest.similarityContext =
          this.similarityService.generateSimilarityContext(similarPrompts);

        // Log similarity detection for debugging
        console.log(
          `[ChatSimilarity] Found ${similarPrompts.length} similar prompts for user ${walletAddress} (using test data)`
        );
        similarPrompts.forEach((similar, index) => {
          console.log(
            `[ChatSimilarity] Similar ${index + 1}: ${Math.round(
              similar.similarity * 100
            )}% - "${similar.prompt.substring(0, 50)}..."`
          );
        });
      }

      return enhancedRequest;
    }

    // Find similar prompts
    console.log(
      `[ChatSimilarity] Finding similar prompts for: "${promptText}"`
    );
    const similarPrompts = await this.similarityService.findSimilarPrompts(
      promptText,
      userMessages,
      walletAddress
    );
    console.log(
      `[ChatSimilarity] Found ${similarPrompts.length} similar prompts`
    );

    // Create enhanced chat request
    const enhancedRequest: EnhancedChatRequest = {
      prompt: { role: 'user', content: promptText },
      conversationId: jobId || '',
      similarPrompts,
    };

    // Add similarity context if enabled and similar prompts found
    if (this.config.contextInjectionEnabled && similarPrompts.length > 0) {
      enhancedRequest.similarityContext =
        this.similarityService.generateSimilarityContext(similarPrompts);

      // Log similarity detection for debugging
      console.log(
        `[ChatSimilarity] Found ${similarPrompts.length} similar prompts for user ${walletAddress}`
      );
      similarPrompts.forEach((similar, index) => {
        console.log(
          `[ChatSimilarity] Similar ${index + 1}: ${Math.round(
            similar.similarity * 100
          )}% - "${similar.prompt.substring(0, 50)}..."`
        );
      });
    }

    return enhancedRequest;
  }

  /**
   * Enhance agent response with similarity awareness
   */
  enhanceAgentResponse(
    response: AgentResponse,
    similarPrompts: SimilarPrompt[]
  ): AgentResponse {
    // Always add similarity metadata, even if no similar prompts found
    const enhancedMetadata = {
      ...response.metadata,
      similarityDetection: {
        similarPromptsFound: similarPrompts?.length || 0,
        highestSimilarity:
          similarPrompts && similarPrompts.length > 0
            ? Math.max(...similarPrompts.map((p) => p.similarity))
            : Number.NEGATIVE_INFINITY,
        similarPromptIds: similarPrompts?.map((p) => p.messageId) || [],
      },
    };

    return {
      ...response,
      metadata: enhancedMetadata,
    };
  }

  /**
   * Extract prompt text from various content formats
   */
  private extractPromptText(content: any): string {
    if (typeof content === 'string') {
      return content.trim();
    }

    if (typeof content === 'object' && content !== null) {
      // Handle structured content (e.g., from ChatRequest)
      if (content.content) {
        return this.extractPromptText(content.content);
      }
      if (content.text) {
        return content.text.trim();
      }
      // Try to extract text from any text-like properties
      const textProps = ['message', 'text', 'prompt', 'query'];
      for (const prop of textProps) {
        if (content[prop] && typeof content[prop] === 'string') {
          return content[prop].trim();
        }
      }
    }

    return '';
  }

  /**
   * Get user's message history for similarity checking with caching
   */
  private async getUserMessageHistory(
    walletAddress: string,
    currentJobId?: string
  ): Promise<any[]> {
    try {
      // Create cache key
      const cacheKey = `${walletAddress}-${currentJobId || 'all'}`;
      const now = Date.now();

      // Check cache first
      const cached = this.messageCache.get(cacheKey);
      if (cached && now - cached.timestamp < this.CACHE_DURATION) {
        console.log(
          `[ChatSimilarity] Using cached messages for ${walletAddress}`
        );
        return cached.messages;
      }

      const options: any = {
        daysBack: this.config.maxHistoryDays,
        limit: 50, // Further reduced limit to prevent overload
      };

      if (this.config.excludeCurrentJob && currentJobId) {
        options.excludeJobId = currentJobId;
      }

      const messages = await MessageDB.getMessagesForSimilarity(
        walletAddress,
        options
      );

      // Cache the result
      this.messageCache.set(cacheKey, {
        messages,
        timestamp: now,
      });

      // Clean up old cache entries
      this.cleanupCache();

      return messages;
    } catch (error) {
      console.error(
        '[ChatSimilarity] Error getting user message history:',
        error
      );
      return [];
    }
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.messageCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.messageCache.delete(key);
      }
    }
  }

  /**
   * Check if a prompt is too similar to recent prompts (for blocking)
   */
  async isPromptTooSimilar(
    promptText: string,
    walletAddress: string,
    currentJobId?: string
  ): Promise<{ isSimilar: boolean; similarPrompt?: SimilarPrompt }> {
    if (
      !this.config.enabled ||
      promptText.length < this.config.minPromptLength
    ) {
      return { isSimilar: false };
    }

    try {
      const userMessages = await this.getUserMessageHistory(
        walletAddress,
        currentJobId
      );

      if (userMessages.length === 0) {
        return { isSimilar: false };
      }

      const similarPrompts = await this.similarityService.findSimilarPrompts(
        promptText,
        userMessages,
        walletAddress
      );

      // Check if any similar prompt exceeds a higher threshold for blocking
      const blockingThreshold = Math.min(
        0.95,
        this.config.similarityThreshold + 0.2
      );
      const tooSimilar = similarPrompts.find(
        (p) => p.similarity >= blockingThreshold
      );

      return {
        isSimilar: !!tooSimilar,
        similarPrompt: tooSimilar,
      };
    } catch (error) {
      console.error(
        '[ChatSimilarity] Error checking prompt similarity:',
        error
      );
      return { isSimilar: false };
    }
  }

  /**
   * Get similarity statistics for a user
   */
  async getUserSimilarityStats(walletAddress: string): Promise<{
    totalMessages: number;
    averageSimilarity: number;
    mostSimilarPairs: Array<{
      prompt1: string;
      prompt2: string;
      similarity: number;
    }>;
  }> {
    try {
      const userMessages = await MessageDB.getRecentMessagesForUser(
        walletAddress,
        30,
        100
      );
      const userPrompts = userMessages.filter((msg) => msg.role === 'user');

      if (userPrompts.length < 2) {
        return {
          totalMessages: userPrompts.length,
          averageSimilarity: 0,
          mostSimilarPairs: [],
        };
      }

      // Calculate pairwise similarities
      const similarities: number[] = [];
      const similarPairs: Array<{
        prompt1: string;
        prompt2: string;
        similarity: number;
      }> = [];

      for (let i = 0; i < userPrompts.length; i++) {
        for (let j = i + 1; j < userPrompts.length; j++) {
          const prompt1 = this.extractPromptText(userPrompts[i].content);
          const prompt2 = this.extractPromptText(userPrompts[j].content);

          if (
            prompt1.length >= this.config.minPromptLength &&
            prompt2.length >= this.config.minPromptLength
          ) {
            const pairSimilarity = await this.calculatePromptSimilarity(
              prompt1,
              prompt2
            );
            similarities.push(pairSimilarity);

            if (pairSimilarity >= this.config.similarityThreshold) {
              similarPairs.push({
                prompt1,
                prompt2,
                similarity: pairSimilarity,
              });
            }
          }
        }
      }

      const averageSimilarity =
        similarities.length > 0
          ? similarities.reduce((sum, sim) => sum + sim, 0) /
            similarities.length
          : 0;

      const mostSimilarPairs = similarPairs
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      return {
        totalMessages: userPrompts.length,
        averageSimilarity,
        mostSimilarPairs,
      };
    } catch (error) {
      console.error(
        '[ChatSimilarity] Error getting user similarity stats:',
        error
      );
      return {
        totalMessages: 0,
        averageSimilarity: 0,
        mostSimilarPairs: [],
      };
    }
  }

  /**
   * Calculate similarity between two prompts
   */
  private async calculatePromptSimilarity(
    prompt1: string,
    prompt2: string
  ): Promise<number> {
    const mockMessages = [
      {
        id: '1',
        role: 'user' as const,
        content: prompt1,
        job_id: 'job1',
        created_at: new Date(),
      },
      {
        id: '2',
        role: 'user' as const,
        content: prompt2,
        job_id: 'job2',
        created_at: new Date(),
      },
    ];

    const similarPrompts = await this.similarityService.findSimilarPrompts(
      prompt1,
      mockMessages,
      'test'
    );

    return similarPrompts.length > 0 ? similarPrompts[0].similarity : 0;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ChatSimilarityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.similarityService.updateConfig({
      similarityThreshold: this.config.similarityThreshold,
      maxSimilarPrompts: this.config.maxSimilarPrompts,
      minPromptLength: this.config.minPromptLength,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): ChatSimilarityConfig {
    return { ...this.config };
  }

  /**
   * Enable or disable the service
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Clear the message cache
   */
  clearCache(): void {
    this.messageCache.clear();
    console.log('[ChatSimilarity] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.messageCache.size,
      entries: Array.from(this.messageCache.keys()),
    };
  }
}

// Default instance
export const defaultChatSimilarityService = new ChatSimilarityService();
