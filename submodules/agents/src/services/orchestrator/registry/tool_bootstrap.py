"""
Bootstrap tools for the agents.
"""

from crewai_tools import (
    ApifyActorsTool,
    BraveSearchTool,
    CodeDocsSearchTool,
    CodeInterpreterTool,
    DallETool,
    PDFSearchTool,
    SeleniumScrapingTool,
    TXTSearchTool,
    VisionTool,
    WebsiteSearchTool,
    YoutubeChannelSearchTool,
    YoutubeVideoSearchTool,
)
from services.orchestrator.registry.tool_registry import ToolRegistry
from services.tools import bootstrap_tools as bootstrap_custom_tools
from services.tools import ToolRegistry as CustomToolRegistry


def _register_tool(tool_name, tool_creator_func, **kwargs):
    """
    Helper function to register a tool with error handling.

    Args:
        tool_name: Name to register the tool under
        tool_creator_func: Function that creates the tool instance
        **kwargs: Arguments to pass to the tool creator function

    Returns:
        bool: True if registration was successful, False otherwise
    """
    if tool_name in ToolRegistry.all_names():
        return True  # Tool already registered

    try:
        tool_instance = tool_creator_func(**kwargs)
        if tool_instance:
            ToolRegistry.register(tool_name, tool_instance)
            return True
    except Exception as e:
        print(f"Failed to initialize {tool_name} tool: {e}")
        return False


def _register_custom_tools():
    """
    Register custom tools from the dedicated tools service.
    """
    # Make sure custom tools are initialized
    bootstrap_custom_tools()
    
    # Get all tools from the custom registry
    for tool_name in CustomToolRegistry.all_names():
        try:
            custom_tool = CustomToolRegistry.get(tool_name)
            # Don't register if a tool with the same name already exists
            if tool_name not in ToolRegistry.all_names():
                ToolRegistry.register(tool_name, custom_tool)
        except Exception as e:
            print(f"Failed to register custom tool {tool_name}: {e}")


def bootstrap_tools():
    """
    Register all default tools with the ToolRegistry.
    Only registers each tool if it hasn't already been registered.
    """
    # Register custom tools first
    _register_custom_tools()
    
    # ======== SEARCH TOOLS ========
    # General web search
    _register_tool("brave_search", BraveSearchTool)

    # ======== SOCIAL MEDIA SCRAPERS ========
    # Instagram data scraper
    _register_tool("instagram_scraper", ApifyActorsTool, actor_name="apify/instagram-scraper")

    # TikTok data scraper
    _register_tool("tiktok_scraper", ApifyActorsTool, actor_name="clockworks/tiktok-scraper")

    # Twitter/X data scraper
    _register_tool("twitter_scraper", ApifyActorsTool, actor_name="apidojo/twitter-scraper-lite")

    # Facebook posts scraper
    _register_tool("facebook_posts_scraper", ApifyActorsTool, actor_name="apify/facebook-posts-scraper")

    # Reddit content scraper
    _register_tool("reddit_scraper", ApifyActorsTool, actor_name="trudax/reddit-scraper-lite")

    # YouTube comments scraper
    _register_tool("youtube_comments_scraper", ApifyActorsTool, actor_name="streamers/youtube-comments-scraper")

    # Truth Social content scraper
    _register_tool("truth_social_scraper", ApifyActorsTool, actor_name="muhammetakkurtt/truth-social-scraper")

    # LinkedIn profile scraper
    _register_tool("linkedin_profile_scraper", ApifyActorsTool, actor_name="dev_fusion/Linkedin-Profile-Scraper")

    # LinkedIn people finder
    _register_tool("linkedin_people_finder", ApifyActorsTool, actor_name="anchor/LinkedIn-people-finder")

    # ======== BUSINESS & LOCATION DATA SCRAPERS ========
    # Google Places business data scraper
    _register_tool("google_places_scraper", ApifyActorsTool, actor_name="compass/crawler-google-places")

    # Business contact information scraper
    _register_tool("contact_info_scraper", ApifyActorsTool, actor_name="vdrmota/contact-info-scraper")

    # Apollo.io B2B data scraper
    _register_tool("apollo_io_scraper", ApifyActorsTool, actor_name="code_crafter/apollo-io-scraper")

    # Website traffic & analytics scraper
    _register_tool("similarweb_scraper", ApifyActorsTool, actor_name="tri_angle/similarweb-scraper")

    # LinkedIn company posts scraper
    _register_tool("linkedin_company_posts_scraper", ApifyActorsTool, actor_name="apimaestro/linkedin-company-posts")

    # ======== E-COMMERCE SCRAPERS ========
    # Amazon product data scraper
    _register_tool("amazon_product_crawler", ApifyActorsTool, actor_name="junglee/Amazon-crawler")

    # ======== TRAVEL & HOSPITALITY SCRAPERS ========
    # TripAdvisor reviews scraper
    _register_tool("tripadvisor_reviews_scraper", ApifyActorsTool, actor_name="maxcopell/tripadvisor-reviews")

    # TripAdvisor listing scraper
    _register_tool("tripadvisor_scraper", ApifyActorsTool, actor_name="maxcopell/tripadvisor")

    # Booking.com reviews scraper
    _register_tool("booking_reviews_scraper", ApifyActorsTool, actor_name="voyager/booking-reviews-scraper")

    # ======== REAL ESTATE SCRAPERS ========
    # Zillow property listings scraper
    _register_tool("zillow_scraper", ApifyActorsTool, actor_name="maxcopell/zillow-scraper")

    # ======== JOB & PROFESSIONAL SCRAPERS ========
    # Glassdoor job listings scraper
    _register_tool("glassdoor_jobs_scraper", ApifyActorsTool, actor_name="bebity/glassdoor-jobs-scraper")

    # ======== CONTENT EXTRACTION TOOLS ========
    # Smart article content extractor
    _register_tool("article_extractor_smart", ApifyActorsTool, actor_name="lukaskrivka/article-extractor-smart")

    # ======== MULTIMEDIA SEARCH TOOLS ========
    # YouTube video content search
    _register_tool("youtube_video_search", YoutubeVideoSearchTool)

    # YouTube channel content search
    _register_tool("youtube_channel_search", YoutubeChannelSearchTool)

    # YouTube transcript scraper
    _register_tool("youtube_transcript_scraper", ApifyActorsTool, actor_name="pintostudio/youtube-transcript-scraper")

    # ======== WEBSITE & WEB CONTENT TOOLS ========
    # Website content semantic search
    _register_tool("website_search", WebsiteSearchTool)

    # Browser-based web scraping (for JavaScript-heavy sites)
    _register_tool("selenium_scraper", SeleniumScrapingTool)

    # ======== DOCUMENT & FILE TOOLS ========
    # Text file semantic search
    _register_tool("txt_search", TXTSearchTool)

    # PDF document semantic search
    _register_tool("pdf_search", PDFSearchTool)

    # ======== CODE & DEVELOPMENT TOOLS ========
    # Python code execution environment
    _register_tool("code_interpreter", CodeInterpreterTool)

    # Code documentation semantic search
    _register_tool("code_docs_search", CodeDocsSearchTool)

    # ======== AI & MULTIMODAL TOOLS ========
    # Image text extraction (OCR and analysis)
    _register_tool("vision", VisionTool)

    # AI image generation
    _register_tool("dalle", DallETool)

    # Add more tools here as needed
    # Example:
    # _register_tool("some_tool", SomeTool, some_param="value")