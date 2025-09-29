import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { walletAddress, autoCreate = false } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Top 10 most useful default jobs based on user feedback and common needs
    const defaultJobs = [
      {
        name: "Daily Crypto Market Summary",
        description: "Bitcoin, Ethereum, and top altcoin prices with market sentiment",
        initial_message: "Provide a daily cryptocurrency market summary including Bitcoin, Ethereum, and top 10 altcoins with price changes, volume trends, and key news headlines",
        schedule_type: "daily",
        schedule_time: "09:00",
        category: "Financial",
        priority: 1
      },
      {
        name: "Morning Weather & Day Planner", 
        description: "Weather forecast with day planning suggestions",
        initial_message: "Provide today's weather forecast for my location and suggest how I should plan my day based on weather conditions, including outfit recommendations",
        schedule_type: "daily",
        schedule_time: "08:00",
        category: "Productivity",
        priority: 2
      },
      {
        name: "AI & Tech News Digest",
        description: "Daily curated AI and technology news to stay current",
        initial_message: "Create a daily digest of the most important AI and technology news, including major breakthroughs, product launches, funding news, and industry trends",
        schedule_type: "daily", 
        schedule_time: "18:00",
        category: "Professional",
        priority: 3
      },
      {
        name: "Daily Motivation & Quote",
        description: "Inspirational quote and daily motivation to start positively",
        initial_message: "Generate an inspiring and actionable motivational quote with brief context about why it's meaningful and practical ways to apply it today",
        schedule_type: "daily",
        schedule_time: "07:00", 
        category: "Health & Lifestyle",
        priority: 4
      },
      {
        name: "Stock Market Overview",
        description: "Daily summary of major stock indices and market trends",
        initial_message: "Provide a daily stock market summary including S&P 500, Nasdaq, Dow Jones performance, notable movers, and key economic news affecting markets",
        schedule_type: "daily",
        schedule_time: "16:00",
        category: "Financial", 
        priority: 5
      },
      {
        name: "Weekly Goal Review",
        description: "Weekly check-in for goal progress and planning",
        initial_message: "Help me review my weekly goals and progress, identify what worked well, what needs improvement, and suggest priorities for the upcoming week",
        schedule_type: "weekly",
        schedule_time: "09:00",
        category: "Productivity",
        priority: 6
      },
      {
        name: "Daily Health Reminder",
        description: "Health tips, hydration reminders, and wellness suggestions",
        initial_message: "Provide daily health and wellness reminders including hydration goals, posture tips, brief exercise suggestions, and a random health fact",
        schedule_type: "daily", 
        schedule_time: "14:00",
        category: "Health & Lifestyle",
        priority: 7
      },
      {
        name: "Industry News Scanner",
        description: "Personalized industry news based on your interests",
        initial_message: "Scan and summarize the most important news in technology, business, and innovation sectors, focusing on trends that could impact professionals and entrepreneurs",
        schedule_type: "daily",
        schedule_time: "12:00",
        category: "Professional",
        priority: 8
      },
      {
        name: "Daily Productivity Tip",
        description: "Actionable productivity tips and life hacks",
        initial_message: "Share a practical productivity tip or life hack that I can implement today, explaining why it works and how to get started with it",
        schedule_type: "daily",
        schedule_time: "10:00",
        category: "Productivity", 
        priority: 9
      },
      {
        name: "Weekend Learning Suggestion",
        description: "Weekly learning opportunities and skill development ideas",
        initial_message: "Suggest interesting learning opportunities for this weekend - online courses, tutorials, books, or skills I could develop in 2-3 hours",
        schedule_type: "weekly",
        schedule_time: "10:00", 
        category: "Professional",
        priority: 10
      }
    ];

    if (autoCreate) {
      // Auto-create these jobs for the user
      try {
        const { JobDB } = await import('@/services/database/db');
        const createdJobs = [];

        for (const jobTemplate of defaultJobs) {
          // Calculate actual schedule time
          const now = new Date();
          const [hours, minutes] = jobTemplate.schedule_time.split(':');
          const scheduleDateTime = new Date();
          scheduleDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          // If time has passed today, schedule for tomorrow
          if (scheduleDateTime <= now) {
            scheduleDateTime.setDate(scheduleDateTime.getDate() + 1);
          }

          // Calculate next run time
          const JobsAPI = await import('@/services/api-clients/jobs');
          const nextRunTime = JobsAPI.default.calculateNextRunTime(
            jobTemplate.schedule_type as 'daily' | 'weekly',
            scheduleDateTime,
            undefined
          );

          const newJob = await JobDB.createJob({
            wallet_address: walletAddress,
            name: jobTemplate.name,
            description: jobTemplate.description,
            initial_message: jobTemplate.initial_message,
            status: 'pending',
            is_scheduled: true,
            has_uploaded_file: false,
            schedule_type: jobTemplate.schedule_type as 'daily' | 'weekly',
            schedule_time: scheduleDateTime,
            next_run_time: nextRunTime,
            interval_days: null,
            is_active: true,
            last_run_at: null,
            run_count: 0,
            max_runs: null,
            weekly_days: jobTemplate.schedule_type === 'weekly' ? '1' : null, // Monday for weekly jobs
            timezone: 'UTC'
          });

          createdJobs.push(newJob);
        }

        return res.status(201).json({
          success: true,
          message: `Created ${createdJobs.length} default jobs`,
          createdJobs: createdJobs.map(job => ({
            id: job.id,
            name: job.name,
            scheduleType: job.schedule_type,
            nextRun: job.next_run_time
          })),
          totalJobs: createdJobs.length
        });

      } catch (createError) {
        console.error('Error creating default jobs:', createError);
        return res.status(500).json({
          error: 'Failed to create default jobs',
          message: createError instanceof Error ? createError.message : 'Unknown error'
        });
      }
    } else {
      // Just return the template jobs
      return res.status(200).json({
        success: true,
        defaultJobs,
        totalJobs: defaultJobs.length,
        message: 'Use autoCreate=true to automatically create these jobs'
      });
    }

  } catch (error) {
    console.error('Default jobs API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process default jobs request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}