import { NextApiRequest, NextApiResponse } from 'next';
import ScheduledJobsDB from '@/services/ScheduledJobs/db';
import { sendChatMessage } from '@/services/ChatManagement/api';
import { createNewConversation } from '@/services/ChatManagement/conversations';

// This endpoint should be called by a cron job or external scheduler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Simple auth check - in production use proper authentication
  const authToken = req.headers.authorization;
  if (authToken !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get all jobs that need to run
    const jobsToRun = await ScheduledJobsDB.getJobsToRun();
    
    console.log(`Found ${jobsToRun.length} jobs to run`);

    const results = [];

    for (const job of jobsToRun) {
      try {
        // Create a new conversation for this job run
        const conversationId = createNewConversation();
        
        // Send the scheduled message
        await sendChatMessage(
          conversationId,
          job.message_content,
          null, // no file
          true  // always use research mode
        );

        // Calculate next run time
        const nextRunTime = ScheduledJobsDB.calculateNextRunTime(
          job.schedule_type as any,
          new Date(),
          job.interval_days || undefined
        );

        // Update job with last run info
        await ScheduledJobsDB.updateJobAfterRun(job.id, nextRunTime);

        results.push({
          jobId: job.id,
          jobName: job.job_name,
          status: 'success',
          conversationId,
          nextRunTime
        });

      } catch (error) {
        console.error(`Error running job ${job.id}:`, error);
        results.push({
          jobId: job.id,
          jobName: job.job_name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return res.status(200).json({
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Scheduled job processor error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}