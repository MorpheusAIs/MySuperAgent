import { NextApiRequest, NextApiResponse } from 'next';
import { SharedJobDB, JobDB, CreateShareParams } from '@/services/database/db';
import { 
  ValidationError, 
  createSafeErrorResponse, 
  validateRequired 
} from '@/services/utils/errors';

interface CreateShareRequest {
  title?: string;
  description?: string;
  expiresIn?: number; // days
  isPublic?: boolean;
}

interface UpdateShareRequest {
  title?: string;
  description?: string;
  isPublic?: boolean;
  expiresAt?: string; // ISO date string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { jobId } = req.query;
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res.status(401).json({ error: 'Wallet address required' });
  }

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  try {
    // Verify job exists and belongs to user
    const job = await JobDB.getJob(jobId);
    if (!job || job.wallet_address !== walletAddress) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Only allow sharing completed jobs
    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed jobs can be shared' });
    }

    switch (req.method) {
      case 'POST':
        return await handleCreateShare(req, res, jobId, walletAddress);
      case 'PUT':
        return await handleUpdateShare(req, res, jobId, walletAddress);
      case 'DELETE':
        return await handleDeleteShare(req, res, jobId, walletAddress);
      case 'GET':
        return await handleGetShare(req, res, jobId, walletAddress);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in share API:', error);
    const { error: errorMessage, statusCode } = createSafeErrorResponse(error);
    return res.status(statusCode).json({ error: errorMessage });
  }
}

async function handleCreateShare(
  req: NextApiRequest,
  res: NextApiResponse,
  jobId: string,
  walletAddress: string
) {
  const body: CreateShareRequest = req.body;

  // Calculate expiration date if provided
  let expires_at: Date | undefined;
  if (body.expiresIn && body.expiresIn > 0) {
    expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + body.expiresIn);
  }

  const shareParams: CreateShareParams = {
    job_id: jobId,
    wallet_address: walletAddress,
    title: body.title,
    description: body.description,
    is_public: body.isPublic ?? true,
    expires_at,
  };

  const sharedJob = await SharedJobDB.createShare(shareParams);
  
  // Generate full share URL
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const shareUrl = `${protocol}://${host}/shared/${sharedJob.share_token}`;

  return res.status(200).json({
    shareToken: sharedJob.share_token,
    shareUrl,
    sharedJob,
  });
}

async function handleUpdateShare(
  req: NextApiRequest,
  res: NextApiResponse,
  jobId: string,
  walletAddress: string
) {
  const body: UpdateShareRequest = req.body;

  const updates: Partial<Pick<typeof body, 'title' | 'description' | 'isPublic'>> & { expires_at?: Date } = {};
  
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.isPublic !== undefined) updates.is_public = body.isPublic;
  if (body.expiresAt) updates.expires_at = new Date(body.expiresAt);

  const updatedShare = await SharedJobDB.updateShare(jobId, walletAddress, updates);
  
  return res.status(200).json({ sharedJob: updatedShare });
}

async function handleDeleteShare(
  req: NextApiRequest,
  res: NextApiResponse,
  jobId: string,
  walletAddress: string
) {
  await SharedJobDB.deleteShare(jobId, walletAddress);
  return res.status(200).json({ success: true });
}

async function handleGetShare(
  req: NextApiRequest,
  res: NextApiResponse,
  jobId: string,
  walletAddress: string
) {
  const sharedJob = await SharedJobDB.getShareByJobId(jobId, walletAddress);
  
  if (!sharedJob) {
    return res.status(404).json({ error: 'Share not found' });
  }

  // Generate full share URL
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const shareUrl = `${protocol}://${host}/shared/${sharedJob.share_token}`;

  return res.status(200).json({
    sharedJob,
    shareUrl,
  });
}