import { isUserWhitelisted } from '@/services/metrics/whitelist';
import type { NextApiRequest, NextApiResponse } from 'next';

// Ensure this API route runs on Node.js runtime, not Edge runtime
export const config = {
  api: {
    runtime: 'nodejs',
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user email and walletID from headers or query
    const email =
      (req.headers['x-user-email'] as string) ||
      (req.query.email as string) ||
      null;
    const walletID =
      (req.headers['x-wallet-address'] as string) ||
      (req.query.walletID as string) ||
      null;

    console.log('[Whitelist Check]', { email, walletID });

    const isWhitelisted = isUserWhitelisted(email, walletID);

    console.log('[Whitelist Check] Result:', isWhitelisted);

    return res.status(200).json({
      isWhitelisted,
      email: email || null,
      walletID: walletID || null,
    });
  } catch (error) {
    console.error('Error checking whitelist:', error);
    return res.status(500).json({
      error: 'Failed to check whitelist',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
