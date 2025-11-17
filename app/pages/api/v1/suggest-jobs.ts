import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { walletAddress, userContext } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Get user's existing jobs to understand their patterns
    let existingJobs: any[] = [];
    try {
      const { JobDB } = await import('@/services/database/db');
      existingJobs = await JobDB.getJobsByWallet(walletAddress);
    } catch (dbError) {
      console.log('Could not fetch existing jobs, proceeding with general suggestions');
    }

    const jobSummary = existingJobs.slice(0, 10).map(job => ({
      name: job.name,
      description: job.description || job.initial_message.substring(0, 100),
      status: job.status,
      isScheduled: job.is_scheduled
    }));

    const prompt = `
You are a job suggestion AI that helps users discover valuable recurring automations. Based on the user's existing jobs, suggest 5-8 new scheduled job ideas that automate repetitive tasks.

User's existing jobs:
${JSON.stringify(jobSummary, null, 2)}

Context: ${userContext || 'User wants to automate recurring tasks and save time'}

Focus on RECURRING AUTOMATION jobs in these categories:
1. **Financial Monitoring**: Daily crypto prices (CoinCap), stock alerts, portfolio tracking
2. **Lifestyle & Local**: Restaurant recommendations (Google Maps), weather, local events
3. **Entertainment & Family**: Bedtime stories, daily jokes, fun facts for kids
4. **Productivity**: Email summaries, calendar digests, deadline reminders
5. **Information**: News digests, industry updates, learning content
6. **Health & Wellness**: Workout reminders, meal planning, health check-ins

IMPORTANT: Every suggestion should be:
- A RECURRING task (daily, weekly, or custom schedule)
- Something that AUTOMATES a repetitive activity
- Saves the user from having to remember or manually do something
- Provides consistent value over time

For each suggestion, provide:
- A compelling title emphasizing the automation (max 50 chars)
- A description highlighting time saved (max 150 chars)
- Schedule type (daily, weekly, or custom)
- Clear value proposition about automation benefit

Respond with JSON array:
[
  {
    "title": "Daily Crypto Market Summary",
    "description": "Get a concise summary of top crypto movements, news, and market sentiment every morning",
    "scheduleType": "daily",
    "scheduledTime": "09:00",
    "category": "Financial",
    "estimatedValue": "Stay informed on market trends without checking multiple sources",
    "initialMessage": "Generate a daily crypto market summary including Bitcoin, Ethereum, and top 10 altcoins with price changes, volume, and key news",
    "difficulty": "easy"
  }
]

Provide 5-8 diverse, high-value suggestions.
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
            content: 'You are a helpful job suggestion AI. Always respond with valid JSON array of job suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
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
      const suggestions = JSON.parse(content);
      
      if (!Array.isArray(suggestions)) {
        throw new Error('Response should be an array of suggestions');
      }

      // Validate and filter suggestions
      const validSuggestions = suggestions.filter(suggestion => 
        suggestion.title && 
        suggestion.description && 
        suggestion.initialMessage
      ).slice(0, 8); // Limit to 8 suggestions

      return res.status(200).json({
        success: true,
        suggestions: validSuggestions,
        userJobCount: existingJobs.length,
        timestamp: new Date().toISOString()
      });

    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      
      // Fallback to hardcoded suggestions focused on recurring tasks
      const fallbackSuggestions = [
        {
          title: "Morning Crypto Price Check",
          description: "Get prices of your favorite cryptocurrencies every morning via CoinCap",
          scheduleType: "daily",
          scheduledTime: "09:00",
          category: "Financial",
          estimatedValue: "Stay informed on crypto markets without manual checking",
          initialMessage: "Tell me the prices of my favorite cryptocurrencies (Bitcoin, Ethereum, and Solana) every morning",
          difficulty: "easy"
        },
        {
          title: "Restaurant Recommendations",
          description: "Find 3 great places to eat in your city using Google Maps",
          scheduleType: "weekly",
          scheduledTime: "18:00",
          category: "Lifestyle",
          estimatedValue: "Never run out of date night ideas",
          initialMessage: "Recommend 3 highly-rated places to eat in my city for this weekend",
          difficulty: "easy"
        },
        {
          title: "Bedtime Story Writer",
          description: "Generate a unique bedtime story for your kids every night",
          scheduleType: "daily",
          scheduledTime: "19:30",
          category: "Entertainment",
          estimatedValue: "Fresh stories every night without thinking",
          initialMessage: "Write a creative bedtime story for my kid about adventure and friendship",
          difficulty: "easy"
        },
        {
          title: "Daily Weather Briefing",
          description: "Morning weather forecast so you know what to wear and plan for",
          scheduleType: "daily",
          scheduledTime: "07:00",
          category: "Productivity",
          estimatedValue: "Better daily planning based on weather",
          initialMessage: "Give me today's weather forecast with temperature, precipitation, and clothing suggestions",
          difficulty: "easy"
        },
        {
          title: "Weekly Email Summary",
          description: "Automated summary of important emails to save inbox time",
          scheduleType: "weekly",
          scheduledTime: "09:00",
          category: "Productivity",
          estimatedValue: "Stay on top of emails without constant checking",
          initialMessage: "Summarize my most important unread emails from the past week and highlight action items",
          difficulty: "medium"
        }
      ];

      return res.status(200).json({
        success: true,
        suggestions: fallbackSuggestions,
        userJobCount: existingJobs.length,
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

  } catch (error) {
    console.error('Job suggestion error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate job suggestions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}