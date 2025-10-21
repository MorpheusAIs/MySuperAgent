/**
 * Job Processor Service
 * Processes pending jobs by triggering orchestration
 */

import {
  createMultiItemStorage,
  extractCurrentItem,
  getNextItem,
  isMultiItemStorageValid,
  parseMultiItemResponse,
} from '@/services/agents/core/multi-item-optimizer';

export interface JobProcessingResult {
  success: boolean;
  timestamp: string;
  processedJobs: number;
  completedJobs: number;
  failedJobs: number;
  errors: string[];
}

export class JobProcessorService {
  private static instance: JobProcessorService;
  private isProcessing = false;
  private processorInterval: NodeJS.Timeout | null = null;
  private lastProcessing: Date | null = null;

  // Configuration
  private readonly PROCESSOR_INTERVAL_MS = 15 * 1000; // Process every 15 seconds for faster response
  private readonly MIN_INTERVAL_BETWEEN_PROCESSING_MS = 5 * 1000; // At least 5 seconds between runs
  private readonly MAX_JOBS_PER_RUN = 10; // Process max 10 jobs per run

  private constructor() {}

  static getInstance(): JobProcessorService {
    if (!JobProcessorService.instance) {
      JobProcessorService.instance = new JobProcessorService();
    }
    return JobProcessorService.instance;
  }

  /**
   * Start the automatic job processor
   */
  startProcessor(): void {
    if (this.processorInterval) {
      console.log('[JOB PROCESSOR] Processor already running');
      return;
    }

    console.log('[JOB PROCESSOR] Starting automatic job processor');

    // Run initial processing after a short delay
    setTimeout(() => this.processPendingJobs(), 2000); // 2 seconds

    // Set up recurring processing
    this.processorInterval = setInterval(() => {
      this.processPendingJobs();
    }, this.PROCESSOR_INTERVAL_MS);
  }

  /**
   * Stop the automatic processor
   */
  stopProcessor(): void {
    if (this.processorInterval) {
      clearInterval(this.processorInterval);
      this.processorInterval = null;
      console.log('[JOB PROCESSOR] Processor stopped');
    }
  }

  /**
   * Process pending jobs
   */
  async processPendingJobs(): Promise<JobProcessingResult | null> {
    if (this.isProcessing) {
      return null;
    }

    // Check minimum interval
    if (this.lastProcessing) {
      const timeSinceLastProcessing =
        Date.now() - this.lastProcessing.getTime();
      if (timeSinceLastProcessing < this.MIN_INTERVAL_BETWEEN_PROCESSING_MS) {
        return null;
      }
    }

    this.isProcessing = true;
    const startTime = Date.now();

    const result: JobProcessingResult = {
      success: false,
      timestamp: new Date().toISOString(),
      processedJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      errors: [],
    };

    try {
      // Get pending jobs with atomic claim (prevents double processing)
      const { JobDB, MessageDB } = await import('@/services/database/db');

      const claimJobsQuery = `
        UPDATE jobs 
        SET status = 'running', updated_at = NOW()
        WHERE id IN (
          SELECT id FROM jobs 
          WHERE status = 'pending' 
            AND is_scheduled = false 
          ORDER BY created_at ASC
          LIMIT ${this.MAX_JOBS_PER_RUN}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *;
      `;

      let pendingJobs = [];
      try {
        const { pool } = await import('@/services/database/db');
        const claimedJobsResult = await pool.query(claimJobsQuery);
        pendingJobs = claimedJobsResult.rows;
      } catch (dbError) {
        console.error('[JOB PROCESSOR] Database query failed:', dbError);
        result.errors.push(
          `Database query failed: ${
            dbError instanceof Error ? dbError.message : 'Unknown error'
          }`
        );
        return result;
      }

      result.processedJobs = pendingJobs.length;

      if (pendingJobs.length === 0) {
        result.success = true;
        this.lastProcessing = new Date();
        return result;
      }

      console.log(
        `[JOB PROCESSOR] Found ${pendingJobs.length} pending jobs to process`
      );

      // Process jobs sequentially to avoid overwhelming the orchestration system
      for (const job of pendingJobs) {
        try {
          console.log(`[JOB PROCESSOR] Processing job ${job.id} (${job.name})`);

          // Create user message
          await MessageDB.createMessage({
            job_id: job.id,
            role: 'user',
            content: job.initial_message,
            order_index: 0,
            metadata: {},
            requires_action: false,
            is_streaming: false,
          });

          // Job is already set to 'running' by the atomic claim query

          // For scheduled jobs, check if we have stored multi-item data
          let useStoredItem = false;
          let storedItemContent: string | null = null;

          if (job.is_scheduled && job.parent_job_id) {
            try {
              const { pool } = await import('@/services/database/db');

              // Get parent job metadata to check for stored items
              const parentJobQuery = `
                SELECT metadata, initial_message
                FROM jobs 
                WHERE id = $1
              `;
              const parentResult = await pool.query(parentJobQuery, [
                job.parent_job_id,
              ]);

              if (parentResult.rows.length > 0) {
                const parentJob = parentResult.rows[0];
                const metadata = parentJob.metadata || {};
                const multiItemStorage = metadata.multi_item_storage;

                // Check if this is the same prompt as the parent job
                const isSamePrompt =
                  parentJob.initial_message === job.initial_message;
                console.log(
                  `[JOB PROCESSOR] Prompt comparison - Same prompt: ${isSamePrompt}`
                );
                console.log(
                  `[JOB PROCESSOR] Parent prompt: "${parentJob.initial_message}"`
                );
                console.log(
                  `[JOB PROCESSOR] Current prompt: "${job.initial_message}"`
                );

                if (isMultiItemStorageValid(multiItemStorage) && isSamePrompt) {
                  console.log(
                    `[JOB PROCESSOR] Found stored multi-item data for job ${
                      job.id
                    }, ${
                      multiItemStorage.items.length -
                      multiItemStorage.current_index
                    } items remaining`
                  );

                  const { item, hasMore, updatedStorage } =
                    getNextItem(multiItemStorage);

                  if (item) {
                    storedItemContent = item;
                    useStoredItem = true;

                    // Update parent job metadata with new index
                    await pool.query(
                      `UPDATE jobs SET metadata = jsonb_set(metadata, '{multi_item_storage}', $1::jsonb) WHERE id = $2`,
                      [JSON.stringify(updatedStorage), job.parent_job_id]
                    );

                    console.log(
                      `[JOB PROCESSOR] Using stored item ${updatedStorage.current_index}/${updatedStorage.total_items}, hasMore: ${hasMore}`
                    );
                  } else {
                    console.log(
                      `[JOB PROCESSOR] No more stored items available`
                    );
                  }
                } else if (!isSamePrompt) {
                  console.log(
                    `[JOB PROCESSOR] Different prompt detected - will generate new content`
                  );
                } else {
                  console.log(
                    `[JOB PROCESSOR] No valid multi-item storage found`
                  );
                }
              }
            } catch (storageError) {
              console.warn(
                `[JOB PROCESSOR] Failed to check multi-item storage:`,
                storageError
              );
              // Continue with normal processing if storage check fails
            }
          }

          // For scheduled jobs, load context from previous job executions
          let chatHistory: Array<{ role: string; content: string }> = [];
          let promptContent = job.initial_message;
          let previousJobs: any[] = [];

          // If we have a stored item, use it directly without calling the LLM
          if (useStoredItem && storedItemContent) {
            console.log(
              `[JOB PROCESSOR] Using pre-generated content for job ${job.id}`
            );

            // Create assistant response with the stored item
            await MessageDB.createMessage({
              job_id: job.id,
              role: 'assistant',
              content: storedItemContent,
              metadata: { source: 'multi_item_storage' },
              order_index: 1,
              requires_action: false,
              is_streaming: false,
            });

            // Update job status to completed
            await JobDB.updateJob(job.id, {
              status: 'completed',
              completed_at: new Date(),
            });

            result.completedJobs++;
            console.log(
              `[JOB PROCESSOR] Job ${job.id} completed using stored item`
            );
            continue; // Skip to next job
          }

          if (job.is_scheduled && job.parent_job_id) {
            try {
              // Get previous jobs with the same parent_job_id (previous executions of this scheduled job)
              const { pool } = await import('@/services/database/db');
              const previousJobsQuery = `
                SELECT j.*, m.content as response_content, m.created_at as response_time
                FROM jobs j
                LEFT JOIN messages m ON j.id = m.job_id AND m.role = 'assistant'
                WHERE j.parent_job_id = $1 
                  AND j.id != $2
                  AND j.status = 'completed'
                ORDER BY j.created_at DESC
                LIMIT 3
              `;

              const previousJobsResult = await pool.query(previousJobsQuery, [
                job.parent_job_id,
                job.id,
              ]);
              previousJobs = previousJobsResult.rows;

              if (previousJobs.length > 0) {
                // Build context from previous job executions
                const lastJob = previousJobs[0];
                const timeSinceLastRun =
                  new Date().getTime() - new Date(lastJob.created_at).getTime();
                const hoursSince = Math.floor(
                  timeSinceLastRun / (1000 * 60 * 60)
                );

                // Create chat history from previous executions
                chatHistory = previousJobs.reverse().flatMap((prevJob) => [
                  {
                    role: 'user',
                    content: prevJob.initial_message,
                    timestamp: new Date(prevJob.created_at).getTime(),
                  },
                  ...(prevJob.response_content
                    ? [
                        {
                          role: 'assistant',
                          content: prevJob.response_content,
                          timestamp: new Date(prevJob.response_time).getTime(),
                        },
                      ]
                    : []),
                ]);

                // Modify prompt for scheduled job follow-up
                promptContent = `This is a scheduled follow-up to: "${
                  job.initial_message
                }"

Previous context: This scheduled job last ran ${
                  hoursSince > 0 ? `${hoursSince} hours ago` : 'recently'
                } (${previousJobs.length} previous execution${
                  previousJobs.length > 1 ? 's' : ''
                }).

Please provide an updated response that:
1. Acknowledges what was covered in previous executions
2. Focuses on NEW developments or information since the last run
3. Builds upon previous responses rather than repeating them
4. Maintains continuity while providing fresh value

Original request: ${job.initial_message}`;
              }
            } catch (contextError) {
              console.warn(
                `[JOB PROCESSOR] Could not load context for scheduled job ${job.id}:`,
                contextError
              );
              // Continue with empty history if context loading fails
            }
          }

          // Prepare scheduled job context for the LLM
          const scheduledJobContext =
            job.is_scheduled && job.parent_job_id
              ? {
                  isScheduled: true,
                  isFirstRun:
                    job.run_count === 0 ||
                    !previousJobs ||
                    previousJobs.length === 0,
                  runCount: job.run_count || 0,
                  scheduleType: job.schedule_type || 'unknown',
                  parentJobId: job.parent_job_id,
                }
              : undefined;

          // Call orchestration via HTTP (internal request) with retry logic
          const baseUrl =
            process.env.NEXT_PUBLIC_API_URL ||
            `http://localhost:${process.env.PORT || 3000}`;
          let response;
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount <= maxRetries) {
            try {
              response = await fetch(`${baseUrl}/api/v1/chat/orchestrate`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  prompt: {
                    role: 'user',
                    content: promptContent,
                  },
                  chatHistory: chatHistory,
                  conversationId: job.id,
                  useResearch: true,
                  walletAddress: job.wallet_address,
                  scheduledJobContext: scheduledJobContext,
                }),
              });

              // If successful, break the retry loop
              if (response.ok) {
                break;
              } else if (retryCount < maxRetries) {
                console.log(
                  `[JOB PROCESSOR] Retry ${
                    retryCount + 1
                  }/${maxRetries} for job ${job.id}, status: ${response.status}`
                );
                retryCount++;
                // Wait before retrying (exponential backoff)
                await new Promise((resolve) =>
                  setTimeout(resolve, Math.pow(2, retryCount) * 1000)
                );
                continue;
              }
            } catch (fetchError) {
              if (retryCount < maxRetries) {
                console.log(
                  `[JOB PROCESSOR] Retry ${
                    retryCount + 1
                  }/${maxRetries} for job ${job.id}, error: ${
                    fetchError instanceof Error
                      ? fetchError.message
                      : 'Unknown error'
                  }`
                );
                retryCount++;
                // Wait before retrying (exponential backoff)
                await new Promise((resolve) =>
                  setTimeout(resolve, Math.pow(2, retryCount) * 1000)
                );
                continue;
              } else {
                throw fetchError;
              }
            }
          }

          if (response && response.ok) {
            const responseData = await response.json();
            const { response: agentResponse, current_agent } = responseData;

            const responseContent =
              typeof agentResponse.content === 'string'
                ? agentResponse.content
                : JSON.stringify(agentResponse.content);

            // Check if response contains multi-item data for scheduled jobs
            let finalContent = responseContent;
            if (
              job.is_scheduled &&
              job.parent_job_id &&
              scheduledJobContext?.isFirstRun
            ) {
              const multiItemResponse = parseMultiItemResponse(responseContent);

              if (multiItemResponse) {
                console.log(
                  `[JOB PROCESSOR] Detected multi-item response with ${multiItemResponse.future_items.length} future items`
                );

                // Extract ONLY the current item for user display
                finalContent = extractCurrentItem(multiItemResponse);
                console.log(
                  `[JOB PROCESSOR] User will see only current item: "${finalContent.substring(
                    0,
                    100
                  )}..."`
                );

                // Store future items in parent job metadata
                const multiItemStorage =
                  createMultiItemStorage(multiItemResponse);

                try {
                  const { pool } = await import('@/services/database/db');
                  await pool.query(
                    `UPDATE jobs 
                     SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('multi_item_storage', $1::jsonb)
                     WHERE id = $2`,
                    [JSON.stringify(multiItemStorage), job.parent_job_id]
                  );
                  console.log(
                    `[JOB PROCESSOR] Stored ${multiItemStorage.total_items} future items in parent job metadata`
                  );
                } catch (storageError) {
                  console.error(
                    `[JOB PROCESSOR] Failed to store multi-item data:`,
                    storageError
                  );
                  // Continue anyway, just won't have stored items
                }
              } else {
                console.log(
                  `[JOB PROCESSOR] No multi-item format detected - AI may not have followed instructions. Full response will be shown.`
                );
                console.log(
                  `[JOB PROCESSOR] Response content preview: "${responseContent.substring(
                    0,
                    200
                  )}..."`
                );
              }
            }

            // Create assistant response
            await MessageDB.createMessage({
              job_id: job.id,
              role: 'assistant',
              content: finalContent,
              agent_name: current_agent,
              metadata: agentResponse.metadata || {},
              order_index: 1,
              requires_action: false,
              is_streaming: false,
            });

            // Update job status to completed
            await JobDB.updateJob(job.id, {
              status: 'completed',
              completed_at: new Date(),
            });

            result.completedJobs++;
            console.log(`[JOB PROCESSOR] Job ${job.id} completed successfully`);
          } else {
            throw new Error(
              `Orchestration API returned ${response?.status || 'unknown'}: ${
                response?.statusText || 'unknown error'
              }`
            );
          }
        } catch (jobError) {
          console.error(
            `[JOB PROCESSOR] Failed to process job ${job.id}:`,
            jobError
          );
          result.failedJobs++;
          result.errors.push(
            `Job ${job.id}: ${
              jobError instanceof Error ? jobError.message : String(jobError)
            }`
          );

          // Mark job as failed
          try {
            await JobDB.updateJob(job.id, {
              status: 'failed',
              completed_at: new Date(),
            });
          } catch (updateError) {
            console.error(
              `[JOB PROCESSOR] Failed to update job ${job.id} status to failed:`,
              updateError
            );
          }
        }
      }

      result.success = result.errors.length === 0;
      this.lastProcessing = new Date();

      const processingTime = Date.now() - startTime;
      console.log(
        `[JOB PROCESSOR] Completed in ${processingTime}ms: ${result.completedJobs} completed, ${result.failedJobs} failed`
      );

      return result;
    } catch (error) {
      console.error('[JOB PROCESSOR] Failed to process pending jobs:', error);
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown processor error'
      );
      return result;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get processor status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      lastProcessing: this.lastProcessing,
      processorActive: this.processorInterval !== null,
      intervalMs: this.PROCESSOR_INTERVAL_MS,
      maxJobsPerRun: this.MAX_JOBS_PER_RUN,
    };
  }
}

// Export singleton instance
export const jobProcessor = JobProcessorService.getInstance();
