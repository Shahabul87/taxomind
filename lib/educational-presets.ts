/**
 * Educational Presets System
 * Provides smart templates and configurations for common educational scenarios
 */

export interface EducationalPreset {
  id: string;
  name: string;
  category: 'programming' | 'business' | 'science' | 'mathematics' | 'language' | 'design' | 'general';
  level: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  duration: 'short' | 'medium' | 'long'; // weeks
  description: string;
  tags: string[];
  
  // Course structure
  courseStructure: {
    title: string;
    description: string;
    learningObjectives: string[];
    chapters: ChapterPreset[];
  };
  
  // Assessment configuration
  assessmentConfig: {
    bloomsDistribution: {
      remember: number;
      understand: number;
      apply: number;
      analyze: number;
      evaluate: number;
      create: number;
    };
    questionTypes: {
      multipleChoice: number;
      trueFalse: number;
      shortAnswer: number;
      essay: number;
      practical: number;
    };
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
  
  // AI generation preferences
  aiPreferences: {
    contentTone: 'formal' | 'conversational' | 'technical' | 'engaging';
    includeExamples: boolean;
    includePracticeExercises: boolean;
    emphasizeRealWorld: boolean;
    interactivityLevel: 'low' | 'medium' | 'high';
  };
  
  // Recommended features
  recommendedFeatures: string[];
  
  // Success metrics
  successMetrics: {
    expectedCompletionRate: number;
    targetEngagementScore: number;
    recommendedClassSize: string;
  };
}

export interface ChapterPreset {
  title: string;
  description: string;
  estimatedDuration: string; // e.g., "2 hours"
  sections: SectionPreset[];
  assessments: AssessmentPreset[];
}

export interface SectionPreset {
  title: string;
  type: 'lecture' | 'reading' | 'video' | 'interactive' | 'practical';
  estimatedDuration: string;
  learningObjectives: string[];
  contentHints: string[];
}

export interface AssessmentPreset {
  title: string;
  type: 'quiz' | 'assignment' | 'project' | 'exam';
  questionCount: number;
  timeLimit?: number; // minutes
  bloomsLevel: string[];
  topics: string[];
}

// Predefined educational presets
export const EDUCATIONAL_PRESETS: EducationalPreset[] = [
  {
    id: 'web-development-bootcamp',
    name: 'Web Development Bootcamp',
    category: 'programming',
    level: 'beginner',
    duration: 'long',
    description: 'Complete web development course covering HTML, CSS, JavaScript, and modern frameworks',
    tags: ['web-development', 'javascript', 'html', 'css', 'react', 'hands-on'],
    
    courseStructure: {
      title: 'Complete Web Development Bootcamp',
      description: 'Learn to build modern web applications from scratch using industry-standard tools and practices.',
      learningObjectives: [
        'Build responsive websites using HTML and CSS',
        'Create interactive web applications with JavaScript',
        'Develop modern single-page applications with React',
        'Implement backend services with Node.js',
        'Deploy applications to production environments'
      ],
      chapters: [
        {
          title: 'HTML & CSS Fundamentals',
          description: 'Master the building blocks of web development',
          estimatedDuration: '1 week',
          sections: [
            {
              title: 'Introduction to HTML',
              type: 'lecture',
              estimatedDuration: '2 hours',
              learningObjectives: ['Understand HTML structure', 'Create basic HTML documents'],
              contentHints: ['HTML tags', 'semantic elements', 'document structure']
            },
            {
              title: 'CSS Styling and Layout',
              type: 'practical',
              estimatedDuration: '3 hours',
              learningObjectives: ['Style HTML elements', 'Create responsive layouts'],
              contentHints: ['CSS selectors', 'flexbox', 'grid layout', 'responsive design']
            }
          ],
          assessments: [
            {
              title: 'HTML & CSS Quiz',
              type: 'quiz',
              questionCount: 15,
              timeLimit: 30,
              bloomsLevel: ['remember', 'understand', 'apply'],
              topics: ['HTML structure', 'CSS properties', 'responsive design']
            }
          ]
        },
        {
          title: 'JavaScript Programming',
          description: 'Learn programming fundamentals with JavaScript',
          estimatedDuration: '2 weeks',
          sections: [
            {
              title: 'JavaScript Basics',
              type: 'lecture',
              estimatedDuration: '4 hours',
              learningObjectives: ['Understand variables and data types', 'Write basic JavaScript programs'],
              contentHints: ['variables', 'functions', 'control structures', 'DOM manipulation']
            },
            {
              title: 'Interactive Web Features',
              type: 'practical',
              estimatedDuration: '4 hours',
              learningObjectives: ['Create interactive user interfaces', 'Handle user events'],
              contentHints: ['event handling', 'form validation', 'dynamic content']
            }
          ],
          assessments: [
            {
              title: 'JavaScript Programming Project',
              type: 'project',
              questionCount: 5,
              bloomsLevel: ['apply', 'analyze', 'create'],
              topics: ['DOM manipulation', 'event handling', 'problem solving']
            }
          ]
        }
      ]
    },
    
    assessmentConfig: {
      bloomsDistribution: {
        remember: 10,
        understand: 20,
        apply: 35,
        analyze: 20,
        evaluate: 10,
        create: 5
      },
      questionTypes: {
        multipleChoice: 30,
        trueFalse: 10,
        shortAnswer: 25,
        essay: 10,
        practical: 25
      },
      difficultyDistribution: {
        easy: 30,
        medium: 50,
        hard: 20
      }
    },
    
    aiPreferences: {
      contentTone: 'engaging',
      includeExamples: true,
      includePracticeExercises: true,
      emphasizeRealWorld: true,
      interactivityLevel: 'high'
    },
    
    recommendedFeatures: [
      'ai-bulk-generation',
      'question-bank-system',
      'cognitive-analytics',
      'practical-assessments'
    ],
    
    successMetrics: {
      expectedCompletionRate: 75,
      targetEngagementScore: 85,
      recommendedClassSize: '15-25 students'
    }
  },
  
  {
    id: 'business-strategy-executive',
    name: 'Executive Business Strategy',
    category: 'business',
    level: 'advanced',
    duration: 'medium',
    description: 'Strategic thinking and decision-making for senior executives and business leaders',
    tags: ['strategy', 'leadership', 'decision-making', 'case-studies', 'executive'],
    
    courseStructure: {
      title: 'Strategic Leadership in Modern Business',
      description: 'Develop advanced strategic thinking capabilities and leadership skills for complex business environments.',
      learningObjectives: [
        'Analyze complex business environments and competitive landscapes',
        'Develop comprehensive strategic plans for organizational growth',
        'Evaluate strategic options using advanced frameworks',
        'Lead strategic change initiatives effectively',
        'Create value through strategic partnerships and innovation'
      ],
      chapters: [
        {
          title: 'Strategic Analysis and Planning',
          description: 'Master advanced strategic analysis frameworks',
          estimatedDuration: '2 weeks',
          sections: [
            {
              title: 'Competitive Intelligence and Market Analysis',
              type: 'lecture',
              estimatedDuration: '3 hours',
              learningObjectives: ['Conduct thorough competitive analysis', 'Identify market opportunities'],
              contentHints: ['Porter\'s Five Forces', 'SWOT analysis', 'market segmentation', 'competitive positioning']
            },
            {
              title: 'Strategic Framework Application',
              type: 'interactive',
              estimatedDuration: '2 hours',
              learningObjectives: ['Apply strategic frameworks to real scenarios', 'Synthesize complex information'],
              contentHints: ['case study analysis', 'framework application', 'strategic synthesis']
            }
          ],
          assessments: [
            {
              title: 'Strategic Analysis Case Study',
              type: 'assignment',
              questionCount: 3,
              bloomsLevel: ['analyze', 'evaluate', 'create'],
              topics: ['competitive analysis', 'strategic frameworks', 'decision-making']
            }
          ]
        }
      ]
    },
    
    assessmentConfig: {
      bloomsDistribution: {
        remember: 5,
        understand: 15,
        apply: 25,
        analyze: 30,
        evaluate: 20,
        create: 5
      },
      questionTypes: {
        multipleChoice: 15,
        trueFalse: 5,
        shortAnswer: 20,
        essay: 35,
        practical: 25
      },
      difficultyDistribution: {
        easy: 10,
        medium: 40,
        hard: 50
      }
    },
    
    aiPreferences: {
      contentTone: 'formal',
      includeExamples: true,
      includePracticeExercises: false,
      emphasizeRealWorld: true,
      interactivityLevel: 'medium'
    },
    
    recommendedFeatures: [
      'risk-analysis',
      'cognitive-analytics',
      'advanced-ai-settings',
      'intervention-recommendations'
    ],
    
    successMetrics: {
      expectedCompletionRate: 90,
      targetEngagementScore: 80,
      recommendedClassSize: '8-15 students'
    }
  },
  
  {
    id: 'data-science-fundamentals',
    name: 'Data Science Fundamentals',
    category: 'science',
    level: 'intermediate',
    duration: 'medium',
    description: 'Introduction to data science concepts, tools, and techniques for analytical thinking',
    tags: ['data-science', 'python', 'statistics', 'machine-learning', 'analytics'],
    
    courseStructure: {
      title: 'Data Science Fundamentals: From Data to Insights',
      description: 'Learn essential data science skills including statistical analysis, data visualization, and machine learning basics.',
      learningObjectives: [
        'Apply statistical methods to analyze datasets',
        'Create effective data visualizations',
        'Implement basic machine learning algorithms',
        'Clean and prepare data for analysis',
        'Communicate data-driven insights effectively'
      ],
      chapters: [
        {
          title: 'Statistical Analysis and Probability',
          description: 'Foundation concepts in statistics and probability theory',
          estimatedDuration: '2 weeks',
          sections: [
            {
              title: 'Descriptive Statistics',
              type: 'lecture',
              estimatedDuration: '2 hours',
              learningObjectives: ['Calculate and interpret descriptive statistics', 'Understand data distributions'],
              contentHints: ['mean, median, mode', 'variance and standard deviation', 'data distributions']
            },
            {
              title: 'Probability and Inference',
              type: 'practical',
              estimatedDuration: '3 hours',
              learningObjectives: ['Apply probability concepts', 'Perform statistical inference'],
              contentHints: ['probability distributions', 'hypothesis testing', 'confidence intervals']
            }
          ],
          assessments: [
            {
              title: 'Statistical Analysis Project',
              type: 'project',
              questionCount: 4,
              bloomsLevel: ['apply', 'analyze', 'evaluate'],
              topics: ['descriptive statistics', 'hypothesis testing', 'data interpretation']
            }
          ]
        }
      ]
    },
    
    assessmentConfig: {
      bloomsDistribution: {
        remember: 15,
        understand: 25,
        apply: 30,
        analyze: 20,
        evaluate: 8,
        create: 2
      },
      questionTypes: {
        multipleChoice: 25,
        trueFalse: 10,
        shortAnswer: 30,
        essay: 15,
        practical: 20
      },
      difficultyDistribution: {
        easy: 25,
        medium: 55,
        hard: 20
      }
    },
    
    aiPreferences: {
      contentTone: 'technical',
      includeExamples: true,
      includePracticeExercises: true,
      emphasizeRealWorld: true,
      interactivityLevel: 'high'
    },
    
    recommendedFeatures: [
      'ai-bulk-generation',
      'cognitive-analytics',
      'question-bank-system'
    ],
    
    successMetrics: {
      expectedCompletionRate: 70,
      targetEngagementScore: 80,
      recommendedClassSize: '12-20 students'
    }
  },
  
  {
    id: 'k12-mathematics-algebra',
    name: 'High School Algebra',
    category: 'mathematics',
    level: 'beginner',
    duration: 'long',
    description: 'Comprehensive algebra course for high school students with step-by-step progression',
    tags: ['algebra', 'high-school', 'mathematics', 'step-by-step', 'practice'],
    
    courseStructure: {
      title: 'Algebra I: Building Mathematical Foundations',
      description: 'Master algebraic concepts through structured lessons, practice problems, and real-world applications.',
      learningObjectives: [
        'Solve linear equations and inequalities',
        'Work with polynomials and factoring',
        'Understand functions and graphing',
        'Apply algebraic concepts to word problems',
        'Develop mathematical reasoning skills'
      ],
      chapters: [
        {
          title: 'Linear Equations and Inequalities',
          description: 'Foundation concepts for solving equations',
          estimatedDuration: '3 weeks',
          sections: [
            {
              title: 'Solving One-Step Equations',
              type: 'lecture',
              estimatedDuration: '1 hour',
              learningObjectives: ['Solve basic linear equations', 'Understand equation properties'],
              contentHints: ['equation properties', 'inverse operations', 'checking solutions']
            },
            {
              title: 'Multi-Step Equation Practice',
              type: 'practical',
              estimatedDuration: '2 hours',
              learningObjectives: ['Solve complex linear equations', 'Apply problem-solving strategies'],
              contentHints: ['distributive property', 'combining like terms', 'multi-step solutions']
            }
          ],
          assessments: [
            {
              title: 'Linear Equations Quiz',
              type: 'quiz',
              questionCount: 20,
              timeLimit: 45,
              bloomsLevel: ['remember', 'understand', 'apply'],
              topics: ['equation solving', 'algebraic manipulation', 'word problems']
            }
          ]
        }
      ]
    },
    
    assessmentConfig: {
      bloomsDistribution: {
        remember: 25,
        understand: 30,
        apply: 35,
        analyze: 8,
        evaluate: 2,
        create: 0
      },
      questionTypes: {
        multipleChoice: 40,
        trueFalse: 15,
        shortAnswer: 35,
        essay: 5,
        practical: 5
      },
      difficultyDistribution: {
        easy: 40,
        medium: 45,
        hard: 15
      }
    },
    
    aiPreferences: {
      contentTone: 'engaging',
      includeExamples: true,
      includePracticeExercises: true,
      emphasizeRealWorld: false,
      interactivityLevel: 'high'
    },
    
    recommendedFeatures: [
      'ai-bulk-generation',
      'question-bank-system',
      'intelligent-onboarding'
    ],
    
    successMetrics: {
      expectedCompletionRate: 85,
      targetEngagementScore: 75,
      recommendedClassSize: '20-30 students'
    }
  },
  
  {
    id: 'creative-writing-workshop',
    name: 'Creative Writing Workshop',
    category: 'language',
    level: 'mixed',
    duration: 'medium',
    description: 'Develop creative writing skills through guided exercises, peer feedback, and portfolio development',
    tags: ['creative-writing', 'workshop', 'peer-review', 'portfolio', 'storytelling'],
    
    courseStructure: {
      title: 'Creative Writing: Craft and Voice',
      description: 'Explore various forms of creative writing while developing your unique voice and storytelling abilities.',
      learningObjectives: [
        'Develop a personal writing voice and style',
        'Master various creative writing techniques',
        'Provide constructive feedback on peer work',
        'Create a portfolio of polished pieces',
        'Understand the revision and editing process'
      ],
      chapters: [
        {
          title: 'Finding Your Voice',
          description: 'Discover and develop your unique writing style',
          estimatedDuration: '2 weeks',
          sections: [
            {
              title: 'Writing Style and Voice',
              type: 'lecture',
              estimatedDuration: '1.5 hours',
              learningObjectives: ['Understand the concept of voice in writing', 'Identify different writing styles'],
              contentHints: ['narrative voice', 'tone and mood', 'style elements']
            },
            {
              title: 'Voice Development Exercises',
              type: 'practical',
              estimatedDuration: '2 hours',
              learningObjectives: ['Practice writing in different voices', 'Develop personal style'],
              contentHints: ['writing prompts', 'voice exercises', 'style experimentation']
            }
          ],
          assessments: [
            {
              title: 'Voice Portfolio Submission',
              type: 'assignment',
              questionCount: 1,
              bloomsLevel: ['create', 'evaluate'],
              topics: ['creative writing', 'personal voice', 'style development']
            }
          ]
        }
      ]
    },
    
    assessmentConfig: {
      bloomsDistribution: {
        remember: 5,
        understand: 15,
        apply: 25,
        analyze: 20,
        evaluate: 15,
        create: 20
      },
      questionTypes: {
        multipleChoice: 10,
        trueFalse: 5,
        shortAnswer: 15,
        essay: 50,
        practical: 20
      },
      difficultyDistribution: {
        easy: 20,
        medium: 50,
        hard: 30
      }
    },
    
    aiPreferences: {
      contentTone: 'conversational',
      includeExamples: true,
      includePracticeExercises: true,
      emphasizeRealWorld: false,
      interactivityLevel: 'medium'
    },
    
    recommendedFeatures: [
      'ai-bulk-generation',
      'advanced-ai-settings',
      'cognitive-analytics'
    ],
    
    successMetrics: {
      expectedCompletionRate: 80,
      targetEngagementScore: 90,
      recommendedClassSize: '8-15 students'
    }
  }
];

/**
 * Utility functions for working with educational presets
 */
export class EducationalPresetManager {
  static getPresetById(id: string): EducationalPreset | undefined {
    return EDUCATIONAL_PRESETS.find(preset => preset.id === id);
  }
  
  static getPresetsByCategory(category: EducationalPreset['category']): EducationalPreset[] {
    return EDUCATIONAL_PRESETS.filter(preset => preset.category === category);
  }
  
  static getPresetsByLevel(level: EducationalPreset['level']): EducationalPreset[] {
    return EDUCATIONAL_PRESETS.filter(preset => preset.level === level);
  }
  
  static getPresetsByDuration(duration: EducationalPreset['duration']): EducationalPreset[] {
    return EDUCATIONAL_PRESETS.filter(preset => preset.duration === duration);
  }
  
  static searchPresets(query: string): EducationalPreset[] {
    const lowercaseQuery = query.toLowerCase();
    return EDUCATIONAL_PRESETS.filter(preset => 
      preset.name.toLowerCase().includes(lowercaseQuery) ||
      preset.description.toLowerCase().includes(lowercaseQuery) ||
      preset.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
  
  static getRecommendedPresets(userProfile: {
    experience?: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
    previousCourses?: string[];
  }): EducationalPreset[] {
    const { experience, interests = [], previousCourses = [] } = userProfile;
    
    let candidates = EDUCATIONAL_PRESETS;
    
    // Filter by experience level
    if (experience) {
      candidates = candidates.filter(preset => 
        preset.level === experience || preset.level === 'mixed'
      );
    }
    
    // Score by interests
    const scored = candidates.map(preset => {
      let score = 0;
      
      // Interest matching
      interests.forEach(interest => {
        if (preset.tags.includes(interest.toLowerCase())) {
          score += 2;
        }
        if (preset.category === interest.toLowerCase()) {
          score += 3;
        }
      });
      
      // Avoid duplicates with previous courses
      const isDuplicate = previousCourses.some(courseId => 
        preset.id === courseId || preset.tags.some(tag => courseId.includes(tag))
      );
      if (isDuplicate) {
        score -= 5;
      }
      
      return { preset, score };
    });
    
    // Sort by score and return top recommendations
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => item.preset);
  }
  
  static applyPresetToCourse(preset: EducationalPreset): {
    courseData: any;
    chaptersData: any[];
    assessmentConfig: any;
  } {
    const { courseStructure, assessmentConfig, aiPreferences } = preset;
    
    return {
      courseData: {
        title: courseStructure.title,
        description: courseStructure.description,
        whatYouWillLearn: courseStructure.learningObjectives,
        categoryHint: preset.category,
        levelHint: preset.level,
        durationHint: preset.duration,
        aiPreferences
      },
      chaptersData: courseStructure.chapters.map((chapter, index) => ({
        title: chapter.title,
        description: chapter.description,
        position: index + 1,
        estimatedDuration: chapter.estimatedDuration,
        sections: chapter.sections.map((section, sIndex) => ({
          title: section.title,
          type: section.type,
          position: sIndex + 1,
          estimatedDuration: section.estimatedDuration,
          learningObjectives: section.learningObjectives,
          contentHints: section.contentHints
        })),
        assessments: chapter.assessments
      })),
      assessmentConfig: {
        ...assessmentConfig,
        recommendedFeatures: preset.recommendedFeatures,
        successMetrics: preset.successMetrics
      }
    };
  }
  
  static generateCustomPreset(requirements: {
    subject: string;
    level: string;
    duration: string;
    goals: string[];
    audience: string;
  }): Partial<EducationalPreset> {
    // This would use AI to generate a custom preset based on requirements
    // For now, return a basic template
    return {
      id: `custom-${Date.now()}`,
      name: `${requirements.subject} Course`,
      category: 'general',
      level: requirements.level as any,
      duration: requirements.duration as any,
      description: `Custom ${requirements.subject} course for ${requirements.audience}`,
      tags: [requirements.subject.toLowerCase(), requirements.level, requirements.audience.toLowerCase()],
      courseStructure: {
        title: `${requirements.subject} Mastery Course`,
        description: `Comprehensive ${requirements.subject} course designed for ${requirements.audience}`,
        learningObjectives: requirements.goals,
        chapters: [] // Would be generated based on requirements
      }
    };
  }
}