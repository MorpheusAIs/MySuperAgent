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
        // Get user's referral codes
        const codes = await DB.ReferralDB.getUserReferralCodes(walletAddress);
        return res.status(200).json({ codes });

      case 'PUT':
        // Update referral code (activate/deactivate)
        const { codeId, isActive } = req.body;
        
        if (!codeId || typeof isActive !== 'boolean') {
          return res.status(400).json({ error: 'codeId and isActive are required' });
        }

        const updatedCode = await DB.ReferralDB.updateReferralCode(walletAddress, codeId, { isActive });
        return res.status(200).json({ code: updatedCode });

      case 'DELETE':
        // Delete referral code
        const { codeId: deleteCodeId } = req.body;
        
        if (!deleteCodeId) {
          return res.status(400).json({ error: 'codeId is required' });
        }

        await DB.ReferralDB.deleteReferralCode(walletAddress, deleteCodeId);
        res.status(204).end();
        return;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
    }
  } catch (error) {
    console.error('Referral codes API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

export default withRateLimitProtection('jobs', handler);