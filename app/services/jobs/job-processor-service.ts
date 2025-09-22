/**
 * Job Processor Service
 * Processes pending jobs by triggering orchestration
 */

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
      const timeSinceLastProcessing = Date.now() - this.lastProcessing.getTime();
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
      errors: []
    };

    try {
      // Get pending jobs
      const { JobDB, MessageDB } = await import('@/services/database/db');
      
      const pendingJobsQuery = `
        SELECT * FROM jobs 
        WHERE status = 'pending' 
          AND is_scheduled = false 
        ORDER BY created_at ASC
        LIMIT ${this.MAX_JOBS_PER_RUN};
      `;
      
      let pendingJobs = [];
      try {
        const { pool } = await import('@/services/database/db');
        const pendingJobsResult = await pool.query(pendingJobsQuery);
        pendingJobs = pendingJobsResult.rows;
      } catch (dbError) {
        console.error('[JOB PROCESSOR] Database query failed:', dbError);
        result.errors.push(`Database query failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        return result;
      }
      
      result.processedJobs = pendingJobs.length;
      
      if (pendingJobs.length === 0) {
        result.success = true;
        this.lastProcessing = new Date();
        return result;
      }

      console.log(`[JOB PROCESSOR] Found ${pendingJobs.length} pending jobs to process`);

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
            is_streaming: false
          });
          
          // Update job status to running
          await JobDB.updateJob(job.id, {
            status: 'running'
          });
          
          // Call orchestration via HTTP (internal request) with retry logic
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3000}`;
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
                    content: job.initial_message,
                  },
                  chatHistory: [],
                  conversationId: job.id,
                  useResearch: true,
                  walletAddress: job.wallet_address,
                }),
              });
              
              // If successful, break the retry loop
              if (response.ok) {
                break;
              } else if (retryCount < maxRetries) {
                console.log(`[JOB PROCESSOR] Retry ${retryCount + 1}/${maxRetries} for job ${job.id}, status: ${response.status}`);
                retryCount++;
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                continue;
              }
            } catch (fetchError) {
              if (retryCount < maxRetries) {
                console.log(`[JOB PROCESSOR] Retry ${retryCount + 1}/${maxRetries} for job ${job.id}, error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
                retryCount++;
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                continue;
              } else {
                throw fetchError;
              }
            }
          }
          
          if (response && response.ok) {
            const responseData = await response.json();
            const { response: agentResponse, current_agent } = responseData;
            
            // Create assistant response
            await MessageDB.createMessage({
              job_id: job.id,
              role: 'assistant',
              content: typeof agentResponse.content === 'string' ? agentResponse.content : JSON.stringify(agentResponse.content),
              agent_name: current_agent,
              metadata: agentResponse.metadata || {},
              order_index: 1,
              requires_action: false,
              is_streaming: false
            });
            
            // Update job status to completed
            await JobDB.updateJob(job.id, {
              status: 'completed',
              completed_at: new Date()
            });
            
            result.completedJobs++;
            console.log(`[JOB PROCESSOR] Job ${job.id} completed successfully`);
            
          } else {
            throw new Error(`Orchestration API returned ${response?.status || 'unknown'}: ${response?.statusText || 'unknown error'}`);
          }
          
        } catch (jobError) {
          console.error(`[JOB PROCESSOR] Failed to process job ${job.id}:`, jobError);
          result.failedJobs++;
          result.errors.push(`Job ${job.id}: ${jobError instanceof Error ? jobError.message : String(jobError)}`);
          
          // Mark job as failed
          try {
            await JobDB.updateJob(job.id, {
              status: 'failed',
              completed_at: new Date()
            });
          } catch (updateError) {
            console.error(`[JOB PROCESSOR] Failed to update job ${job.id} status to failed:`, updateError);
          }
        }
      }

      result.success = result.errors.length === 0;
      this.lastProcessing = new Date();
      
      const processingTime = Date.now() - startTime;
      console.log(`[JOB PROCESSOR] Completed in ${processingTime}ms: ${result.completedJobs} completed, ${result.failedJobs} failed`);
      
      return result;
      
    } catch (error) {
      console.error('[JOB PROCESSOR] Failed to process pending jobs:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown processor error');
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
      maxJobsPerRun: this.MAX_JOBS_PER_RUN
    };
  }
}

// Export singleton instance
export const jobProcessor = JobProcessorService.getInstance();