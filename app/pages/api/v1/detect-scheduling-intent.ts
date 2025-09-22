import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use OpenAI to analyze the message for scheduling intent
    const prompt = `
Analyze the following user message and determine if it contains scheduling intent. Look for keywords and phrases that indicate the user wants to schedule or automate a task.

Scheduling indicators include:
- Time-based keywords: "daily", "weekly", "hourly", "every", "schedule", "remind", "at", "when", "morning", "evening", "night"
- Automation keywords: "automatically", "regular", "recurring", "repeat", "routine"
- Future tense: "will", "want to", "need to", "should"

Message: "${message}"

Respond with a JSON object containing:
{
  "hasSchedulingIntent": boolean,
  "confidence": number (0-1),
  "schedulingKeywords": string[],
  "suggestedSchedule": {
    "type": "once" | "daily" | "weekly" | "custom" | null,
    "description": string
  },
  "reasoning": string
}

Example responses:
For "Send me daily crypto prices": {"hasSchedulingIntent": true, "confidence": 0.9, "schedulingKeywords": ["daily"], "suggestedSchedule": {"type": "daily", "description": "Run daily at 9:00 AM"}, "reasoning": "User explicitly requested daily updates"}

For "What is Bitcoin's price?": {"hasSchedulingIntent": false, "confidence": 0.1, "schedulingKeywords": [], "suggestedSchedule": null, "reasoning": "One-time information request with no scheduling indicators"}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a scheduling intent detection system. Analyze user messages and detect if they want to schedule or automate tasks. Always respond with valid JSON.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    try {
      const analysisResult = JSON.parse(content);
      
      // Validate the response structure
      if (typeof analysisResult.hasSchedulingIntent !== 'boolean') {
        throw new Error('Invalid response format from AI');
      }

      return res.status(200).json({
        success: true,
        analysis: analysisResult,
        originalMessage: message
      });

    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback: simple keyword detection
      const schedulingKeywords = [
        'daily', 'weekly', 'hourly', 'every', 'schedule', 'remind', 'automatically', 
        'regular', 'recurring', 'repeat', 'routine', 'morning', 'evening', 'night',
        'at', 'when', 'will', 'want to', 'need to', 'should'
      ];
      
      const messageWords = message.toLowerCase().split(/\s+/);
      const foundKeywords = schedulingKeywords.filter(keyword => 
        messageWords.some(word => word.includes(keyword))
      );
      
      const hasSchedulingIntent = foundKeywords.length > 0;
      
      return res.status(200).json({
        success: true,
        analysis: {
          hasSchedulingIntent,
          confidence: hasSchedulingIntent ? 0.7 : 0.3,
          schedulingKeywords: foundKeywords,
          suggestedSchedule: hasSchedulingIntent ? {
            type: foundKeywords.includes('daily') ? 'daily' : 
                  foundKeywords.includes('weekly') ? 'weekly' : 'custom',
            description: 'Schedule detected via keyword matching'
          } : null,
          reasoning: hasSchedulingIntent ? 
            `Found scheduling keywords: ${foundKeywords.join(', ')}` : 
            'No scheduling keywords detected'
        },
        originalMessage: message,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Scheduling intent detection error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze scheduling intent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}