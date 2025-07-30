import { NextApiRequest, NextApiResponse } from 'next';
import ScheduledJobsDB from '@/services/ScheduledJobs/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // For now, use a placeholder user identifier - in production this would come from auth
  const userIdentifier = req.headers['x-user-id'] as string || 'default-user';

  try {
    switch (req.method) {
      case 'GET':
        const jobs = await ScheduledJobsDB.getJobsByUser(userIdentifier);
        return res.status(200).json({ jobs });

      case 'POST':
        const { 
          job_name, 
          job_description, 
          message_content, 
          schedule_type, 
          schedule_time,
          interval_days,
          max_runs,
          timezone 
        } = req.body;

        // Validate required fields
        if (!job_name || !message_content || !schedule_type || !schedule_time) {
          return res.status(400).json({ 
            error: 'Missing required fields: job_name, message_content, schedule_type, schedule_time' 
          });
        }

        // Calculate initial next_run_time
        const scheduleDate = new Date(schedule_time);
        const now = new Date();
        const next_run_time = scheduleDate > now ? scheduleDate : now;

        const newJob = await ScheduledJobsDB.createJob({
          user_identifier: userIdentifier,
          job_name,
          job_description: job_description || null,
          message_content,
          schedule_type,
          schedule_time: scheduleDate,
          next_run_time,
          interval_days: interval_days || null,
          is_active: true,
          max_runs: max_runs || null,
          timezone: timezone || 'UTC'
        });

        return res.status(201).json({ job: newJob });

      case 'PUT':
        const { id, ...updates } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'Job ID is required' });
        }

        const updatedJob = await ScheduledJobsDB.updateJob(id, updates);
        return res.status(200).json({ job: updatedJob });

      case 'DELETE':
        const { id: deleteId } = req.body;
        
        if (!deleteId) {
          return res.status(400).json({ error: 'Job ID is required' });
        }

        await ScheduledJobsDB.deleteJob(deleteId);
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Scheduled jobs API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}