import { NextApiRequest, NextApiResponse } from 'next';

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

    // Simple title generation based on first message
    // TODO: Implement actual LLM-based title generation
    let title = 'New Conversation';
    
    if (chat_history.length > 0) {
      const firstMessage = chat_history.find(msg => msg.role === 'user');
      if (firstMessage && firstMessage.content) {
        // Extract first few words and clean them up
        const words = firstMessage.content.split(' ').slice(0, 5);
        title = words.join(' ');
        if (title.length > 50) {
          title = title.substring(0, 47) + '...';
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