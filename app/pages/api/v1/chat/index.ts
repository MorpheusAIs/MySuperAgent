import { AgentRegistry } from '@/services/agents/core/agent-registry';
import { initializeAgents } from '@/services/agents/initialize';
import { orchestrator } from '@/services/agents/orchestrator';
import { AgentResponse, ChatRequest } from '@/services/agents/types';
import { defaultChatSimilarityService } from '@/services/similarity/chat-similarity-service';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const chatRequest: ChatRequest = req.body;
    const walletAddress = req.body.walletAddress; // Extract wallet address from request

    // Ensure agents are initialized
    await initializeAgents();

    // Process chat request with similarity checking (with timeout protection)
    let enhancedChatRequest = chatRequest;
    try {
      const similarityPromise = defaultChatSimilarityService.processChatRequest(
        chatRequest,
        walletAddress
      );

      // Add timeout to prevent blocking
      enhancedChatRequest = await Promise.race([
        similarityPromise,
        new Promise<ChatRequest>((resolve) => {
          setTimeout(() => {
            console.log(
              '[ChatAPI] Similarity processing timeout, using original request'
            );
            resolve(chatRequest);
          }, 2000); // 2 second timeout
        }),
      ]);
    } catch (error) {
      console.error(
        '[ChatAPI] Error in similarity processing, using original request:',
        error
      );
      enhancedChatRequest = chatRequest;
    }

    // Parse command if present
    const { agentName, message } = AgentRegistry.parseCommand(
      enhancedChatRequest.prompt.content
    );

    let currentAgent: string;
    let agentResponse: AgentResponse;

    if (agentName) {
      // Direct agent command
      enhancedChatRequest.prompt.content = message;
      const agent = await AgentRegistry.get(agentName);

      if (!agent) {
        return res.status(404).json({ error: `Agent ${agentName} not found` });
      }

      agentResponse = await agent.chat(enhancedChatRequest);
      currentAgent = agentName;
    } else if (enhancedChatRequest.useResearch) {
      // Use orchestrator for multi-agent flow with user context
      [currentAgent, agentResponse] = await orchestrator.runOrchestration(
        enhancedChatRequest,
        walletAddress
      );
    } else {
      // Use intelligent agent selection for regular chat with user context
      const selection = await AgentRegistry.selectBestAgentWithLLM(
        enhancedChatRequest.prompt.content,
        walletAddress
      );
      const selectedAgent = selection.agent;
      if (!selectedAgent) {
        return res.status(500).json({ error: 'No suitable agent found' });
      }
      agentResponse = await selectedAgent.chat(enhancedChatRequest);
      currentAgent = selectedAgent.getDefinition().name;

      // Add agent selection metadata with user-specific context
      const availableAgents = walletAddress
        ? (await AgentRegistry.getUserAvailableAgents(walletAddress)).map(
            (a) => ({ name: a.name, type: a.type })
          )
        : AgentRegistry.getAvailableAgents().map((a) => ({
            name: a.name,
            type: 'core',
          }));

      if (agentResponse.metadata) {
        agentResponse.metadata.selectedAgent = currentAgent;
        agentResponse.metadata.agentType = selection.agentType;
        agentResponse.metadata.selectionReasoning = selection.reasoning;
        agentResponse.metadata.availableAgents = availableAgents;
        agentResponse.metadata.userSpecificAgents = walletAddress
          ? true
          : false;
      } else {
        agentResponse.metadata = {
          selectedAgent: currentAgent,
          agentType: selection.agentType,
          selectionReasoning: selection.reasoning,
          availableAgents,
          userSpecificAgents: walletAddress ? true : false,
        };
      }
    }

    // Enhance response with similarity metadata
    const enhancedResponse = defaultChatSimilarityService.enhanceAgentResponse(
      agentResponse,
      enhancedChatRequest.similarPrompts || []
    );

    return res.status(200).json({
      response: enhancedResponse,
      current_agent: currentAgent,
    });
  } catch (error) {
    console.error('Error handling chat:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
