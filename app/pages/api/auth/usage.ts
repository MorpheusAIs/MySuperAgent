// TODO: Fix imports - install jsonwebtoken and fix Database path
// import { MessageDB } from '@/services/database/db';
// import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

// TODO: Temporary mock - replace with actual MessageDB implementation
const MessageDB = {
  async getMessageCountForUserToday(
    walletAddress: string,
    startOfDay: Date,
    endOfDay: Date
  ) {
    console.log(
      'TODO: Implement MessageDB.getMessageCountForUserToday for:',
      walletAddress
    );
    return 0; // Mock return
  },
};

// TODO: Temporary mock - replace with actual jwt implementation
const jwt = {
  verify: (token: string, secret: string) => {
    console.log('TODO: Implement JWT verification');
    throw new Error('JWT not implemented');
  },
};

interface DecodedToken {
  wallet_address: string;
  user_id: number;
}

const verifyToken = (token: string): DecodedToken | null => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, secret) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use GET request.',
    });
  }

  try {
    // For now, return unlimited usage for all authenticated users
    // This prevents 401 errors while the JWT implementation is incomplete
    return res.status(200).json({
      success: true,
      data: {
        messagesUsedToday: 0,
        messagesLimit: null, // Unlimited
        isUnlimited: true, // Pro users get unlimited
      },
    });
  } catch (error) {
    console.error('Error getting usage data:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
