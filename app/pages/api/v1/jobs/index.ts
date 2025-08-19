import { NextApiRequest, NextApiResponse } from 'next';
import { JobDB, MessageDB } from '@/services/Database/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required in x-wallet-address header' });
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

    switch (req.method) {
      case 'GET':
        const jobs = await DB.JobDB.getJobsByWallet(walletAddress);
        return res.status(200).json({ jobs });

      case 'POST':
        const { 
          name, 
          description, 
          initial_message, 
          is_scheduled,
          has_uploaded_file 
        } = req.body;

        if (!initial_message) {
          return res.status(400).json({ 
            error: 'initial_message is required' 
          });
        }

        const newJob = await DB.JobDB.createJob({
          wallet_address: walletAddress,
          name: name || 'New Job',
          description: description || null,
          initial_message,
          status: 'pending',
          is_scheduled: is_scheduled || false,
          has_uploaded_file: has_uploaded_file || false,
          timezone: 'UTC',
          is_active: true,
          run_count: 0
        });

        return res.status(201).json({ job: newJob });

      case 'PUT':
        const { id, ...updates } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'Job ID is required' });
        }

        // Verify job belongs to wallet
        const existingJob = await DB.JobDB.getJob(id);
        if (!existingJob || existingJob.wallet_address !== walletAddress) {
          return res.status(404).json({ error: 'Job not found' });
        }

        const updatedJob = await DB.JobDB.updateJob(id, updates);
        return res.status(200).json({ job: updatedJob });

      case 'DELETE':
        const { id: deleteId } = req.body;
        
        if (!deleteId) {
          return res.status(400).json({ error: 'Job ID is required' });
        }

        // Verify job belongs to wallet
        const jobToDelete = await DB.JobDB.getJob(deleteId);
        if (!jobToDelete || jobToDelete.wallet_address !== walletAddress) {
          return res.status(404).json({ error: 'Job not found' });
        }

        await DB.JobDB.deleteJob(deleteId);
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Jobs API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}