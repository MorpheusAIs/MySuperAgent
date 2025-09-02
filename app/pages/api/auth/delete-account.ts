// TODO: Fix imports - install jsonwebtoken and fix Database path
// import { UserDB } from '@/services/database/db';
// import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

// TODO: Temporary mock - replace with actual UserDB implementation
const UserDB = {
  async getUser(walletAddress: string) {
    console.log('TODO: Implement UserDB.getUser for:', walletAddress);
    return null;
  },
  async softDeleteUser(walletAddress: string) {
    console.log('TODO: Implement UserDB.softDeleteUser for:', walletAddress);
    return false;
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
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use DELETE request.',
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

    // Verify the user exists and is not already deleted
    const user = await UserDB.getUser(wallet_address);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or already deleted',
      });
    }

    // Perform soft delete
    const deleted = await UserDB.softDeleteUser(wallet_address);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete account',
      });
    }

    // Log the account deletion for audit purposes
    console.log(
      `Account soft deleted: ${wallet_address} at ${new Date().toISOString()}`
    );

    return res.status(200).json({
      success: true,
      message: 'Account successfully deleted',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
