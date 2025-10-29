import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    let DB, pool;
    try {
      const dbModule = await import('@/services/database/db');
      DB = dbModule;
      pool = dbModule.pool;
    } catch (importError) {
      console.error('Database module not available:', importError);
      return res.status(503).json({
        error:
          'Database service unavailable. Please install dependencies and initialize the database.',
      });
    }

    // Get total jobs and calculate the average rate
    const totalJobs = await DB.JobDB.getTotalCompletedJobsCount();

    // Calculate average job completion rate (jobs per minute)
    // Query for jobs completed in the last hour to get a recent rate
    const query = `
      SELECT COUNT(*) as recent_jobs
      FROM jobs 
      WHERE status = 'completed' 
      AND completed_at >= NOW() - INTERVAL '1 hour';
    `;
    const result = await pool.query(query);
    const jobsLastHour = parseInt(result.rows[0].recent_jobs, 10) || 0;

    // Calculate jobs per minute based on last hour's data
    // If no jobs in last hour, use a conservative estimate
    const jobsPerMinute = jobsLastHour > 0 ? jobsLastHour / 60 : 0.05;

    console.log('Stats API response:', {
      totalJobs,
      jobsLastHour,
      jobsPerMinute,
    });

    return res.status(200).json({
      totalJobs,
      jobsPerMinute,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Comprehensive Stats API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
