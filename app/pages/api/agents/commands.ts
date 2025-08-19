import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to load AgentRegistry, but provide a fallback if it fails
    try {
      const { AgentRegistry } = await import('@/services/agents/core/agent-registry');
      
      // Initialize agents if not already done
      if (!AgentRegistry.isInitialized()) {
        await AgentRegistry.initialize();
      }

      // Return available agent commands
      const agents = AgentRegistry.getAvailableAgents();
      const commands = agents.map(agent => ({
        command: `@${agent.name}`,
        description: agent.description,
        agent: agent.name,
      }));
      
      return res.status(200).json({ commands });
    } catch (agentError) {
      console.warn('AgentRegistry not available, providing basic commands:', agentError);
      // Return basic commands as fallback when AgentRegistry is not available
      const basicCommands = [
        {
          command: '@default',
          description: 'General purpose AI assistant',
          agent: 'default',
        },
        {
          command: '@research',
          description: 'Research and web search assistant',
          agent: 'research',
        },
        {
          command: '@crypto',
          description: 'Cryptocurrency data and analysis',
          agent: 'crypto',
        }
      ];
      return res.status(200).json({ commands: basicCommands });
    }
  } catch (error) {
    console.error('Error fetching agent commands:', error);
    // Even in case of complete failure, return empty commands to prevent 404
    return res.status(200).json({ commands: [] });
  }
}