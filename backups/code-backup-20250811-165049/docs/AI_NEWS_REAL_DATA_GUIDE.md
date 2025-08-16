# AI News Real Data Integration Guide

## Overview

The AI News page now supports fetching real-time AI news from multiple sources including RSS feeds, news APIs, and web searches. You can toggle between demo data and real data directly from the UI.

## Features

### 1. Real News Sources
- **RSS Feeds** (Free, no API key required):
  - TechCrunch AI
  - MIT News AI
  - The Verge AI
  - VentureBeat AI
  - Google AI Blog
  - OpenAI Blog
  - DeepMind Blog
  - arXiv AI
  - Reddit MachineLearning

- **News APIs** (Optional, require API keys):
  - NewsAPI.org
  - Bing News Search
  - Google Custom Search

- **Web Search**:
  - Hacker News (via Algolia API - free)
  - Google News RSS

### 2. Ranking System
All news articles are ranked using 8 weighted criteria:
- **Freshness (25%)**: How recent the news is
- **Relevance (20%)**: AI/ML specific relevance
- **Impact (15%)**: Industry/research impact
- **Credibility (15%)**: Source credibility
- **Virality (10%)**: Social engagement
- **Innovation (8%)**: Technical innovation
- **Educational (5%)**: Educational value
- **Practicality (2%)**: Real-world applications

### 3. UI Features
- **Real/Demo Toggle**: Switch between real web data and demo data
- **Auto-refresh**: Optional 5-minute auto-refresh
- **Trending Badges**: Hot, Rising, New indicators
- **Quality Badges**: Breaking, Verified, High Impact, etc.
- **Category Filtering**: Filter by news category
- **Impact Level Filtering**: Filter by importance
- **Search**: Search across titles and tags

## Setup

### 1. Basic Setup (RSS Feeds Only - No API Keys Required)

The system works out of the box with RSS feeds. Just toggle "Real News" in the UI to start fetching real AI news.

### 2. Enhanced Setup (With News APIs)

To enable additional news sources, add API keys to your `.env` file:

```env
# Enable real news fetching
USE_REAL_NEWS=true

# NewsAPI.org (100 free requests per day)
# Get your key at: https://newsapi.org
NEWS_API_KEY=your_newsapi_key_here

# Bing News Search API
# Get your key at: https://www.microsoft.com/en-us/bing/apis/bing-news-search-api
BING_API_KEY=your_bing_api_key_here

# Google Custom Search API (100 free queries per day)
# Get your key at: https://developers.google.com/custom-search/v1/overview
GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_google_search_engine_id_here
```

## Usage

### 1. Toggle Real News in UI

Click the "Real News" / "Demo News" button in the AI News page controls to switch between:
- **Demo News**: Pre-generated AI news for testing
- **Real News**: Live news from web sources

### 2. Manual Refresh

Click the "Refresh" button to fetch the latest news immediately.

### 3. Auto Refresh

Enable "Auto-refresh" to automatically fetch new articles every 5 minutes.

## Development

### Test Real News Fetching

```bash
# Run the test script
npx tsx scripts/test-real-news.ts
```

### Add New RSS Sources

Edit `/lib/sam-real-news-fetcher.ts` and add new sources to the `sources` array:

```typescript
{
  name: 'Your Source Name',
  type: 'rss',
  url: 'https://example.com/ai-news/feed/'
}
```

### Customize Ranking Weights

Edit `/lib/sam-news-ranking-engine.ts` to adjust the ranking criteria weights:

```typescript
private readonly WEIGHTS = {
  freshness: 0.25,      // Adjust these values
  relevance: 0.20,
  impact: 0.15,
  // ...
};
```

## API Endpoints

### Fetch Real-Time News
```
GET /api/sam/ai-news?realtime=true
```

### Fetch Top-Ranked News
```
GET /api/sam/ai-news?action=top-ranked&limit=20
```

### Fetch Trending News
```
GET /api/sam/ai-news?action=trending&limit=10
```

### Search News
```
GET /api/sam/ai-news?action=search&query=GPT
```

## Troubleshooting

### No News Appearing
1. Check browser console for errors
2. Verify RSS feeds are accessible
3. Check if API keys are correctly set (if using APIs)

### Slow Loading
- RSS feeds can take a few seconds to load
- Consider reducing the number of sources
- Enable caching in production

### API Rate Limits
- NewsAPI: 100 requests/day (free tier)
- Google Custom Search: 100 queries/day (free tier)
- Use RSS feeds primarily to avoid rate limits

## Production Deployment

1. Set `USE_REAL_NEWS=true` in production environment
2. Configure API keys in environment variables
3. Consider implementing Redis caching for better performance
4. Monitor API usage to avoid rate limits

## Future Enhancements

- [ ] Add more news sources
- [ ] Implement caching layer
- [ ] Add personalization based on user preferences
- [ ] Implement email digest feature
- [ ] Add social media integration
- [ ] Create mobile app notifications