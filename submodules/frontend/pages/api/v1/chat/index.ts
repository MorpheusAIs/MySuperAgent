import { NextApiRequest, NextApiResponse } from 'next';
import { ChatRequest, AgentResponse } from '@/services/agents/types';
import { AgentRegistry } from '@/services/agents/core/AgentRegistry';
import { orchestrator } from '@/services/agents/orchestrator';
import { initializeAgents } from '@/services/agents/initialize';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const chatRequest: ChatRequest = req.body;
    console.log(`Received chat request for conversation ${chatRequest.conversationId}`);

    // Ensure agents are initialized
    await initializeAgents();


    // Parse command if present
    const { agentName, message } = AgentRegistry.parseCommand(chatRequest.prompt.content);
    
    let currentAgent: string;
    let agentResponse: AgentResponse;

    if (agentName) {
      // Direct agent command
      chatRequest.prompt.content = message;
      const agent = AgentRegistry.get(agentName);
      
      if (!agent) {
        return res.status(404).json({ error: `Agent ${agentName} not found` });
      }
      
      agentResponse = await agent.chat(chatRequest);
      currentAgent = agentName;
    } else if (chatRequest.useResearch) {
      // Use orchestrator for multi-agent flow
      console.log('Using research flow');
      [currentAgent, agentResponse] = await orchestrator.runOrchestration(chatRequest);
    } else {
      // Use intelligent agent selection for regular chat
      console.log('Using intelligent agent selection');
      const selectedAgent = AgentRegistry.selectBestAgent(chatRequest.prompt.content);
      if (!selectedAgent) {
        return res.status(500).json({ error: 'No suitable agent found' });
      }
      agentResponse = await selectedAgent.chat(chatRequest);
      currentAgent = selectedAgent.getDefinition().name;
      
      // Add agent selection metadata
      if (agentResponse.metadata) {
        agentResponse.metadata.selectedAgent = currentAgent;
        agentResponse.metadata.availableAgents = AgentRegistry.getAvailableAgents().map(a => a.name);
      } else {
        agentResponse.metadata = {
          selectedAgent: currentAgent,
          availableAgents: AgentRegistry.getAvailableAgents().map(a => a.name),
        };
      }
    }

    return res.status(200).json({
      response: agentResponse,
      current_agent: currentAgent,
    });
  } catch (error) {
    console.error('Error handling chat:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}