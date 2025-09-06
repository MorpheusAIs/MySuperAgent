import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '@/services/database/db';

interface OrchestrationHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: {
      status: 'pass' | 'fail';
      responseTime?: number;
      error?: string;
    };
    stuckJobs: {
      status: 'pass' | 'warn' | 'fail';
      count: number;
      details: string;
    };
    recentFailures: {
      status: 'pass' | 'warn' | 'fail';
      count: number;
      details: string;
    };
  };
  recommendations: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrchestrationHealthCheck>
) {
  const startTime = Date.now();
  
  const healthCheck: OrchestrationHealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'pass' },
      stuckJobs: { status: 'pass', count: 0, details: '' },
      recentFailures: { status: 'pass', count: 0, details: '' }
    },
    recommendations: []
  };

  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    try {
      await Database.query('SELECT 1');
      healthCheck.checks.database.responseTime = Date.now() - dbStartTime;
    } catch (dbError) {
      healthCheck.checks.database.status = 'fail';
      healthCheck.checks.database.error = dbError instanceof Error ? dbError.message : String(dbError);
      healthCheck.status = 'unhealthy';
    }

    // Check for stuck jobs (running > 10 mins, pending > 30 mins)
    try {
      const stuckJobsQuery = `
        SELECT COUNT(*) as count
        FROM jobs 
        WHERE 
          (status = 'running' AND updated_at < NOW() - INTERVAL '10 minutes')
          OR 
          (status = 'pending' AND created_at < NOW() - INTERVAL '30 minutes')
      `;
      
      const stuckResult = await Database.query(stuckJobsQuery);
      const stuckCount = parseInt(stuckResult.rows[0].count);
      
      healthCheck.checks.stuckJobs.count = stuckCount;
      
      if (stuckCount === 0) {
        healthCheck.checks.stuckJobs.details = 'No stuck jobs found';
      } else if (stuckCount <= 5) {
        healthCheck.checks.stuckJobs.status = 'warn';
        healthCheck.checks.stuckJobs.details = `${stuckCount} jobs may be stuck`;
        healthCheck.status = healthCheck.status === 'healthy' ? 'degraded' : healthCheck.status;
        healthCheck.recommendations.push('Consider running job cleanup service');
      } else {
        healthCheck.checks.stuckJobs.status = 'fail';
        healthCheck.checks.stuckJobs.details = `${stuckCount} jobs are stuck - system may be overloaded`;
        healthCheck.status = 'unhealthy';
        healthCheck.recommendations.push('Immediate job cleanup required - check orchestration service');
      }
    } catch (stuckError) {
      healthCheck.checks.stuckJobs.status = 'fail';
      healthCheck.checks.stuckJobs.details = `Failed to check stuck jobs: ${stuckError}`;
      healthCheck.status = 'unhealthy';
    }

    // Check recent failure rate (last hour)
    try {
      const failureQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
        FROM jobs 
        WHERE created_at > NOW() - INTERVAL '1 hour'
      `;
      
      const failureResult = await Database.query(failureQuery);
      const total = parseInt(failureResult.rows[0].total);
      const failed = parseInt(failureResult.rows[0].failed);
      const failureRate = total > 0 ? (failed / total) * 100 : 0;
      
      healthCheck.checks.recentFailures.count = failed;
      
      if (total === 0) {
        healthCheck.checks.recentFailures.details = 'No recent job activity';
      } else if (failureRate <= 10) {
        healthCheck.checks.recentFailures.details = `${failed}/${total} jobs failed (${failureRate.toFixed(1)}% failure rate)`;
      } else if (failureRate <= 30) {
        healthCheck.checks.recentFailures.status = 'warn';
        healthCheck.checks.recentFailures.details = `${failed}/${total} jobs failed (${failureRate.toFixed(1)}% failure rate - elevated)`;
        healthCheck.status = healthCheck.status === 'healthy' ? 'degraded' : healthCheck.status;
        healthCheck.recommendations.push('Monitor orchestration system - elevated failure rate');
      } else {
        healthCheck.checks.recentFailures.status = 'fail';
        healthCheck.checks.recentFailures.details = `${failed}/${total} jobs failed (${failureRate.toFixed(1)}% failure rate - critical)`;
        healthCheck.status = 'unhealthy';
        healthCheck.recommendations.push('Critical: Orchestration system may be down - investigate immediately');
      }
    } catch (failureError) {
      healthCheck.checks.recentFailures.status = 'fail';
      healthCheck.checks.recentFailures.details = `Failed to check recent failures: ${failureError}`;
      healthCheck.status = 'unhealthy';
    }

    // Additional recommendations based on overall health
    if (healthCheck.status === 'unhealthy') {
      healthCheck.recommendations.unshift('System is unhealthy - immediate attention required');
    } else if (healthCheck.status === 'degraded') {
      healthCheck.recommendations.unshift('System is degraded - monitoring recommended');
    }

    // Return appropriate HTTP status code
    let statusCode = 200;
    if (healthCheck.status === 'degraded') {
      statusCode = 200; // Still OK, but with warnings
    } else if (healthCheck.status === 'unhealthy') {
      statusCode = 503; // Service unavailable
    }

    return res.status(statusCode).json(healthCheck);

  } catch (error) {
    console.error('[ORCHESTRATION HEALTH] Health check failed:', error);
    
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'fail', error: 'Health check failed' },
        stuckJobs: { status: 'fail', count: -1, details: 'Unable to check' },
        recentFailures: { status: 'fail', count: -1, details: 'Unable to check' }
      },
      recommendations: ['Health check system failure - manual investigation required']
    });
  }
}