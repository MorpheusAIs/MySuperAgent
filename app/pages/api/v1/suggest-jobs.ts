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
You are a job suggestion AI that helps users discover useful automations and tasks. Based on the user's existing jobs and context, suggest 5-8 new job ideas that would be valuable.

User's existing jobs:
${JSON.stringify(jobSummary, null, 2)}

Context: ${userContext || 'General user looking for helpful automations'}

Consider these categories of useful jobs:
1. **Information Monitoring**: Daily crypto prices, weather, news summaries
2. **Productivity**: Calendar reminders, task tracking, deadline alerts  
3. **Financial**: Portfolio tracking, market alerts, price notifications
4. **Health & Lifestyle**: Daily affirmations, workout reminders, habit tracking
5. **Professional**: Industry news, competitor analysis, market research
6. **Entertainment**: Daily jokes, quotes, interesting facts
7. **Technical**: System monitoring, code deployment, automated reports

For each suggestion, provide:
- A compelling title (max 50 chars)
- A clear description (max 150 chars) 
- Suggested schedule type
- Estimated value/benefit

Focus on jobs that:
- Save time through automation
- Provide regular valuable information
- Help with consistency (habits, routines)
- Are genuinely useful, not just novelties
- Complement existing jobs without duplicating them

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
      
      // Fallback to hardcoded suggestions
      const fallbackSuggestions = [
        {
          title: "Daily Crypto Market Update",
          description: "Get Bitcoin, Ethereum, and top altcoin prices and news every morning",
          scheduleType: "daily",
          scheduledTime: "09:00",
          category: "Financial",
          estimatedValue: "Stay informed on crypto markets",
          initialMessage: "Provide daily cryptocurrency market summary with Bitcoin, Ethereum, and top 10 altcoin prices, percentage changes, and major news",
          difficulty: "easy"
        },
        {
          title: "Weather & Day Planner",
          description: "Get weather forecast and daily planning suggestions",
          scheduleType: "daily", 
          scheduledTime: "08:00",
          category: "Productivity",
          estimatedValue: "Better daily planning",
          initialMessage: "Provide today's weather forecast and suggest how to plan my day based on weather conditions",
          difficulty: "easy"
        },
        {
          title: "AI News Digest",
          description: "Curated AI and tech news summary to stay current with innovations",
          scheduleType: "daily",
          scheduledTime: "18:00", 
          category: "Professional",
          estimatedValue: "Stay current with tech trends",
          initialMessage: "Create a daily digest of the most important AI and technology news, including breakthroughs, product launches, and industry trends",
          difficulty: "easy"
        },
        {
          title: "Motivational Quote Generator",
          description: "Daily inspiration and motivational quotes to start your day positively",
          scheduleType: "daily",
          scheduledTime: "07:00",
          category: "Health & Lifestyle", 
          estimatedValue: "Daily motivation and positivity",
          initialMessage: "Generate an inspiring and motivational quote with brief context about why it's meaningful and how to apply it today",
          difficulty: "easy"
        },
        {
          title: "Weekly Goal Progress Check",
          description: "Weekly reminder to review and plan your goals and achievements",
          scheduleType: "weekly",
          scheduledTime: "09:00",
          category: "Productivity",
          estimatedValue: "Better goal tracking and achievement",
          initialMessage: "Help me review my weekly goals and progress, suggest adjustments, and plan priorities for the upcoming week",
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