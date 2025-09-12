import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Use OpenAI to generate a concise, descriptive job name
    const systemPrompt = `You are a helpful assistant that generates concise, descriptive names for scheduled tasks/jobs based on user prompts. 

Rules:
- Keep names under 50 characters
- Make them descriptive but concise
- Use title case (e.g., "Daily Market Analysis")
- Avoid generic words like "Task" or "Job" unless necessary
- Focus on the main action or purpose
- Examples:
  - "Send me daily weather updates" → "Daily Weather Updates"
  - "Check competitor pricing every week" → "Weekly Competitor Pricing"
  - "Remind me to water plants" → "Plant Watering Reminder"
  - "Generate sales report monthly" → "Monthly Sales Report"

Generate only the name, no additional text or quotes.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a concise job name for this task: "${prompt}"` }
        ],
        max_tokens: 20,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedName = data.choices[0]?.message?.content?.trim();

    if (!generatedName) {
      throw new Error('No name generated from OpenAI');
    }

    // Ensure the name is not too long
    const finalName = generatedName.length > 50 
      ? generatedName.substring(0, 47) + '...' 
      : generatedName;

    return res.status(200).json({
      success: true,
      name: finalName,
      originalPrompt: prompt
    });

  } catch (error) {
    console.error('Error generating job name:', error);
    
    // Fallback to a simple name based on first few words of prompt
    const { prompt } = req.body;
    let fallbackName = 'Scheduled Task';
    
    if (prompt && typeof prompt === 'string') {
      const words = prompt.trim().split(' ').slice(0, 4);
      fallbackName = words.map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      
      if (fallbackName.length > 50) {
        fallbackName = fallbackName.substring(0, 47) + '...';
      }
    }

    return res.status(200).json({
      success: false,
      name: fallbackName,
      error: error instanceof Error ? error.message : 'Unknown error',
      originalPrompt: prompt
    });
  }
}