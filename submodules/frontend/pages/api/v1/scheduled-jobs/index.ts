import { NextApiRequest, NextApiResponse } from 'next';
import { JobDB, ScheduledJobDB } from '@/services/Database/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required in x-wallet-address header' });
  }

  try {
    let DB;
    try {
      const module = await import('@/services/Database/db');
      DB = module;
    } catch (importError) {
      console.error('Database module not available:', importError);
      return res.status(503).json({ 
        error: 'Database service unavailable. Please install dependencies and initialize the database.' 
      });
    }

    switch (req.method) {
      case 'GET':
        const scheduledJobs = await DB.ScheduledJobDB.getScheduledJobsByWallet(walletAddress);
        return res.status(200).json({ jobs: scheduledJobs });

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

        // First create the job
        const job = await DB.JobDB.createJob({
          wallet_address: walletAddress,
          name: job_name,
          description: job_description || null,
          initial_message: message_content,
          status: 'pending',
          is_scheduled: true,
          has_uploaded_file: false
        });

        // Calculate initial next_run_time
        const scheduleDate = new Date(schedule_time);
        const now = new Date();
        const next_run_time = scheduleDate > now ? scheduleDate : now;

        // Create the scheduled job
        const newScheduledJob = await DB.ScheduledJobDB.createScheduledJob({
          job_id: job.id,
          wallet_address: walletAddress,
          schedule_type,
          schedule_time: scheduleDate,
          next_run_time,
          interval_days: interval_days || null,
          is_active: true,
          max_runs: max_runs || null,
          timezone: timezone || 'UTC'
        });

        return res.status(201).json({ job: newScheduledJob, created_job: job });

      case 'PUT':
        const { id, ...updates } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'Scheduled job ID is required' });
        }

        // Verify scheduled job belongs to wallet
        const existingScheduledJobs = await DB.ScheduledJobDB.getScheduledJobsByWallet(walletAddress);
        const existingScheduledJob = existingScheduledJobs.find(sj => sj.id === id);
        
        if (!existingScheduledJob) {
          return res.status(404).json({ error: 'Scheduled job not found' });
        }

        const updatedScheduledJob = await DB.ScheduledJobDB.updateScheduledJob(id, updates);
        return res.status(200).json({ job: updatedScheduledJob });

      case 'DELETE':
        const { id: deleteId } = req.body;
        
        if (!deleteId) {
          return res.status(400).json({ error: 'Scheduled job ID is required' });
        }

        // Verify scheduled job belongs to wallet
        const scheduledJobsToCheck = await DB.ScheduledJobDB.getScheduledJobsByWallet(walletAddress);
        const scheduledJobToDelete = scheduledJobsToCheck.find(sj => sj.id === deleteId);
        
        if (!scheduledJobToDelete) {
          return res.status(404).json({ error: 'Scheduled job not found' });
        }

        await DB.ScheduledJobDB.deleteScheduledJob(deleteId);
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