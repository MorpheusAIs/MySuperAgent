import { NextApiRequest, NextApiResponse } from 'next';
import { AgentTeamDB } from '@/services/database/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { teamId } = req.query;
  
  if (!teamId || typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Invalid team ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(teamId, res);
      case 'PUT':
        return handlePut(teamId, req, res);
      case 'DELETE':
        return handleDelete(teamId, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in agent-teams/[teamId] API:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

async function handleGet(teamId: string, res: NextApiResponse) {
  try {
    const team = await AgentTeamDB.getTeam(teamId);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    return res.status(200).json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    throw error;
  }
}

async function handlePut(teamId: string, req: NextApiRequest, res: NextApiResponse) {
  const { name, description, agents } = req.body;
  
  if (!name && !description && !agents) {
    return res.status(400).json({ 
      error: 'At least one field to update is required' 
    });
  }

  if (agents && (!Array.isArray(agents) || agents.length === 0)) {
    return res.status(400).json({ 
      error: 'agents must be a non-empty array' 
    });
  }

  try {
    const updates: any = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (agents) updates.agents = agents;
    
    const team = await AgentTeamDB.updateTeam(teamId, updates);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    return res.status(200).json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
}

async function handleDelete(teamId: string, res: NextApiResponse) {
  try {
    await AgentTeamDB.deleteTeam(teamId);
    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
}