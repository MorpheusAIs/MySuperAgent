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
    const stats = {
      totalJobs,
      recurringJobs,
      activeScheduledJobs,
      completedToday,
      timeSavedHours: Math.round(avgTimesSaved || 0),
      // Add some derived metrics
      efficiencyScore: totalJobs > 0 ? Math.min(100, Math.round((totalJobs / 100) * 95 + 5)) : 0,
      uptime: '99.9%', // Static for now - could be calculated from server uptime
    };

    // Create carousel messages with similar lengths (WITHOUT "Neo" prefix - that's handled by the frontend)
    const carouselMessages = [
      `has completed ${stats.totalJobs.toLocaleString()} total jobs`,
      `handles ${stats.recurringJobs} recurring jobs daily`,
      `has saved ${stats.timeSavedHours} hours of work time`,
      `completed ${stats.completedToday} jobs just today`,
      stats.activeScheduledJobs > 0 ? `manages ${stats.activeScheduledJobs} scheduled tasks now` : null,
      stats.efficiencyScore > 50 ? `operates at ${stats.efficiencyScore}% efficiency rate` : null,
      `maintains ${stats.uptime} service uptime`
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