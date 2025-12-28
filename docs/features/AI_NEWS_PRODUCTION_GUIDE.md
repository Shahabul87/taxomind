# AI News Production Deployment Guide

## Overview

The AI News feature is configured to **automatically show real news in production** environments. No additional configuration is required for basic functionality.

## How It Works

### 1. Automatic Production Detection

The system automatically detects production environments by checking:
- `NODE_ENV === 'production'`
- `VERCEL_ENV === 'production'`
- `NEXT_PUBLIC_VERCEL_ENV === 'production'`

When any of these conditions are true, real news is automatically fetched.

### 2. Data Sources (No API Keys Required)

The following RSS feeds are always available without API keys:
- **TechCrunch AI** - Latest AI industry news
- **The Verge AI** - Technology and AI coverage
- **VentureBeat AI** - Business and AI news
- **MIT Technology Review** - Research and innovation
- **Google AI Blog** - Official Google AI updates
- **OpenAI Blog** - OpenAI announcements
- **arXiv AI** - Latest AI research papers
- **Reddit MachineLearning** - Community discussions
- **Towards Data Science** - AI tutorials and insights
- **AI News** - General AI news
- **Wired AI** - AI business coverage

### 3. Production Features

#### Automatic Real News
- Real news is automatically enabled in production
- No need to toggle or configure anything
- Falls back to cached data if RSS feeds fail

#### Caching
- 5-minute cache in production (1 minute in dev)
- Reduces server load and improves response times
- Automatic cache cleanup

#### Error Handling
- Individual RSS feed failures don't break the system
- 10-second timeout for RSS feeds
- Fallback to cached or demo data if all sources fail

#### Performance Optimizations
- Parallel fetching from all sources
- Smart deduplication
- Limited to top 100 articles to prevent UI overload

## Deployment Steps

### 1. Vercel Deployment (Recommended)

```bash
# Deploy to Vercel
vercel

# Or use GitHub integration for automatic deployments
```

The system will automatically detect Vercel's production environment.

### 2. Other Platforms

Set the environment variable:
```env
NODE_ENV=production
```

### 3. Optional: Enhanced News Sources

To enable additional news sources (NewsAPI, Bing, Google Search):

```env
# Optional - for more news sources
NEWS_API_KEY=your_newsapi_key_here
BING_API_KEY=your_bing_api_key_here
GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_google_search_engine_id_here
```

## Monitoring

### 1. Check Data Source

The API response includes the data source:
```json
{
  "news": [...],
  "source": "real",  // or "demo"
  "environment": "production"
}
```

### 2. Monitor RSS Feed Health

Check the server logs for:
- `Fetching real AI news from web sources...`
- `Fetched X unique AI news articles in Yms`
- Any RSS feed errors

### 3. Cache Statistics

The news cache provides statistics:
- Number of cache entries
- Total cached articles
- Cache age

## Troubleshooting

### No News Appearing

1. Check server logs for RSS feed errors
2. Verify internet connectivity
3. Check if RSS feeds are accessible from your server
4. Look for timeout errors (10-second limit)

### Old News Showing

1. Clear the cache manually if needed
2. Check if cache duration is appropriate
3. Verify RSS feeds are updating

### Performance Issues

1. Enable caching if disabled
2. Reduce number of RSS sources if needed
3. Check server resources

## Best Practices

### 1. Don't Disable Caching
Caching significantly improves performance and reduces load.

### 2. Monitor API Keys (if used)
If using optional APIs, monitor usage to avoid rate limits.

### 3. Regular Updates
Keep RSS feed URLs updated as sources may change.

### 4. Error Logging
Enable comprehensive logging in production to catch issues early.

## Testing Production Mode Locally

```bash
# Test with production environment
NODE_ENV=production npm run dev

# Or set in .env.local
NODE_ENV=production
USE_REAL_NEWS=true
```

## API Endpoints

### Get Latest News (Production)
```
GET /api/sam/ai-news
```
Automatically returns real news in production.

### Force Real News (Development)
```
GET /api/sam/ai-news?realtime=true
```

### Get Trending News
```
GET /api/sam/ai-news?action=trending
```

### Search News
```
GET /api/sam/ai-news?action=search&query=GPT
```

## Security Considerations

1. **No API Keys in Client**: All API keys stay server-side
2. **Rate Limiting**: RSS feeds have natural rate limits
3. **Content Sanitization**: All content is sanitized before display
4. **CORS**: RSS feeds are fetched server-side to avoid CORS issues

## Performance Metrics

Expected performance in production:
- Initial load: 2-5 seconds (uncached)
- Subsequent loads: <100ms (cached)
- RSS timeout: 10 seconds max
- Cache duration: 5 minutes
- Maximum articles: 100

## Fallback Strategy

If all RSS feeds fail:
1. Try Google News RSS (always available)
2. Use cached articles if available
3. Fall back to demo data as last resort
4. User sees content regardless of failures

## Future Enhancements

- Redis caching for multi-instance deployments
- WebSocket for real-time updates
- User preference persistence
- Email digest feature
- Progressive Web App support