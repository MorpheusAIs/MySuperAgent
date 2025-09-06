import type { NextApiRequest, NextApiResponse } from 'next';
import { UserA2AAgentDB } from '@/services/database/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get user's A2A agents
        const agents = await UserA2AAgentDB.getUserA2AAgents(walletAddress);
        return res.status(200).json(agents);

      case 'POST':
        // Add or update A2A agent
        const { 
          agent_id,
          agent_name, 
          agent_description,
          endpoint_url,
          capabilities = [],
          is_enabled = true 
        } = req.body;

        if (!agent_id || !agent_name || !endpoint_url) {
          return res.status(400).json({ 
            error: 'Agent ID, name, and endpoint URL are required' 
          });
        }

        const newAgent = await UserA2AAgentDB.addA2AAgent({
          wallet_address: walletAddress,
          agent_id,
          agent_name,
          agent_description: agent_description || null,
          endpoint_url,
          capabilities,
          is_enabled,
          connection_status: 'unknown',
          last_ping: null
        });

        return res.status(201).json(newAgent);

      case 'PUT':
        // Update A2A agent status
        const { 
          agentId,
          enabled,
          connectionStatus 
        } = req.body;

        if (!agentId) {
          return res.status(400).json({ 
            error: 'Agent ID is required' 
          });
        }

        // Update enabled status if provided
        if (enabled !== undefined) {
          await UserA2AAgentDB.enableA2AAgent(
            walletAddress,
            agentId,
            enabled
          );
        }

        // Update connection status if provided
        if (connectionStatus) {
          await UserA2AAgentDB.updateA2AAgentStatus(
            walletAddress,
            agentId,
            connectionStatus
          );
        }

        // Get updated agent
        const updatedAgent = await UserA2AAgentDB.getA2AAgent(
          walletAddress,
          agentId
        );

        return res.status(200).json(updatedAgent);

      case 'DELETE':
        // Delete A2A agent
        const { agentId: delAgentId } = req.query;

        if (!delAgentId || typeof delAgentId !== 'string') {
          return res.status(400).json({ 
            error: 'Agent ID is required' 
          });
        }

        await UserA2AAgentDB.deleteA2AAgent(
          walletAddress,
          delAgentId
        );

        return res.status(204).end();

      case 'PATCH':
        // Ping A2A agent to test connection
        const { agentId: pingAgentId } = req.body;

        if (!pingAgentId) {
          return res.status(400).json({ 
            error: 'Agent ID is required' 
          });
        }

        // Get agent details
        const agent = await UserA2AAgentDB.getA2AAgent(
          walletAddress,
          pingAgentId
        );

        if (!agent) {
          return res.status(404).json({ 
            error: 'Agent not found' 
          });
        }

        // Try to ping the agent endpoint
        try {
          const pingResponse = await fetch(`${agent.endpoint_url}/ping`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });

          const isHealthy = pingResponse.ok;
          const status = isHealthy ? 'connected' : 'error';

          // Update agent status
          await UserA2AAgentDB.updateA2AAgentStatus(
            walletAddress,
            pingAgentId,
            status
          );

          return res.status(200).json({
            agentId: pingAgentId,
            status,
            lastPing: new Date().toISOString()
          });

        } catch (pingError) {
          // Update agent status to error
          await UserA2AAgentDB.updateA2AAgentStatus(
            walletAddress,
            pingAgentId,
            'disconnected'
          );

          return res.status(200).json({
            agentId: pingAgentId,
            status: 'disconnected',
            lastPing: new Date().toISOString(),
            error: 'Failed to reach agent endpoint'
          });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
        return res.status(405).json({ 
          error: `Method ${req.method} not allowed` 
        });
    }
  } catch (error: any) {
    console.error('A2A agents API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}