import { NextApiRequest, NextApiResponse } from 'next';
import { jobScheduler } from '@/services/jobs/scheduler-service';
import type { SchedulerResult } from '@/services/jobs/scheduler-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SchedulerResult | { error: string }>
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional authentication for manual scheduler runs
  const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;
  if (cronSecret) {
    const providedSecret = req.headers.authorization?.replace('Bearer ', '') || req.query.secret;
    if (providedSecret !== cronSecret) {
      return res.status(401).json({ error: 'Unauthorized - invalid secret' });
    }
  }

  try {
    console.log('[SCHEDULER API] Manual scheduler run requested');
    
    const result = await jobScheduler.processScheduledJobs();
    
    if (!result) {
      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        processedJobs: 0,
        executedJobs: 0,
        failedJobs: 0,
        errors: ['Scheduler was already running or skipped due to timing'],
        executions: []
      });
    }

    // Return appropriate status code based on result
    const statusCode = result.success ? 200 : (result.executedJobs > 0 ? 207 : 500);
    
    console.log(`[SCHEDULER API] Manual run completed: ${result.executedJobs}/${result.processedJobs} jobs executed successfully`);
    
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('[SCHEDULER API] Manual scheduler run failed:', error);
    return res.status(500).json({ 
      error: 'Failed to run scheduler: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
}