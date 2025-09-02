import { MessageDB } from '@/services/Database/db';
import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

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
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing or invalid',
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    const { wallet_address } = decoded;

    // Get today's date range (start and end of day)
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get message count for today
    // Note: This would need to be implemented in MessageDB if it doesn't exist
    const messagesCount = await MessageDB.getMessageCountForUserToday(
      wallet_address,
      startOfDay,
      endOfDay
    );

    return res.status(200).json({
      success: true,
      data: {
        messagesUsedToday: messagesCount,
        messagesLimit: 10, // Free plan limit
        isUnlimited: false, // This would be true for pro users
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
