import type { Job } from '@/services/database/db';

export interface ScheduledJobExecution {
  jobId: string;
  walletAddress: string;
  success: boolean;
  newJobId?: string;
  error?: string;
  executedAt: Date;
}

export interface SchedulerResult {
  success: boolean;
  timestamp: string;
  processedJobs: number;
  executedJobs: number;
  failedJobs: number;
  errors: string[];
  executions: ScheduledJobExecution[];
}

export class JobSchedulerService {
  private static instance: JobSchedulerService;
  private isRunning = false;
  private schedulerInterval: NodeJS.Timeout | null = null;
  private lastRun: Date | null = null;
  
  // Configuration
  private readonly SCHEDULER_INTERVAL_MS = 60 * 1000; // Check every minute
  private readonly MIN_INTERVAL_BETWEEN_RUNS_MS = 30 * 1000; // At least 30 seconds between runs
  private readonly MAX_JOBS_PER_RUN = 10; // Process max 10 jobs per run to avoid overload

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): JobSchedulerService {
    if (!JobSchedulerService.instance) {
      JobSchedulerService.instance = new JobSchedulerService();
    }
    return JobSchedulerService.instance;
  }

  /**
   * Start the automatic scheduler
   */
  startScheduler(): void {
    if (this.schedulerInterval) {
      console.log('[JOB SCHEDULER] Scheduler already running');
      return;
    }

    console.log('[JOB SCHEDULER] Starting automatic job scheduler');
    
    // Run initial check after a short delay
    setTimeout(() => this.processScheduledJobs(), 5000); // 5 seconds
    
    // Set up recurring scheduler
    this.schedulerInterval = setInterval(() => {
      this.processScheduledJobs();
    }, this.SCHEDULER_INTERVAL_MS);
  }

  /**
   * Stop the automatic scheduler
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      console.log('[JOB SCHEDULER] Scheduler stopped');
    }
  }

  /**
   * Manually process scheduled jobs
   */
  async processScheduledJobs(): Promise<SchedulerResult | null> {
    if (this.isRunning) {
      console.log('[JOB SCHEDULER] Scheduler already processing, skipping');
      return null;
    }

    // Check minimum interval
    if (this.lastRun) {
      const timeSinceLastRun = Date.now() - this.lastRun.getTime();
      if (timeSinceLastRun < this.MIN_INTERVAL_BETWEEN_RUNS_MS) {
        return null;
      }
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    const result: SchedulerResult = {
      success: false,
      timestamp: new Date().toISOString(),
      processedJobs: 0,
      executedJobs: 0,
      failedJobs: 0,
      errors: [],
      executions: []
    };

    try {
      console.log('[JOB SCHEDULER] Processing scheduled jobs...');
      
      // Get jobs that are due to run
      const { JobDB } = await import('@/services/database/db');
      const dueJobs = await JobDB.getActiveScheduledJobs();
      result.processedJobs = dueJobs.length;
      
      if (dueJobs.length === 0) {
        result.success = true;
        this.lastRun = new Date();
        return result;
      }

      // Limit jobs per run to prevent overload
      const jobsToProcess = dueJobs.slice(0, this.MAX_JOBS_PER_RUN);
      
      console.log(`[JOB SCHEDULER] Found ${dueJobs.length} due jobs, processing ${jobsToProcess.length}`);

      // Process jobs in parallel with controlled concurrency
      const executions = await Promise.allSettled(
        jobsToProcess.map(job => this.executeScheduledJob(job))
      );

      // Process results
      executions.forEach((execution, index) => {
        const job = jobsToProcess[index];
        
        if (execution.status === 'fulfilled' && execution.value.success) {
          result.executedJobs++;
          result.executions.push(execution.value);
          console.log(`[JOB SCHEDULER] Successfully executed job ${job.id} (${job.name})`);
        } else {
          result.failedJobs++;
          const error = execution.status === 'rejected' 
            ? execution.reason 
            : execution.value.error;
          result.errors.push(`Job ${job.id} (${job.name}): ${error}`);
          console.error(`[JOB SCHEDULER] Failed to execute job ${job.id}:`, error);
          
          if (execution.status === 'fulfilled') {
            result.executions.push(execution.value);
          }
        }
      });

      result.success = result.errors.length === 0;
      this.lastRun = new Date();
      
      const processingTime = Date.now() - startTime;
      console.log(`[JOB SCHEDULER] Completed in ${processingTime}ms: ${result.executedJobs} executed, ${result.failedJobs} failed`);
      
      return result;
      
    } catch (error) {
      console.error('[JOB SCHEDULER] Failed to process scheduled jobs:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown scheduler error');
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Execute a single scheduled job
   */
  private async executeScheduledJob(job: Job): Promise<ScheduledJobExecution> {
    const execution: ScheduledJobExecution = {
      jobId: job.id,
      walletAddress: job.wallet_address,
      success: false,
      executedAt: new Date()
    };

    try {
      console.log(`[JOB SCHEDULER] Executing scheduled job ${job.id} (${job.name}) - last run: ${job.last_run_at || 'never'}`);
      
      // Call the job execution API directly without HTTP client to avoid circular issues
      const { JobDB } = await import('@/services/database/db');
      const JobsAPI = await import('@/services/api-clients/jobs');
      
      // Create a new job instance based on the scheduled job
      const newJob = await JobDB.createJob({
        wallet_address: job.wallet_address,
        name: job.name,
        description: job.description,
        initial_message: job.initial_message,
        status: 'pending',
        has_uploaded_file: job.has_uploaded_file || false,
        is_scheduled: false, // This is a regular job instance
        schedule_type: null,
        schedule_time: null,
        next_run_time: null,
        interval_days: null,
        is_active: true,
        last_run_at: null,
        run_count: 0,
        max_runs: null,
        timezone: job.timezone || 'UTC'
      });

      // Update the scheduled job's run count and last run time
      const now = new Date();
      let nextRunTime: Date | null = null;
      
      // Calculate next run time if it's not a one-time job
      if (job.schedule_type && job.schedule_type !== 'once') {
        nextRunTime = JobsAPI.default.calculateNextRunTime(
          job.schedule_type as 'daily' | 'hourly' | 'weekly' | 'custom',
          now,
          job.interval_days || undefined
        );
      }

      // Update the scheduled job
      await JobDB.updateJob(job.id, {
        run_count: (job.run_count || 0) + 1,
        last_run_at: now,
        next_run_time: nextRunTime,
        // Deactivate if it was a one-time job or reached max runs
        is_active: job.schedule_type === 'once' ? false : 
                   (job.max_runs && (job.run_count || 0) + 1 >= job.max_runs) ? false : 
                   job.is_active
      });

      execution.success = true;
      execution.newJobId = newJob.id;
      
      console.log(`[JOB SCHEDULER] Job ${job.id} executed successfully:`);
      console.log(`  - Created new job instance: ${newJob.id}`);
      console.log(`  - Run count: ${job.run_count || 0} → ${(job.run_count || 0) + 1}`);
      console.log(`  - Next run time: ${nextRunTime ? nextRunTime.toISOString() : 'none (job completed)'}`);
      
    } catch (error) {
      execution.success = false;
      execution.error = error instanceof Error ? error.message : String(error);
      console.error(`[JOB SCHEDULER] Job ${job.id} execution failed:`, execution.error);
      
      // If execution fails, we should still update the next run time to avoid getting stuck
      try {
        const { JobDB } = await import('@/services/database/db');
        const JobsAPI = await import('@/services/api-clients/jobs');
        const now = new Date();
        
        let nextRunTime: Date | null = null;
        if (job.schedule_type && job.schedule_type !== 'once') {
          nextRunTime = JobsAPI.default.calculateNextRunTime(
            job.schedule_type as 'daily' | 'hourly' | 'weekly' | 'custom',
            now,
            job.interval_days || undefined
          );
        }
        
        await JobDB.updateJob(job.id, {
          last_run_at: now,
          next_run_time: nextRunTime
        });
        
        console.log(`[JOB SCHEDULER] Updated failed job ${job.id} next run time to ${nextRunTime?.toISOString() || 'none'}`);
      } catch (updateError) {
        console.error(`[JOB SCHEDULER] Failed to update job ${job.id} after execution failure:`, updateError);
      }
    }

    return execution;
  }

  /**
   * Get scheduler status and statistics
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      schedulerActive: this.schedulerInterval !== null,
      intervalMs: this.SCHEDULER_INTERVAL_MS,
      maxJobsPerRun: this.MAX_JOBS_PER_RUN
    };
  }

  /**
   * Get jobs that should run soon (for debugging)
   */
  async getUpcomingJobs(limitMinutes: number = 60): Promise<Job[]> {
    const query = `
      SELECT * FROM jobs 
      WHERE is_scheduled = TRUE 
        AND is_active = TRUE 
        AND next_run_time <= NOW() + INTERVAL '${limitMinutes} minutes'
      ORDER BY next_run_time ASC
      LIMIT 20;
    `;

    try {
      const { pool } = await import('@/services/database/db');
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('[JOB SCHEDULER] Failed to get upcoming jobs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const jobScheduler = JobSchedulerService.getInstance();

// Auto-start scheduler in production/development (server-side only)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Server-side only - but don't auto-start here, let instrumentation.ts handle it
  // This avoids multiple scheduler instances
  console.log('[JOB SCHEDULER] Scheduler module loaded');
}