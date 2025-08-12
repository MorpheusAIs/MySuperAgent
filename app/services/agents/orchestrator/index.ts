import { ChatRequest, AgentResponse, ResponseType } from '@/services/agents/types';
import { EventEmitter } from 'events';
import { AgentRegistry } from '@/services/agents/core/AgentRegistry';

export class Orchestrator {
  private eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  async runOrchestration(request: ChatRequest): Promise<[string, AgentResponse]> {
    try {

      // Determine which agent(s) to use
      let selectedAgent;
      if (request.selectedAgents && request.selectedAgents.length > 0) {
        // Try to find the first available agent from the selected list
        for (const agentName of request.selectedAgents) {
          selectedAgent = await AgentRegistry.get(agentName);
          if (selectedAgent) {
            break;
          }
        }
        
        // If no selected agent is available, fall back to LLM-based intelligent selection
        if (!selectedAgent) {
          const selectionResult = await AgentRegistry.selectBestAgentWithLLM(request.prompt.content);
          selectedAgent = selectionResult.agent;
        }
      } else {
        // Use LLM-based intelligent agent selection
        const selectionResult = await AgentRegistry.selectBestAgentWithLLM(request.prompt.content);
        selectedAgent = selectionResult.agent;
      }

      if (!selectedAgent) {
        throw new Error('No suitable agent found');
      }

      const response = await selectedAgent.chat({
        prompt: request.prompt,
        conversationId: request.conversationId || 'default',
      });

      const agentName = selectedAgent.getDefinition().name;
      const agentResponse: AgentResponse = {
        responseType: ResponseType.SUCCESS,
        content: response.content || 'No response generated',
        metadata: {
          ...response.metadata,
          selectedAgent: agentName,
          availableAgents: AgentRegistry.getAvailableAgents().map(a => a.name),
        },
      };

      return [agentName, agentResponse];
    } catch (error) {
      const response: AgentResponse = {
        responseType: ResponseType.ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      };
      
      return ['orchestrator', response];
    }
  }

  async streamOrchestration(request: ChatRequest, res: any): Promise<void> {
    try {
      
      // Determine which agent(s) to use for streaming
      let selectedAgent;
      let selectionMethod = 'unknown';
      
      if (request.selectedAgents && request.selectedAgents.length > 0) {
        // Try to find the first available agent from the selected list
        for (const agentName of request.selectedAgents) {
          selectedAgent = await AgentRegistry.get(agentName);
          if (selectedAgent) {
            selectionMethod = 'user_selected';
            break;
          }
        }
        
        // If no selected agent is available, fall back to LLM-based intelligent selection
        if (!selectedAgent) {
          const selectionResult = await AgentRegistry.selectBestAgentWithLLM(request.prompt.content);
          selectedAgent = selectionResult.agent;
          selectionMethod = 'llm_intelligent_fallback';
        }
      } else {
        // Use LLM-based intelligent agent selection
        const selectionResult = await AgentRegistry.selectBestAgentWithLLM(request.prompt.content);
        selectedAgent = selectionResult.agent;
        selectionMethod = 'llm_intelligent';
      }

      if (!selectedAgent) {
        throw new Error('No suitable agent found');
      }
      
      const selectedAgentName = selectedAgent.getDefinition().name;

      // Convert to Mastra message format
      const messages = [];
      if (request.chatHistory) {
        messages.push(...request.chatHistory.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })));
      }
      messages.push({
        role: 'user' as const,
        content: request.prompt.content
      });

      // Check if the agent has Mastra streamVNext method
      if (typeof selectedAgent.streamVNext === 'function') {
        const stream = await selectedAgent.streamVNext(messages);

        let subtaskOutputs: any[] = [];
        let contributingAgents: string[] = [selectedAgent.getDefinition().name];
        let globalTelemetry = {
          total_processing_time: 0,
          total_token_usage: {
            prompt: 0,
            response: 0,
            total: 0,
          }
        };

        // Process each chunk from Mastra's stream
        for await (const chunk of stream) {
          // Handle different chunk types from Mastra
          switch (chunk.type) {
            case 'text':
              // Stream text chunks
              res.write(`data: ${JSON.stringify({
                type: 'chunk',
                content: chunk.payload.text || chunk.payload.content,
                timestamp: new Date().toISOString()
              })}\n\n`);
              break;

            case 'tool_call':
              // Emit subtask dispatch for tool calls
              res.write(`data: ${JSON.stringify({
                type: 'subtask_dispatch',
                data: {
                  subtask: `Executing tool: ${chunk.payload.name || 'Unknown tool'}`,
                  agent: selectedAgent.getDefinition().name,
                  current_agent_index: 0,
                  total_agents: 1,
                  timestamp: new Date().toISOString()
                }
              })}\n\n`);
              break;

            case 'tool_result':
              // Emit subtask result for tool results
              const toolResult = {
                subtask: `Tool execution: ${chunk.payload.name || 'Unknown tool'}`,
                output: chunk.payload.result || 'Tool completed',
                agents: [selectedAgent.getDefinition().name],
                telemetry: {
                  processing_time: { duration: 0 },
                  token_usage: {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0
                  }
                },
                timestamp: new Date().toISOString()
              };
              
              subtaskOutputs.push(toolResult);
              
              res.write(`data: ${JSON.stringify({
                type: 'subtask_result',
                data: toolResult
              })}\n\n`);
              break;

            default:
              // Handle other chunk types as needed
              break;
          }
        }

        // Get final results from stream
        const finalText = await stream.text;
        const usage = await stream.usage;
        
        // Update telemetry with actual usage
        if (usage) {
          globalTelemetry.total_token_usage = {
            prompt: usage.promptTokens || 0,
            response: usage.completionTokens || 0,
            total: usage.totalTokens || 0,
          };
        }

        // Emit synthesis complete
        res.write(`data: ${JSON.stringify({
          type: 'synthesis_complete',
          data: {
            final_answer: finalText,
            timestamp: new Date().toISOString()
          }
        })}\n\n`);

        // Emit stream complete with final metadata including debugging info
        const metadata = {
          collaboration: "orchestrated",
          contributing_agents: contributingAgents,
          subtask_outputs: subtaskOutputs,
          selected_agent: selectedAgentName,
          selection_method: selectionMethod,
          user_requested_agents: request.selectedAgents || [],
          available_agents: AgentRegistry.getAvailableAgents().map(a => a.name),
          token_usage: globalTelemetry.total_token_usage.total > 0 ? {
            total_tokens: globalTelemetry.total_token_usage.total,
            prompt_tokens: globalTelemetry.total_token_usage.prompt,
            completion_tokens: globalTelemetry.total_token_usage.response,
          } : undefined,
          processing_time: globalTelemetry.total_processing_time > 0 ? {
            duration: globalTelemetry.total_processing_time,
          } : undefined,
        };
        

        res.write(`data: ${JSON.stringify({
          type: 'stream_complete',
          data: {
            final_answer: finalText,
            ...metadata,
            timestamp: new Date().toISOString()
          }
        })}\n\n`);

        res.end();

      } else {
        // Fallback to regular chat if streaming not available
        const response = await selectedAgent.chat({
          prompt: request.prompt,
          conversationId: request.conversationId || 'default',
        });

        const agentName = selectedAgent.getDefinition().name;
        
        // Send as complete event for non-streaming with debugging info
        res.write(`data: ${JSON.stringify({
          type: 'stream_complete',
          data: {
            final_answer: response.content || 'No response generated',
            collaboration: "single_agent",
            contributing_agents: [agentName],
            selected_agent: agentName,
            selection_method: selectionMethod,
            user_requested_agents: request.selectedAgents || [],
            available_agents: AgentRegistry.getAvailableAgents().map(a => a.name),
            subtask_outputs: [{
              subtask: 'Direct agent response',
              output: response.content || 'No response generated',
              agents: [agentName],
              telemetry: {
                processing_time: { duration: 0 },
                token_usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
              }
            }],
            timestamp: new Date().toISOString()
          }
        })}\n\n`);

        res.end();
      }
    } catch (error) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })}\n\n`);
      res.end();
    }
  }


  onEvent(eventName: string, handler: (data: any) => void) {
    this.eventEmitter.on(eventName, handler);
  }

  removeEventListener(eventName: string, handler: (data: any) => void) {
    this.eventEmitter.removeListener(eventName, handler);
  }
}

export const orchestrator = new Orchestrator();