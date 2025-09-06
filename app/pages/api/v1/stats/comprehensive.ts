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
    let DB;
    try {
      const dbModule = await import('@/services/database/db');
      DB = dbModule;
    } catch (importError) {
      console.error('Database module not available:', importError);
      return res.status(503).json({
        error: 'Database service unavailable. Please install dependencies and initialize the database.',
      });
    }

    // Get comprehensive job statistics
    const [
      totalJobs,
      recurringJobs,
      activeScheduledJobs,
      completedToday,
      avgTimesSaved
    ] = await Promise.all([
      DB.JobDB.getTotalCompletedJobsCount(),
      DB.JobDB.getRecurringJobsCount(),
      DB.JobDB.getActiveScheduledJobsCount(),
      DB.JobDB.getCompletedJobsToday(),
      DB.JobDB.calculateTimeSaved()
    ]);

    // Calculate additional metrics
    const humanEquivalentHours = Math.round(avgTimesSaved || 0);
    const totalIncomeEarned = Math.round(humanEquivalentHours * 15); // $15/hour multiplier
    
    const stats = {
      totalJobs,
      recurringJobs,
      activeScheduledJobs,
      completedToday,
      humanEquivalentHours,
      totalIncomeEarned,
    };

    // Create carousel messages with similar lengths (WITHOUT "Neo" prefix - that's handled by the frontend)
    const carouselMessages = [
      `has completed ${stats.totalJobs.toLocaleString()} total jobs to date`,
      `handles ${stats.recurringJobs} recurring jobs actively`,
      `has worked ${stats.humanEquivalentHours} human equivalent hours`,
      `completed ${stats.completedToday} jobs over the past day`,
      stats.totalIncomeEarned > 0 ? `has earned $${stats.totalIncomeEarned.toLocaleString()} for humans so far` : null,
    ].filter(Boolean); // Remove null messages

    return res.status(200).json({
      stats,
      carouselMessages,
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