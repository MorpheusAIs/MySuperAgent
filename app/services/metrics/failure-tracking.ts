/**
 * Failure Tracking Service
 * 
 * Tracks and stores failure metrics when responses are generated.
 * This should be called after each assistant response is created.
 */

import { FailureMetricsDB } from '../Database/db';
import { failureAnalysisService } from './failure-analysis';

export interface TrackFailureParams {
  jobId: string;
  messageId?: string;
  userId?: string;
  walletAddress?: string;
  agentName?: string;
  userPrompt: string;
  assistantResponse: string;
}

export class FailureTrackingService {
  /**
   * Track a response and analyze it for failures
   * This should be called asynchronously (fire and forget) to not block the response
   */
  async trackResponse(params: TrackFailureParams): Promise<void> {
    try {
      // Extract text content from response (handles both string and object formats)
      const responseText = this.extractTextContent(params.assistantResponse);
      const promptText = this.extractTextContent(params.userPrompt);

      if (!responseText || !promptText) {
        return; // Skip if we can't extract text
      }

      // Analyze the response for failures
      const analysis = failureAnalysisService.analyzeResponse(
        promptText,
        responseText
      );

      // Store the metric (always store, even if not a failure, for analytics)
      await FailureMetricsDB.createFailureMetric({
        job_id: params.jobId,
        message_id: params.messageId,
        user_id: params.userId,
        wallet_address: params.walletAddress,
        agent_name: params.agentName,
        user_prompt: promptText,
        assistant_response: responseText,
        is_failure: analysis.isFailure,
        failure_type: analysis.failureType || null,
        failure_reason: analysis.failureReason || null,
        failure_summary: analysis.failureSummary || null,
        detected_tags: analysis.detectedTags || null,
        request_theme: analysis.requestTheme || null,
      });

      if (analysis.isFailure) {
        console.log(
          `[FailureTracking] Detected failure: ${analysis.failureType} - ${analysis.failureSummary}`
        );
      }
    } catch (error) {
      // Don't throw - we don't want to break the response flow
      console.error('[FailureTracking] Error tracking response:', error);
    }
  }

  /**
   * Extract text content from message content (handles both string and object formats)
   */
  private extractTextContent(content: any): string {
    if (typeof content === 'string') {
      return content;
    }

    if (typeof content === 'object' && content !== null) {
      // Try common fields
      if (content.text) return String(content.text);
      if (content.content) return String(content.content);
      if (content.message) return String(content.message);
      
      // If it's an array, try to extract text from elements
      if (Array.isArray(content)) {
        return content
          .map((item) => this.extractTextContent(item))
          .join(' ');
      }
    }

    return String(content || '');
  }
}

export const failureTrackingService = new FailureTrackingService();

