import { NextApiRequest, NextApiResponse } from 'next';
import { SharedJobDB } from '@/services/database/db';
import { createSafeErrorResponse } from '@/services/utils/errors';
import { trackEvent } from '@/services/analytics';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid share token' });
  }

  try {
    const sharedJobData = await SharedJobDB.getByToken(token);

    if (!sharedJobData) {
      // Track access to non-existent or expired shares
      trackEvent('shared_job.access_failed', {
        token: token.substring(0, 8) + '...', // Log partial token for debugging
        reason: 'not_found_or_expired',
        userAgent: req.headers['user-agent'],
        ip: (req.headers['x-forwarded-for'] as string) || req.connection.remoteAddress,
      });

      return res.status(404).json({ 
        error: 'Shared job not found or has expired' 
      });
    }

    // Track successful access
    trackEvent('shared_job.accessed', {
      jobId: sharedJobData.job_id,
      shareId: sharedJobData.id,
      viewCount: sharedJobData.view_count,
      hasCustomTitle: !!sharedJobData.title,
      hasCustomDescription: !!sharedJobData.description,
      messageCount: sharedJobData.messages.length,
      jobStatus: sharedJobData.job.status,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer as string,
    });

    // Return job data with messages
    return res.status(200).json({
      job: sharedJobData.job,
      messages: sharedJobData.messages,
      share: {
        title: sharedJobData.title,
        description: sharedJobData.description,
        viewCount: sharedJobData.view_count,
        createdAt: sharedJobData.created_at,
        expiresAt: sharedJobData.expires_at,
      }
    });

  } catch (error) {
    console.error('Error fetching shared job:', error);
    
    // Track API errors
    trackEvent('shared_job.api_error', {
      token: token.substring(0, 8) + '...',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const { error: errorMessage, statusCode } = createSafeErrorResponse(error);
    return res.status(statusCode).json({ error: errorMessage });
  }
}