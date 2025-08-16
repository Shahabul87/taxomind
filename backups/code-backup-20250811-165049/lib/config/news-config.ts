/**
 * News Configuration for different environments
 */

export const newsConfig = {
  // Determine if we should use real news data
  useRealNews: () => {
    // Railway deployment detection
    if (process.env.RAILWAY_ENVIRONMENT === 'production' ||
        process.env.RAILWAY_PUBLIC_DOMAIN ||
        process.env.RAILWAY_PROJECT_ID) {
      return true;
    }
    
    // Always use real news in production
    if (process.env.NODE_ENV === 'production' || 
        process.env.VERCEL_ENV === 'production' ||
        process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
      return true;
    }
    
    // Check explicit environment variable
    if (process.env.USE_REAL_NEWS === 'true' || 
        process.env.NEXT_PUBLIC_USE_REAL_NEWS === 'true') {
      return true;
    }
    
    // Default to false in development
    return false;
  },
  
  // Cache configuration
  cache: {
    // Cache duration in milliseconds
    duration: process.env.NODE_ENV === 'production' ? 
      5 * 60 * 1000 : // 5 minutes in production
      60 * 1000,      // 1 minute in development
    
    // Maximum number of cached articles
    maxArticles: 200,
    
    // Enable caching
    enabled: true
  },
  
  // Fetch configuration
  fetch: {
    // Timeout for RSS feeds
    rssTimeout: 10000, // 10 seconds
    
    // Timeout for API calls
    apiTimeout: 5000, // 5 seconds
    
    // Maximum articles per source
    maxPerSource: 20,
    
    // Total maximum articles
    maxTotal: 100,
    
    // Retry configuration
    retries: 2,
    retryDelay: 1000 // 1 second
  },
  
  // Source priorities (higher = more important)
  sourcePriority: {
    'OpenAI Blog': 100,
    'Google DeepMind': 95,
    'MIT News AI': 90,
    'TechCrunch AI': 85,
    'The Verge AI': 80,
    'VentureBeat AI': 75,
    'Hacker News': 85,
    'Google News': 70,
    'Reddit MachineLearning': 65,
    'arXiv AI': 88
  },
  
  // Production RSS feeds (always available, no API key needed)
  productionFeeds: [
    {
      name: 'TechCrunch AI',
      url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
      priority: 85
    },
    {
      name: 'The Verge AI',
      url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
      priority: 80
    },
    {
      name: 'VentureBeat AI',
      url: 'https://venturebeat.com/category/ai/feed/',
      priority: 75
    },
    {
      name: 'MIT Technology Review',
      url: 'https://www.technologyreview.com/feed/',
      priority: 90
    },
    {
      name: 'Google AI Blog',
      url: 'https://blog.google/technology/ai/rss/',
      priority: 95
    },
    {
      name: 'OpenAI Blog',
      url: 'https://openai.com/blog/rss.xml',
      priority: 100
    },
    {
      name: 'arXiv AI',
      url: 'http://arxiv.org/rss/cs.AI',
      priority: 88
    }
  ]
};

// Export utility functions
export const isProductionEnvironment = () => {
  return process.env.NODE_ENV === 'production' || 
         process.env.VERCEL_ENV === 'production' ||
         process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ||
         process.env.RAILWAY_ENVIRONMENT === 'production' ||
         process.env.RAILWAY_PUBLIC_DOMAIN !== undefined ||
         process.env.RAILWAY_PROJECT_ID !== undefined;
};

export const shouldUseRealNews = () => newsConfig.useRealNews();