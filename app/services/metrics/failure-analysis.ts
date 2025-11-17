/**
 * Failure Analysis Service
 * 
 * Analyzes assistant responses to detect failures and extract information about
 * what the platform couldn't accomplish.
 */

export interface FailureAnalysis {
  isFailure: boolean;
  failureType?: string;
  failureReason?: string;
  failureSummary?: string;
  detectedTags?: string[];
  requestTheme?: string;
}

export class FailureAnalysisService {
  // Keywords that indicate a failure or inability to complete a task
  private failureIndicators = [
    'cannot',
    "can't",
    'unable to',
    'not able to',
    'failed',
    'error',
    'does not exist',
    'not found',
    'not available',
    'not supported',
    'not implemented',
    'not possible',
    'sorry',
    'apologize',
    'unfortunately',
    "i don't",
    "i can't",
    "i'm unable",
    'i cannot',
    'limitation',
    'restriction',
    'not capable',
    'not designed',
    'not configured',
    'missing',
    'broken',
    'not working',
    'not functioning',
  ];

  // Failure type patterns
  private failureTypePatterns: Array<{
    type: string;
    patterns: RegExp[];
  }> = [
    {
      type: 'agent_not_found',
      patterns: [
        /agent.*not.*found/i,
        /agent.*does.*not.*exist/i,
        /no.*agent.*available/i,
        /agent.*not.*available/i,
      ],
    },
    {
      type: 'capability_limitation',
      patterns: [
        /cannot.*perform/i,
        /not.*capable/i,
        /not.*designed.*to/i,
        /limitation/i,
        /not.*supported/i,
        /not.*implemented/i,
      ],
    },
    {
      type: 'could_not_answer',
      patterns: [
        /cannot.*answer/i,
        /unable.*to.*answer/i,
        /don.*t.*know/i,
        /not.*sure/i,
        /don.*t.*have.*information/i,
        /lack.*information/i,
      ],
    },
    {
      type: 'error',
      patterns: [
        /error.*occurred/i,
        /something.*went.*wrong/i,
        /failed.*to/i,
        /encountered.*error/i,
        /an.*error/i,
      ],
    },
  ];

  /**
   * Analyze a response to detect if it indicates a failure
   */
  analyzeResponse(
    userPrompt: string,
    assistantResponse: string
  ): FailureAnalysis {
    const responseLower = assistantResponse.toLowerCase();
    const promptLower = userPrompt.toLowerCase();

    // Check for failure indicators
    const hasFailureIndicator = this.failureIndicators.some((indicator) =>
      responseLower.includes(indicator)
    );

    if (!hasFailureIndicator) {
      return {
        isFailure: false,
        detectedTags: this.extractTags(userPrompt),
        requestTheme: this.extractTheme(userPrompt),
      };
    }

    // Determine failure type
    let failureType = 'unknown';
    for (const { type, patterns } of this.failureTypePatterns) {
      if (patterns.some((pattern) => pattern.test(assistantResponse))) {
        failureType = type;
        break;
      }
    }

    // Extract failure reason
    const failureReason = this.extractFailureReason(assistantResponse);

    // Generate summary
    const failureSummary = this.generateFailureSummary(
      userPrompt,
      assistantResponse,
      failureType,
      failureReason
    );

    return {
      isFailure: true,
      failureType,
      failureReason,
      failureSummary,
      detectedTags: this.extractTags(userPrompt),
      requestTheme: this.extractTheme(userPrompt),
    };
  }

  /**
   * Extract failure reason from response
   */
  private extractFailureReason(response: string): string {
    // Look for sentences that contain failure indicators
    const sentences = response.split(/[.!?]+/);
    const failureSentences = sentences.filter((sentence) => {
      const lower = sentence.toLowerCase();
      return this.failureIndicators.some((indicator) =>
        lower.includes(indicator)
      );
    });

    if (failureSentences.length > 0) {
      // Return the first failure sentence, cleaned up
      return failureSentences[0].trim();
    }

    // Fallback: return first 200 chars of response
    return response.substring(0, 200).trim();
  }

  /**
   * Generate a summary of what couldn't be done
   */
  private generateFailureSummary(
    userPrompt: string,
    assistantResponse: string,
    failureType: string,
    failureReason: string
  ): string {
    const theme = this.extractTheme(userPrompt);
    const tags = this.extractTags(userPrompt);

    let summary = `User requested: ${theme || 'a task'}`;
    if (tags.length > 0) {
      summary += ` (tags: ${tags.join(', ')})`;
    }

    summary += `. Platform was unable to: `;

    switch (failureType) {
      case 'agent_not_found':
        summary += `find or access the required agent/service`;
        break;
      case 'capability_limitation':
        summary += `perform this action due to platform limitations`;
        break;
      case 'could_not_answer':
        summary += `provide the requested information`;
        break;
      case 'error':
        summary += `complete the request due to an error`;
        break;
      default:
        summary += `complete the request`;
    }

    if (failureReason) {
      summary += `. Reason: ${failureReason.substring(0, 150)}`;
    }

    return summary;
  }

  /**
   * Extract tags/themes from user prompt using simple keyword matching
   */
  private extractTags(prompt: string): string[] {
    const tags: string[] = [];
    const lower = prompt.toLowerCase();

    // Common request categories
    const tagPatterns: Array<{ tag: string; patterns: RegExp[] }> = [
      {
        tag: 'crypto',
        patterns: [/crypto|bitcoin|ethereum|blockchain|token|coin|nft|defi/i],
      },
      {
        tag: 'trading',
        patterns: [/trade|buy|sell|order|price|market|exchange/i],
      },
      {
        tag: 'research',
        patterns: [/research|analyze|investigate|study|find.*information/i],
      },
      {
        tag: 'code',
        patterns: [/code|program|script|function|api|develop|build/i],
      },
      {
        tag: 'data',
        patterns: [/data|database|query|fetch|retrieve|get.*data/i],
      },
      {
        tag: 'web',
        patterns: [/website|web|url|link|page|browse|scrape/i],
      },
      {
        tag: 'agent',
        patterns: [/agent|assistant|bot|automation/i],
      },
      {
        tag: 'mcp',
        patterns: [/mcp|server|tool|integration/i],
      },
    ];

    for (const { tag, patterns } of tagPatterns) {
      if (patterns.some((pattern) => pattern.test(prompt))) {
        tags.push(tag);
      }
    }

    return tags;
  }

  /**
   * Extract main theme/category from user prompt
   */
  private extractTheme(prompt: string): string {
    const tags = this.extractTags(prompt);
    if (tags.length > 0) {
      return tags[0]; // Return first tag as main theme
    }

    // Fallback: extract first few words as theme
    const words = prompt.split(/\s+/).slice(0, 3);
    return words.join(' ').toLowerCase();
  }
}

export const failureAnalysisService = new FailureAnalysisService();

