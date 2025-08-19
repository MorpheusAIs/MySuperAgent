import { AgentRegistry } from './core/agent-registry';

// Initialize agents at module load time
let initializationPromise: Promise<void> | null = null;

export async function initializeAgents() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    if (!AgentRegistry.isInitialized()) {
      await AgentRegistry.initialize();
    }
  })();

  return initializationPromise;
}

// Initialize immediately when this module is imported
initializeAgents().catch(error => {
  console.error('Failed to initialize agents:', error);
});