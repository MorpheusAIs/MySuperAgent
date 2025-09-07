import { NextApiRequest, NextApiResponse } from 'next';
import { PrivyClient } from '@privy-io/server-auth';
import jwt from 'jsonwebtoken';

// Initialize Privy client
const privy = new PrivyClient(
  process.env.PRIVY_APP_ID || '',
  process.env.PRIVY_APP_SECRET || ''
);

// JWT secret for our own tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { privy_token, privy_user_id, email, wallet_address } = req.body;

    if (!privy_token || !privy_user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify the Privy access token
    const verifiedClaims = await privy.verifyAuthToken(privy_token);
    
    // Ensure the user ID matches
    if (verifiedClaims.userId !== privy_user_id) {
      return res.status(401).json({ error: 'Invalid token for user' });
    }

    // Get or create user in our database
    let DB;
    try {
      const dbModule = await import('@/services/database/db');
      DB = dbModule.UserDB;
    } catch (error) {
      console.error('Database module not available:', error);
      return res.status(503).json({
        error: 'Database service unavailable',
      });
    }

    // Create or update user in our database
    let user;
    try {
      // Try to find user by Privy ID first
      user = await DB.getUserByPrivyId(privy_user_id);
      
      if (!user) {
        // Try to find by wallet address if provided
        if (wallet_address) {
          user = await DB.getUserByWalletAddress(wallet_address);
        }
        
        // If still no user, try by email
        if (!user && email) {
          user = await DB.getUserByEmail(email);
        }
        
        if (!user) {
          // Create new user - use wallet address or create user-based identifier
          const userIdentifier = wallet_address || `user_${privy_user_id.slice(-8)}`;
          user = await DB.createUser({
            wallet_address: userIdentifier,
            email: email || null,
            privy_user_id: privy_user_id,
            created_at: new Date(),
            updated_at: new Date(),
          });
        } else {
          // Update existing user with Privy ID
          await DB.updateUser(user.wallet_address, {
            privy_user_id: privy_user_id,
            email: email || user.email,
            wallet_address: wallet_address || user.wallet_address,
            updated_at: new Date(),
          });
        }
      } else {
        // Update user info if needed
        if ((email && email !== user.email) || 
            (wallet_address && wallet_address !== user.wallet_address)) {
          await DB.updateUser(user.wallet_address, {
            email: email || user.email,
            wallet_address: wallet_address || user.wallet_address,
            updated_at: new Date(),
          });
        }
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // For now, create a temporary user object if DB operations fail
      const fallbackIdentifier = wallet_address || `user_${privy_user_id.slice(-8)}`;
      user = {
        id: 1, // Default ID for anonymous users
        wallet_address: fallbackIdentifier,
        email: email,
        privy_user_id: privy_user_id,
      };
    }

    // Generate our own JWT token
    const access_token = jwt.sign(
      {
        userId: user.id,
        privyUserId: privy_user_id,
        email: email,
        walletAddress: wallet_address,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      access_token,
      user_id: user.id,
      email: user.email,
      wallet_address: user.wallet_address,
    });
  } catch (error) {
    console.error('Privy verification error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}