import { NextRequest, NextResponse } from 'next/server';

interface NewsArticle {
  articleId: string;
  title: string;
  summary: string;
  content: string;
  articleUrl: string;
  source: {
    name: string;
    url: string;
  };
  author?: string;
  publishDate: Date;
  category: string;
  tags: string[];
  readingTime: number;
  relevanceScore: number;
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
  images?: {
    url: string;
    caption: string;
  }[];
  isBookmarked?: boolean;
  isLiked?: boolean;
  rankingScore?: number;
  trendingStatus?: 'hot' | 'rising' | 'steady' | 'new';
  qualityBadges?: string[];
}

// Demo news articles with realistic AI news content
const generateDemoNews = (): NewsArticle[] => {
  const currentDate = new Date();

  return [
    {
      articleId: 'news-001',
      title: 'OpenAI Announces GPT-5: Revolutionary Breakthrough in AI Reasoning',
      summary: 'OpenAI unveils GPT-5 with unprecedented reasoning capabilities, multimodal understanding, and a 10x improvement in complex problem-solving. The new model demonstrates human-level performance across multiple cognitive tasks.',
      content: 'Full article content about GPT-5 breakthrough...',
      articleUrl: 'https://openai.com/gpt5',
      source: {
        name: 'OpenAI Blog',
        url: 'https://openai.com'
      },
      author: 'Sam Altman',
      publishDate: new Date(currentDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      category: 'breakthrough',
      tags: ['GPT-5', 'OpenAI', 'Language Models', 'AI Breakthrough', 'Multimodal'],
      readingTime: 8,
      relevanceScore: 9.8,
      impactLevel: 'critical',
      rankingScore: 98,
      trendingStatus: 'hot',
      qualityBadges: ['Verified Source', 'Breaking News']
    },
    {
      articleId: 'news-002',
      title: 'Stanford Researchers Achieve 95% Accuracy in AI-Powered Disease Diagnosis',
      summary: 'New deep learning model developed at Stanford Medicine demonstrates 95% accuracy in early disease detection, outperforming traditional diagnostic methods and potentially saving thousands of lives.',
      content: 'Full article content about Stanford research...',
      articleUrl: 'https://med.stanford.edu/ai-diagnosis',
      source: {
        name: 'Stanford Medicine',
        url: 'https://med.stanford.edu'
      },
      author: 'Dr. Sarah Chen',
      publishDate: new Date(currentDate.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
      category: 'research',
      tags: ['Healthcare AI', 'Stanford', 'Deep Learning', 'Medical Diagnosis'],
      readingTime: 12,
      relevanceScore: 9.2,
      impactLevel: 'critical',
      rankingScore: 94,
      trendingStatus: 'rising',
      qualityBadges: ['Peer Reviewed', 'Academic Research']
    },
    {
      articleId: 'news-003',
      title: 'Google DeepMind Unveils Gemini 2.0 with Advanced Multimodal Capabilities',
      summary: 'Google\'s latest AI model Gemini 2.0 integrates vision, audio, and text understanding in a single unified architecture, setting new benchmarks across 30+ AI evaluation metrics.',
      content: 'Full article content about Gemini 2.0...',
      articleUrl: 'https://deepmind.google/gemini2',
      source: {
        name: 'Google DeepMind',
        url: 'https://deepmind.google'
      },
      author: 'Demis Hassabis',
      publishDate: new Date(currentDate.getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
      category: 'product-launch',
      tags: ['Google', 'Gemini', 'Multimodal AI', 'DeepMind'],
      readingTime: 10,
      relevanceScore: 9.5,
      impactLevel: 'high',
      rankingScore: 92,
      trendingStatus: 'hot',
      qualityBadges: ['Official Release']
    },
    {
      articleId: 'news-004',
      title: 'AI in Education: Adaptive Learning Platform Increases Student Performance by 40%',
      summary: 'Comprehensive study across 500 schools reveals that AI-powered adaptive learning platforms significantly improve student outcomes, with personalized learning paths showing remarkable effectiveness.',
      content: 'Full article content about AI in education...',
      articleUrl: 'https://edtech.org/ai-adaptive-learning',
      source: {
        name: 'EdTech Magazine',
        url: 'https://edtech.org'
      },
      author: 'Dr. Michael Torres',
      publishDate: new Date(currentDate.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
      category: 'education',
      tags: ['EdTech', 'Adaptive Learning', 'Student Performance', 'AI Education'],
      readingTime: 15,
      relevanceScore: 8.9,
      impactLevel: 'high',
      rankingScore: 89,
      trendingStatus: 'rising',
      qualityBadges: ['Research Backed']
    },
    {
      articleId: 'news-005',
      title: 'Meta Announces Open-Source LLaMA 3 with 405B Parameters',
      summary: 'Meta releases LLaMA 3, the largest open-source language model with 405 billion parameters, democratizing access to advanced AI capabilities for researchers and developers worldwide.',
      content: 'Full article content about LLaMA 3...',
      articleUrl: 'https://ai.meta.com/llama3',
      source: {
        name: 'Meta AI',
        url: 'https://ai.meta.com'
      },
      author: 'Mark Zuckerberg',
      publishDate: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      category: 'product-launch',
      tags: ['Meta', 'LLaMA', 'Open Source', 'Large Language Models'],
      readingTime: 7,
      relevanceScore: 9.0,
      impactLevel: 'high',
      rankingScore: 88,
      trendingStatus: 'steady',
      qualityBadges: ['Open Source']
    },
    {
      articleId: 'news-006',
      title: 'EU Proposes Comprehensive AI Regulation Framework',
      summary: 'European Union unveils detailed AI regulation framework addressing ethics, safety, and accountability, setting global standards for responsible AI development and deployment.',
      content: 'Full article content about EU AI regulation...',
      articleUrl: 'https://ec.europa.eu/ai-regulation',
      source: {
        name: 'European Commission',
        url: 'https://ec.europa.eu'
      },
      publishDate: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      category: 'policy',
      tags: ['EU Regulation', 'AI Ethics', 'Policy', 'Governance'],
      readingTime: 20,
      relevanceScore: 8.5,
      impactLevel: 'high',
      rankingScore: 85,
      trendingStatus: 'steady',
      qualityBadges: ['Government Source']
    },
    {
      articleId: 'news-007',
      title: 'Anthropic Releases Claude 3.5 Sonnet with Enhanced Coding Capabilities',
      summary: 'Anthropic\'s latest Claude 3.5 Sonnet model showcases remarkable improvements in software development tasks, achieving 92% on SWE-bench coding challenges.',
      content: 'Full article content about Claude 3.5 Sonnet...',
      articleUrl: 'https://anthropic.com/claude-3-5-sonnet',
      source: {
        name: 'Anthropic',
        url: 'https://anthropic.com'
      },
      author: 'Dario Amodei',
      publishDate: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      category: 'product-launch',
      tags: ['Anthropic', 'Claude', 'Coding AI', 'LLM'],
      readingTime: 9,
      relevanceScore: 8.8,
      impactLevel: 'high',
      rankingScore: 87,
      trendingStatus: 'new',
      qualityBadges: ['Official Release']
    },
    {
      articleId: 'news-008',
      title: 'MIT Study: AI-Generated Content Now Comprises 30% of Online Information',
      summary: 'Comprehensive MIT study reveals that AI-generated content has reached unprecedented levels, raising important questions about content authenticity, detection, and regulation.',
      content: 'Full article content about AI-generated content study...',
      articleUrl: 'https://news.mit.edu/ai-content-study',
      source: {
        name: 'MIT Technology Review',
        url: 'https://technologyreview.com'
      },
      author: 'Dr. Jennifer Park',
      publishDate: new Date(currentDate.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      category: 'research',
      tags: ['Content Generation', 'AI Detection', 'MIT', 'Research'],
      readingTime: 14,
      relevanceScore: 8.3,
      impactLevel: 'medium',
      rankingScore: 82,
      trendingStatus: 'steady',
      qualityBadges: ['Academic Research', 'Peer Reviewed']
    },
    {
      articleId: 'news-009',
      title: 'Startup Raises $200M for Revolutionary AI Hardware Accelerators',
      summary: 'Silicon Valley startup secures massive funding for next-generation AI chips promising 100x performance improvement and 90% energy reduction for machine learning workloads.',
      content: 'Full article content about AI hardware startup...',
      articleUrl: 'https://techcrunch.com/ai-chip-startup',
      source: {
        name: 'TechCrunch',
        url: 'https://techcrunch.com'
      },
      author: 'Alex Martinez',
      publishDate: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      category: 'investment',
      tags: ['AI Hardware', 'Startup', 'Funding', 'Chips'],
      readingTime: 6,
      relevanceScore: 7.9,
      impactLevel: 'medium',
      rankingScore: 78,
      trendingStatus: 'new',
      qualityBadges: ['Verified Funding']
    },
    {
      articleId: 'news-010',
      title: 'Microsoft and OpenAI Announce Strategic Partnership Extension',
      summary: 'Microsoft extends partnership with OpenAI with additional $10B investment, deepening collaboration on Azure AI infrastructure and enterprise AI solutions.',
      content: 'Full article content about Microsoft-OpenAI partnership...',
      articleUrl: 'https://news.microsoft.com/openai-partnership',
      source: {
        name: 'Microsoft News',
        url: 'https://news.microsoft.com'
      },
      author: 'Satya Nadella',
      publishDate: new Date(currentDate.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      category: 'partnership',
      tags: ['Microsoft', 'OpenAI', 'Partnership', 'Azure', 'Investment'],
      readingTime: 11,
      relevanceScore: 8.6,
      impactLevel: 'high',
      rankingScore: 84,
      trendingStatus: 'steady',
      qualityBadges: ['Official Announcement']
    },
    {
      articleId: 'news-011',
      title: 'AI Ethics Committee Releases Global Guidelines for Responsible AI Development',
      summary: 'International consortium of AI researchers and ethicists publishes comprehensive guidelines addressing bias, transparency, and accountability in AI systems.',
      content: 'Full article content about AI ethics guidelines...',
      articleUrl: 'https://aiethics.org/global-guidelines',
      source: {
        name: 'AI Ethics Institute',
        url: 'https://aiethics.org'
      },
      author: 'Dr. Sophia Williams',
      publishDate: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      category: 'ethics',
      tags: ['AI Ethics', 'Guidelines', 'Responsible AI', 'Governance'],
      readingTime: 18,
      relevanceScore: 8.1,
      impactLevel: 'medium',
      rankingScore: 81,
      trendingStatus: 'steady'
    },
    {
      articleId: 'news-012',
      title: 'Breakthrough in Quantum AI: Hybrid Systems Solve Complex Optimization Problems',
      summary: 'Researchers combine quantum computing with classical AI to achieve groundbreaking results in optimization tasks, opening new frontiers for computational problem-solving.',
      content: 'Full article content about quantum AI...',
      articleUrl: 'https://nature.com/quantum-ai-breakthrough',
      source: {
        name: 'Nature',
        url: 'https://nature.com'
      },
      author: 'Dr. Robert Chen',
      publishDate: new Date(currentDate.getTime() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      category: 'research',
      tags: ['Quantum Computing', 'Optimization', 'Hybrid Systems', 'Research'],
      readingTime: 16,
      relevanceScore: 8.7,
      impactLevel: 'high',
      rankingScore: 86,
      trendingStatus: 'new',
      qualityBadges: ['Peer Reviewed', 'Academic Research']
    }
  ];
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const realtime = searchParams.get('realtime') === 'true';

    // For now, always return demo data
    // In the future, this could integrate with real news APIs when realtime=true
    const news = generateDemoNews();

    return NextResponse.json({
      success: true,
      news,
      source: realtime ? 'demo' : 'demo', // Would be 'real' when actual API is integrated
      metadata: {
        timestamp: new Date().toISOString(),
        count: news.length,
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Error fetching AI news:', error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch AI news'
      }
    }, { status: 500 });
  }
}
