import { NextApiRequest, NextApiResponse } from 'next';
import { withRateLimitProtection } from '@/middleware/rate-limiting';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required in x-wallet-address header' });
  }

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

  try {
    switch (req.method) {
      case 'GET':
        // Get user's referral dashboard data
        const dashboard = await DB.ReferralDB.getReferralDashboard(walletAddress);
        return res.status(200).json(dashboard);

      case 'POST':
        // Create new referral code or use existing code
        const { action, referralCode } = req.body;

        if (action === 'generate') {
          // Generate new referral code for user
          const { description, maxUses, expiresAt } = req.body;
          const code = await DB.ReferralDB.generateReferralCode(walletAddress, {
            description,
            maxUses,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined
          });
          return res.status(201).json({ code });

        } else if (action === 'use') {
          // Use someone else's referral code
          if (!referralCode) {
            return res.status(400).json({ error: 'Referral code is required' });
          }
          
          try {
            const result = await DB.ReferralDB.useReferralCode(walletAddress, referralCode);
            return res.status(200).json(result);
          } catch (error) {
            if (error instanceof Error) {
              if (error.message.includes('already referred')) {
                return res.status(409).json({ error: 'You have already been referred' });
              }
              if (error.message.includes('not found') || error.message.includes('expired') || error.message.includes('inactive')) {
                return res.status(404).json({ error: 'Invalid or expired referral code' });
              }
              if (error.message.includes('own code')) {
                return res.status(400).json({ error: 'Cannot use your own referral code' });
              }
            }
            throw error;
          }

        } else {
          res.status(400).json({ error: 'Invalid action. Use "generate" or "use"' });
          return;
        }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
    }
  } catch (error) {
    console.error('Referrals API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

export default withRateLimitProtection('jobs', handler);