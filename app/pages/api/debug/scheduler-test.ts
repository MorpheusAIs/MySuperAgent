import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '@/services/database/db';
import { jobScheduler } from '@/services/jobs/scheduler-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[DEBUG] Manual scheduler test initiated');

    // First, let's see what jobs are due
    const dueJobs = await Database.JobDB.getActiveScheduledJobs();
    console.log(`[DEBUG] Found ${dueJobs.length} jobs due to run`);
    
    if (dueJobs.length > 0) {
      console.log('[DEBUG] Due jobs:');
      dueJobs.slice(0, 5).forEach(job => {
        console.log(`  - ${job.id}: "${job.name}" (next_run: ${job.next_run_time}, last_run: ${job.last_run_at || 'never'})`);
      });
    }

    // Run the scheduler
    const result = await jobScheduler.processScheduledJobs();
    
    console.log('[DEBUG] Scheduler execution result:', result);

    return res.status(200).json({
      success: true,
      dueJobsFound: dueJobs.length,
      dueJobs: dueJobs.slice(0, 3).map(job => ({
        id: job.id,
        name: job.name,
        next_run_time: job.next_run_time,
        last_run_at: job.last_run_at,
        run_count: job.run_count
      })),
      schedulerResult: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DEBUG] Scheduler test failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}