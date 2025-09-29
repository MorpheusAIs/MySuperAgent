import { z } from 'zod';

// Chat request/response schemas
export const ChatRequestSchema = z.object({
  prompt: z.object({
    role: z.string(),
    content: z.string(),
  }),
  chatHistory: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      })
    )
    .optional(),
  conversationId: z.string(),
  requestId: z.string().optional(),
  useResearch: z.boolean().optional(),
  selectedAgents: z.array(z.string()).optional(),
  similarityContext: z.string().optional(),
  similarPrompts: z
    .array(
      z.object({
        messageId: z.string(),
        prompt: z.string(),
        response: z.string(),
        similarity: z.number(),
        jobId: z.string(),
        createdAt: z.date(),
      })
    )
    .optional(),
});

export const AgentResponseSchema = z.object({
  responseType: z.enum([
    'success',
    'error',
    'needs_info',
    'action_required',
    'research',
  ]),
  content: z.string().optional(),
  errorMessage: z.string().optional(),
  actionType: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Agent definition schema
export const AgentDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  capabilities: z.array(z.string()),
  tags: z.array(z.string()).optional(),
});

// Telemetry schemas
export const TelemetrySchema = z.object({
  processingTime: z
    .object({
      startTime: z.number(),
      endTime: z.number(),
      duration: z.number(),
    })
    .optional(),
  tokenUsage: z
    .object({
      totalTokens: z.number(),
      promptTokens: z.number(),
      completionTokens: z.number(),
      cachedPromptTokens: z.number().optional(),
    })
    .optional(),
});

export const SubtaskOutputSchema = z.object({
  subtask: z.string(),
  output: z.string(),
  agents: z.array(z.string()),
  telemetry: TelemetrySchema.optional(),
});
