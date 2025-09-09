import { NextApiRequest, NextApiResponse } from 'next';
import { jobProcessor, JobProcessingResult } from '@/services/jobs/job-processor-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JobProcessingResult | { error: string }>
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[PROCESSOR API] Manual processor run requested');

  try {
    const result = await jobProcessor.processPendingJobs();
    
    if (!result) {
      // Processor was already running or too soon since last run
      return res.status(202).json({
        success: true,
        timestamp: new Date().toISOString(),
        processedJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        errors: ['Processor skipped - already running or minimum interval not met']
      });
    }
    
    console.log('[PROCESSOR API] Manual run completed:', result);
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('[PROCESSOR API] Manual run failed:', error);
    return res.status(500).json({ 
      error: 'Processor run failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
}

// This endpoint can be called by:
// - Vercel cron jobs for serverless processing
// - Manual testing: curl -X POST http://localhost:3000/api/v1/jobs/processor-run
// - External monitoring services