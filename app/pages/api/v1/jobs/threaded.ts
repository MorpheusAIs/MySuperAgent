import { NextApiRequest, NextApiResponse } from 'next';

export interface JobThread {
  id: string;
  name: string;
  description: string | null;
  initial_message: string;
  parent_job_id: string | null;
  is_scheduled: boolean;
  schedule_type?: string | null;
  jobs: Job[];
  latest_job: Job;
  total_runs: number;
  latest_status: string;
  latest_created_at: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res
      .status(400)
      .json({ error: 'Wallet address is required in x-wallet-address header' });
  }

  try {
    let DB;
    try {
      const dbModule = await import('@/services/database/db');
      DB = dbModule;
    } catch (importError) {
      console.error('Database module not available:', importError);
      return res.status(503).json({
        error:
          'Database service unavailable. Please install dependencies and initialize the database.',
      });
    }

    // Get all jobs for the wallet
    const allJobs = await DB.JobDB.getJobsByWallet(walletAddress);

    // Group jobs into threads
    const threadMap = new Map<string, JobThread>();

    for (const job of allJobs) {
      // Determine thread key - use parent_job_id if available, otherwise use name
      const threadKey = job.parent_job_id || job.name;

      if (!threadMap.has(threadKey)) {
        // Create new thread
        threadMap.set(threadKey, {
          id: threadKey,
          name: job.name,
          description: job.description,
          initial_message: job.initial_message,
          parent_job_id: job.parent_job_id,
          is_scheduled: job.is_scheduled,
          schedule_type: job.schedule_type,
          jobs: [],
          latest_job: job,
          total_runs: 0,
          latest_status: job.status,
          latest_created_at: job.created_at,
        });
      }

      const thread = threadMap.get(threadKey)!;
      thread.jobs.push(job);
      thread.total_runs++;

      // Update latest job if this one is newer
      if (new Date(job.created_at) > new Date(thread.latest_created_at)) {
        thread.latest_job = job;
        thread.latest_status = job.status;
        thread.latest_created_at = job.created_at;
      }
    }

    // Convert to array and sort by latest created_at
    const threads = Array.from(threadMap.values()).sort(
      (a, b) =>
        new Date(b.latest_created_at).getTime() -
        new Date(a.latest_created_at).getTime()
    );

    // Sort jobs within each thread by created_at DESC
    threads.forEach((thread) => {
      thread.jobs.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return res.status(200).json({ threads });
  } catch (error) {
    console.error('Error fetching threaded jobs:', error);
    return res.status(500).json({
      error: 'Failed to fetch threaded jobs',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
