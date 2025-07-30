import { BaseAgent } from '@/services/agents/core/BaseAgent';
import { AgentDefinition } from '@/services/agents/types';

class AgentRegistryClass {
  private agents: Map<string, BaseAgent> = new Map();
  private initialized = false;

  register(agent: BaseAgent) {
    const definition = agent.getDefinition();
    this.agents.set(definition.name, agent);
    console.log(`Registered agent: ${definition.name}`, definition);
  }

  get(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  getAll(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  getDefinitions(): AgentDefinition[] {
    return Array.from(this.agents.values()).map(agent => agent.getDefinition());
  }

  getAvailableAgents(): Array<{ name: string; description: string }> {
    return this.getDefinitions().map(def => ({
      name: def.name,
      description: def.description,
    }));
  }

  getAgentsByCapability(capability: string): BaseAgent[] {
    return this.getAll().filter(agent => 
      agent.getDefinition().capabilities.some(cap => 
        cap.toLowerCase().includes(capability.toLowerCase())
      )
    );
  }

  selectBestAgent(prompt: string): BaseAgent | null {
    console.log('Selecting best agent for prompt:', prompt);
    console.log('Available agents:', Array.from(this.agents.keys()));
    
    // Simple heuristic-based agent selection
    const lowerPrompt = prompt.toLowerCase();
    
    // Keyword mapping for agent selection
    const agentKeywords = {
      research: ['search', 'find', 'research', 'investigate', 'information', 'web', 'internet'],
      code: ['code', 'program', 'function', 'bug', 'debug', 'syntax', 'algorithm', 'development'],
      data: ['data', 'analyze', 'csv', 'json', 'statistics', 'dataset', 'process'],
      math: ['calculate', 'math', 'equation', 'solve', 'formula', 'computation', 'number'],
    };
    
    let bestAgent: BaseAgent | null = null;
    let maxScore = 0;
    
    for (const [agentType, keywords] of Object.entries(agentKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (lowerPrompt.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestAgent = this.get(agentType);
      }
    }
    
    // Fallback to default agent if no specific match
    return bestAgent || this.get('default');
  }

  parseCommand(prompt: string): { agentName: string | null; message: string } {
    const commandPattern = /^@(\w+)\s+(.*)$/;
    const match = prompt.match(commandPattern);
    
    if (match) {
      const agentName = match[1];
      const message = match[2];
      
      if (this.agents.has(agentName)) {
        return { agentName, message };
      }
    }
    
    return { agentName: null, message: prompt };
  }

  async initialize() {
    if (this.initialized) return;
    
    // Import and register all agents
    const { DefaultAgent } = await import('@/services/agents/agents/DefaultAgent');
    const { ResearchAgent } = await import('@/services/agents/agents/ResearchAgent');
    const { CodeAgent } = await import('@/services/agents/agents/CodeAgent');
    const { DataAgent } = await import('@/services/agents/agents/DataAgent');
    const { MathAgent } = await import('@/services/agents/agents/MathAgent');
    
    // Register all agents
    this.register(new DefaultAgent());
    this.register(new ResearchAgent());
    this.register(new CodeAgent());
    this.register(new DataAgent());
    this.register(new MathAgent());
    
    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }
}

export const AgentRegistry = new AgentRegistryClass();