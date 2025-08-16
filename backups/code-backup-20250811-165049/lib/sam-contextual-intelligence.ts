/**
 * SAM Contextual Intelligence System
 * 
 * This system enhances SAM's responses by providing deep contextual awareness
 * based on URL, current data, and form states.
 */

import { SAMContextData } from '@/components/sam/sam-context-manager';

export interface ContextualResponse {
  greeting: string;
  capabilities: string[];
  suggestedActions: string[];
  relevantQuestions: string[];
  contextualTips: string[];
  dataAwareness: string;
}

export interface FormInsight {
  formId: string;
  completeness: number;
  missingFields: string[];
  suggestions: string[];
  validationTips: string[];
}

export class SAMContextualIntelligence {
  
  /**
   * Generate contextual response based on current context
   */
  static generateContextualResponse(context: SAMContextData): ContextualResponse {
    const { pageType, entityType, entityData, formData, url } = context;
    
    switch (pageType) {
      case 'course-edit':
        return this.generateCourseEditResponse(entityData, formData);
      case 'chapter-edit':
        return this.generateChapterEditResponse(entityData, formData);
      case 'section-edit':
        return this.generateSectionEditResponse(entityData, formData);
      case 'revolutionary-architect':
        return this.generateRevolutionaryArchitectResponse(formData);
      case 'course-create':
        return this.generateCourseCreateResponse(formData);
      case 'courses-list':
        return this.generateCoursesListResponse(entityData);
      case 'analytics-dashboard':
        return this.generateAnalyticsResponse(entityData);
      default:
        return this.generateDefaultResponse(pageType, entityType);
    }
  }

  private static generateCourseEditResponse(entityData: any, formData?: Record<string, any>): ContextualResponse {
    const course = entityData;
    const isPublished = course?.isPublished || false;
    const hasChapters = course?.chapters?.length > 0;
    const hasDescription = course?.description && course.description.length > 50;
    const hasImage = course?.imageUrl;
    const hasPrice = course?.price && course.price > 0;

    let greeting = `I can see you're working on "${course?.title || 'your course'}"! `;
    
    if (isPublished) {
      greeting += "This course is live and students can enroll. ";
    } else {
      greeting += "This course is in draft mode. ";
    }

    const capabilities = [
      'Course structure optimization',
      'Content development guidance',
      'Student engagement strategies',
      'Publishing readiness assessment',
      'Market positioning advice',
      'Learning outcome improvement'
    ];

    const suggestedActions = [];
    const contextualTips = [];

    // Analyze form data for current editing context
    if (formData) {
      const formInsights = this.analyzeFormData(formData);
      formInsights.forEach(insight => {
        if (insight.completeness < 80) {
          suggestedActions.push(`Complete the ${insight.formId} (${Math.round(insight.completeness)}% done)`);
        }
      });
    }

    // Course completion suggestions
    if (!hasDescription) {
      suggestedActions.push('Add a compelling course description');
      contextualTips.push('A good description should be 100-300 words and clearly explain what students will learn');
    }
    
    if (!hasChapters) {
      suggestedActions.push('Create your first chapter');
      contextualTips.push('Break your course into 5-8 digestible chapters for optimal learning');
    }
    
    if (!hasImage) {
      suggestedActions.push('Upload an attractive course image');
      contextualTips.push('Courses with images get 40% more enrollments');
    }
    
    if (!hasPrice && !isPublished) {
      suggestedActions.push('Set your course price');
      contextualTips.push('Consider your target audience and competitor pricing');
    }

    const relevantQuestions = [
      'What specific learning outcome do you want students to achieve?',
      'Who is your ideal student for this course?',
      'What makes your course unique compared to others?',
      'How can we improve student engagement?',
      'What assessments would best measure learning?'
    ];

    const dataAwareness = `I can see your course "${course?.title}" has ${course?.chapters?.length || 0} chapters${
      course?.isPublished ? ' and is published' : ' and is in draft mode'
    }. ${course?.description ? 'The description looks good' : 'Consider adding a description'}${
      course?.price ? `, priced at $${course.price}` : ', no price set yet'
    }.`;

    return {
      greeting,
      capabilities,
      suggestedActions,
      relevantQuestions,
      contextualTips,
      dataAwareness
    };
  }

  private static generateChapterEditResponse(entityData: any, formData?: Record<string, any>): ContextualResponse {
    const { course, chapter } = entityData || {};
    const sections = chapter?.sections || [];
    const isPublished = chapter?.isPublished || false;

    const greeting = `I'm here to help you develop "${chapter?.title || 'this chapter'}" in "${course?.title || 'your course'}"! `;

    const capabilities = [
      'Chapter content structure',
      'Learning objective alignment',
      'Section planning and sequencing',
      'Assessment integration',
      'Engagement activity design',
      'QuestionDifficulty progression'
    ];

    const suggestedActions = [];
    const contextualTips = [];

    if (!chapter?.description) {
      suggestedActions.push('Add a chapter description');
      contextualTips.push('Describe what students will learn in this chapter');
    }

    if (sections.length === 0) {
      suggestedActions.push('Create sections for this chapter');
      contextualTips.push('Aim for 3-7 sections per chapter for optimal learning');
    }

    if (sections.length > 0) {
      const incompleteSections = sections.filter((s: any) => !s.content);
      if (incompleteSections.length > 0) {
        suggestedActions.push(`Complete ${incompleteSections.length} sections`);
      }
    }

    const relevantQuestions = [
      'What key concept should students master in this chapter?',
      'How does this chapter build on previous learning?',
      'What real-world application can you include?',
      'How will you assess understanding?',
      'What might students find challenging here?'
    ];

    const dataAwareness = `I can see chapter "${chapter?.title}" has ${sections.length} sections${
      isPublished ? ' and is published' : ' and is in draft mode'
    }. ${chapter?.description ? 'Good description provided' : 'No description yet'}.`;

    return {
      greeting,
      capabilities,
      suggestedActions,
      relevantQuestions,
      contextualTips,
      dataAwareness
    };
  }

  private static generateSectionEditResponse(entityData: any, formData?: Record<string, any>): ContextualResponse {
    const { course, chapter, section } = entityData || {};
    const hasContent = section?.content && section.content.length > 100;
    const hasVideo = section?.videoUrl;
    const hasAttachments = section?.attachments?.length > 0;

    const greeting = `Let's work on "${section?.title || 'this section'}" in "${chapter?.title || 'the chapter'}"! `;

    const capabilities = [
      'Content creation guidance',
      'Interactive element suggestions',
      'Assessment design',
      'Multimedia integration',
      'Learning activity planning',
      'Accessibility optimization'
    ];

    const suggestedActions = [];
    const contextualTips = [];

    if (!hasContent) {
      suggestedActions.push('Add content to this section');
      contextualTips.push('Break content into digestible chunks with clear headings');
    }

    if (!hasVideo && section?.type === 'video') {
      suggestedActions.push('Upload a video for this section');
      contextualTips.push('Keep videos under 10 minutes for better engagement');
    }

    if (!hasAttachments) {
      contextualTips.push('Consider adding downloadable resources or exercises');
    }

    const relevantQuestions = [
      'What specific skill or knowledge should students gain here?',
      'How can you make this content interactive?',
      'What examples would clarify this concept?',
      'How will you know if students understand?',
      'What practice opportunities can you provide?'
    ];

    const dataAwareness = `I can see section "${section?.title}" is type "${section?.type || 'unknown'}"${
      hasContent ? ' with content' : ' without content yet'
    }${hasVideo ? ' and has video' : ''}${hasAttachments ? ` and ${section.attachments.length} attachments` : ''}.`;

    return {
      greeting,
      capabilities,
      suggestedActions,
      relevantQuestions,
      contextualTips,
      dataAwareness
    };
  }

  private static generateRevolutionaryArchitectResponse(formData?: Record<string, any>): ContextualResponse {
    const greeting = "🚀 Welcome to the Revolutionary Course Architect! I'm your AI pedagogical partner, ready to create an amazing course using learning science and market intelligence.";

    const capabilities = [
      'AI-powered course architecture',
      'Pedagogical optimization',
      'Market analysis and positioning',
      'Learning science integration',
      'Predictive success analytics',
      'Real-time collaborative design'
    ];

    const suggestedActions = [];
    const contextualTips = [
      'Be specific about your target audience for better course design',
      'Clear learning outcomes lead to better course structure',
      'Market research helps with pricing and positioning',
      'Pedagogical principles ensure effective learning'
    ];

    // Analyze form completion
    if (formData) {
      const basicFormData = formData['basics'] || {};
      if (!basicFormData.title) {
        suggestedActions.push('Start by describing your course idea');
      }
      if (!basicFormData.targetAudience) {
        suggestedActions.push('Define your target audience');
      }
      if (!basicFormData.overview) {
        suggestedActions.push('Provide a course overview');
      }
    }

    const relevantQuestions = [
      'What specific problem does your course solve for students?',
      'What transformation do you want to create in your learners?',
      'What makes your teaching approach unique?',
      'What would success look like for your students?',
      'How will students apply this knowledge in the real world?'
    ];

    const dataAwareness = 'I\'m ready to analyze your course concept and generate a comprehensive pedagogical architecture with market insights.';

    return {
      greeting,
      capabilities,
      suggestedActions,
      relevantQuestions,
      contextualTips,
      dataAwareness
    };
  }

  private static generateCourseCreateResponse(formData?: Record<string, any>): ContextualResponse {
    const greeting = "Ready to create a new course? I'm here to guide you from initial concept to market-ready course!";

    const capabilities = [
      'Course concept development',
      'Target audience analysis',
      'Learning pathway design',
      'Content structure planning',
      'Market research insights',
      'Technology recommendations'
    ];

    const suggestedActions = [
      'Define your course topic clearly',
      'Consider your target audience',
      'Think about learning outcomes',
      'Plan your course structure'
    ];

    const contextualTips = [
      'Start with a clear, engaging title',
      'Focus on student transformation, not just information',
      'Consider what makes your course unique',
      'Think about practical applications'
    ];

    const relevantQuestions = [
      'What subject are you passionate about teaching?',
      'Who is your ideal student?',
      'What specific problem will your course solve?',
      'What experience level are you targeting?',
      'How will students benefit from this course?'
    ];

    const dataAwareness = 'I can help you brainstorm course ideas, validate market demand, and structure your content for maximum learning impact.';

    return {
      greeting,
      capabilities,
      suggestedActions,
      relevantQuestions,
      contextualTips,
      dataAwareness
    };
  }

  private static generateCoursesListResponse(entityData: any): ContextualResponse {
    const courses = entityData || [];
    const publishedCount = courses.filter((c: any) => c.isPublished).length;
    const draftCount = courses.length - publishedCount;

    const greeting = `I can see your course dashboard! You have ${courses.length} courses (${publishedCount} published, ${draftCount} drafts).`;

    const capabilities = [
      'Course performance analysis',
      'Portfolio optimization',
      'Student engagement insights',
      'Revenue optimization',
      'Market opportunity identification',
      'Content strategy planning'
    ];

    const suggestedActions = [];
    const contextualTips = [];

    if (draftCount > 0) {
      suggestedActions.push(`Complete and publish ${draftCount} draft courses`);
      contextualTips.push('Published courses generate revenue and help students');
    }

    if (publishedCount > 0) {
      suggestedActions.push('Analyze your best-performing courses');
      contextualTips.push('Identify patterns in successful courses to replicate them');
    }

    if (courses.length < 3) {
      suggestedActions.push('Consider creating more courses');
      contextualTips.push('Multiple courses increase your teaching authority and revenue potential');
    }

    const relevantQuestions = [
      'Which course topics are performing best?',
      'What new course would complement your existing portfolio?',
      'How can you improve student completion rates?',
      'What feedback are students giving you?',
      'Which courses need updating or improvement?'
    ];

    const dataAwareness = `I can analyze your course portfolio performance, student engagement patterns, and suggest optimization strategies.`;

    return {
      greeting,
      capabilities,
      suggestedActions,
      relevantQuestions,
      contextualTips,
      dataAwareness
    };
  }

  private static generateAnalyticsResponse(entityData: any): ContextualResponse {
    const greeting = "Let's dive into your analytics! I can help interpret data and suggest improvements.";

    const capabilities = [
      'Performance data interpretation',
      'Student behavior analysis',
      'Engagement optimization',
      'Revenue trend analysis',
      'Completion rate improvement',
      'Predictive insights'
    ];

    const suggestedActions = [
      'Identify your top-performing content',
      'Analyze student drop-off points',
      'Review completion rate trends',
      'Examine engagement patterns'
    ];

    const contextualTips = [
      'Focus on metrics that correlate with student success',
      'Look for patterns in high-engagement content',
      'Identify common points where students struggle',
      'Use data to inform content improvements'
    ];

    const relevantQuestions = [
      'What metrics matter most for your goals?',
      'Where are students struggling in your courses?',
      'Which content generates the most engagement?',
      'How can you improve completion rates?',
      'What trends do you see in student behavior?'
    ];

    const dataAwareness = 'I can help you understand student engagement patterns, identify improvement opportunities, and optimize your teaching strategy.';

    return {
      greeting,
      capabilities,
      suggestedActions,
      relevantQuestions,
      contextualTips,
      dataAwareness
    };
  }

  private static generateDefaultResponse(pageType: string, entityType?: string): ContextualResponse {
    const greeting = `I'm SAM, your AI learning assistant. I can see you're in the ${entityType || pageType} section.`;

    const capabilities = [
      'Educational guidance',
      'Learning optimization',
      'Content development',
      'Student engagement',
      'Performance analysis'
    ];

    const suggestedActions = [
      'Let me know what you\'re working on',
      'Ask me about learning strategies',
      'Get help with content creation'
    ];

    const contextualTips = [
      'I can adapt to your specific needs',
      'Describe your current challenge for targeted help',
      'I have expertise in learning science and education'
    ];

    const relevantQuestions = [
      'What are you trying to accomplish?',
      'What challenges are you facing?',
      'How can I assist with your current task?',
      'What would make your teaching more effective?'
    ];

    const dataAwareness = 'I\'m ready to help with whatever you\'re working on. Just describe your needs!';

    return {
      greeting,
      capabilities,
      suggestedActions,
      relevantQuestions,
      contextualTips,
      dataAwareness
    };
  }

  /**
   * Analyze form data to provide insights
   */
  static analyzeFormData(formData: Record<string, any>): FormInsight[] {
    const insights: FormInsight[] = [];

    Object.entries(formData).forEach(([formId, data]) => {
      const fields = Object.entries(data);
      const totalFields = fields.length;
      const completedFields = fields.filter(([_, value]) => {
        if (typeof value === 'string') return value.trim().length > 0;
        if (typeof value === 'boolean') return true;
        if (typeof value === 'number') return value > 0;
        return value != null;
      }).length;

      const completeness = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
      
      const missingFields = fields
        .filter(([_, value]) => {
          if (typeof value === 'string') return value.trim().length === 0;
          if (typeof value === 'number') return value <= 0;
          return value == null;
        })
        .map(([key, _]) => key);

      const suggestions: string[] = [];
      const validationTips: string[] = [];

      // Generate suggestions based on form type and missing fields
      if (formId.includes('title') && missingFields.includes('title')) {
        suggestions.push('Add a clear, descriptive title');
        validationTips.push('Titles should be 5-60 characters and clearly describe the content');
      }

      if (formId.includes('description') && missingFields.includes('description')) {
        suggestions.push('Provide a detailed description');
        validationTips.push('Good descriptions are 50-300 words and explain value to students');
      }

      if (formId.includes('price') && missingFields.includes('price')) {
        suggestions.push('Set an appropriate price');
        validationTips.push('Research competitor pricing and consider your target audience');
      }

      insights.push({
        formId,
        completeness,
        missingFields,
        suggestions,
        validationTips
      });
    });

    return insights;
  }

  /**
   * Generate contextual questions based on current state
   */
  static generateContextualQuestions(context: SAMContextData): string[] {
    const { pageType, entityData } = context;
    
    const baseQuestions = [
      'How can I help you with your current task?',
      'What specific challenge are you facing?',
      'What would you like to accomplish here?'
    ];

    switch (pageType) {
      case 'course-edit':
        return [
          'What learning outcome is most important for this course?',
          'Who is your ideal student?',
          'How can we improve student engagement?',
          'What makes this course unique?',
          'What assessments would work best?'
        ];

      case 'chapter-edit':
        return [
          'What key concept should students master in this chapter?',
          'How does this chapter connect to the overall course?',
          'What real-world examples can you include?',
          'How will you assess understanding?',
          'What might students find challenging?'
        ];

      case 'section-edit':
        return [
          'What specific skill should students gain from this section?',
          'How can you make this content more interactive?',
          'What examples would clarify this concept?',
          'How will you know if students understand?',
          'What practice opportunities can you provide?'
        ];

      default:
        return baseQuestions;
    }
  }
}