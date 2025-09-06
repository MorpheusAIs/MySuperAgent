import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/services/database/db';

// Configuration for cleanup thresholds
const CLEANUP_CONFIG = {
  RUNNING_JOB_TIMEOUT_MINUTES: 10, // Jobs running for more than 10 minutes
  PENDING_JOB_TIMEOUT_MINUTES: 30, // Jobs pending for more than 30 minutes
  MAX_RETRY_ATTEMPTS: 3, // Maximum retry attempts for failed cleanup operations
  CLEANUP_BATCH_SIZE: 50, // Process jobs in batches to avoid overwhelming the system
};

interface StuckJob {
  id: string;
  wallet_address: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  minutes_stuck: number;
}

interface CleanupResult {
  success: boolean;
  processed: number;
  rescued: number;
  failed: number;
  errors: string[];
  stuckJobs: StuckJob[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CleanupResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      processed: 0,
      rescued: 0,
      failed: 0,
      errors: ['Method not allowed'],
      stuckJobs: []
    });
  }

  const startTime = Date.now();
  console.log('[JOB CLEANUP] Starting cleanup process');

  try {
    const result = await performJobCleanup();
    
    const processingTime = Date.now() - startTime;
    console.log(`[JOB CLEANUP] Completed in ${processingTime}ms:`, result);
    
    return res.status(200).json(result);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[JOB CLEANUP] Failed after ${processingTime}ms:`, error);
    
    return res.status(500).json({
      success: false,
      processed: 0,
      rescued: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown cleanup error'],
      stuckJobs: []
    });
  }
}

async function performJobCleanup(): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: false,
    processed: 0,
    rescued: 0,
    failed: 0,
    errors: [],
    stuckJobs: []
  };

  try {
    // Find stuck jobs
    const stuckJobs = await findStuckJobs();
    result.stuckJobs = stuckJobs;
    result.processed = stuckJobs.length;

    console.log(`[JOB CLEANUP] Found ${stuckJobs.length} stuck jobs`);

    // Process stuck jobs in batches
    const batches = chunkArray(stuckJobs, CLEANUP_CONFIG.CLEANUP_BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`[JOB CLEANUP] Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} jobs)`);
      
      const batchResults = await Promise.allSettled(
        batch.map(job => rescueStuckJob(job))
      );
      
      // Process batch results
      batchResults.forEach((batchResult, index) => {
        const job = batch[index];
        if (batchResult.status === 'fulfilled' && batchResult.value.success) {
          result.rescued++;
          console.log(`[JOB CLEANUP] Rescued job ${job.id} (${job.name})`);
        } else {
          result.failed++;
          const error = batchResult.status === 'rejected' 
            ? batchResult.reason 
            : batchResult.value.error;
          result.errors.push(`Job ${job.id}: ${error}`);
          console.error(`[JOB CLEANUP] Failed to rescue job ${job.id}:`, error);
        }
      });
    }

    result.success = result.errors.length === 0;
    
    return result;
  } catch (error) {
    console.error('[JOB CLEANUP] Cleanup process failed:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error during cleanup');
    return result;
  }
}

async function findStuckJobs(): Promise<StuckJob[]> {
  const query = `
    SELECT 
      id,
      wallet_address,
      name,
      status,
      created_at,
      updated_at,
      EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_stuck
    FROM jobs 
    WHERE 
      (status = 'running' AND updated_at < NOW() - INTERVAL '${CLEANUP_CONFIG.RUNNING_JOB_TIMEOUT_MINUTES} minutes')
      OR 
      (status = 'pending' AND created_at < NOW() - INTERVAL '${CLEANUP_CONFIG.PENDING_JOB_TIMEOUT_MINUTES} minutes')
    ORDER BY updated_at ASC
    LIMIT ${CLEANUP_CONFIG.CLEANUP_BATCH_SIZE * 5}; -- Limit total jobs to process
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('[JOB CLEANUP] Failed to find stuck jobs:', error);
    throw new Error(`Database query failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function rescueStuckJob(job: StuckJob): Promise<{ success: boolean; error?: string }> {
  const jobId = job.id;
  const walletAddress = job.wallet_address;
  
  try {
    console.log(`[JOB CLEANUP] Attempting to rescue job ${jobId} (stuck for ${Math.round(job.minutes_stuck)} minutes)`);

    // Check if job has any messages
    const messages = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE job_id = $1',
      [jobId]
    );
    
    const hasMessages = parseInt(messages.rows[0].count) > 0;
    
    if (!hasMessages) {
      // Job has no messages at all - likely created but never processed
      console.log(`[JOB CLEANUP] Job ${jobId} has no messages, marking as failed`);
      
      await pool.query(
        `UPDATE jobs SET 
           status = 'failed', 
           updated_at = NOW(),
           completed_at = NOW()
         WHERE id = $1`,
        [jobId]
      );
      
      // Add error message to explain what happened
      await pool.query(
        `INSERT INTO messages (job_id, role, content, response_type, error_message, metadata, order_index, created_at)
         VALUES ($1, 'assistant', $2, 'error', $3, $4, 0, NOW())`,
        [
          jobId,
          'This job was automatically cancelled due to a system timeout. Please try your request again.',
          'Job cleanup: No processing occurred within timeout period',
          JSON.stringify({
            autoCleanup: true,
            cleanupReason: 'no_processing',
            minutesStuck: Math.round(job.minutes_stuck),
            cleanupTime: new Date().toISOString()
          })
        ]
      );
      
      return { success: true };
    } else {
      // Job has messages but is stuck - check if it has assistant response
      const assistantMessages = await pool.query(
        'SELECT COUNT(*) as count FROM messages WHERE job_id = $1 AND role = $2',
        [jobId, 'assistant']
      );
      
      const hasAssistantResponse = parseInt(assistantMessages.rows[0].count) > 0;
      
      if (hasAssistantResponse) {
        // Job has assistant response but status is wrong - fix status
        console.log(`[JOB CLEANUP] Job ${jobId} has responses but wrong status, correcting to completed`);
        
        await pool.query(
          `UPDATE jobs SET 
             status = 'completed', 
             updated_at = NOW(),
             completed_at = NOW()
           WHERE id = $1`,
          [jobId]
        );
        
        return { success: true };
      } else {
        // Job has user message but no assistant response - it's truly stuck
        console.log(`[JOB CLEANUP] Job ${jobId} is truly stuck, marking as failed and adding explanation`);
        
        await pool.query(
          `UPDATE jobs SET 
             status = 'failed', 
             updated_at = NOW(),
             completed_at = NOW()
           WHERE id = $1`,
          [jobId]
        );
        
        // Get the next order index
        const maxOrderResult = await pool.query(
          'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM messages WHERE job_id = $1',
          [jobId]
        );
        const nextOrder = parseInt(maxOrderResult.rows[0].next_order);
        
        // Add error message to explain what happened
        await pool.query(
          `INSERT INTO messages (job_id, role, content, response_type, error_message, metadata, order_index, created_at)
           VALUES ($1, 'assistant', $2, 'error', $3, $4, $5, NOW())`,
          [
            jobId,
            'This job was automatically cancelled due to a system processing failure. The AI agent system encountered an issue. Please try your request again.',
            `Job cleanup: Processing failed after ${Math.round(job.minutes_stuck)} minutes`,
            JSON.stringify({
              autoCleanup: true,
              cleanupReason: 'processing_failure',
              minutesStuck: Math.round(job.minutes_stuck),
              cleanupTime: new Date().toISOString()
            }),
            nextOrder
          ]
        );
        
        return { success: true };
      }
    }
  } catch (error) {
    console.error(`[JOB CLEANUP] Failed to rescue job ${jobId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}