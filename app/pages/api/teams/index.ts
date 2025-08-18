import { NextApiRequest, NextApiResponse } from 'next';
import { AgentTeamDB } from '@/services/database/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in teams API:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { wallet_address } = req.query;
  
  if (!wallet_address || typeof wallet_address !== 'string') {
    return res.status(400).json({ error: 'wallet_address is required' });
  }

  try {
    const teams = await AgentTeamDB.getTeamsByWallet(wallet_address);
    return res.status(200).json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { wallet_address, name, description, agents } = req.body;
  
  if (!wallet_address || !name || !agents || !Array.isArray(agents) || agents.length === 0) {
    return res.status(400).json({ 
      error: 'wallet_address, name, and at least one agent are required' 
    });
  }

  try {
    const team = await AgentTeamDB.createTeam({
      wallet_address,
      name,
      description: description || null,
      agents
    });
    
    return res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
}