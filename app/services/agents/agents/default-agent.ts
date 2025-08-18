import { BaseAgent } from '@/services/agents/core/base-agent';
import { createTool } from '@mastra/core';
import { z } from 'zod';

export class DefaultAgent extends BaseAgent {
  constructor() {
    super(
      'default',
      'A general-purpose AI assistant that can help with a wide variety of tasks',
      [
        'General conversation',
        'Information lookup',
        'Basic problem solving',
        'Creative writing',
        'Analysis and reasoning',
      ]
    );
  }

  getInstructions(): string {
    return `You are a helpful AI assistant that can assist with a wide variety of tasks. 
    You should be friendly, informative, and provide clear and accurate responses. 
    If you're unsure about something, be honest about your limitations.
    Focus on being helpful while maintaining accuracy.`;
  }

  getTools() {
    // Default agent has no specific tools, just uses LLM capabilities
    return {};
  }
}