import { NextApiRequest, NextApiResponse } from 'next';
import { UserPreferencesDB } from '@/services/Database/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required in x-wallet-address header' });
  }

  try {
    let DB;
    try {
      const module = await import('@/services/Database/db');
      DB = module;
    } catch (importError) {
      console.error('Database module not available:', importError);
      return res.status(503).json({ 
        error: 'Database service unavailable. Please install dependencies and initialize the database.' 
      });
    }

    switch (req.method) {
      case 'GET':
        const preferences = await DB.UserPreferencesDB.getPreferences(walletAddress);
        return res.status(200).json({ preferences });

      case 'PUT':
        const { 
          auto_schedule_jobs, 
          default_schedule_type, 
          default_schedule_time, 
          timezone 
        } = req.body;

        const updatedPreferences = await DB.UserPreferencesDB.updatePreferences(walletAddress, {
          auto_schedule_jobs,
          default_schedule_type,
          default_schedule_time,
          timezone
        });

        return res.status(200).json({ preferences: updatedPreferences });

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('User preferences API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}