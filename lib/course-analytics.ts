interface CourseAnalytics {
  titleQuality: number;
  descriptionQuality: number;
  marketFit: number;
  audienceAlignment: number;
  structureOptimization: number;
  overallScore: number;
  marketability: 'Low' | 'Medium' | 'High' | 'Excellent';
  revenuePotential: number;
  completionLikelihood: number;
  competitorAnalysis?: {
    competition: 'Low' | 'Medium' | 'High';
    marketGap: boolean;
    pricingRecommendation: string;
  };
}

interface CourseFormData {
  courseTitle: string;
  courseShortOverview: string;
  courseCategory: string;
  courseSubcategory?: string;
  courseIntent: string;
  targetAudience: string;
  difficulty: string;
  duration: string;
  chapterCount: number;
  sectionsPerChapter: number;
  courseGoals: string[];
  includeAssessments: boolean;
  bloomsFocus: string[];
  preferredContentTypes: string[];
}

export class CourseAnalyticsEngine {
  
  static calculateCourseScore(formData: CourseFormData): CourseAnalytics {
    const titleQuality = this.analyzeTitleQuality(formData.courseTitle);
    const descriptionQuality = this.analyzeDescriptionQuality(formData.courseShortOverview);
    const marketFit = this.analyzeMarketFit(formData);
    const audienceAlignment = this.analyzeAudienceAlignment(formData);
    const structureOptimization = this.analyzeStructureOptimization(formData);
    
    const overallScore = Math.round(
      (titleQuality + descriptionQuality + marketFit + audienceAlignment + structureOptimization) / 5
    );
    
    const marketability = this.determineMarketability(overallScore);
    const revenuePotential = this.calculateRevenuePotential(formData, overallScore);
    const completionLikelihood = this.calculateCompletionLikelihood(formData);
    
    return {
      titleQuality,
      descriptionQuality,
      marketFit,
      audienceAlignment,
      structureOptimization,
      overallScore,
      marketability,
      revenuePotential,
      completionLikelihood,
      competitorAnalysis: this.analyzeCompetition(formData)
    };
  }
  
  static analyzeTitleQuality(title: string): number {
    if (!title || title.length < 3) return 0;
    
    let score = 50; // Base score
    
    // Length optimization (30-60 characters ideal)
    if (title.length >= 30 && title.length <= 60) score += 20;
    else if (title.length >= 20 && title.length <= 80) score += 10;
    
    // Power words
    const powerWords = ['complete', 'master', 'ultimate', 'professional', 'advanced', 'comprehensive', 'bootcamp', 'course', 'guide', 'training'];
    const hasPowerWords = powerWords.some(word => title.toLowerCase().includes(word));
    if (hasPowerWords) score += 15;
    
    // Numbers and specificity
    const hasNumbers = /\d/.test(title);
    if (hasNumbers) score += 10;
    
    // Clear value proposition
    const valueWords = ['learn', 'build', 'create', 'develop', 'master', 'become'];
    const hasValueProp = valueWords.some(word => title.toLowerCase().includes(word));
    if (hasValueProp) score += 15;
    
    // Avoid overstuffing
    const wordCount = title.split(' ').length;
    if (wordCount > 15) score -= 10;
    
    return Math.min(100, Math.max(0, score));
  }
  
  private static analyzeDescriptionQuality(description: string): number {
    if (!description || description.length < 10) return 0;
    
    let score = 30; // Base score
    
    // Length optimization (150-300 characters ideal)
    if (description.length >= 150 && description.length <= 300) score += 25;
    else if (description.length >= 100 && description.length <= 400) score += 15;
    else if (description.length < 50) score -= 20;
    
    // Benefit-focused language
    const benefitWords = ['will learn', 'will be able', 'will master', 'will understand', 'will create', 'will build'];
    const hasBenefits = benefitWords.some(phrase => description.toLowerCase().includes(phrase));
    if (hasBenefits) score += 20;
    
    // Specific outcomes
    const outcomeWords = ['project', 'certificate', 'skills', 'knowledge', 'experience', 'portfolio'];
    const hasOutcomes = outcomeWords.some(word => description.toLowerCase().includes(word));
    if (hasOutcomes) score += 15;
    
    // Call to action
    const ctaWords = ['enroll', 'join', 'start', 'begin', 'get started'];
    const hasCTA = ctaWords.some(word => description.toLowerCase().includes(word));
    if (hasCTA) score += 10;
    
    // Readability (sentence count)
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 2 && sentences.length <= 5) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }
  
  private static analyzeMarketFit(formData: CourseFormData): number {
    if (!formData.courseCategory || !formData.targetAudience) return 0;
    
    let score = 40; // Base score
    
    // High-demand categories
    const highDemandCategories = ['technology', 'business', 'design', 'marketing'];
    if (highDemandCategories.includes(formData.courseCategory.toLowerCase())) score += 20;
    
    // Clear target audience
    if (formData.targetAudience && formData.targetAudience !== 'Custom (describe below)') score += 15;
    
    // Intent alignment
    const professionalIntents = ['career advancement', 'certification preparation', 'professional development'];
    const isProfessional = professionalIntents.some(intent => 
      formData.courseIntent.toLowerCase().includes(intent.toLowerCase())
    );
    if (isProfessional) score += 15;
    
    // Subcategory specificity
    if (formData.courseSubcategory) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }
  
  private static analyzeAudienceAlignment(formData: CourseFormData): number {
    if (!formData.targetAudience || !formData.difficulty) return 0;
    
    let score = 50; // Base score
    
    // Logical difficulty progression
    const beginnerAudiences = ['complete beginners', 'no experience'];
    const advancedAudiences = ['experienced practitioners', 'professionals'];
    
    const isBeginnerAudience = beginnerAudiences.some(aud => 
      formData.targetAudience.toLowerCase().includes(aud)
    );
    const isAdvancedAudience = advancedAudiences.some(aud => 
      formData.targetAudience.toLowerCase().includes(aud)
    );
    
    if ((isBeginnerAudience && formData.difficulty === 'BEGINNER') ||
        (isAdvancedAudience && formData.difficulty === 'ADVANCED')) {
      score += 25;
    }
    
    // Duration appropriateness
    const durationWeeks = this.parseDuration(formData.duration);
    if (formData.difficulty === 'BEGINNER' && durationWeeks <= 8) score += 15;
    if (formData.difficulty === 'ADVANCED' && durationWeeks >= 8) score += 15;
    
    // Content type alignment
    if (formData.preferredContentTypes.includes('video') && 
        formData.preferredContentTypes.includes('projects')) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }
  
  private static analyzeStructureOptimization(formData: CourseFormData): number {
    let score = 30; // Base score
    
    // Learning goals quality
    if (formData.courseGoals.length >= 3 && formData.courseGoals.length <= 7) score += 20;
    else if (formData.courseGoals.length >= 1) score += 10;
    
    // Chapter/section balance
    const totalSections = formData.chapterCount * formData.sectionsPerChapter;
    if (totalSections >= 15 && totalSections <= 50) score += 20;
    else if (totalSections >= 10 && totalSections <= 60) score += 10;
    
    // Assessment inclusion
    if (formData.includeAssessments) score += 15;
    
    // Bloom's taxonomy progression
    if (formData.bloomsFocus.length >= 2) score += 15;
    
    return Math.min(100, Math.max(0, score));
  }
  
  private static determineMarketability(score: number): 'Low' | 'Medium' | 'High' | 'Excellent' {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
  }
  
  private static calculateRevenuePotential(formData: CourseFormData, score: number): number {
    // Base revenue calculation
    let baseRevenue = 0;
    
    // Category multipliers
    const categoryMultipliers: Record<string, number> = {
      'technology': 1.5,
      'business': 1.3,
      'design': 1.2,
      'health': 1.0,
      'education': 0.8
    };
    
    const multiplier = categoryMultipliers[formData.courseCategory] || 1.0;
    
    // Difficulty level pricing
    const difficultyPricing: Record<string, number> = {
      'BEGINNER': 50,
      'INTERMEDIATE': 75,
      'ADVANCED': 100
    };
    
    baseRevenue = difficultyPricing[formData.difficulty] || 50;
    
    // Quality score bonus
    const qualityBonus = (score / 100) * 0.5 + 0.5; // 0.5x to 1.0x multiplier
    
    // Duration impact
    const durationWeeks = this.parseDuration(formData.duration);
    const durationMultiplier = Math.min(2.0, Math.max(0.5, durationWeeks / 8));
    
    const estimatedRevenue = Math.round(baseRevenue * multiplier * qualityBonus * durationMultiplier);
    
    return estimatedRevenue;
  }
  
  private static calculateCompletionLikelihood(formData: CourseFormData): number {
    let score = 50; // Base completion rate
    
    // Structure affects completion
    const totalSections = formData.chapterCount * formData.sectionsPerChapter;
    if (totalSections <= 30) score += 20; // Manageable size
    else if (totalSections > 50) score -= 20; // Too overwhelming
    
    // Assessments help retention
    if (formData.includeAssessments) score += 15;
    
    // Varied content types
    if (formData.preferredContentTypes.length >= 3) score += 10;
    
    // Clear goals
    if (formData.courseGoals.length >= 3) score += 15;
    
    return Math.min(100, Math.max(20, score));
  }
  
  private static analyzeCompetition(formData: CourseFormData) {
    // Simplified competition analysis
    const highCompetitionCategories = ['technology', 'business'];
    const isHighCompetition = highCompetitionCategories.includes(formData.courseCategory);
    
    return {
      competition: isHighCompetition ? 'High' as const : 'Medium' as const,
      marketGap: formData.courseSubcategory !== undefined,
      pricingRecommendation: `$${this.calculateRevenuePotential(formData, 75) * 0.8}-${this.calculateRevenuePotential(formData, 75) * 1.2}`
    };
  }
  
  private static parseDuration(duration: string): number {
    // Convert duration string to weeks
    if (duration.includes('week')) {
      const weeks = duration.match(/(\d+)/);
      return weeks ? parseInt(weeks[1]) : 4;
    }
    if (duration.includes('month')) {
      const months = duration.match(/(\d+)/);
      return months ? parseInt(months[1]) * 4 : 16;
    }
    if (duration.includes('year')) {
      return 52;
    }
    return 4; // Default fallback
  }
}

// Real-time validation messages
export interface ValidationMessage {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  suggestion?: string;
  actionable?: boolean;
}

export class RealTimeValidator {
  
  static validateTitle(title: string): ValidationMessage | null {
    if (!title || title.length < 3) {
      return {
        type: 'error',
        message: 'Title too short',
        suggestion: 'Add more descriptive words',
        actionable: true
      };
    }
    
    if (title.length > 100) {
      return {
        type: 'warning',
        message: 'Title might be too long',
        suggestion: 'Keep it under 60 characters for better SEO',
        actionable: true
      };
    }
    
    const score = CourseAnalyticsEngine.analyzeTitleQuality(title);
    
    if (score >= 80) {
      return {
        type: 'success',
        message: `Excellent title! (${score}/100)`,
        actionable: false
      };
    } else if (score >= 60) {
      return {
        type: 'info',
        message: `Good title (${score}/100)`,
        suggestion: 'Consider adding power words like "Complete" or "Master"',
        actionable: true
      };
    } else {
      return {
        type: 'warning',
        message: `Title needs improvement (${score}/100)`,
        suggestion: 'Add specific benefits and clear value proposition',
        actionable: true
      };
    }
  }
  
  static validateDescription(description: string): ValidationMessage | null {
    if (!description || description.length < 10) {
      return {
        type: 'error',
        message: 'Description too short',
        suggestion: 'Describe what students will learn and achieve',
        actionable: true
      };
    }
    
    const score = CourseAnalyticsEngine['analyzeDescriptionQuality'](description);
    
    if (score >= 80) {
      return {
        type: 'success',
        message: `Great description! (${score}/100)`,
        actionable: false
      };
    } else if (score >= 60) {
      return {
        type: 'info',
        message: `Good description (${score}/100)`,
        suggestion: 'Consider adding specific outcomes students will achieve',
        actionable: true
      };
    } else {
      return {
        type: 'warning',
        message: `Description needs work (${score}/100)`,
        suggestion: 'Focus on benefits and what students will be able to do',
        actionable: true
      };
    }
  }
  
  static validateAudienceAlignment(audience: string, difficulty: string): ValidationMessage | null {
    if (!audience || !difficulty) return null;
    
    const beginnerKeywords = ['beginner', 'no experience', 'complete'];
    const advancedKeywords = ['experienced', 'professional', 'expert'];
    
    const isBeginnerAudience = beginnerKeywords.some(keyword => 
      audience.toLowerCase().includes(keyword)
    );
    const isAdvancedAudience = advancedKeywords.some(keyword => 
      audience.toLowerCase().includes(keyword)
    );
    
    if (isBeginnerAudience && difficulty === 'ADVANCED') {
      return {
        type: 'warning',
        message: 'Audience-difficulty mismatch',
        suggestion: 'Consider "Beginner" or "Intermediate" for new learners',
        actionable: true
      };
    }
    
    if (isAdvancedAudience && difficulty === 'BEGINNER') {
      return {
        type: 'warning',
        message: 'Audience-difficulty mismatch',
        suggestion: 'Consider "Advanced" for experienced professionals',
        actionable: true
      };
    }
    
    return {
      type: 'success',
      message: 'Perfect audience-difficulty alignment!',
      actionable: false
    };
  }
}