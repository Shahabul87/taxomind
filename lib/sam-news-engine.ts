import { db } from '@/lib/db';
import { samNewsRankingEngine, RankedNewsArticle } from './sam-news-ranking-engine';
import { samRealNewsFetcher } from './sam-real-news-fetcher';
import { shouldUseRealNews, newsConfig } from '@/lib/config/news-config';
import { newsCache } from '@/lib/news-cache';

export interface NewsArticle {
  articleId: string;
  title: string;
  summary: string;
  content: string;
  articleUrl: string; // Direct link to the original article
  category: NewsCategory;
  tags: string[];
  source: NewsSource;
  author?: string;
  publishDate: Date;
  relevanceScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  readingTime: number;
  keyTakeaways: string[];
  relatedArticles: string[];
  educationalValue: number;
  technicalDepth: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  images?: NewsImage[];
  citations: Citation[];
}

export interface NewsSource {
  name: string;
  url: string;
  credibility: number;
  type: 'official' | 'research' | 'media' | 'blog' | 'social';
  country: string;
}

export interface NewsImage {
  url: string;
  caption: string;
  credit: string;
}

export interface Citation {
  text: string;
  source: string;
  url?: string;
}

export type NewsCategory = 
  | 'breakthrough'
  | 'research'
  | 'industry'
  | 'policy'
  | 'education'
  | 'ethics'
  | 'startup'
  | 'investment'
  | 'product-launch'
  | 'partnership';

export interface NewsDigest {
  date: Date;
  topStories: NewsArticle[];
  trendingTopics: string[];
  marketMovers: MarketMover[];
  upcomingEvents: Event[];
  weeklyAnalysis: string;
  mustReads: NewsArticle[];
}

export interface MarketMover {
  company: string;
  change: number;
  reason: string;
  impact: string;
  relatedNews: string[];
}

export interface Event {
  name: string;
  date: Date;
  location: string;
  type: 'conference' | 'webinar' | 'workshop' | 'launch' | 'deadline';
  description: string;
  registrationUrl?: string;
  speakers?: string[];
}

export interface NewsTopic {
  topicId: string;
  name: string;
  description: string;
  trendingScore: number;
  articleCount: number;
  lastUpdated: Date;
  relatedTopics: string[];
  experts: Expert[];
}

export interface Expert {
  name: string;
  title: string;
  organization: string;
  expertise: string[];
  socialMedia?: {
    twitter?: string;
    linkedin?: string;
  };
}

export interface NewsAlert {
  alertId: string;
  userId: string;
  keywords: string[];
  categories: NewsCategory[];
  frequency: 'instant' | 'daily' | 'weekly';
  lastSent: Date;
  isActive: boolean;
}

export interface NewsAnalytics {
  timeframe: 'day' | 'week' | 'month' | 'quarter';
  totalArticles: number;
  categoriesDistribution: Record<NewsCategory, number>;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topKeywords: Array<{ keyword: string; count: number }>;
  readingEngagement: {
    averageReadTime: number;
    completionRate: number;
    shareRate: number;
  };
}

export class SAMNewsEngine {
  private newsDatabase: Map<string, NewsArticle>;
  private topicsIndex: Map<string, NewsTopic>;
  private alertsSystem: Map<string, NewsAlert>;

  constructor() {
    this.newsDatabase = new Map();
    this.topicsIndex = new Map();
    this.alertsSystem = new Map();
    this.initializeNewsData();
  }

  private initializeNewsData() {
    // Initialize with sample AI news
    const articles: NewsArticle[] = [
      {
        articleId: 'news-001',
        title: 'OpenAI Announces GPT-5 with Revolutionary Reasoning Capabilities',
        summary: 'OpenAI unveils GPT-5, featuring advanced reasoning, reduced hallucinations, and multimodal understanding that rivals human cognitive abilities.',
        content: `OpenAI has announced the release of GPT-5, marking a significant leap in artificial intelligence capabilities. The new model demonstrates unprecedented reasoning abilities, with benchmarks showing performance that matches or exceeds human experts in various domains.

Key improvements include:
- 99.9% reduction in hallucinations through advanced fact-checking mechanisms
- Native multimodal understanding across text, images, video, and audio
- Real-time learning and adaptation capabilities
- Energy efficiency improved by 80% compared to GPT-4

The model has been trained on a diverse dataset with enhanced safety measures and alignment techniques. Early testers report breakthrough applications in scientific research, education, and creative industries.`,
        category: 'breakthrough',
        tags: ['GPT-5', 'OpenAI', 'LLM', 'Multimodal AI', 'AGI'],
        source: {
          name: 'OpenAI Blog',
          url: 'https://openai.com/blog',
          credibility: 95,
          type: 'official',
          country: 'USA'
        },
        publishDate: new Date('2024-11-20'),
        relevanceScore: 98,
        sentiment: 'positive',
        impactLevel: 'critical',
        readingTime: 5,
        keyTakeaways: [
          'GPT-5 achieves near-human reasoning capabilities',
          'Significant reduction in AI hallucinations',
          'Multimodal processing as a standard feature',
          'Major implications for education and research'
        ],
        relatedArticles: ['news-002', 'news-003'],
        educationalValue: 90,
        technicalDepth: 'intermediate',
        images: [
          {
            url: '/images/news/gpt5-announcement.jpg',
            caption: 'GPT-5 Architecture Diagram',
            credit: 'OpenAI'
          }
        ],
        citations: [
          {
            text: 'GPT-5 represents the most significant advance in AI reasoning to date',
            source: 'Sam Altman, CEO OpenAI',
            url: 'https://twitter.com/sama/status/xxx'
          }
        ]
      },
      {
        articleId: 'news-002',
        title: 'Google DeepMind Achieves Breakthrough in Quantum Error Correction',
        summary: 'DeepMind&apos;s new AI system reduces quantum computing errors by 90%, bringing practical quantum computers closer to reality.',
        content: `Google DeepMind has announced a major breakthrough in quantum error correction using advanced machine learning techniques. The new system, called QuantumShield, uses neural networks to predict and correct quantum errors in real-time.

Technical achievements:
- 90% reduction in quantum decoherence errors
- Scalable to 1000+ qubit systems
- Real-time error prediction and correction
- Compatible with multiple quantum hardware platforms

This breakthrough addresses one of the fundamental challenges in quantum computing and could accelerate the timeline for practical quantum applications by 5-10 years.`,
        category: 'research',
        tags: ['Quantum Computing', 'DeepMind', 'Error Correction', 'Machine Learning'],
        source: {
          name: 'Nature Journal',
          url: 'https://nature.com',
          credibility: 98,
          type: 'research',
          country: 'UK'
        },
        publishDate: new Date('2024-11-18'),
        relevanceScore: 95,
        sentiment: 'positive',
        impactLevel: 'high',
        readingTime: 7,
        keyTakeaways: [
          'Major reduction in quantum computing errors',
          'AI-powered error correction shows promise',
          'Practical quantum computers now more feasible',
          'Cross-platform compatibility achieved'
        ],
        relatedArticles: ['news-004'],
        educationalValue: 85,
        technicalDepth: 'advanced',
        citations: [
          {
            text: 'This could be the breakthrough quantum computing has been waiting for',
            source: 'Dr. John Preskill, Caltech',
            url: 'https://quantum.caltech.edu'
          }
        ]
      },
      {
        articleId: 'news-003',
        title: 'EU Passes Comprehensive AI Education Act',
        summary: 'European Union mandates AI literacy in all schools by 2026, setting global precedent for AI education policy.',
        content: `The European Parliament has passed the AI Education Act, requiring all member states to integrate AI literacy into their educational curricula by 2026. This landmark legislation aims to prepare students for an AI-driven future.

Key provisions:
- Mandatory AI ethics courses for all students
- Programming and ML basics starting from age 10
- Teacher training programs with €2 billion funding
- Student data protection and AI transparency rules
- Industry partnerships for practical experience

The act has been praised by educators and tech leaders as a model for global AI education policy.`,
        category: 'policy',
        tags: ['AI Education', 'EU Policy', 'Digital Literacy', 'Education Reform'],
        source: {
          name: 'EU Commission',
          url: 'https://ec.europa.eu',
          credibility: 100,
          type: 'official',
          country: 'EU'
        },
        publishDate: new Date('2024-11-15'),
        relevanceScore: 92,
        sentiment: 'positive',
        impactLevel: 'high',
        readingTime: 6,
        keyTakeaways: [
          'AI education becomes mandatory in EU schools',
          'Significant funding for teacher training',
          'Focus on ethics and responsible AI use',
          'Could influence global education policies'
        ],
        relatedArticles: ['news-005'],
        educationalValue: 95,
        technicalDepth: 'beginner',
        citations: [
          {
            text: 'This act ensures no student is left behind in the AI revolution',
            source: 'Margrethe Vestager, EU Commissioner',
            url: 'https://ec.europa.eu/commission'
          }
        ]
      }
    ];

    // Store articles
    articles.forEach(article => {
      this.newsDatabase.set(article.articleId, article);
    });

    // Initialize topics
    this.initializeTopics();
  }

  private initializeTopics() {
    const topics: NewsTopic[] = [
      {
        topicId: 'llm-advances',
        name: 'Large Language Models',
        description: 'Latest developments in LLMs and generative AI',
        trendingScore: 95,
        articleCount: 156,
        lastUpdated: new Date(),
        relatedTopics: ['multimodal-ai', 'ai-safety'],
        experts: [
          {
            name: 'Dr. Ilya Sutskever',
            title: 'Chief Scientist',
            organization: 'OpenAI',
            expertise: ['Deep Learning', 'LLMs', 'AI Safety']
          }
        ]
      },
      {
        topicId: 'quantum-ml',
        name: 'Quantum Machine Learning',
        description: 'Integration of quantum computing with ML',
        trendingScore: 82,
        articleCount: 47,
        lastUpdated: new Date(),
        relatedTopics: ['quantum-computing', 'ml-algorithms'],
        experts: [
          {
            name: 'Dr. Maria Schuld',
            title: 'Quantum ML Researcher',
            organization: 'Xanadu',
            expertise: ['Quantum Algorithms', 'Machine Learning']
          }
        ]
      },
      {
        topicId: 'ai-regulation',
        name: 'AI Regulation & Policy',
        description: 'Government policies and regulations on AI',
        trendingScore: 88,
        articleCount: 92,
        lastUpdated: new Date(),
        relatedTopics: ['ai-ethics', 'data-privacy'],
        experts: [
          {
            name: 'Dr. Cynthia Dwork',
            title: 'Professor',
            organization: 'Harvard University',
            expertise: ['Privacy', 'Fairness in ML', 'AI Ethics']
          }
        ]
      }
    ];

    topics.forEach(topic => {
      this.topicsIndex.set(topic.topicId, topic);
    });
  }

  async getLatestNews(
    filter?: {
      category?: NewsCategory;
      tags?: string[];
      minRelevance?: number;
      technicalDepth?: string;
      limit?: number;
    }
  ): Promise<NewsArticle[]> {
    let articles = Array.from(this.newsDatabase.values());

    // Apply filters
    if (filter) {
      if (filter.category) {
        articles = articles.filter(a => a.category === filter.category);
      }
      if (filter.tags && filter.tags.length > 0) {
        articles = articles.filter(a => 
          filter.tags!.some(tag => a.tags.includes(tag))
        );
      }
      if (filter.minRelevance) {
        articles = articles.filter(a => a.relevanceScore >= filter.minRelevance);
      }
      if (filter.technicalDepth) {
        articles = articles.filter(a => a.technicalDepth === filter.technicalDepth);
      }
    }

    // Sort by date and relevance
    articles.sort((a, b) => {
      const dateWeight = 0.3;
      const relevanceWeight = 0.7;
      
      const dateScoreA = new Date().getTime() - a.publishDate.getTime();
      const dateScoreB = new Date().getTime() - b.publishDate.getTime();
      
      const scoreA = (a.relevanceScore * relevanceWeight) - (dateScoreA * dateWeight);
      const scoreB = (b.relevanceScore * relevanceWeight) - (dateScoreB * dateWeight);
      
      return scoreB - scoreA;
    });

    return articles.slice(0, filter?.limit || 20);
  }

  async getNewsDigest(date?: Date): Promise<NewsDigest> {
    const targetDate = date || new Date();
    const articles = await this.getLatestNews({ limit: 50 });

    // Filter articles from the last week
    const weekAgo = new Date(targetDate);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyArticles = articles.filter(a => 
      a.publishDate >= weekAgo && a.publishDate <= targetDate
    );

    // Identify trending topics
    const topicCounts = new Map<string, number>();
    weeklyArticles.forEach(article => {
      article.tags.forEach(tag => {
        topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
      });
    });

    const trendingTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);

    // Generate market movers (mock data for now)
    const marketMovers: MarketMover[] = [
      {
        company: 'OpenAI',
        change: 15.5,
        reason: 'GPT-5 announcement drives valuation',
        impact: 'Positive market sentiment for AI sector',
        relatedNews: ['news-001']
      },
      {
        company: 'Google',
        change: 8.2,
        reason: 'Quantum computing breakthrough',
        impact: 'Strengthens position in quantum race',
        relatedNews: ['news-002']
      }
    ];

    // Upcoming events
    const upcomingEvents: Event[] = [
      {
        name: 'NeurIPS 2024',
        date: new Date('2024-12-10'),
        location: 'Vancouver, Canada',
        type: 'conference',
        description: 'Premier machine learning conference',
        registrationUrl: 'https://neurips.cc',
        speakers: ['Yoshua Bengio', 'Yann LeCun', 'Andrew Ng']
      }
    ];

    return {
      date: targetDate,
      topStories: weeklyArticles.slice(0, 5),
      trendingTopics,
      marketMovers,
      upcomingEvents,
      weeklyAnalysis: this.generateWeeklyAnalysis(weeklyArticles),
      mustReads: weeklyArticles.filter(a => a.relevanceScore > 90).slice(0, 3)
    };
  }

  private generateWeeklyAnalysis(articles: NewsArticle[]): string {
    const categories = new Map<NewsCategory, number>();
    let totalSentiment = 0;
    let sentimentCount = 0;

    articles.forEach(article => {
      categories.set(article.category, (categories.get(article.category) || 0) + 1);
      
      if (article.sentiment === 'positive') totalSentiment += 1;
      else if (article.sentiment === 'negative') totalSentiment -= 1;
      sentimentCount++;
    });

    const topCategory = Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])[0];

    const averageSentiment = totalSentiment / sentimentCount;
    const sentimentText = averageSentiment > 0.3 ? 'positive' : 
                         averageSentiment < -0.3 ? 'negative' : 'neutral';

    return `This week in AI: ${articles.length} major developments with a ${sentimentText} overall sentiment. The focus was primarily on ${topCategory[0]} with ${topCategory[1]} articles. Key themes included breakthroughs in reasoning capabilities, regulatory developments, and increasing enterprise adoption.`;
  }

  async searchNews(query: string): Promise<NewsArticle[]> {
    const results: NewsArticle[] = [];
    const searchLower = query.toLowerCase();

    this.newsDatabase.forEach(article => {
      const searchScore = this.calculateSearchScore(article, searchLower);
      if (searchScore > 0) {
        results.push({ ...article, relevanceScore: searchScore });
      }
    });

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private calculateSearchScore(article: NewsArticle, query: string): number {
    let score = 0;

    // Title match (highest weight)
    if (article.title.toLowerCase().includes(query)) score += 50;
    
    // Summary match
    if (article.summary.toLowerCase().includes(query)) score += 30;
    
    // Content match
    if (article.content.toLowerCase().includes(query)) score += 20;
    
    // Tag match
    if (article.tags.some(tag => tag.toLowerCase().includes(query))) score += 25;
    
    // Key takeaway match
    if (article.keyTakeaways.some(kt => kt.toLowerCase().includes(query))) score += 15;

    return score;
  }

  async getTrendingTopics(): Promise<NewsTopic[]> {
    return Array.from(this.topicsIndex.values())
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10);
  }

  async getNewsByTopic(topicId: string): Promise<NewsArticle[]> {
    const topic = this.topicsIndex.get(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    // Find articles related to this topic
    return Array.from(this.newsDatabase.values())
      .filter(article => 
        article.tags.some(tag => 
          tag.toLowerCase().includes(topic.name.toLowerCase())
        )
      )
      .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
  }

  async createNewsAlert(
    userId: string,
    keywords: string[],
    categories: NewsCategory[],
    frequency: 'instant' | 'daily' | 'weekly'
  ): Promise<NewsAlert> {
    const alert: NewsAlert = {
      alertId: `alert-${Date.now()}`,
      userId,
      keywords,
      categories,
      frequency,
      lastSent: new Date(),
      isActive: true
    };

    this.alertsSystem.set(alert.alertId, alert);
    
    // Store in database
    try {
      await db.sAMInteraction.create({
        data: {
          userId,
          interactionType: 'CONTENT_GENERATED',
          context: {
            engine: 'news',
            action: 'create_alert',
            alertId: alert.alertId,
            keywords,
            categories
          },
          result: { success: true }
        }
      });
    } catch (error) {
      console.error('Error creating news alert:', error);
    }

    return alert;
  }

  async getNewsAnalytics(timeframe: 'day' | 'week' | 'month' | 'quarter'): Promise<NewsAnalytics> {
    const now = new Date();
    const startDate = new Date(now);

    switch (timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }

    const articles = Array.from(this.newsDatabase.values())
      .filter(a => a.publishDate >= startDate);

    // Calculate distributions
    const categoriesDistribution: Record<NewsCategory, number> = {} as any;
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const keywordFrequency = new Map<string, number>();

    articles.forEach(article => {
      // Categories
      categoriesDistribution[article.category] = (categoriesDistribution[article.category] || 0) + 1;
      
      // Sentiment
      sentimentCounts[article.sentiment]++;
      
      // Keywords from tags
      article.tags.forEach(tag => {
        keywordFrequency.set(tag, (keywordFrequency.get(tag) || 0) + 1);
      });
    });

    // Top keywords
    const topKeywords = Array.from(keywordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));

    return {
      timeframe,
      totalArticles: articles.length,
      categoriesDistribution,
      sentimentAnalysis: {
        positive: (sentimentCounts.positive / articles.length) * 100,
        neutral: (sentimentCounts.neutral / articles.length) * 100,
        negative: (sentimentCounts.negative / articles.length) * 100
      },
      topKeywords,
      readingEngagement: {
        averageReadTime: articles.reduce((sum, a) => sum + a.readingTime, 0) / articles.length,
        completionRate: 75, // Mock data
        shareRate: 12.5 // Mock data
      }
    };
  }

  async getRelatedArticles(articleId: string): Promise<NewsArticle[]> {
    const article = this.newsDatabase.get(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    // Get explicitly related articles
    const related = article.relatedArticles
      .map(id => this.newsDatabase.get(id))
      .filter(a => a !== undefined) as NewsArticle[];

    // Find more related by tags
    const tagRelated = Array.from(this.newsDatabase.values())
      .filter(a => 
        a.articleId !== articleId &&
        !article.relatedArticles.includes(a.articleId) &&
        a.tags.some(tag => article.tags.includes(tag))
      )
      .sort((a, b) => {
        const aScore = a.tags.filter(tag => article.tags.includes(tag)).length;
        const bScore = b.tags.filter(tag => article.tags.includes(tag)).length;
        return bScore - aScore;
      })
      .slice(0, 3);

    return [...related, ...tagRelated];
  }

  async getExpertOpinions(topicId: string): Promise<Expert[]> {
    const topic = this.topicsIndex.get(topicId);
    return topic?.experts || [];
  }

  // Educational news features
  async getEducationalNews(): Promise<NewsArticle[]> {
    return Array.from(this.newsDatabase.values())
      .filter(a => 
        a.category === 'education' || 
        a.educationalValue > 80 ||
        a.tags.some(tag => tag.toLowerCase().includes('education'))
      )
      .sort((a, b) => b.educationalValue - a.educationalValue);
  }

  async getBeginnerFriendlyNews(): Promise<NewsArticle[]> {
    return Array.from(this.newsDatabase.values())
      .filter(a => a.technicalDepth === 'beginner')
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Store reading activity
  async recordReading(
    userId: string,
    articleId: string,
    readingTime: number,
    completed: boolean
  ): Promise<void> {
    try {
      await db.sAMInteraction.create({
        data: {
          userId,
          interactionType: 'CONTENT_GENERATED',
          context: {
            engine: 'news',
            action: 'read_article',
            articleId,
            readingTime,
            completed
          },
          result: { success: true }
        }
      });
    } catch (error) {
      console.error('Error recording news reading:', error);
    }
  }

  // Fetch real-time news from external sources
  async fetchRealTimeNews(includeRanking: boolean = true): Promise<NewsArticle[] | RankedNewsArticle[]> {
    try {
      // Use configuration to determine if we should use real data
      const useRealData = shouldUseRealNews();
      
      if (useRealData) {
        console.log('Fetching real AI news from web sources...');
        
        try {
          // Fetch real news from RSS feeds and APIs
          const realArticles = await samRealNewsFetcher.fetchAllNews();
          
          // If we got real articles, use them
          if (realArticles && realArticles.length > 0) {
            // Add to our database for caching
            realArticles.forEach(article => {
              this.newsDatabase.set(article.articleId, article);
            });
            
            // Apply ranking if requested
            if (includeRanking) {
              return await samNewsRankingEngine.rankNews(realArticles);
            }
            
            return realArticles;
          } else {
            console.log('No real articles fetched, falling back to cached/demo data');
          }
        } catch (fetchError) {
          console.error('Error fetching real news, using fallback:', fetchError);
          // Continue to fallback data
        }
      }
      
      // For development/demo, or as fallback when real news fails
      console.log('Using generated AI news for demo/fallback...');

      const fetchedArticles: NewsArticle[] = [];
      
      // Simulated real news data with actual links
      // In production, these would be fetched from RSS feeds or APIs
      // Generate current timestamps for fresh news
      const now = new Date();
      const getTimeAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
      
      const realTimeArticles: NewsArticle[] = [
        // BREAKING: Latest news (0-3 hours old)
        {
          articleId: `rt-${Date.now()}-1`,
          title: 'Google Unveils Gemini 2.0: Multimodal AI That Outperforms GPT-4 in Reasoning',
          summary: 'Google DeepMind announces Gemini 2.0 with unprecedented multimodal capabilities, scoring 98% on complex reasoning benchmarks and native code generation across 20+ languages.',
          content: 'Google DeepMind has unveiled Gemini 2.0, their most advanced AI model to date. The model demonstrates superior performance in multimodal tasks, combining text, image, video, and audio understanding in a single architecture.',
          articleUrl: 'https://deepmind.google/technologies/gemini',
          category: 'breakthrough',
          tags: ['Google', 'Gemini', 'Multimodal AI', 'DeepMind', 'Reasoning'],
          source: {
            name: 'Google DeepMind',
            url: 'https://deepmind.google',
            credibility: 98,
            type: 'official',
            country: 'UK'
          },
          author: 'Demis Hassabis',
          publishDate: getTimeAgo(0.5), // 30 minutes ago
          relevanceScore: 99,
          sentiment: 'positive',
          impactLevel: 'critical',
          readingTime: 6,
          keyTakeaways: [
            '98% accuracy on complex reasoning benchmarks',
            'Native multimodal understanding without adapters',
            'Code generation in 20+ programming languages',
            'Real-time video understanding capabilities'
          ],
          relatedArticles: [],
          educationalValue: 88,
          technicalDepth: 'advanced',
          images: [{
            url: 'https://deepmind.google/gemini-2.jpg',
            caption: 'Gemini 2.0 multimodal architecture',
            credit: 'Google DeepMind'
          }]
        },
        {
          articleId: `rt-${Date.now()}-2`,
          title: 'Anthropic\'s Claude 3 Achieves Near-Human Performance in Scientific Research Tasks',
          summary: 'Claude 3 demonstrates ability to conduct independent research, write academic papers, and even suggest novel hypotheses in multiple scientific domains.',
          content: 'Anthropic has released benchmark results showing Claude 3 can perform graduate-level research tasks, including literature review, hypothesis generation, and experimental design with minimal human oversight.',
          articleUrl: 'https://www.anthropic.com/news/claude-3-research',
          category: 'breakthrough',
          tags: ['Anthropic', 'Claude 3', 'Research AI', 'Scientific Discovery'],
          source: {
            name: 'Anthropic',
            url: 'https://anthropic.com',
            credibility: 95,
            type: 'official',
            country: 'US'
          },
          author: 'Dario Amodei',
          publishDate: getTimeAgo(1), // 1 hour ago
          relevanceScore: 97,
          sentiment: 'positive',
          impactLevel: 'critical',
          readingTime: 7,
          keyTakeaways: [
            'Conducts independent scientific research',
            'Writes publication-ready academic papers',
            'Suggests novel research hypotheses',
            'Outperforms PhD students in literature reviews'
          ],
          relatedArticles: [],
          educationalValue: 90,
          technicalDepth: 'expert'
        },
        {
          articleId: `rt-${Date.now()}-3`,
          title: 'Meta Releases Llama 3.1 with 405B Parameters, Rivals GPT-4 Performance',
          summary: 'Meta\'s open-source Llama 3.1 405B model matches closed-source competitors, marking a watershed moment for open AI development.',
          content: 'Meta has released Llama 3.1, featuring a massive 405 billion parameter model that performs on par with GPT-4 and Claude 3, while remaining fully open-source and commercially usable.',
          articleUrl: 'https://ai.meta.com/blog/llama-3-1-release',
          category: 'breakthrough',
          tags: ['Meta', 'Llama', 'Open Source', 'LLM', '405B'],
          source: {
            name: 'Meta AI',
            url: 'https://ai.meta.com',
            credibility: 93,
            type: 'official',
            country: 'US'
          },
          author: 'Mark Zuckerberg',
          publishDate: getTimeAgo(2), // 2 hours ago
          relevanceScore: 94,
          sentiment: 'positive',
          impactLevel: 'critical',
          readingTime: 5,
          keyTakeaways: [
            '405B parameters rivals closed-source models',
            'Fully open-source and commercially licensed',
            'Supports 128K context window',
            'Available for immediate download and deployment'
          ],
          relatedArticles: [],
          educationalValue: 82,
          technicalDepth: 'advanced'
        },
        
        // HOT NEWS (2-4 hours old)
        {
          articleId: `rt-${Date.now()}-4`,
          title: 'NVIDIA Announces Project GR00T: Foundation Model for Humanoid Robots',
          summary: 'NVIDIA\'s new AI model enables humanoid robots to understand natural language and emulate human movements by observing demonstrations.',
          content: 'NVIDIA unveiled Project GR00T (Generalist Robot 00 Technology), a foundation model designed specifically for humanoid robots, capable of understanding multimodal instructions and learning from human demonstrations.',
          articleUrl: 'https://nvidianews.nvidia.com/news/project-groot',
          category: 'product-launch',
          tags: ['NVIDIA', 'Robotics', 'Foundation Model', 'Humanoid', 'GR00T'],
          source: {
            name: 'NVIDIA News',
            url: 'https://nvidianews.nvidia.com',
            credibility: 94,
            type: 'official',
            country: 'US'
          },
          author: 'Jensen Huang',
          publishDate: getTimeAgo(2.5), // 2.5 hours ago
          relevanceScore: 91,
          sentiment: 'positive',
          impactLevel: 'high',
          readingTime: 6,
          keyTakeaways: [
            'Foundation model specifically for humanoid robots',
            'Learns from human demonstrations',
            'Multimodal understanding of tasks',
            'Partners include Boston Dynamics and Tesla'
          ],
          relatedArticles: [],
          educationalValue: 78,
          technicalDepth: 'intermediate'
        },
        
        {
          articleId: `rt-${Date.now()}-5`,
          title: 'OpenAI Researchers Achieve AGI-Level Performance in Mathematical Reasoning',
          summary: 'Internal OpenAI project "Q*" reportedly solves complex mathematical problems at PhD level, sparking debate about AGI timeline.',
          content: 'Sources within OpenAI reveal that their Q* (Q-Star) project has achieved breakthrough performance in mathematical reasoning, solving problems that typically require PhD-level expertise in mathematics.',
          articleUrl: 'https://openai.com/research/mathematical-reasoning',
          category: 'research',
          tags: ['OpenAI', 'Q*', 'AGI', 'Mathematical Reasoning', 'Breakthrough'],
          source: {
            name: 'OpenAI Research',
            url: 'https://openai.com',
            credibility: 95,
            type: 'research',
            country: 'US'
          },
          author: 'Ilya Sutskever',
          publishDate: getTimeAgo(3), // 3 hours ago
          relevanceScore: 98,
          sentiment: 'positive',
          impactLevel: 'critical',
          readingTime: 8,
          keyTakeaways: [
            'Solves PhD-level mathematical problems',
            'Major step toward artificial general intelligence',
            'Uses novel reasoning architecture',
            'Implications for scientific discovery'
          ],
          relatedArticles: [],
          educationalValue: 85,
          technicalDepth: 'expert'
        },
        
        // RISING NEWS (4-8 hours old)
        {
          articleId: `rt-${Date.now()}-6`,
          title: 'Apple Unveils Apple Intelligence: On-Device AI for iPhone 16 Series',
          summary: 'Apple enters the AI race with privacy-focused, on-device AI capabilities integrated throughout iOS 18, challenging cloud-based competitors.',
          content: 'Apple has announced Apple Intelligence, a suite of on-device AI features that run entirely on iPhone 16\'s new Neural Engine, providing ChatGPT-level capabilities without sending data to the cloud.',
          articleUrl: 'https://www.apple.com/newsroom/apple-intelligence',
          category: 'product-launch',
          tags: ['Apple', 'iOS 18', 'On-Device AI', 'Privacy', 'Neural Engine'],
          source: {
            name: 'Apple Newsroom',
            url: 'https://www.apple.com/newsroom',
            credibility: 96,
            type: 'official',
            country: 'US'
          },
          author: 'Tim Cook',
          publishDate: getTimeAgo(4), // 4 hours ago
          relevanceScore: 89,
          sentiment: 'positive',
          impactLevel: 'high',
          readingTime: 5,
          keyTakeaways: [
            'Fully on-device AI processing',
            'Privacy-first approach to AI',
            'Integrated across all iOS apps',
            'No cloud dependency for core features'
          ],
          relatedArticles: [],
          educationalValue: 76,
          technicalDepth: 'intermediate'
        },
        
        {
          articleId: `rt-${Date.now()}-7`,
          title: 'MIT Develops AI That Can Learn New Tasks in Seconds Using "In-Context Learning"',
          summary: 'Revolutionary approach allows AI models to master entirely new tasks with just a few examples, mimicking human rapid learning abilities.',
          content: 'MIT researchers have developed a new AI architecture that can learn to perform completely new tasks in seconds by observing just a handful of examples, without any additional training.',
          articleUrl: 'https://news.mit.edu/2024/ai-rapid-learning',
          category: 'research',
          tags: ['MIT', 'In-Context Learning', 'Few-Shot Learning', 'AI Research'],
          source: {
            name: 'MIT News',
            url: 'https://news.mit.edu',
            credibility: 97,
            type: 'research',
            country: 'US'
          },
          author: 'Prof. Joshua Tenenbaum',
          publishDate: getTimeAgo(5), // 5 hours ago
          relevanceScore: 92,
          sentiment: 'positive',
          impactLevel: 'high',
          readingTime: 7,
          keyTakeaways: [
            'Learns new tasks in seconds',
            'Requires only 3-5 examples',
            'No additional training needed',
            'Mimics human learning patterns'
          ],
          relatedArticles: [],
          educationalValue: 88,
          technicalDepth: 'advanced'
        },
        
        // INDUSTRY NEWS (6-12 hours old)
        {
          articleId: `rt-${Date.now()}-8`,
          title: 'Amazon Invests $4 Billion More in Anthropic, Total Investment Reaches $8 Billion',
          summary: 'Amazon doubles down on AI with massive additional investment in Anthropic, signaling intensified competition with Microsoft-OpenAI partnership.',
          content: 'Amazon has announced an additional $4 billion investment in Anthropic, bringing its total investment to $8 billion, as it seeks to compete with Microsoft\'s partnership with OpenAI in the enterprise AI market.',
          articleUrl: 'https://press.aboutamazon.com/anthropic-investment',
          category: 'investment',
          tags: ['Amazon', 'Anthropic', 'Investment', 'Claude', 'AWS'],
          source: {
            name: 'Amazon Press',
            url: 'https://press.aboutamazon.com',
            credibility: 92,
            type: 'official',
            country: 'US'
          },
          author: 'Andy Jassy',
          publishDate: getTimeAgo(6), // 6 hours ago
          relevanceScore: 86,
          sentiment: 'positive',
          impactLevel: 'high',
          readingTime: 4,
          keyTakeaways: [
            '$8 billion total investment in Anthropic',
            'Claude to be deeply integrated with AWS',
            'Exclusive cloud provider arrangement',
            'Enterprise AI competition intensifies'
          ],
          relatedArticles: [],
          educationalValue: 72,
          technicalDepth: 'beginner'
        },
        
        {
          articleId: `rt-${Date.now()}-9`,
          title: 'Stability AI Releases Stable Diffusion 3.5: Photorealistic Image Generation at 8K Resolution',
          summary: 'Latest Stable Diffusion model achieves unprecedented photorealism and can generate 8K resolution images in under 10 seconds on consumer GPUs.',
          content: 'Stability AI has released Stable Diffusion 3.5, featuring dramatic improvements in photorealism, text rendering, and the ability to generate 8K resolution images efficiently on consumer hardware.',
          articleUrl: 'https://stability.ai/news/stable-diffusion-3-5',
          category: 'product-launch',
          tags: ['Stability AI', 'Stable Diffusion', 'Image Generation', 'Open Source'],
          source: {
            name: 'Stability AI',
            url: 'https://stability.ai',
            credibility: 88,
            type: 'official',
            country: 'UK'
          },
          author: 'Emad Mostaque',
          publishDate: getTimeAgo(8), // 8 hours ago
          relevanceScore: 83,
          sentiment: 'positive',
          impactLevel: 'medium',
          readingTime: 5,
          keyTakeaways: [
            '8K resolution image generation',
            'Runs on consumer GPUs',
            'Perfect text rendering in images',
            'Open source and free to use'
          ],
          relatedArticles: [],
          educationalValue: 79,
          technicalDepth: 'intermediate'
        },
        
        // EDUCATIONAL & POLICY NEWS (10-16 hours old)
        {
          articleId: `rt-${Date.now()}-10`,
          title: 'Harvard and MIT Launch Free AI Literacy Program for 1 Million Students',
          summary: 'Major universities collaborate to provide free, comprehensive AI education to bridge the global AI skills gap.',
          content: 'Harvard University and MIT have jointly launched an ambitious program to provide free AI literacy education to one million students worldwide, featuring hands-on projects and industry certifications.',
          articleUrl: 'https://www.harvard.edu/ai-literacy-initiative',
          category: 'education',
          tags: ['Harvard', 'MIT', 'AI Education', 'Free Courses', 'Online Learning'],
          source: {
            name: 'Harvard University',
            url: 'https://harvard.edu',
            credibility: 99,
            type: 'official',
            country: 'US'
          },
          author: 'President Claudine Gay',
          publishDate: getTimeAgo(10), // 10 hours ago
          relevanceScore: 87,
          sentiment: 'positive',
          impactLevel: 'high',
          readingTime: 6,
          keyTakeaways: [
            'Free AI education for 1 million students',
            'Industry-recognized certifications',
            'Hands-on projects with real datasets',
            'Available in 12 languages'
          ],
          relatedArticles: [],
          educationalValue: 98,
          technicalDepth: 'beginner'
        },
        
        {
          articleId: `rt-${Date.now()}-11`,
          title: 'China Releases Open-Source AI Model "Yi-Large" Surpassing GPT-4 on Benchmarks',
          summary: 'Chinese AI lab 01.AI\'s Yi-Large model outperforms GPT-4 on multiple benchmarks while being completely open-source.',
          content: '01.AI, founded by AI pioneer Kai-Fu Lee, has released Yi-Large, an open-source model that surpasses GPT-4 on reasoning, coding, and multilingual benchmarks, marking China\'s emergence as an AI superpower.',
          articleUrl: 'https://01.ai/yi-large-release',
          category: 'breakthrough',
          tags: ['China', 'Yi-Large', 'Open Source', 'Kai-Fu Lee', '01.AI'],
          source: {
            name: '01.AI',
            url: 'https://01.ai',
            credibility: 85,
            type: 'official',
            country: 'CN'
          },
          author: 'Kai-Fu Lee',
          publishDate: getTimeAgo(12), // 12 hours ago
          relevanceScore: 90,
          sentiment: 'positive',
          impactLevel: 'critical',
          readingTime: 7,
          keyTakeaways: [
            'Outperforms GPT-4 on key benchmarks',
            'Fully open-source and free',
            'Superior multilingual capabilities',
            'Trained on 15 trillion tokens'
          ],
          relatedArticles: [],
          educationalValue: 81,
          technicalDepth: 'advanced'
        },
        
        // RECENT BUT IMPORTANT (16-24 hours old)
        {
          articleId: `rt-${Date.now()}-12`,
          title: 'Tesla\'s Optimus Robot Learns Complex Tasks Through VR Human Demonstrations',
          summary: 'Tesla demonstrates Optimus robots learning intricate manufacturing tasks by observing humans in VR, accelerating robot training by 100x.',
          content: 'Tesla has revealed that its Optimus humanoid robots can now learn complex manufacturing tasks by observing human workers performing the same tasks in virtual reality, reducing training time from months to hours.',
          articleUrl: 'https://www.tesla.com/AI',
          category: 'industry',
          tags: ['Tesla', 'Optimus', 'Robotics', 'VR Training', 'Manufacturing'],
          source: {
            name: 'Tesla AI',
            url: 'https://tesla.com',
            credibility: 90,
            type: 'official',
            country: 'US'
          },
          author: 'Elon Musk',
          publishDate: getTimeAgo(18), // 18 hours ago
          relevanceScore: 84,
          sentiment: 'positive',
          impactLevel: 'high',
          readingTime: 5,
          keyTakeaways: [
            'VR-based robot training system',
            '100x faster learning than traditional methods',
            'Handles complex assembly tasks',
            'Deployment in Tesla factories by Q2 2025'
          ],
          relatedArticles: [],
          educationalValue: 74,
          technicalDepth: 'intermediate'
        }
      ];

      // Add fetched articles to our database
      realTimeArticles.forEach(article => {
        this.newsDatabase.set(article.articleId, article);
        fetchedArticles.push(article);
      });

      // Apply ranking if requested
      if (includeRanking) {
        return await samNewsRankingEngine.rankNews(fetchedArticles);
      }

      return fetchedArticles;
    } catch (error) {
      console.error('Error fetching real-time news:', error);
      // Return existing cached news as fallback
      return Array.from(this.newsDatabase.values())
        .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime())
        .slice(0, 10);
    }
  }

  // Get top-ranked news
  async getTopRankedNews(limit: number = 20): Promise<RankedNewsArticle[]> {
    const cacheKey = `top-ranked-${limit}`;
    
    // Check cache first
    const cachedNews = newsCache.get(cacheKey);
    if (cachedNews) {
      return cachedNews as RankedNewsArticle[];
    }
    
    // Fetch fresh news with ranking
    const rankedNews = await this.fetchRealTimeNews(true) as RankedNewsArticle[];
    
    // Get existing news and rank them too
    const existingNews = await this.getLatestNews({ limit: 50 });
    const rankedExisting = await samNewsRankingEngine.rankNews(existingNews);
    
    // Combine and deduplicate
    const allRankedNews = [...rankedNews, ...rankedExisting];
    const uniqueNews = Array.from(
      new Map(allRankedNews.map(article => [article.articleId, article])).values()
    );
    
    // Sort by ranking score and return top items
    const result = uniqueNews
      .sort((a, b) => b.rankingScore - a.rankingScore)
      .slice(0, limit);
    
    // Cache the result
    newsCache.set(cacheKey, result);
    
    return result;
  }

  // Get trending news (hot + rising)
  async getTrendingNews(limit: number = 10): Promise<RankedNewsArticle[]> {
    const allNews = await this.getTopRankedNews(50);
    return samNewsRankingEngine.getTrendingNews(allNews, limit);
  }

  // Get news by specific ranking criteria
  async getNewsByCriteria(
    criteria: 'freshness' | 'relevance' | 'impact' | 'innovation',
    limit: number = 10
  ): Promise<RankedNewsArticle[]> {
    const allNews = await this.getLatestNews({ limit: 100 });
    return samNewsRankingEngine.getTopNewsByCriteria(allNews, criteria, limit);
  }
}

// Export singleton instance
export const samNewsEngine = new SAMNewsEngine();