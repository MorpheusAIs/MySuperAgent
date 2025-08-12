import { BaseAgent } from '@/services/agents/core/BaseAgent';
import { 
  dalleTool, 
  visionTool, 
  youtubeVideoSearchTool, 
  youtubeChannelSearchTool 
} from '@/services/agents/tools/crewai-equivalents';

export class MultimediaAgent extends BaseAgent {
  constructor() {
    super(
      'visual_content_creator',
      'AI visual content creator that generates and analyzes visual content to enhance communication and marketing materials.',
      [
        'AI image generation',
        'Image analysis and OCR',
        'YouTube content research',
        'Video content analysis',
        'Visual content creation'
      ],
      'gpt-4o-mini',
      false // Uses OpenAI tools directly
    );
  }

  getInstructions(): string {
    return `You are a creative professional who specializes in AI-generated visual content. You combine artistic sensibility with technical expertise to create compelling images and extract information from visual sources.

Key capabilities:
- Generate high-quality images using DALL-E 3
- Analyze images and extract text content using GPT-4 Vision
- Search YouTube for videos and channels
- Provide creative direction for visual content
- Extract insights from visual media

Important workflow instructions:
1) For image generation, create detailed, specific prompts that capture the user's vision
2) For image analysis, provide comprehensive descriptions and extract all relevant text
3) For YouTube research, focus on content relevance and quality metrics
4) Always use tools directly without unnecessary thinking steps
5) Provide creative suggestions to enhance visual content

Available tools:
- dalle: Generate images with DALL-E 3 (requires OPENAI_API_KEY)
- vision: Analyze images with GPT-4 Vision (requires OPENAI_API_KEY)
- youtube_video_search: Search for YouTube videos (requires YOUTUBE_API_KEY)
- youtube_channel_search: Search for YouTube channels (requires YOUTUBE_API_KEY)`;
  }

  getTools() {
    return {
      dalle: dalleTool,
      vision: visionTool,
      youtube_video_search: youtubeVideoSearchTool,
      youtube_channel_search: youtubeChannelSearchTool,
    };
  }
}

export class YouTubeAnalystAgent extends BaseAgent {
  constructor() {
    super(
      'youtube_analyst',
      'YouTube content intelligence specialist that extracts and analyzes content, trends, and audience engagement on YouTube.',
      [
        'YouTube video analysis',
        'Channel performance metrics',
        'Content trend identification',
        'Audience engagement analysis',
        'Video transcript analysis'
      ],
      'gpt-4o-mini',
      true // Uses both API tools and Apify tools
    );
  }

  getInstructions(): string {
    return `You are a video content expert who specializes in YouTube analytics. You are skilled at extracting insights from video content, comments, and channel performance to identify content trends and audience preferences.

Key capabilities:
- Search and analyze YouTube videos and channels
- Extract video transcripts and analyze content
- Monitor comments and audience engagement
- Identify trending topics and viral content
- Analyze channel growth and performance metrics

Important workflow instructions:
1) Use YouTube search tools to find relevant content first
2) Extract transcripts when detailed content analysis is needed
3) Analyze comments for audience sentiment and engagement
4) Focus on actionable insights for content creators
5) Limit follow-up questions and provide comprehensive analysis

Available tools:
- YouTube API tools for search and basic data
- Apify tools for detailed scraping including:
  - youtube-comments-scraper for engagement analysis
  - youtube-transcript-scraper for content analysis`;
  }

  getTools() {
    return {
      youtube_video_search: youtubeVideoSearchTool,
      youtube_channel_search: youtubeChannelSearchTool,
    };
  }
}