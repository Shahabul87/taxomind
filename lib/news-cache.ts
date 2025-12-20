import { NewsArticle } from '@/lib/sam-engines/content/sam-news-engine';
import { newsConfig } from './config/news-config';

interface CachedNews {
  articles: NewsArticle[];
  timestamp: number;
}

class NewsCache {
  private cache: Map<string, CachedNews> = new Map();
  private readonly cacheDuration = newsConfig.cache.duration;
  private readonly maxArticles = newsConfig.cache.maxArticles;

  /**
   * Get cached news if still valid
   */
  get(key: string): NewsArticle[] | null {
    if (!newsConfig.cache.enabled) return null;
    
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    const age = now - cached.timestamp;
    
    // Check if cache is still valid
    if (age > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`Using cached news (age: ${Math.round(age / 1000)}s)`);
    return cached.articles;
  }

  /**
   * Set news in cache
   */
  set(key: string, articles: NewsArticle[]): void {
    if (!newsConfig.cache.enabled) return;
    
    // Limit number of articles to cache
    const articlesToCache = articles.slice(0, this.maxArticles);
    
    this.cache.set(key, {
      articles: articlesToCache,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    this.cleanup();
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clean up old cache entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((cached, key) => {
      if (now - cached.timestamp > this.cacheDuration * 2) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    const totalArticles = entries.reduce((sum, [_, cached]) => sum + cached.articles.length, 0);
    
    return {
      entries: this.cache.size,
      totalArticles,
      oldestEntry: entries.length > 0 ? 
        new Date(Math.min(...entries.map(([_, c]) => c.timestamp))) : null,
      newestEntry: entries.length > 0 ? 
        new Date(Math.max(...entries.map(([_, c]) => c.timestamp))) : null
    };
  }
}

// Export singleton instance
export const newsCache = new NewsCache();