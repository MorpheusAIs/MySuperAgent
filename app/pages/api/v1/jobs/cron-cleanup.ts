import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/services/database/db';

// This endpoint is designed to be called by external cron services
// like Vercel Cron, GitHub Actions, or external monitoring services

interface CronCleanupResult {
  success: boolean;
  timestamp: string;
  dbTimeoutProcessed: number;
  apiCleanupProcessed: number;
  totalRescued: number;
  errors: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CronCleanupResult>
) {
  // Allow both GET (for Vercel cron) and POST requests
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      timestamp: new Date().toISOString(),
      dbTimeoutProcessed: 0,
      apiCleanupProcessed: 0,
      totalRescued: 0,
      errors: ['Method not allowed']
    });
  }

  // Optional authentication for cron jobs
  const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;
  if (cronSecret) {
    const providedSecret = req.headers.authorization?.replace('Bearer ', '') || req.query.secret;
    if (providedSecret !== cronSecret) {
      return res.status(401).json({
        success: false,
        timestamp: new Date().toISOString(),
        dbTimeoutProcessed: 0,
        apiCleanupProcessed: 0,
        totalRescued: 0,
        errors: ['Unauthorized - invalid cron secret']
      });
    }
  }

  const startTime = Date.now();
  console.log('[CRON CLEANUP] Starting scheduled cleanup process');

  const result: CronCleanupResult = {
    success: false,
    timestamp: new Date().toISOString(),
    dbTimeoutProcessed: 0,
    apiCleanupProcessed: 0,
    totalRescued: 0,
    errors: []
  };

  try {
    // Step 1: Run database timeout function
    console.log('[CRON CLEANUP] Running database timeout handler');
    try {
      await pool.query('SELECT handle_job_timeouts()');
      console.log('[CRON CLEANUP] Database timeout handler completed');
    } catch (dbError) {
      const errorMsg = `Database timeout handler failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`;
      console.error('[CRON CLEANUP]', errorMsg);
      result.errors.push(errorMsg);
    }

    // Step 2: Check how many jobs were processed by the timeout function
    try {
      const timeoutCheck = await pool.query(`
        SELECT COUNT(*) as count 
        FROM jobs 
        WHERE status = 'failed' 
          AND updated_at > NOW() - INTERVAL '2 minutes'
          AND EXISTS (
            SELECT 1 FROM messages m 
            WHERE m.job_id = jobs.id 
              AND m.metadata::jsonb ? 'autoTimeout'
              AND m.created_at > NOW() - INTERVAL '2 minutes'
          )
      `);
      result.dbTimeoutProcessed = parseInt(timeoutCheck.rows[0].count) || 0;
    } catch (countError) {
      console.error('[CRON CLEANUP] Failed to count timeout-processed jobs:', countError);
    }

    // Step 3: Call the full cleanup API for any remaining edge cases
    console.log('[CRON CLEANUP] Running comprehensive cleanup');
    try {
      const cleanupResponse = await fetch(`${getBaseUrl(req)}/api/v1/jobs/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (cleanupResponse.ok) {
        const cleanupData = await cleanupResponse.json();
        result.apiCleanupProcessed = cleanupData.processed || 0;
        result.totalRescued += cleanupData.rescued || 0;
        
        if (cleanupData.errors && cleanupData.errors.length > 0) {
          result.errors.push(...cleanupData.errors);
        }
      } else {
        const errorMsg = `Cleanup API returned ${cleanupResponse.status}: ${cleanupResponse.statusText}`;
        console.error('[CRON CLEANUP]', errorMsg);
        result.errors.push(errorMsg);
      }
    } catch (apiError) {
      const errorMsg = `Cleanup API call failed: ${apiError instanceof Error ? apiError.message : String(apiError)}`;
      console.error('[CRON CLEANUP]', errorMsg);
      result.errors.push(errorMsg);
    }

    result.totalRescued += result.dbTimeoutProcessed;
    result.success = result.errors.length === 0;

    const processingTime = Date.now() - startTime;
    console.log(`[CRON CLEANUP] Completed in ${processingTime}ms:`, {
      dbTimeoutProcessed: result.dbTimeoutProcessed,
      apiCleanupProcessed: result.apiCleanupProcessed,
      totalRescued: result.totalRescued,
      errors: result.errors.length
    });

    // Return appropriate HTTP status
    const statusCode = result.success ? 200 : (result.totalRescued > 0 ? 207 : 500);
    return res.status(statusCode).json(result);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[CRON CLEANUP] Critical failure after ${processingTime}ms:`, error);
    
    result.errors.push(error instanceof Error ? error.message : 'Unknown error during cron cleanup');
    return res.status(500).json(result);
  }
}

function getBaseUrl(req: NextApiRequest): string {
  const protocol = req.headers['x-forwarded-proto'] || (req.connection as any)?.encrypted ? 'https' : 'http';
  const host = req.headers.host;
  return `${protocol}://${host}`;
}

// For local testing, you can call this endpoint like:
// curl -X POST http://localhost:3000/api/v1/jobs/cron-cleanup
// 
// For production with secret:
// curl -X POST https://your-domain.com/api/v1/jobs/cron-cleanup \
//   -H "Authorization: Bearer your-cron-secret"