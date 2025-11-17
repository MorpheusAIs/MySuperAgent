import type { NextApiRequest, NextApiResponse } from 'next';
import { isUserWhitelisted } from '@/services/metrics/whitelist';
import { JobDB, MessageDB, UserAvailableToolDB, UserMCPServerDB, FailureMetricsDB } from '@/services/database/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user email and walletID from headers or query
    const email = (req.headers['x-user-email'] as string) || (req.query.email as string) || null;
    const walletID = (req.headers['x-wallet-address'] as string) || (req.query.walletID as string) || null;

    // Check if user is whitelisted
    if (!isUserWhitelisted(email, walletID)) {
      return res.status(403).json({ error: 'Access denied. You are not whitelisted for metrics access.' });
    }

    // Fetch all metrics data
    const [
      dailyJobCounts,
      jobStatusDistribution,
      totalJobs,
      jobsToday,
      uniqueUsers,
      mcpServerUsage,
      mcpToolUsage,
      agentUsage,
      mcpServerAdoption,
      totalMCPServers,
      totalMCPTools,
    ] = await Promise.all([
      JobDB.getDailyJobCounts(30),
      JobDB.getJobStatusDistribution(),
      JobDB.getTotalJobsCount(),
      JobDB.getJobsCreatedToday(),
      JobDB.getUniqueUsersCount(),
      MessageDB.getMCPServerUsageStats(),
      MessageDB.getMCPToolUsageStats(),
      MessageDB.getAgentUsageStats(),
      UserAvailableToolDB.getMCPServerAdoptionStats(),
      UserAvailableToolDB.getTotalMCPServersCount(),
      UserAvailableToolDB.getTotalMCPToolsCount(),
    ]);

    // Calculate trends
    const last7Days = dailyJobCounts.slice(-7);
    const previous7Days = dailyJobCounts.slice(-14, -7);
    const last7DaysTotal = last7Days.reduce((sum, day) => sum + day.count, 0);
    const previous7DaysTotal = previous7Days.reduce((sum, day) => sum + day.count, 0);
    const jobGrowthRate = previous7DaysTotal > 0 
      ? ((last7DaysTotal - previous7DaysTotal) / previous7DaysTotal) * 100 
      : 0;

    // Get date range for MCP usage
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const mcpUsageLast30Days = await MessageDB.getMCPUsageByDateRange(thirtyDaysAgo, now);

    // Fetch failure metrics (handle case where table doesn't exist yet)
    let failureData = null;
    try {
      const failureStats = await FailureMetricsDB.getFailureStats();
      const recentFailures = await FailureMetricsDB.getFailureMetrics({
        isFailure: true,
        limit: 50,
      });

      // Get request themes and tags
      const allMetrics = await FailureMetricsDB.getFailureMetrics({
        limit: 1000,
      });

      const themeCounts: Record<string, number> = {};
      const tagCounts: Record<string, number> = {};
      allMetrics.forEach((metric) => {
        if (metric.request_theme) {
          themeCounts[metric.request_theme] = (themeCounts[metric.request_theme] || 0) + 1;
        }
        if (metric.detected_tags && Array.isArray(metric.detected_tags)) {
          metric.detected_tags.forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const requestThemes = Object.entries(themeCounts)
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      const tagDistribution = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

      failureData = {
        stats: failureStats,
        recentFailures: recentFailures.slice(0, 20),
        requestThemes,
        tagDistribution,
      };
    } catch (error) {
      // Table might not exist yet - log but don't fail the whole request
      console.warn('[Metrics] Failure metrics table may not exist yet:', error instanceof Error ? error.message : String(error));
      failureData = null;
    }

    // Fetch Vercel metrics if available
    let vercelMetrics = null;
    try {
      const vercelResponse = await fetch(`${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/api/metrics/vercel?email=${encodeURIComponent(email || '')}&walletID=${encodeURIComponent(walletID || '')}`, {
        headers: {
          'x-user-email': email || '',
          'x-wallet-address': walletID || '',
        },
      });
      if (vercelResponse.ok) {
        vercelMetrics = await vercelResponse.json();
      }
    } catch (error) {
      console.error('Error fetching Vercel metrics:', error);
      // Continue without Vercel metrics
    }

    return res.status(200).json({
      jobs: {
        dailyCounts: dailyJobCounts,
        statusDistribution: jobStatusDistribution,
        total: totalJobs,
        today: jobsToday,
        growthRate: jobGrowthRate,
        last7DaysTotal,
        previous7DaysTotal,
      },
      users: {
        unique: uniqueUsers,
      },
      mcp: {
        serverUsage: mcpServerUsage,
        toolUsage: mcpToolUsage,
        serverAdoption: mcpServerAdoption,
        totalServers: totalMCPServers,
        totalTools: totalMCPTools,
        usageLast30Days: mcpUsageLast30Days,
      },
      agents: {
        usage: agentUsage,
      },
      failures: failureData,
      vercel: vercelMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

