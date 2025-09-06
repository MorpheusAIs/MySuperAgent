import type { NextApiRequest, NextApiResponse } from 'next';
import { UserMCPServerDB, UserAvailableToolDB } from '@/services/database/db';

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
        // Get user's MCP servers
        const servers = await UserMCPServerDB.getUserMCPServers(walletAddress);
        
        // Get tools for each server
        const serversWithTools = await Promise.all(
          servers.map(async (server) => {
            const tools = await UserAvailableToolDB.getServerTools(
              walletAddress, 
              server.server_name
            );
            return {
              ...server,
              availableTools: tools.length
            };
          })
        );
        
        return res.status(200).json(serversWithTools);

      case 'POST':
        // Add or update MCP server
        const { 
          server_name, 
          server_url, 
          connection_config,
          is_enabled = true 
        } = req.body;

        if (!server_name || !server_url) {
          return res.status(400).json({ 
            error: 'Server name and URL are required' 
          });
        }

        const newServer = await UserMCPServerDB.addMCPServer({
          wallet_address: walletAddress,
          server_name,
          server_url,
          connection_config: connection_config || {},
          is_enabled,
          health_status: 'unknown',
          last_health_check: null
        });

        return res.status(201).json(newServer);

      case 'PUT':
        // Update MCP server status or health
        const { 
          serverName, 
          enabled, 
          healthStatus 
        } = req.body;

        if (!serverName) {
          return res.status(400).json({ 
            error: 'Server name is required' 
          });
        }

        // Update enabled status if provided
        if (enabled !== undefined) {
          await UserMCPServerDB.enableMCPServer(
            walletAddress,
            serverName,
            enabled
          );
        }

        // Update health status if provided
        if (healthStatus) {
          await UserMCPServerDB.updateMCPServerHealth(
            walletAddress,
            serverName,
            healthStatus
          );
        }

        // Get updated server
        const updatedServer = await UserMCPServerDB.getMCPServer(
          walletAddress,
          serverName
        );

        return res.status(200).json(updatedServer);

      case 'DELETE':
        // Delete MCP server and its tools
        const { serverName: delServerName } = req.query;

        if (!delServerName || typeof delServerName !== 'string') {
          return res.status(400).json({ 
            error: 'Server name is required' 
          });
        }

        // Delete associated tools first
        await UserAvailableToolDB.deleteServerTools(
          walletAddress,
          delServerName
        );

        // Delete the server
        await UserMCPServerDB.deleteMCPServer(
          walletAddress,
          delServerName
        );

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ 
          error: `Method ${req.method} not allowed` 
        });
    }
  } catch (error: any) {
    console.error('MCP servers API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}