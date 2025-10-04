import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required in x-wallet-address header' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    let DB;
    try {
      const dbModule = await import('@/services/database/db');
      DB = dbModule;
    } catch (importError) {
      console.error('Database module not available:', importError);
      return res.status(503).json({ 
        error: 'Database service unavailable. Please install dependencies and initialize the database.' 
      });
    }

    const { jobId } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    // Get the scheduled job
    const scheduledJob = await DB.JobDB.getJob(jobId);
    if (!scheduledJob) {
      return res.status(404).json({ error: 'Scheduled job not found' });
    }

    // Verify job belongs to wallet
    if (scheduledJob.wallet_address !== walletAddress) {
      return res.status(403).json({ error: 'Unauthorized access to job' });
    }

    // Verify it's a scheduled job
    if (!scheduledJob.is_scheduled) {
      return res.status(400).json({ error: 'Job is not a scheduled job' });
    }

    // Create a new job instance based on the scheduled job
    const newJob = await DB.JobDB.createJob({
      wallet_address: walletAddress,
      name: scheduledJob.name,
      description: scheduledJob.description,
      initial_message: scheduledJob.initial_message,
      status: 'running', // Set to running since we'll execute it immediately
      has_uploaded_file: scheduledJob.has_uploaded_file,
      is_scheduled: false, // This is a regular job instance
      schedule_type: null,
      schedule_time: null,
      next_run_time: null,
      interval_days: null,
      is_active: true,
      last_run_at: null,
      run_count: 0,
      max_runs: null,
      timezone: scheduledJob.timezone
    });

    // Update the scheduled job's run count and last run time
    const now = new Date();
    let nextRunTime: Date | null = null;
    
    // Calculate next run time if it's not a one-time job
    if (scheduledJob.schedule_type && scheduledJob.schedule_type !== 'once') {
      const JobsAPI = await import('@/services/api-clients/jobs');
      nextRunTime = JobsAPI.default.calculateNextRunTime(
        scheduledJob.schedule_type,
        now,
        scheduledJob.interval_days || undefined
      );
    }

    // Update the scheduled job
    await DB.JobDB.updateJob(jobId, {
      run_count: scheduledJob.run_count + 1,
      last_run_at: now,
      next_run_time: nextRunTime,
      // Deactivate if it was a one-time job or reached max runs
      is_active: scheduledJob.schedule_type === 'once' ? false :
                 (scheduledJob.max_runs && scheduledJob.run_count + 1 >= scheduledJob.max_runs) ? false :
                 scheduledJob.is_active
    });

    // Execute the job immediately by calling the orchestration endpoint
    try {
      // Import axios for making HTTP request
      const axios = (await import('axios')).default;

      // Get the base URL from the request
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const baseURL = `${protocol}://${host}`;

      // Create the user message for the new job
      await DB.JobDB.createMessage({
        job_id: newJob.id,
        role: 'user',
        content: scheduledJob.initial_message,
        order_index: 0,
      });

      // Call the orchestration endpoint to execute the job
      // Use a background request so we don't wait for completion
      axios.post(`${baseURL}/api/v1/chat/orchestrate`, {
        prompt: { role: 'user', content: scheduledJob.initial_message },
        chatHistory: [],
        conversationId: newJob.id,
        useResearch: true,
        walletAddress: walletAddress,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        timeout: 120000, // 2 minute timeout
      }).catch(error => {
        console.error('Background job execution error:', error);
        // Update job status to failed
        DB.JobDB.updateJob(newJob.id, { status: 'failed' });
      });

      // Don't wait for orchestration to complete - return immediately
      console.log(`Job ${newJob.id} execution started in background`);

    } catch (error) {
      console.error('Error starting job execution:', error);
      // Update job status to failed if we couldn't start execution
      await DB.JobDB.updateJob(newJob.id, { status: 'failed' });
    }

    return res.status(201).json({
      message: 'Job created and execution started',
      newJob,
      scheduledJob: await DB.JobDB.getJob(jobId) // Return updated scheduled job
    });

  } catch (error) {
    console.error('Run job API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}