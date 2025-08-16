import axios from 'axios';
import Parser from 'rss-parser';
import { NewsArticle, NewsCategory } from './sam-news-engine';
import { logger } from '@/lib/logger';

interface NewsSource {
  name: string;
  type: 'rss' | 'api' | 'scraper';
  url: string;
  apiKey?: string;
}

export class SAMNewsFetcher {
  private rssParser: Parser;
  
  // Real news sources
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
      url: 'https://news.mit.edu/topic/artificial-intelligence2/feed'
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
    // News APIs (require API keys)
    {
      name: 'NewsAPI',
      type: 'api',
      url: 'https://newsapi.org/v2/everything',
      apiKey: process.env.NEWS_API_KEY // You need to get this from newsapi.org
    },
    {
      name: 'Bing News',
      type: 'api',
      url: 'https://api.bing.microsoft.com/v7.0/news/search',
      apiKey: process.env.BING_API_KEY // From Azure
    }
  ];

  constructor() {
    this.rssParser = new Parser({
      customFields: {
        item: ['media:content', 'media:thumbnail']
      }
    });
  }

  /**
   * Fetch real news from RSS feeds
   */
  async fetchFromRSS(sourceUrl: string): Promise<NewsArticle[]> {
    try {
      const feed = await this.rssParser.parseURL(sourceUrl);
      const articles: NewsArticle[] = [];
      
      feed.items.forEach((item, index) => {
        if (index < 10) { // Limit to 10 items per feed
          articles.push({
            articleId: `rss-${Date.now()}-${index}`,
            title: item.title || 'Untitled',
            summary: this.extractSummary(item.content || item.contentSnippet || ''),
            content: item.content || item.contentSnippet || '',
            articleUrl: item.link || '',
            category: this.categorizeArticle(item.title || ''),
            tags: this.extractTags(item.categories || []),
            source: {
              name: feed.title || 'Unknown Source',
              url: feed.link || sourceUrl,
              credibility: 85,
              type: 'media',
              country: 'US'
            },
            author: item.creator || item.author || 'Unknown',
            publishDate: new Date(item.pubDate || item.isoDate || Date.now()),
            relevanceScore: 75,
            sentiment: 'neutral',
            impactLevel: 'medium',
            readingTime: Math.ceil((item.content?.length || 500) / 1000),
            keyTakeaways: [],
            relatedArticles: [],
            educationalValue: 70,
            technicalDepth: 'intermediate',
            images: item['media:thumbnail'] ? [{
              url: item['media:thumbnail']['$'].url,
              caption: item.title || '',
              credit: ''
            }] : undefined,
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
   * Fetch news from NewsAPI
   */
  async fetchFromNewsAPI(): Promise<NewsArticle[]> {
    if (!process.env.NEWS_API_KEY) {

      return [];
    }

    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'artificial intelligence OR machine learning OR deep learning OR GPT OR LLM',
          sortBy: 'publishedAt',
          language: 'en',
          pageSize: 20,
          apiKey: process.env.NEWS_API_KEY
        }
      });

      return response.data.articles.map((article: any, index: number) => ({
        articleId: `newsapi-${Date.now()}-${index}`,
        title: article.title,
        summary: article.description || '',
        content: article.content || article.description || '',
        articleUrl: article.url,
        category: this.categorizeArticle(article.title),
        tags: this.extractTags([article.source.name]),
        source: {
          name: article.source.name,
          url: `https://${article.source.id || article.source.name}.com`,
          credibility: 80,
          type: 'media',
          country: 'US'
        },
        author: article.author || 'Unknown',
        publishDate: new Date(article.publishedAt),
        relevanceScore: 75,
        sentiment: 'neutral',
        impactLevel: 'medium',
        readingTime: 5,
        keyTakeaways: [],
        relatedArticles: [],
        educationalValue: 70,
        technicalDepth: 'intermediate',
        images: article.urlToImage ? [{
          url: article.urlToImage,
          caption: article.title,
          credit: article.source.name
        }] : undefined
      }));
    } catch (error: any) {
      logger.error('Error fetching from NewsAPI:', error);
      return [];
    }
  }

  /**
   * Fetch news from Bing News Search API
   */
  async fetchFromBingNews(): Promise<NewsArticle[]> {
    if (!process.env.BING_API_KEY) {

      return [];
    }

    try {
      const response = await axios.get('https://api.bing.microsoft.com/v7.0/news/search', {
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY
        },
        params: {
          q: 'artificial intelligence breakthrough',
          count: 20,
          freshness: 'Day',
          sortBy: 'Date'
        }
      });

      return response.data.value.map((article: any, index: number) => ({
        articleId: `bing-${Date.now()}-${index}`,
        title: article.name,
        summary: article.description,
        content: article.description,
        articleUrl: article.url,
        category: this.categorizeArticle(article.name),
        tags: article.about?.map((topic: any) => topic.name) || [],
        source: {
          name: article.provider[0]?.name || 'Unknown',
          url: article.provider[0]?.url || '',
          credibility: 85,
          type: 'media',
          country: 'US'
        },
        author: 'Unknown',
        publishDate: new Date(article.datePublished),
        relevanceScore: 80,
        sentiment: 'neutral',
        impactLevel: 'medium',
        readingTime: 5,
        keyTakeaways: [],
        relatedArticles: [],
        educationalValue: 75,
        technicalDepth: 'intermediate',
        images: article.image ? [{
          url: article.image.thumbnail.contentUrl,
          caption: article.name,
          credit: article.provider[0]?.name
        }] : undefined
      }));
    } catch (error: any) {
      logger.error('Error fetching from Bing News:', error);
      return [];
    }
  }

  /**
   * Fetch all news from all sources
   */
  async fetchAllNews(): Promise<NewsArticle[]> {
    const allArticles: NewsArticle[] = [];
    
    // Fetch from RSS feeds (free, no API key needed)
    for (const source of this.sources.filter(s => s.type === 'rss')) {
      const articles = await this.fetchFromRSS(source.url);
      allArticles.push(...articles);
    }
    
    // Fetch from APIs (if keys are configured)
    const [newsApiArticles, bingArticles] = await Promise.all([
      this.fetchFromNewsAPI(),
      this.fetchFromBingNews()
    ]);
    
    allArticles.push(...newsApiArticles, ...bingArticles);
    
    // Remove duplicates based on title similarity
    const uniqueArticles = this.deduplicateArticles(allArticles);
    
    // Sort by publish date (newest first)
    uniqueArticles.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
    
    return uniqueArticles;
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

  private categorizeArticle(title: string): NewsCategory {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('breakthrough') || titleLower.includes('announces')) {
      return 'breakthrough';
    } else if (titleLower.includes('research') || titleLower.includes('study')) {
      return 'research';
    } else if (titleLower.includes('launch') || titleLower.includes('release')) {
      return 'product-launch';
    } else if (titleLower.includes('invest') || titleLower.includes('funding')) {
      return 'investment';
    } else if (titleLower.includes('education') || titleLower.includes('learn')) {
      return 'education';
    } else if (titleLower.includes('policy') || titleLower.includes('regulation')) {
      return 'policy';
    }
    
    return 'industry';
  }

  private extractTags(categories: string[]): string[] {
    const tags: string[] = [];
    
    // Add category-based tags
    categories.forEach(cat => {
      if (cat && cat.length > 0) {
        tags.push(cat);
      }
    });
    
    // Add default AI tags
    tags.push('AI', 'Technology');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.title.toLowerCase().substring(0, 50);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Export singleton instance
export const samNewsFetcher = new SAMNewsFetcher();