import { NextApiRequest, NextApiResponse } from 'next';
import { jobScheduler } from '@/services/jobs/scheduler-service';
import { jobProcessor } from '@/services/jobs/job-processor-service';
import type { Job } from '@/services/database/db';

interface SchedulerStatusResponse {
  scheduler: {
    isRunning: boolean;
    lastRun: string | null;
    schedulerActive: boolean;
    intervalMs: number;
    maxJobsPerRun: number;
  };
  processor: {
    isProcessing: boolean;
    lastProcessing: string | null;
    processorActive: boolean;
    intervalMs: number;
    maxJobsPerRun: number;
  };
  upcomingJobs: Job[];
  stats: {
    totalScheduledJobs: number;
    activeScheduledJobs: number;
    jobsDueNow: number;
    pendingJobs: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SchedulerStatusResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get scheduler status
    const schedulerStatus = jobScheduler.getStatus();
    
    // Get processor status
    const processorStatus = jobProcessor.getStatus();
    
    // Get upcoming jobs (next hour)
    const upcomingJobs = await jobScheduler.getUpcomingJobs(60);
    
    // Get database statistics
    let pool;
    try {
      const dbModule = await import('@/services/database/db');
      pool = dbModule.pool;
    } catch (importError) {
      console.error('Database module not available:', importError);
      return res.status(503).json({ 
        error: 'Database service unavailable' 
      });
    }

    // Get various job counts
    const totalScheduledQuery = `SELECT COUNT(*) as count FROM jobs WHERE is_scheduled = true`;
    const activeScheduledQuery = `SELECT COUNT(*) as count FROM jobs WHERE is_scheduled = true AND is_active = true`;
    const dueNowQuery = `SELECT COUNT(*) as count FROM jobs WHERE is_scheduled = true AND is_active = true AND next_run_time <= NOW()`;
    const pendingJobsQuery = `SELECT COUNT(*) as count FROM jobs WHERE status = 'pending' AND is_scheduled = false`;
    
    const [totalResult, activeResult, dueResult, pendingResult] = await Promise.all([
      pool.query(totalScheduledQuery),
      pool.query(activeScheduledQuery),
      pool.query(dueNowQuery),
      pool.query(pendingJobsQuery)
    ]);

    const response: SchedulerStatusResponse = {
      scheduler: {
        ...schedulerStatus,
        lastRun: schedulerStatus.lastRun ? schedulerStatus.lastRun.toISOString() : null
      },
      processor: {
        ...processorStatus,
        lastProcessing: processorStatus.lastProcessing ? processorStatus.lastProcessing.toISOString() : null
      },
      upcomingJobs: upcomingJobs.slice(0, 10), // Limit to 10 for API response size
      stats: {
        totalScheduledJobs: parseInt(totalResult.rows[0].count),
        activeScheduledJobs: parseInt(activeResult.rows[0].count),
        jobsDueNow: parseInt(dueResult.rows[0].count),
        pendingJobs: parseInt(pendingResult.rows[0].count)
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Scheduler status API error:', error);
    return res.status(500).json({ 
      error: 'Failed to get scheduler status: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
}