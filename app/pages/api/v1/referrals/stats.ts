import { NextApiRequest, NextApiResponse } from 'next';
import { withRateLimitProtection } from '@/middleware/rate-limiting';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

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
    // Get detailed referral statistics
    const stats = await DB.ReferralDB.getReferralStats(walletAddress);
    const referralHistory = await DB.ReferralDB.getReferralHistory(walletAddress);
    const recentReferrals = await DB.ReferralDB.getRecentReferrals(walletAddress, 10);

    return res.status(200).json({
      stats,
      referralHistory,
      recentReferrals
    });

  } catch (error) {
    console.error('Referral stats API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

export default withRateLimitProtection('jobs', handler);