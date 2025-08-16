import axios from 'axios';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { NewsArticle, NewsCategory } from './sam-news-engine';
import { logger } from '@/lib/logger';

interface NewsSource {
  name: string;
  type: 'rss' | 'api' | 'search' | 'scraper';
  url: string;
  apiKey?: string;
}

export class SAMRealNewsFetcher {
  private rssParser: Parser;
  
  // Real news sources - prioritizing free options
  private sources: NewsSource[] = [
    // RSS Feeds (Free, no API key needed)
    {
      name: 'TechCrunch AI',
      type: 'rss',
      url: 'https://techcrunch.com/category/artificial-intelligence/feed/'
    },
    {
      name: 'MIT News AI',
      type: 'rss',
      url: 'https://news.mit.edu/rss/topic/artificial-intelligence'
    },
    {
      name: 'The Verge AI',
      type: 'rss',
      url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml'
    },
    {
      name: 'VentureBeat AI',
      type: 'rss',
      url: 'https://venturebeat.com/category/ai/feed/'
    },
    {
      name: 'Google AI Blog',
      type: 'rss',
      url: 'https://blog.google/technology/ai/rss/'
    },
    {
      name: 'OpenAI Blog',
      type: 'rss',
      url: 'https://openai.com/blog/rss.xml'
    },
    {
      name: 'DeepMind Blog',
      type: 'rss',
      url: 'https://deepmind.com/blog/feed/basic/'
    },
    {
      name: 'arXiv AI',
      type: 'rss',
      url: 'http://arxiv.org/rss/cs.AI'
    },
    {
      name: 'Reddit MachineLearning',
      type: 'rss',
      url: 'https://www.reddit.com/r/MachineLearning/hot/.rss'
    },
    {
      name: 'Towards Data Science',
      type: 'rss',
      url: 'https://towardsdatascience.com/feed'
    },
    {
      name: 'AI News',
      type: 'rss',
      url: 'https://www.artificialintelligence-news.com/feed/'
    },
    {
      name: 'Wired AI',
      type: 'rss',
      url: 'https://www.wired.com/feed/category/business/artificial-intelligence/rss'
    }
  ];

  constructor() {
    this.rssParser = new Parser({
      customFields: {
        item: ['media:content', 'media:thumbnail', 'dc:creator', 'content:encoded']
      }
    });
  }

  /**
   * Perform a Google-like search for AI news
   * Uses multiple search techniques to find relevant content
   */
  async searchAINews(query: string = 'artificial intelligence news latest'): Promise<NewsArticle[]> {
    const allArticles: NewsArticle[] = [];
    
    // 1. Search through RSS feeds
    const rssArticles = await this.searchRSSFeeds(query);
    allArticles.push(...rssArticles);
    
    // 2. Use Google Custom Search (if API key available)
    const googleArticles = await this.searchGoogleCustom(query);
    allArticles.push(...googleArticles);
    
    // 3. Search through news aggregators
    const aggregatorArticles = await this.searchNewsAggregators(query);
    allArticles.push(...aggregatorArticles);
    
    // Remove duplicates and sort by date
    return this.deduplicateAndSort(allArticles);
  }

  /**
   * Search through RSS feeds for matching content
   */
  private async searchRSSFeeds(query: string): Promise<NewsArticle[]> {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 2);
    const allArticles: NewsArticle[] = [];
    
    // Fetch from all RSS sources in parallel
    const feedPromises = this.sources
      .filter(source => source.type === 'rss')
      .map(source => this.fetchFromRSS(source.url));
    
    const feedResults = await Promise.allSettled(feedPromises);
    
    feedResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        const filteredArticles = result.value.filter(article => {
          const content = `${article.title} ${article.summary}`.toLowerCase();
          // Check if at least 2 query words match
          const matchCount = queryWords.filter(word => content.includes(word)).length;
          return matchCount >= Math.min(2, queryWords.length);
        });
        allArticles.push(...filteredArticles);
      }
    });
    
    return allArticles;
  }

  /**
   * Use Google Custom Search JSON API (requires API key)
   */
  private async searchGoogleCustom(query: string): Promise<NewsArticle[]> {
    // Google Custom Search API (100 free queries per day)
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!apiKey || !searchEngineId) {

      return [];
    }
    
    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: `${query} site:techcrunch.com OR site:theverge.com OR site:wired.com OR site:mit.edu OR site:openai.com`,
          num: 10,
          dateRestrict: 'd7' // Last 7 days
        }
      });
      
      return response.data.items?.map((item: any, index: number) => ({
        articleId: `google-${Date.now()}-${index}`,
        title: item.title,
        summary: item.snippet,
        content: item.snippet,
        articleUrl: item.link,
        category: this.categorizeArticle(item.title),
        tags: this.extractTags(item.snippet),
        source: {
          name: new URL(item.link).hostname.replace('www.', ''),
          url: item.link,
          credibility: 80,
          type: 'media' as const,
          country: 'US'
        },
        author: 'Unknown',
        publishDate: new Date(),
        relevanceScore: 85,
        sentiment: 'neutral' as const,
        impactLevel: 'medium' as const,
        readingTime: 5,
        keyTakeaways: [],
        relatedArticles: [],
        educationalValue: 75,
        technicalDepth: 'intermediate' as const
      })) || [];
    } catch (error: any) {
      logger.error('Google Custom Search error:', error);
      return [];
    }
  }

  /**
   * Search through news aggregators using web scraping
   */
  private async searchNewsAggregators(query: string): Promise<NewsArticle[]> {
    const articles: NewsArticle[] = [];
    
    // Search Hacker News
    const hnArticles = await this.searchHackerNews(query);
    articles.push(...hnArticles);
    
    // Search Google News (web scraping approach)
    const googleNewsArticles = await this.scrapeGoogleNews(query);
    articles.push(...googleNewsArticles);
    
    return articles;
  }

  /**
   * Search Hacker News using their API
   */
  private async searchHackerNews(query: string): Promise<NewsArticle[]> {
    try {
      // Use Algolia's Hacker News Search API (free)
      const response = await axios.get('https://hn.algolia.com/api/v1/search', {
        params: {
          query: query,
          tags: 'story',
          hitsPerPage: 20,
          numericFilters: `created_at_i>${Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60}` // Last 7 days
        }
      });
      
      return response.data.hits
        .filter((hit: any) => hit.url && hit.title)
        .map((hit: any, index: number) => ({
          articleId: `hn-${Date.now()}-${index}`,
          title: hit.title,
          summary: `Discussion on Hacker News with ${hit.points} points and ${hit.num_comments} comments`,
          content: hit.title,
          articleUrl: hit.url,
          category: this.categorizeArticle(hit.title),
          tags: this.extractTags(hit.title),
          source: {
            name: 'Hacker News',
            url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
            credibility: 85,
            type: 'social' as const,
            country: 'US'
          },
          author: hit.author,
          publishDate: new Date(hit.created_at),
          relevanceScore: Math.min(100, 50 + hit.points / 10),
          sentiment: 'neutral' as const,
          impactLevel: hit.points > 100 ? 'high' : 'medium' as const,
          readingTime: 5,
          keyTakeaways: [],
          relatedArticles: [],
          educationalValue: 80,
          technicalDepth: 'intermediate' as const
        }));
    } catch (error: any) {
      logger.error('Hacker News search error:', error);
      return [];
    }
  }

  /**
   * Scrape Google News (careful approach to avoid rate limiting)
   */
  private async scrapeGoogleNews(query: string): Promise<NewsArticle[]> {
    try {
      // Use a Google News RSS feed with search query
      const googleNewsRss = `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' AI artificial intelligence')}&hl=en-US&gl=US&ceid=US:en`;
      
      const feed = await this.rssParser.parseURL(googleNewsRss);
      
      return feed.items.slice(0, 10).map((item, index) => ({
        articleId: `gnews-${Date.now()}-${index}`,
        title: item.title || 'Untitled',
        summary: this.extractSummary(item.contentSnippet || ''),
        content: item.contentSnippet || '',
        articleUrl: item.link || '',
        category: this.categorizeArticle(item.title || '') as NewsCategory,
        tags: ['AI', 'Technology', 'News'],
        source: {
          name: this.extractSourceFromGoogleNews(item.title || ''),
          url: item.link || '',
          credibility: 80,
          type: 'media' as const,
          country: 'US'
        },
        author: 'Unknown',
        publishDate: new Date(item.pubDate || Date.now()),
        relevanceScore: 75,
        sentiment: 'neutral' as const,
        impactLevel: 'medium' as const,
        readingTime: 5,
        keyTakeaways: [],
        relatedArticles: [],
        educationalValue: 70,
        technicalDepth: 'intermediate' as const,
        citations: []
      }));
    } catch (error: any) {
      logger.error('Google News scraping error:', error);
      return [];
    }
  }

  /**
   * Fetch real news from RSS feeds
   */
  private async fetchFromRSS(sourceUrl: string): Promise<NewsArticle[]> {
    try {
      const feed = await this.rssParser.parseURL(sourceUrl);
      const articles: NewsArticle[] = [];
      
      feed.items.forEach((item, index) => {
        if (index < 15) { // Limit to 15 items per feed
          articles.push({
            articleId: `rss-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            title: item.title || 'Untitled',
            summary: this.extractSummary(item.content || item.contentSnippet || item['content:encoded'] || ''),
            content: item.content || item.contentSnippet || item['content:encoded'] || '',
            articleUrl: item.link || '',
            category: this.categorizeArticle(item.title || '') as NewsCategory,
            tags: this.extractTags(item.categories || []),
            source: {
              name: feed.title || 'Unknown Source',
              url: feed.link || sourceUrl,
              credibility: this.getSourceCredibility(feed.title || ''),
              type: 'media' as const,
              country: 'US'
            },
            author: item.creator || item['dc:creator'] || item.author || 'Unknown',
            publishDate: new Date(item.pubDate || item.isoDate || Date.now()),
            relevanceScore: this.calculateRelevanceScore(item.title || '', item.content || ''),
            sentiment: 'neutral' as const,
            impactLevel: this.determineImpactLevel(item.title || ''),
            readingTime: Math.ceil((item.content?.length || 500) / 1000),
            keyTakeaways: [],
            relatedArticles: [],
            educationalValue: 70,
            technicalDepth: 'intermediate' as const,
            images: this.extractImages(item),
            citations: []
          });
        }
      });
      
      return articles;
    } catch (error: any) {
      logger.error(`Error fetching RSS feed from ${sourceUrl}:`, error);
      return [];
    }
  }

  /**
   * Fetch all news from all sources
   */
  async fetchAllNews(): Promise<NewsArticle[]> {

    const startTime = Date.now();
    const allArticles: NewsArticle[] = [];
    
    // Parallel fetch from all RSS feeds with timeout
    const rssSources = this.sources.filter(s => s.type === 'rss');
    const rssPromises = rssSources.map(source => 
      this.fetchFromRSS(source.url).catch(err => {
        logger.error(`RSS fetch failed for ${source.name}:`, err.message);
        return [];
      })
    );
    
    // Set a timeout for RSS feeds (10 seconds max)
    const rssResults = await Promise.race([
      Promise.all(rssPromises),
      new Promise<NewsArticle[][]>(resolve => 
        setTimeout(() => {

          resolve([]);
        }, 10000)
      )
    ]);
    
    // Collect RSS results
    if (Array.isArray(rssResults)) {
      rssResults.forEach(articles => {
        if (articles && articles.length > 0) {
          allArticles.push(...articles);
        }
      });
    }
    
    // Try to fetch from APIs in parallel (with individual error handling)
    const apiPromises: Promise<NewsArticle[]>[] = [
      // News API/Bing not implemented in this fetcher; only use HN and Google News here
      this.searchHackerNews('artificial intelligence').catch((err: any) => {
        logger.error('HN search failed:', err);
        return [] as NewsArticle[];
      }),
      this.scrapeGoogleNews('artificial intelligence latest news').catch((err: any) => {
        logger.error('Google News scrape failed:', err);
        return [] as NewsArticle[];
      })
    ];
    
    const apiResults = await Promise.all(apiPromises);
    apiResults.forEach((articles: NewsArticle[]) => {
      if (articles && articles.length > 0) {
        allArticles.push(...articles);
      }
    });
    
    // If we have no articles at all, use the search method as fallback
    if (allArticles.length === 0) {

      const searchResults = await this.searchAINews('artificial intelligence machine learning GPT latest breakthrough');
      allArticles.push(...searchResults);
    }
    
    // Remove duplicates based on title similarity
    const uniqueArticles = this.deduplicateArticles(allArticles);
    
    // Sort by publish date (newest first)
    uniqueArticles.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
    
    const endTime = Date.now();

    // Return top 100 articles to avoid overwhelming the UI
    return uniqueArticles.slice(0, 100);
  }

  /**
   * Helper methods
   */
  private extractSummary(content: string): string {
    // Remove HTML tags
    const text = content.replace(/<[^>]*>/g, '');
    // Take first 200 characters
    return text.substring(0, 200) + (text.length > 200 ? '...' : '');
  }

  private categorizeArticle(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('breakthrough') || titleLower.includes('announces')) {
      return 'breakthrough';
    } else if (titleLower.includes('research') || titleLower.includes('study') || titleLower.includes('paper')) {
      return 'research';
    } else if (titleLower.includes('launch') || titleLower.includes('release') || titleLower.includes('introduces')) {
      return 'product-launch';
    } else if (titleLower.includes('invest') || titleLower.includes('funding') || titleLower.includes('raises')) {
      return 'investment';
    } else if (titleLower.includes('education') || titleLower.includes('learn') || titleLower.includes('course')) {
      return 'education';
    } else if (titleLower.includes('policy') || titleLower.includes('regulation') || titleLower.includes('law')) {
      return 'policy';
    } else if (titleLower.includes('ethics') || titleLower.includes('bias') || titleLower.includes('safety')) {
      return 'ethics';
    }
    
    return 'industry';
  }

  private extractTags(input: string[] | string): string[] {
    const tags: string[] = ['AI', 'Technology'];
    
    if (Array.isArray(input)) {
      tags.push(...input.filter(tag => tag && tag.length > 0));
    } else if (typeof input === 'string') {
      // Extract potential tags from text
      const aiTerms = ['GPT', 'LLM', 'Neural Network', 'Deep Learning', 'Machine Learning', 'NLP', 'Computer Vision'];
      aiTerms.forEach(term => {
        if (input.toLowerCase().includes(term.toLowerCase())) {
          tags.push(term);
        }
      });
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private getSourceCredibility(sourceName: string): number {
    const credibilityMap: Record<string, number> = {
      'MIT': 95,
      'OpenAI': 95,
      'Google': 90,
      'DeepMind': 95,
      'TechCrunch': 80,
      'The Verge': 75,
      'VentureBeat': 78,
      'arXiv': 85,
      'Hacker News': 85,
      'Reddit': 70
    };
    
    for (const [key, value] of Object.entries(credibilityMap)) {
      if (sourceName.includes(key)) {
        return value;
      }
    }
    
    return 75; // Default credibility
  }

  private calculateRelevanceScore(title: string, content: string): number {
    const text = `${title} ${content}`.toLowerCase();
    let score = 50;
    
    const highRelevanceTerms = ['gpt', 'openai', 'anthropic', 'google ai', 'deepmind', 'breakthrough', 'llm', 'transformer'];
    const mediumRelevanceTerms = ['ai', 'artificial intelligence', 'machine learning', 'neural network', 'deep learning'];
    
    highRelevanceTerms.forEach(term => {
      if (text.includes(term)) score += 10;
    });
    
    mediumRelevanceTerms.forEach(term => {
      if (text.includes(term)) score += 5;
    });
    
    return Math.min(100, score);
  }

  private determineImpactLevel(title: string): 'critical' | 'high' | 'medium' | 'low' {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('breakthrough') || titleLower.includes('revolutionary') || titleLower.includes('game-changing')) {
      return 'critical';
    } else if (titleLower.includes('major') || titleLower.includes('significant') || titleLower.includes('important')) {
      return 'high';
    } else if (titleLower.includes('new') || titleLower.includes('update') || titleLower.includes('release')) {
      return 'medium';
    }
    
    return 'low';
  }

  private extractImages(item: any): { url: string; caption: string; credit: string }[] | undefined {
    const images = [];
    
    if (item['media:thumbnail']) {
      images.push({
        url: item['media:thumbnail']['$']?.url || item['media:thumbnail'],
        caption: item.title || '',
        credit: ''
      });
    }
    
    if (item['media:content'] && item['media:content']['$']?.url) {
      images.push({
        url: item['media:content']['$'].url,
        caption: item.title || '',
        credit: ''
      });
    }
    
    return images.length > 0 ? images : undefined;
  }

  private extractSourceFromGoogleNews(title: string): string {
    // Google News titles often end with " - Source Name"
    const parts = title.split(' - ');
    return parts.length > 1 ? parts[parts.length - 1] : 'Google News';
  }

  private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      // Create a key based on title similarity (first 50 chars)
      const key = article.title.toLowerCase().substring(0, 50).replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private deduplicateAndSort(articles: NewsArticle[]): NewsArticle[] {
    const uniqueArticles = this.deduplicateArticles(articles);
    
    // Sort by publish date (newest first)
    uniqueArticles.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
    
    return uniqueArticles;
  }
}

// Export singleton instance
export const samRealNewsFetcher = new SAMRealNewsFetcher();