import type { NextApiRequest, NextApiResponse } from 'next';

interface UserSettings {
  aiPersonality: string;
  bio: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
        error: 'Database service unavailable. Please install dependencies and initialize the database.',
      });
    }

    switch (req.method) {
      case 'GET':
        // Get user settings from user_preferences table
        let preferences = await DB.UserPreferencesDB.getPreferences(walletAddress);
        if (!preferences) {
          // Create defaults if none exist
          preferences = await DB.UserPreferencesDB.updatePreferences(walletAddress, {
            ai_personality: '',
            user_bio: '',
          });
        }
        return res.status(200).json({
          aiPersonality: preferences.ai_personality || '',
          bio: preferences.user_bio || '',
        });

      case 'PUT':
        // Update user settings
        const { aiPersonality, bio } = req.body as UserSettings;
        const updatedPreferences = await DB.UserPreferencesDB.updatePreferences(walletAddress, {
          ai_personality: aiPersonality,
          user_bio: bio,
        });
        return res.status(200).json({
          aiPersonality: updatedPreferences.ai_personality || '',
          bio: updatedPreferences.user_bio || '',
          success: true,
        });

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('User settings API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
