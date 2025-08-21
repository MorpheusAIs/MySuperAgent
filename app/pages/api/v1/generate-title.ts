import { NextApiRequest, NextApiResponse } from 'next';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Initialize OpenAI client
const openai = createOpenAI({
  baseURL: 'https://api.cerebras.ai/v1',
  apiKey: process.env.CEREBRAS_API_KEY || '',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chat_history, conversation_id } = req.body;
    
    if (!chat_history || !Array.isArray(chat_history)) {
      return res.status(400).json({ error: 'Invalid chat history' });
    }

    let title = 'New Conversation';
    
    if (chat_history.length === 0) {
      return res.status(200).json({ title });
    }

    try {
      // Use LLM to generate a contextual title
      const conversationText = chat_history
        .slice(0, 10) // Limit to first 10 messages to avoid token limits
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const result = await generateObject({
        model: openai('llama3.1-70b'),
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that generates concise, descriptive titles for conversations. 
            
            Rules:
            - Generate a title that captures the main topic or intent of the conversation
            - Keep it under 50 characters
            - Make it descriptive but concise
            - Don't include quotes around the title
            - Focus on the main subject or task being discussed
            - Examples: "Market Analysis Request", "Crypto Portfolio Review", "Schedule Daily Tasks", "Code Debugging Help"`
          },
          {
            role: 'user',
            content: `Generate a title for this conversation:\n\n${conversationText}`
          }
        ],
        schema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'A concise, descriptive title for the conversation'
            }
          },
          required: ['title']
        } as any,
        temperature: 0.3, // Lower temperature for more consistent titles
      });

      title = (result.object as { title: string }).title;
      
      // Ensure title length constraints
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }
      
      console.log(`[Title Generation] Generated title: "${title}" for conversation ${conversation_id}`);
      
    } catch (llmError) {
      console.warn('[Title Generation] LLM title generation failed, falling back to simple method:', llmError);
      
      // Fallback to simple title generation if LLM fails
      const firstMessage = chat_history.find(msg => msg.role === 'user');
      if (firstMessage && firstMessage.content) {
        // Extract first few words and clean them up
        const words = firstMessage.content.split(' ').slice(0, 6);
        title = words.join(' ');
        if (title.length > 50) {
          title = title.substring(0, 47) + '...';
        }
        
        // Clean up the title - remove common prefixes
        title = title
          .replace(/^(please|can you|could you|help me|i need|i want)/i, '')
          .trim();
        
        // Capitalize first letter
        if (title.length > 0) {
          title = title.charAt(0).toUpperCase() + title.slice(1);
        }
        
        if (!title || title.length < 3) {
          title = 'New Conversation';
        }
      }
    }
    
    return res.status(200).json({ title });
  } catch (error) {
    console.error('Error generating title:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}