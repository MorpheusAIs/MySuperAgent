import { AgentRegistry } from './core/AgentRegistry';

// Initialize agents at module load time
let initializationPromise: Promise<void> | null = null;

export async function initializeAgents() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    if (!AgentRegistry.isInitialized()) {
      console.log('[Agents] Initializing agent system...');
      await AgentRegistry.initialize();
      console.log('[Agents] Agent system initialized successfully');
      console.log('[Agents] Available agents:', AgentRegistry.getAvailableAgents().map(a => a.name));
    }
  })();

  return initializationPromise;
}

// Initialize immediately when this module is imported
initializeAgents().catch(error => {
  console.error('[Agents] Failed to initialize agents:', error);
});