import { NextApiRequest, NextApiResponse } from 'next';
import { FailureMetricsDB } from '@/services/database/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = await FailureMetricsDB.getFailureStats();
    const recentFailures = await FailureMetricsDB.getFailureMetrics({
      isFailure: true,
      limit: 50,
    });

    // Get request themes (what people are requesting)
    const allMetrics = await FailureMetricsDB.getFailureMetrics({
      limit: 1000, // Get enough to analyze themes
    });

    // Group by theme
    const themeCounts: Record<string, number> = {};
    allMetrics.forEach((metric) => {
      if (metric.request_theme) {
        themeCounts[metric.request_theme] =
          (themeCounts[metric.request_theme] || 0) + 1;
      }
    });

    const requestThemes = Object.entries(themeCounts)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Get tag distribution
    const tagCounts: Record<string, number> = {};
    allMetrics.forEach((metric) => {
      if (metric.detected_tags && Array.isArray(metric.detected_tags)) {
        metric.detected_tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const tagDistribution = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      stats,
      recentFailures: recentFailures.slice(0, 20),
      requestThemes,
      tagDistribution,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Metrics Failures] Error:', error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

