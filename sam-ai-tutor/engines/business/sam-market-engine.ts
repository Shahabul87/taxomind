import { db } from '@/lib/db';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface MarketAnalysisRequest {
  courseId: string;
  analysisType: 'comprehensive' | 'pricing' | 'competition' | 'trends';
  includeRecommendations?: boolean;
}

export interface CompetitorAnalysis {
  name: string;
  url?: string;
  price: number;
  rating?: number;
  enrollments?: number;
  strengths: string[];
  weaknesses: string[];
  features: string[];
}

export interface MarketAnalysisResponse {
  marketValue: {
    score: number;
    factors: {
      demand: number;
      competition: number;
      uniqueness: number;
      timing: number;
    };
  };
  pricing: {
    recommendedPrice: number;
    priceRange: { min: number; max: number };
    competitorAverage: number;
    valueProposition: string;
  };
  competition: {
    directCompetitors: CompetitorAnalysis[];
    marketGaps: string[];
    differentiators: string[];
  };
  branding: {
    score: number;
    strengths: string[];
    improvements: string[];
    targetAudience: {
      primary: string;
      secondary: string[];
      demographics: {
        age: string;
        education: string;
        experience: string;
      };
    };
  };
  trends: {
    marketGrowth: 'declining' | 'stable' | 'growing' | 'explosive';
    topicRelevance: number;
    futureProjection: string;
    emergingTopics: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export class MarketAnalysisEngine {
  async analyzeCourse(
    courseId: string,
    analysisType: MarketAnalysisRequest['analysisType'] = 'comprehensive',
    includeRecommendations = true
  ): Promise<MarketAnalysisResponse> {
    // Get course data
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        chapters: {
          include: {
            sections: true,
          },
        },
        Purchase: true,
        Enrollment: true,
        reviews: true,
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Check if we have a recent analysis
    const existingAnalysis = await db.courseMarketAnalysis.findUnique({
      where: { courseId },
    });

    const hoursSinceLastAnalysis = existingAnalysis
      ? (Date.now() - existingAnalysis.lastAnalyzedAt.getTime()) / (1000 * 60 * 60)
      : Infinity;

    // Use cached analysis if it's less than 24 hours old
    if (existingAnalysis && hoursSinceLastAnalysis < 24 && analysisType === 'comprehensive') {
      return this.parseStoredAnalysis(existingAnalysis);
    }

    // Perform new analysis
    const analysis = await this.performAnalysis(course, analysisType, includeRecommendations);

    // Store the analysis
    await this.storeAnalysis(courseId, analysis);

    return analysis;
  }

  private async performAnalysis(
    course: any,
    analysisType: string,
    includeRecommendations: boolean
  ): Promise<MarketAnalysisResponse> {
    const courseContext = this.buildCourseContext(course);
    
    const systemPrompt = `You are SAM, an expert market analyst specializing in online education and course evaluation. Analyze courses based on market demand, competition, pricing strategies, and growth potential.

**Analysis Parameters:**
- Course Title: ${course.title}
- Category: ${course.category?.name || 'General'}
- Current Price: $${course.price || 0}
- Chapters: ${course.chapters.length}
- Total Sections: ${course.chapters.reduce((sum: number, ch: any) => sum + ch.sections.length, 0)}
- Enrollments: ${course.enrollment.length}
- Purchases: ${course.Purchase.length}
- Average Rating: ${this.calculateAverageRating(course.reviews)}

**Analysis Type:** ${analysisType}
**Include Recommendations:** ${includeRecommendations}

**Market Analysis Requirements:**
1. **Market Value Assessment**: Score the course's market potential (0-100) based on demand, competition, uniqueness, and timing
2. **Pricing Analysis**: Recommend optimal pricing based on content depth, market standards, and competitor analysis
3. **Competition Analysis**: Identify direct competitors, market gaps, and unique differentiators
4. **Branding & Positioning**: Evaluate brand strength and target audience alignment
5. **Trend Analysis**: Assess market growth trends and future relevance
6. **Strategic Recommendations**: Provide actionable insights for immediate, short-term, and long-term success

Provide a comprehensive analysis in JSON format that helps course creators optimize their market position and maximize success.`;

    const userPrompt = `Analyze this course for market potential and provide strategic insights:

${courseContext}

Focus on ${analysisType} analysis${includeRecommendations ? ' with detailed recommendations' : ''}.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
      ],
    });

    const aiResponse = response.content[0];
    const analysisText = aiResponse.type === 'text' ? aiResponse.text : '';

    return this.parseAnalysisResponse(analysisText, course);
  }

  private buildCourseContext(course: any): string {
    const totalSections = course.chapters.reduce((sum: number, ch: any) => sum + ch.sections.length, 0);
    const avgRating = this.calculateAverageRating(course.reviews);
    
    return `
Course Information:
- Title: ${course.title}
- Description: ${course.description || 'No description provided'}
- Category: ${course.category?.name || 'Uncategorized'}
- Price: $${course.price || 0}
- Published: ${course.isPublished ? 'Yes' : 'No'}
- Structure: ${course.chapters.length} chapters, ${totalSections} sections
- Engagement: ${course.enrollment.length} enrollments, ${course.Purchase.length} purchases
- Rating: ${avgRating.toFixed(1)}/5 (${course.reviews.length} reviews)
- Created: ${course.createdAt.toISOString()}
- Last Updated: ${course.updatedAt.toISOString()}

Learning Outcomes:
${course.whatYouWillLearn.join('\n')}

Target Skills:
${this.extractTargetSkills(course)}
`;
  }

  private calculateAverageRating(reviews: any[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }

  private extractTargetSkills(course: any): string {
    // Extract skills from course content and structure
    const skills: string[] = [];
    
    // Analyze chapter titles for skill keywords
    course.chapters.forEach((chapter: any) => {
      if (chapter.title.toLowerCase().includes('build')) skills.push('Practical Application');
      if (chapter.title.toLowerCase().includes('advanced')) skills.push('Advanced Concepts');
      if (chapter.title.toLowerCase().includes('project')) skills.push('Project-Based Learning');
    });

    return skills.length > 0 ? skills.join(', ') : 'General Skills';
  }

  private parseAnalysisResponse(analysisText: string, course: any): MarketAnalysisResponse {
    try {
      // Try to parse as JSON first
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error: any) {
      // If JSON parsing fails, extract data manually
    }

    // Fallback parsing logic
    return {
      marketValue: {
        score: this.extractScore(analysisText, 'market value', 75),
        factors: {
          demand: this.extractScore(analysisText, 'demand', 70),
          competition: this.extractScore(analysisText, 'competition', 60),
          uniqueness: this.extractScore(analysisText, 'uniqueness', 65),
          timing: this.extractScore(analysisText, 'timing', 80),
        },
      },
      pricing: {
        recommendedPrice: this.extractPrice(analysisText, course.price || 49),
        priceRange: {
          min: Math.max(0, (course.price || 49) * 0.7),
          max: (course.price || 49) * 1.5,
        },
        competitorAverage: this.extractPrice(analysisText, 59),
        valueProposition: this.extractValueProposition(analysisText),
      },
      competition: {
        directCompetitors: this.extractCompetitors(analysisText),
        marketGaps: this.extractMarketGaps(analysisText),
        differentiators: this.extractDifferentiators(analysisText),
      },
      branding: {
        score: this.extractScore(analysisText, 'branding', 70),
        strengths: this.extractStrengths(analysisText),
        improvements: this.extractImprovements(analysisText),
        targetAudience: {
          primary: 'Intermediate learners',
          secondary: ['Beginners with some experience', 'Career changers'],
          demographics: {
            age: '25-40',
            education: 'College degree or equivalent',
            experience: '1-3 years in related field',
          },
        },
      },
      trends: {
        marketGrowth: this.extractMarketGrowth(analysisText),
        topicRelevance: this.extractScore(analysisText, 'relevance', 80),
        futureProjection: 'Growing demand expected over next 12-18 months',
        emergingTopics: this.extractEmergingTopics(analysisText),
      },
      recommendations: {
        immediate: this.extractRecommendations(analysisText, 'immediate'),
        shortTerm: this.extractRecommendations(analysisText, 'short-term'),
        longTerm: this.extractRecommendations(analysisText, 'long-term'),
      },
    };
  }

  private extractScore(text: string, keyword: string, defaultScore: number): number {
    const regex = new RegExp(`${keyword}.*?(\\d+)`, 'i');
    const match = text.match(regex);
    return match ? parseInt(match[1]) : defaultScore;
  }

  private extractPrice(text: string, defaultPrice: number): number {
    const priceRegex = /\$(\d+)/g;
    const matches = text.match(priceRegex);
    if (matches && matches.length > 0) {
      return parseInt(matches[0].replace('$', ''));
    }
    return defaultPrice;
  }

  private extractValueProposition(text: string): string {
    const valueMatch = text.match(/value proposition[:\s]+([^.]+)/i);
    return valueMatch ? valueMatch[1].trim() : 'Comprehensive learning experience with practical applications';
  }

  private extractCompetitors(text: string): CompetitorAnalysis[] {
    // This would be enhanced with actual competitor data from external sources
    return [
      {
        name: 'Generic Competitor Course',
        price: 59.99,
        rating: 4.5,
        enrollments: 10000,
        strengths: ['Established brand', 'Large student base'],
        weaknesses: ['Less personalized', 'Outdated content'],
        features: ['Video lessons', 'Quizzes', 'Certificate'],
      },
    ];
  }

  private extractMarketGaps(text: string): string[] {
    const gaps = [];
    if (text.includes('practical')) gaps.push('More hands-on projects needed');
    if (text.includes('advanced')) gaps.push('Advanced topics underserved');
    if (text.includes('beginner')) gaps.push('Beginner-friendly content lacking');
    return gaps.length > 0 ? gaps : ['Personalized learning paths', 'Live mentorship options'];
  }

  private extractDifferentiators(text: string): string[] {
    return [
      'AI-powered personalized learning',
      'Comprehensive curriculum depth',
      'Active instructor engagement',
      'Project-based learning approach',
    ];
  }

  private extractStrengths(text: string): string[] {
    return [
      'Well-structured content',
      'Clear learning objectives',
      'Good pacing and progression',
    ];
  }

  private extractImprovements(text: string): string[] {
    return [
      'Enhance visual branding elements',
      'Add more social proof and testimonials',
      'Improve course description SEO',
    ];
  }

  private extractMarketGrowth(text: string): 'declining' | 'stable' | 'growing' | 'explosive' {
    if (text.includes('explosive') || text.includes('rapid growth')) return 'explosive';
    if (text.includes('growing') || text.includes('increasing')) return 'growing';
    if (text.includes('stable') || text.includes('steady')) return 'stable';
    if (text.includes('declining') || text.includes('decreasing')) return 'declining';
    return 'growing';
  }

  private extractEmergingTopics(text: string): string[] {
    return [
      'AI integration in courses',
      'Microlearning modules',
      'Mobile-first learning',
      'Gamification elements',
    ];
  }

  private extractRecommendations(text: string, timeframe: string): string[] {
    const defaultRecs = {
      immediate: [
        'Optimize course title for SEO',
        'Add compelling course trailer video',
        'Enhance course thumbnail design',
      ],
      'short-term': [
        'Develop email marketing campaign',
        'Create free preview content',
        'Implement student testimonials',
      ],
      'long-term': [
        'Build course series for recurring revenue',
        'Develop corporate training packages',
        'Create certification program',
      ],
    };

    return defaultRecs[timeframe as keyof typeof defaultRecs] || [];
  }

  private async storeAnalysis(courseId: string, analysis: MarketAnalysisResponse): Promise<void> {
    const data = {
      courseId,
      marketValue: analysis.marketValue.score,
      demandScore: analysis.marketValue.factors.demand,
      competitorAnalysis: analysis.competition as any,
      pricingAnalysis: analysis.pricing as any,
      trendAnalysis: analysis.trends as any,
      brandingScore: analysis.branding.score,
      targetAudienceMatch: analysis.marketValue.factors.uniqueness,
      recommendedPrice: analysis.pricing.recommendedPrice,
      marketPosition: this.determineMarketPosition(analysis.marketValue.score),
      opportunities: analysis.recommendations as any,
      threats: analysis.competition.directCompetitors.map(c => c.name) as any,
      lastAnalyzedAt: new Date(),
    };

    await db.courseMarketAnalysis.upsert({
      where: { courseId },
      update: data,
      create: data,
    });
  }

  private determineMarketPosition(score: number): string {
    if (score >= 80) return 'Market Leader';
    if (score >= 65) return 'Strong Competitor';
    if (score >= 50) return 'Average Performer';
    return 'Needs Improvement';
  }

  private parseStoredAnalysis(analysis: any): MarketAnalysisResponse {
    return {
      marketValue: {
        score: analysis.marketValue,
        factors: {
          demand: analysis.demandScore,
          competition: analysis.competitorAnalysis?.competition || 60,
          uniqueness: analysis.targetAudienceMatch,
          timing: 80,
        },
      },
      pricing: analysis.pricingAnalysis as any,
      competition: analysis.competitorAnalysis as any,
      branding: {
        score: analysis.brandingScore,
        strengths: [],
        improvements: [],
        targetAudience: {
          primary: 'General learners',
          secondary: [],
          demographics: {
            age: '25-45',
            education: 'Varied',
            experience: 'Mixed',
          },
        },
      },
      trends: analysis.trendAnalysis as any,
      recommendations: analysis.opportunities as any,
    };
  }

  async findCompetitors(courseId: string): Promise<CompetitorAnalysis[]> {
    const competitors = await db.courseCompetitor.findMany({
      where: { courseId },
      orderBy: { analyzedAt: 'desc' },
      take: 10,
    });

    return competitors.map(c => ({
      name: c.competitorName,
      url: c.competitorUrl || undefined,
      price: c.price,
      rating: c.rating || undefined,
      enrollments: c.enrollments || undefined,
      strengths: c.strengths as string[],
      weaknesses: c.weaknesses as string[],
      features: c.features as string[],
    }));
  }

  async analyzeCompetitor(
    courseId: string,
    competitorData: Partial<CompetitorAnalysis>
  ): Promise<void> {
    await db.courseCompetitor.create({
      data: {
        courseId,
        competitorName: competitorData.name || 'Unknown Competitor',
        competitorUrl: competitorData.url,
        price: competitorData.price || 0,
        rating: competitorData.rating,
        enrollments: competitorData.enrollments,
        features: competitorData.features || [],
        strengths: competitorData.strengths || [],
        weaknesses: competitorData.weaknesses || [],
      },
    });
  }
}