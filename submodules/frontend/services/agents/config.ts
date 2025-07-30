import { Mastra } from '@mastra/core';

// Core Mastra instance - workflows can be added as needed
export const mastra = new Mastra({
  workflows: {},
});

// Model configuration
export const DEFAULT_MODEL = 'gpt-4o-mini';
export const ORCHESTRATOR_MODEL = 'gpt-4o';