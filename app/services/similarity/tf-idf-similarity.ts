/**
 * TF-IDF Similarity Service
 *
 * This service implements TF-IDF (Term Frequency-Inverse Document Frequency)
 * to find similar prompts from user's message history and prevent repetitive responses.
 */

import { Message } from '@/services/database/db';

export interface SimilarPrompt {
  messageId: string;
  prompt: string;
  response: string;
  similarity: number;
  jobId: string;
  createdAt: Date;
}

export interface SimilarityConfig {
  similarityThreshold: number; // Minimum similarity score (0-1)
  maxSimilarPrompts: number; // Maximum number of similar prompts to return
  minPromptLength: number; // Minimum prompt length to consider
}

export class TFIDFSimilarityService {
  private config: SimilarityConfig;

  constructor(config: Partial<SimilarityConfig> = {}) {
    this.config = {
      similarityThreshold: 0.7,
      maxSimilarPrompts: 3,
      minPromptLength: 10,
      ...config,
    };
  }

  /**
   * Find similar prompts from user's message history
   */
  async findSimilarPrompts(
    currentPrompt: string,
    userMessages: Message[],
    walletAddress: string
  ): Promise<SimilarPrompt[]> {
    if (currentPrompt.length < this.config.minPromptLength) {
      return [];
    }

    // Filter and prepare user prompts with their responses
    const promptResponsePairs = this.extractPromptResponsePairs(userMessages);

    if (promptResponsePairs.length === 0) {
      return [];
    }

    // Calculate TF-IDF vectors for all prompts
    const allPrompts = [
      currentPrompt,
      ...promptResponsePairs.map((pair) => pair.prompt),
    ];
    const tfIdfVectors = this.calculateTFIDFVectors(allPrompts);

    if (tfIdfVectors.length === 0) {
      return [];
    }

    const currentPromptVector = tfIdfVectors[0];
    const similarPrompts: SimilarPrompt[] = [];

    // Calculate similarity with each historical prompt
    for (let i = 1; i < tfIdfVectors.length; i++) {
      const similarity = this.calculateCosineSimilarity(
        currentPromptVector,
        tfIdfVectors[i]
      );

      if (similarity >= this.config.similarityThreshold) {
        const pair = promptResponsePairs[i - 1];
        similarPrompts.push({
          messageId: pair.messageId,
          prompt: pair.prompt,
          response: pair.response,
          similarity,
          jobId: pair.jobId,
          createdAt: pair.createdAt,
        });
      }
    }

    // Also check for similar responses (not just prompts)
    const responseSimilarities = await this.findSimilarResponses(
      currentPrompt,
      promptResponsePairs
    );

    // Merge and deduplicate similar prompts and responses
    const allSimilar = [...similarPrompts, ...responseSimilarities];
    const uniqueSimilar = this.deduplicateSimilarPrompts(allSimilar);

    // Sort by similarity (highest first) and limit results
    return uniqueSimilar
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.config.maxSimilarPrompts);
  }

  /**
   * Find similar responses to the current prompt
   */
  private async findSimilarResponses(
    currentPrompt: string,
    promptResponsePairs: Array<{
      messageId: string;
      prompt: string;
      response: string;
      jobId: string;
      createdAt: Date;
    }>
  ): Promise<SimilarPrompt[]> {
    const allTexts = [
      currentPrompt,
      ...promptResponsePairs.map((pair) => pair.response),
    ];
    const tfIdfVectors = this.calculateTFIDFVectors(allTexts);

    if (tfIdfVectors.length === 0) {
      return [];
    }

    const currentVector = tfIdfVectors[0];
    const similarResponses: SimilarPrompt[] = [];

    for (let i = 1; i < tfIdfVectors.length; i++) {
      const similarity = this.calculateCosineSimilarity(
        currentVector,
        tfIdfVectors[i]
      );

      // Use a slightly lower threshold for response similarity
      if (similarity >= this.config.similarityThreshold * 0.8) {
        const pair = promptResponsePairs[i - 1];
        similarResponses.push({
          messageId: pair.messageId,
          prompt: pair.prompt,
          response: pair.response,
          similarity: similarity * 0.9, // Slightly lower weight for response similarity
          jobId: pair.jobId,
          createdAt: pair.createdAt,
        });
      }
    }

    return similarResponses;
  }

  /**
   * Deduplicate similar prompts by messageId
   */
  private deduplicateSimilarPrompts(
    similarPrompts: SimilarPrompt[]
  ): SimilarPrompt[] {
    const seen = new Set<string>();
    return similarPrompts.filter((prompt) => {
      if (seen.has(prompt.messageId)) {
        return false;
      }
      seen.add(prompt.messageId);
      return true;
    });
  }

  /**
   * Extract prompt-response pairs from message history
   */
  private extractPromptResponsePairs(messages: Message[]): Array<{
    messageId: string;
    prompt: string;
    response: string;
    jobId: string;
    createdAt: Date;
  }> {
    const pairs: Array<{
      messageId: string;
      prompt: string;
      response: string;
      jobId: string;
      createdAt: Date;
    }> = [];

    // Sort messages by order_index to maintain conversation flow
    const sortedMessages = messages.sort(
      (a, b) => (a.order_index || 0) - (b.order_index || 0)
    );

    for (let i = 0; i < sortedMessages.length - 1; i++) {
      const currentMessage = sortedMessages[i];
      const nextMessage = sortedMessages[i + 1];

      // Look for user prompt followed by assistant response
      if (currentMessage.role === 'user' && nextMessage.role === 'assistant') {
        const prompt = this.extractTextContent(currentMessage.content);
        const response = this.extractTextContent(nextMessage.content);

        if (
          prompt &&
          response &&
          prompt.length >= this.config.minPromptLength
        ) {
          pairs.push({
            messageId: currentMessage.id,
            prompt,
            response,
            jobId: currentMessage.job_id,
            createdAt: currentMessage.created_at,
          });
        }
      }
    }

    return pairs;
  }

  /**
   * Extract text content from message content (handles both string and object formats)
   */
  private extractTextContent(content: any): string {
    if (typeof content === 'string') {
      return content.trim();
    }

    if (typeof content === 'object' && content !== null) {
      // Handle structured content (e.g., from ChatRequest)
      if (content.content) {
        return this.extractTextContent(content.content);
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
   * Calculate TF-IDF vectors for a collection of documents
   */
  private calculateTFIDFVectors(documents: string[]): number[][] {
    if (documents.length === 0) return [];

    // Tokenize documents
    const tokenizedDocs = documents.map((doc) => this.tokenize(doc));

    // Get all unique terms across all documents
    const allTerms = new Set<string>();
    tokenizedDocs.forEach((tokens) => {
      tokens.forEach((token) => allTerms.add(token));
    });

    const termArray = Array.from(allTerms);
    const docCount = documents.length;

    // Calculate TF-IDF vectors
    const vectors: number[][] = [];

    for (let i = 0; i < tokenizedDocs.length; i++) {
      const docTokens = tokenizedDocs[i];
      const vector: number[] = [];

      for (const term of termArray) {
        // Term Frequency (TF)
        const termCount = docTokens.filter((token) => token === term).length;
        const tf = termCount / docTokens.length;

        // Document Frequency (DF)
        const docFrequency = tokenizedDocs.filter((tokens) =>
          tokens.includes(term)
        ).length;

        // Inverse Document Frequency (IDF)
        const idf = Math.log(docCount / docFrequency);

        vector.push(tf * idf);
      }

      vectors.push(vector);
    }

    return vectors;
  }

  /**
   * Tokenize text into words (basic implementation)
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/)
      .filter((word) => word.length > 2) // Filter out short words
      .filter((word) => !this.isStopWord(word)); // Remove stop words
  }

  /**
   * Check if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'this',
      'that',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'me',
      'him',
      'her',
      'us',
      'them',
      'my',
      'your',
      'his',
      'her',
      'its',
      'our',
      'their',
    ]);
    return stopWords.has(word);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(
    vectorA: number[],
    vectorB: number[]
  ): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate context from similar prompts for injection into new responses
   */
  generateSimilarityContext(similarPrompts: SimilarPrompt[]): string {
    if (similarPrompts.length === 0) {
      return '';
    }

    const contextParts = similarPrompts.map((similar, index) => {
      const similarityPercent = Math.round(similar.similarity * 100);
      return `Similar prompt ${index + 1} (${similarityPercent}% similar):
Previous: "${similar.prompt}"
Response: "${similar.response}"
---`;
    });

    return `\n\n🚨🚨🚨 CRITICAL ANTI-REPETITION ALERT 🚨🚨🚨
${contextParts.join('\n')}

🔥 ABSOLUTELY CRITICAL INSTRUCTIONS - READ CAREFULLY 🔥

⚠️  YOU HAVE BEEN GIVEN SIMILAR PREVIOUS INTERACTIONS ABOVE ⚠️
⚠️  DO NOT REPEAT ANYTHING FROM THOSE RESPONSES ⚠️

🎯 MANDATORY REQUIREMENTS:
1. You MUST provide a COMPLETELY DIFFERENT response
2. Use DIFFERENT jokes, examples, or approaches
3. Change your tone, style, or perspective
4. Add NEW insights or angles not mentioned before
5. NEVER use the same punchlines, phrases, or structures
6. If it's a joke request, find a TOTALLY DIFFERENT type of joke
7. Be CREATIVE and ORIGINAL - think outside the box

🚫 FORBIDDEN:
- Repeating any jokes, examples, or phrases from above
- Using similar punchlines or structures
- Giving the same type of response
- Being predictable or repetitive

✅ REQUIRED:
- Complete originality and uniqueness
- Fresh perspective and approach
- Creative thinking and new angles
- Valuable new content

Your response must be 100% ORIGINAL and VALUABLE!\n`;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SimilarityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): SimilarityConfig {
    return { ...this.config };
  }
}

// Default instance
export const defaultSimilarityService = new TFIDFSimilarityService();
