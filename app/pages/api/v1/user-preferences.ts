import type { NextApiRequest, NextApiResponse } from 'next';
import { UserPreferences } from '@/services/database/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    let DB;
    try {
      const dbModule = await import('@/services/database/db');
      DB = dbModule;
    } catch (importError) {
      console.error('Database module not available:', importError);
      return res.status(503).json({ 
        error: 'Database service unavailable. Please install dependencies and initialize the database.' 
      });
    }

    switch (req.method) {
      case 'GET':
        // Get user preferences, create defaults if none exist
        let preferences = await DB.UserPreferencesDB.getPreferences(walletAddress);
        if (!preferences) {
          // Create default preferences for new user
          preferences = await DB.UserPreferencesDB.updatePreferences(walletAddress, {
            auto_schedule_jobs: false,
            default_schedule_type: 'daily',
            default_schedule_time: '09:00:00',
            timezone: 'UTC'
          });
        }
        return res.status(200).json(preferences);

      case 'POST':
        // Create user preferences
        const createData = req.body;
        const newPreferences = await DB.UserPreferencesDB.createPreferences(walletAddress, createData);
        return res.status(201).json(newPreferences);

      case 'PUT':
        // Update user preferences (upsert)
        const updateData = req.body;
        const updatedPreferences = await DB.UserPreferencesDB.updatePreferences(walletAddress, updateData);
        return res.status(200).json(updatedPreferences);

      case 'DELETE':
        // Delete user preferences
        await DB.UserPreferencesDB.deletePreferences(walletAddress);
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('User preferences API error:', error);
    
    // Handle database connection errors gracefully
    if (error.message?.includes('Connection') || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Database service unavailable',
        details: 'Please ensure the database is running and accessible'
      });
    }

    // Handle missing database dependency
    if (error.message?.includes('Cannot find module')) {
      return res.status(503).json({ 
        error: 'Database service unavailable',
        details: 'Please install database dependencies: npm install pg'
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}