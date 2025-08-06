import { NextApiRequest, NextApiResponse } from 'next';
import { JobDB, MessageDB } from '@/services/Database/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query;
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required in x-wallet-address header' });
  }

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    let DB;
    try {
      const dbModule = await import('@/services/Database/db');
      DB = dbModule;
    } catch (importError) {
      console.error('Database module not available:', importError);
      return res.status(503).json({ 
        error: 'Database service unavailable. Please install dependencies and initialize the database.' 
      });
    }

    // Verify job belongs to wallet
    const job = await DB.JobDB.getJob(jobId);
    if (!job || job.wallet_address !== walletAddress) {
      return res.status(404).json({ error: 'Job not found' });
    }

    switch (req.method) {
      case 'GET':
        const messages = await DB.MessageDB.getMessagesByJob(jobId);
        return res.status(200).json({ messages });

      case 'POST':
        const { 
          role, 
          content, 
          response_type, 
          agent_name, 
          error_message, 
          metadata, 
          requires_action, 
          action_type, 
          is_streaming,
          order_index
        } = req.body;

        if (!role || !content) {
          return res.status(400).json({ 
            error: 'role and content are required' 
          });
        }

        // Get current message count to determine order_index
        const existingMessages = await DB.MessageDB.getMessagesByJob(jobId);
        const nextOrderIndex = order_index !== undefined ? order_index : existingMessages.length;

        const newMessage = await DB.MessageDB.createMessage({
          job_id: jobId,
          role,
          content,
          response_type,
          agent_name,
          error_message,
          metadata: metadata || {},
          requires_action: requires_action || false,
          action_type,
          is_streaming: is_streaming || false,
          order_index: nextOrderIndex
        });

        return res.status(201).json({ message: newMessage });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Messages API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}