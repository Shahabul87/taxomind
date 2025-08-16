/**
 * Cognitive Prerequisite Mapping System
 * 
 * This module maps the interdependencies between Bloom's taxonomy levels,
 * tracks prerequisite mastery, and provides intelligent scaffolding recommendations.
 */

import { BloomsLevel, QuestionType } from '@prisma/client';
import { ENHANCED_BLOOMS_FRAMEWORK } from './ai-question-generator';

export interface CognitivePrerequisite {
  level: BloomsLevel;
  requiredMasteryLevel: number; // 0-1 scale
  criticalityScore: number; // 0-1 how critical this prerequisite is
  developmentalStage: 'foundational' | 'intermediate' | 'advanced';
  scaffoldingStrategies: string[];
}

export interface SkillDependency {
  sourceLevel: BloomsLevel;
  targetLevel: BloomsLevel;
  dependencyStrength: number; // 0-1 how strongly target depends on source
  developmentalGap: number; // Expected time/effort gap between levels
  bridgingActivities: BridgingActivity[];
  commonTransitionErrors: TransitionError[];
}

export interface BridgingActivity {
  activityType: 'scaffolding' | 'practice' | 'reflection' | 'application';
  description: string;
  estimatedTime: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  cognitiveLoad: number; // 1-5
  successRate: number; // 0-1 based on historical data
}

export interface TransitionError {
  errorType: 'conceptual' | 'procedural' | 'metacognitive';
  description: string;
  frequency: number; // 0-1 how often this error occurs
  interventionStrategy: string;
  preventionMethods: string[];
}

export interface CognitivePathway {
  pathway: BloomsLevel[];
  totalDevelopmentTime: number; // estimated hours
  criticalMilestones: Milestone[];
  riskPoints: RiskPoint[];
  alternativePaths: AlternativePathway[];
  personalizedAdjustments: PersonalizationFactor[];
}

export interface Milestone {
  level: BloomsLevel;
  masteryThreshold: number; // 0-1
  validationMethods: string[];
  typicalTimeToReach: number; // hours
  successIndicators: string[];
}

export interface RiskPoint {
  level: BloomsLevel;
  riskType: 'plateau' | 'regression' | 'overload' | 'misconception';
  probability: number; // 0-1
  earlyWarningSignals: string[];
  interventionStrategies: string[];
  preventionMethods: string[];
}

export interface AlternativePathway {
  pathDescription: string;
  suitableFor: string[]; // Learning style preferences
  estimatedEffectiveness: number; // 0-1
  requiredSupport: 'minimal' | 'moderate' | 'intensive';
}

export interface PersonalizationFactor {
  factorType: 'learning_style' | 'prior_knowledge' | 'motivation' | 'cognitive_capacity';
  description: string;
  adjustmentRecommendation: string;
  impactOnTimeline: number; // multiplier for development time
}

export interface PrerequisiteMasteryStatus {
  level: BloomsLevel;
  currentMastery: number; // 0-1
  requiredMastery: number; // 0-1
  masteryGap: number; // difference between required and current
  isReady: boolean;
  readinessScore: number; // 0-1 overall readiness
  specificDeficits: SkillDeficit[];
  recommendedActions: RecommendedAction[];
}

export interface SkillDeficit {
  skill: string;
  deficitSeverity: 'minor' | 'moderate' | 'major';
  impactOnProgression: number; // 0-1
  targetedPractice: string[];
  estimatedRemediationTime: number; // hours
}

export interface RecommendedAction {
  actionType: 'practice' | 'review' | 'scaffolding' | 'alternative_approach';
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number; // 0-1
  timeRequirement: number; // minutes
}

// Comprehensive prerequisite mapping for each Bloom's level
export const COGNITIVE_PREREQUISITE_MAP: Record<BloomsLevel, CognitivePrerequisite[]> = {
  REMEMBER: [
    // Remember is the foundational level - minimal prerequisites
    {
      level: 'REMEMBER' as BloomsLevel,
      requiredMasteryLevel: 0.0,
      criticalityScore: 1.0,
      developmentalStage: 'foundational',
      scaffoldingStrategies: [
        'Repetition and drill exercises',
        'Mnemonic devices and memory aids',
        'Chunking information into smaller units',
        'Visual and auditory memory techniques',
        'Regular spaced review sessions'
      ]
    }
  ],

  UNDERSTAND: [
    {
      level: 'REMEMBER' as BloomsLevel,
      requiredMasteryLevel: 0.75,
      criticalityScore: 0.9,
      developmentalStage: 'foundational',
      scaffoldingStrategies: [
        'Concept mapping and graphic organizers',
        'Explain-in-your-own-words exercises',
        'Example and non-example comparisons',
        'Analogies and metaphors',
        'Summarization practice'
      ]
    }
  ],

  APPLY: [
    {
      level: 'REMEMBER' as BloomsLevel,
      requiredMasteryLevel: 0.7,
      criticalityScore: 0.8,
      developmentalStage: 'foundational',
      scaffoldingStrategies: [
        'Procedural knowledge reinforcement',
        'Step-by-step guided practice'
      ]
    },
    {
      level: 'UNDERSTAND' as BloomsLevel,
      requiredMasteryLevel: 0.8,
      criticalityScore: 0.95,
      developmentalStage: 'intermediate',
      scaffoldingStrategies: [
        'Worked examples with explanation',
        'Problem-solving strategy instruction',
        'Case study analysis',
        'Simulation and role-playing',
        'Transfer exercises across contexts'
      ]
    }
  ],

  ANALYZE: [
    {
      level: 'REMEMBER' as BloomsLevel,
      requiredMasteryLevel: 0.7,
      criticalityScore: 0.6,
      developmentalStage: 'foundational',
      scaffoldingStrategies: ['Factual knowledge base building']
    },
    {
      level: 'UNDERSTAND' as BloomsLevel,
      requiredMasteryLevel: 0.75,
      criticalityScore: 0.85,
      developmentalStage: 'intermediate',
      scaffoldingStrategies: [
        'Conceptual framework development',
        'Pattern recognition training'
      ]
    },
    {
      level: 'APPLY' as BloomsLevel,
      requiredMasteryLevel: 0.8,
      criticalityScore: 0.9,
      developmentalStage: 'intermediate',
      scaffoldingStrategies: [
        'Deconstruction exercises',
        'Compare and contrast activities',
        'Cause-and-effect analysis',
        'Systems thinking development',
        'Critical questioning techniques'
      ]
    }
  ],

  EVALUATE: [
    {
      level: 'REMEMBER' as BloomsLevel,
      requiredMasteryLevel: 0.65,
      criticalityScore: 0.5,
      developmentalStage: 'foundational',
      scaffoldingStrategies: ['Criteria and standards awareness']
    },
    {
      level: 'UNDERSTAND' as BloomsLevel,
      requiredMasteryLevel: 0.7,
      criticalityScore: 0.7,
      developmentalStage: 'intermediate',
      scaffoldingStrategies: ['Value system comprehension']
    },
    {
      level: 'APPLY' as BloomsLevel,
      requiredMasteryLevel: 0.75,
      criticalityScore: 0.8,
      developmentalStage: 'intermediate',
      scaffoldingStrategies: ['Practical judgment experience']
    },
    {
      level: 'ANALYZE' as BloomsLevel,
      requiredMasteryLevel: 0.85,
      criticalityScore: 0.95,
      developmentalStage: 'advanced',
      scaffoldingStrategies: [
        'Criteria development exercises',
        'Evidence evaluation training',
        'Perspective-taking activities',
        'Bias recognition and mitigation',
        'Structured argument analysis'
      ]
    }
  ],

  CREATE: [
    {
      level: 'REMEMBER' as BloomsLevel,
      requiredMasteryLevel: 0.6,
      criticalityScore: 0.4,
      developmentalStage: 'foundational',
      scaffoldingStrategies: ['Building blocks knowledge']
    },
    {
      level: 'UNDERSTAND' as BloomsLevel,
      requiredMasteryLevel: 0.65,
      criticalityScore: 0.6,
      developmentalStage: 'intermediate',
      scaffoldingStrategies: ['Conceptual flexibility development']
    },
    {
      level: 'APPLY' as BloomsLevel,
      requiredMasteryLevel: 0.7,
      criticalityScore: 0.75,
      developmentalStage: 'intermediate',
      scaffoldingStrategies: ['Tool and technique mastery']
    },
    {
      level: 'ANALYZE' as BloomsLevel,
      requiredMasteryLevel: 0.75,
      criticalityScore: 0.8,
      developmentalStage: 'advanced',
      scaffoldingStrategies: ['Component understanding for synthesis']
    },
    {
      level: 'EVALUATE' as BloomsLevel,
      requiredMasteryLevel: 0.7,
      criticalityScore: 0.85,
      developmentalStage: 'advanced',
      scaffoldingStrategies: [
        'Creative ideation techniques',
        'Design thinking methodology',
        'Innovation frameworks',
        'Original synthesis practice',
        'Iterative refinement processes'
      ]
    }
  ]
};

// Skill dependency relationships between levels
export const SKILL_DEPENDENCIES: SkillDependency[] = [
  {
    sourceLevel: 'REMEMBER',
    targetLevel: 'UNDERSTAND',
    dependencyStrength: 0.9,
    developmentalGap: 2.5,
    bridgingActivities: [
      {
        activityType: 'scaffolding',
        description: 'Concept mapping to connect facts to meaning',
        estimatedTime: 30,
        difficulty: 'medium',
        cognitiveLoad: 2,
        successRate: 0.85
      },
      {
        activityType: 'practice',
        description: 'Explain-why exercises for memorized facts',
        estimatedTime: 20,
        difficulty: 'easy',
        cognitiveLoad: 2,
        successRate: 0.9
      }
    ],
    commonTransitionErrors: [
      {
        errorType: 'conceptual',
        description: 'Confusing memorization with comprehension',
        frequency: 0.4,
        interventionStrategy: 'Explicit instruction on difference between knowing and understanding',
        preventionMethods: ['Regular comprehension checks', 'Paraphrasing exercises']
      }
    ]
  },
  {
    sourceLevel: 'UNDERSTAND',
    targetLevel: 'APPLY',
    dependencyStrength: 0.95,
    developmentalGap: 3.0,
    bridgingActivities: [
      {
        activityType: 'practice',
        description: 'Guided problem-solving with step-by-step support',
        estimatedTime: 45,
        difficulty: 'medium',
        cognitiveLoad: 3,
        successRate: 0.8
      },
      {
        activityType: 'application',
        description: 'Real-world scenario practice',
        estimatedTime: 60,
        difficulty: 'hard',
        cognitiveLoad: 4,
        successRate: 0.75
      }
    ],
    commonTransitionErrors: [
      {
        errorType: 'procedural',
        description: 'Applying procedures without understanding context',
        frequency: 0.35,
        interventionStrategy: 'Context-rich problem presentation',
        preventionMethods: ['Conceptual grounding before procedures', 'When-to-use instruction']
      }
    ]
  },
  {
    sourceLevel: 'APPLY',
    targetLevel: 'ANALYZE',
    dependencyStrength: 0.85,
    developmentalGap: 4.0,
    bridgingActivities: [
      {
        activityType: 'scaffolding',
        description: 'Break down complex problems into components',
        estimatedTime: 40,
        difficulty: 'hard',
        cognitiveLoad: 4,
        successRate: 0.7
      },
      {
        activityType: 'reflection',
        description: 'Analyze solution strategies and their effectiveness',
        estimatedTime: 25,
        difficulty: 'medium',
        cognitiveLoad: 3,
        successRate: 0.8
      }
    ],
    commonTransitionErrors: [
      {
        errorType: 'metacognitive',
        description: 'QuestionDifficulty stepping back to see patterns',
        frequency: 0.5,
        interventionStrategy: 'Explicit metacognitive strategy instruction',
        preventionMethods: ['Think-aloud protocols', 'Strategy awareness training']
      }
    ]
  },
  {
    sourceLevel: 'ANALYZE',
    targetLevel: 'EVALUATE',
    dependencyStrength: 0.9,
    developmentalGap: 3.5,
    bridgingActivities: [
      {
        activityType: 'scaffolding',
        description: 'Criteria development and application exercises',
        estimatedTime: 50,
        difficulty: 'hard',
        cognitiveLoad: 4,
        successRate: 0.65
      },
      {
        activityType: 'practice',
        description: 'Evidence-based reasoning practice',
        estimatedTime: 35,
        difficulty: 'medium',
        cognitiveLoad: 3,
        successRate: 0.75
      }
    ],
    commonTransitionErrors: [
      {
        errorType: 'conceptual',
        description: 'Confusing personal opinion with evidence-based judgment',
        frequency: 0.6,
        interventionStrategy: 'Explicit criteria and evidence training',
        preventionMethods: ['Rubric development', 'Peer evaluation exercises']
      }
    ]
  },
  {
    sourceLevel: 'EVALUATE',
    targetLevel: 'CREATE',
    dependencyStrength: 0.75,
    developmentalGap: 5.0,
    bridgingActivities: [
      {
        activityType: 'scaffolding',
        description: 'Design thinking workshops',
        estimatedTime: 90,
        difficulty: 'hard',
        cognitiveLoad: 5,
        successRate: 0.6
      },
      {
        activityType: 'practice',
        description: 'Iterative creation with feedback cycles',
        estimatedTime: 120,
        difficulty: 'hard',
        cognitiveLoad: 5,
        successRate: 0.7
      }
    ],
    commonTransitionErrors: [
      {
        errorType: 'conceptual',
        description: 'Fear of originality and creative risk-taking',
        frequency: 0.4,
        interventionStrategy: 'Safe creative space establishment',
        preventionMethods: ['Growth mindset training', 'Failure celebration']
      }
    ]
  }
];

export class CognitivePrerequisiteMapper {
  private static instance: CognitivePrerequisiteMapper;
  
  private constructor() {}
  
  public static getInstance(): CognitivePrerequisiteMapper {
    if (!CognitivePrerequisiteMapper.instance) {
      CognitivePrerequisiteMapper.instance = new CognitivePrerequisiteMapper();
    }
    return CognitivePrerequisiteMapper.instance;
  }

  /**
   * Assess prerequisite mastery status for a target level
   */
  public assessPrerequisiteMastery(
    targetLevel: BloomsLevel,
    currentMasteryLevels: Record<BloomsLevel, number>,
    learnerProfile?: any
  ): PrerequisiteMasteryStatus {
    const prerequisites = COGNITIVE_PREREQUISITE_MAP[targetLevel] || [];
    let totalReadinessScore = 0;
    let masteryCount = 0;
    const specificDeficits: SkillDeficit[] = [];
    const recommendedActions: RecommendedAction[] = [];

    prerequisites.forEach(prerequisite => {
      const currentMastery = currentMasteryLevels[prerequisite.level] || 0;
      const requiredMastery = prerequisite.requiredMasteryLevel;
      const masteryGap = Math.max(0, requiredMastery - currentMastery);
      
      if (masteryGap > 0) {
        const deficitSeverity = this.classifyDeficitSeverity(masteryGap, prerequisite.criticalityScore);
        
        specificDeficits.push({
          skill: `${prerequisite.level} mastery`,
          deficitSeverity,
          impactOnProgression: masteryGap * prerequisite.criticalityScore,
          targetedPractice: prerequisite.scaffoldingStrategies,
          estimatedRemediationTime: this.estimateRemediationTime(masteryGap, prerequisite.developmentalStage)
        });

        recommendedActions.push({
          actionType: 'practice',
          description: `Focus on ${prerequisite.level} level skills`,
          priority: deficitSeverity === 'major' ? 'high' : deficitSeverity === 'moderate' ? 'medium' : 'low',
          estimatedImpact: prerequisite.criticalityScore,
          timeRequirement: this.estimateRemediationTime(masteryGap, prerequisite.developmentalStage) * 60
        });
      }

      // Calculate weighted readiness contribution
      const prerequisiteReadiness = Math.min(1, currentMastery / requiredMastery);
      totalReadinessScore += prerequisiteReadiness * prerequisite.criticalityScore;
      masteryCount++;
    });

    const overallReadiness = masteryCount > 0 ? totalReadinessScore / masteryCount : 0;
    const currentMastery = currentMasteryLevels[targetLevel] || 0;
    
    return {
      level: targetLevel,
      currentMastery,
      requiredMastery: 0.7, // Standard mastery threshold
      masteryGap: Math.max(0, 0.7 - currentMastery),
      isReady: overallReadiness >= 0.8 && specificDeficits.length === 0,
      readinessScore: overallReadiness,
      specificDeficits,
      recommendedActions
    };
  }

  /**
   * Generate optimal cognitive pathway for learning progression
   */
  public generateCognitivePathway(
    startLevel: BloomsLevel,
    targetLevel: BloomsLevel,
    currentMasteryLevels: Record<BloomsLevel, number>,
    learnerProfile?: any
  ): CognitivePathway {
    const bloomsHierarchy: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    
    const startIndex = bloomsHierarchy.indexOf(startLevel);
    const targetIndex = bloomsHierarchy.indexOf(targetLevel);
    
    if (startIndex === -1 || targetIndex === -1 || startIndex >= targetIndex) {
      throw new Error('Invalid level progression specified');
    }

    const pathway = bloomsHierarchy.slice(startIndex, targetIndex + 1);
    let totalDevelopmentTime = 0;
    const criticalMilestones: Milestone[] = [];
    const riskPoints: RiskPoint[] = [];

    // Calculate development time and identify milestones/risks
    for (let i = 0; i < pathway.length; i++) {
      const level = pathway[i];
      const currentMastery = currentMasteryLevels[level] || 0;
      
      // Time estimation based on mastery gap and level complexity
      const complexity = this.getLevelComplexity(level);
      const masteryGap = Math.max(0, 0.8 - currentMastery);
      const levelTime = masteryGap * complexity * 10; // Base 10 hours per full level
      totalDevelopmentTime += levelTime;

      // Add milestone
      criticalMilestones.push({
        level,
        masteryThreshold: 0.8,
        validationMethods: this.getValidationMethods(level),
        typicalTimeToReach: levelTime,
        successIndicators: this.getSuccessIndicators(level)
      });

      // Identify potential risk points
      if (masteryGap > 0.4) {
        riskPoints.push({
          level,
          riskType: 'plateau',
          probability: masteryGap * 0.8,
          earlyWarningSignals: [`QuestionDifficulty progressing beyond ${Math.round(currentMastery * 100)}% mastery`],
          interventionStrategies: COGNITIVE_PREREQUISITE_MAP[level]?.[0]?.scaffoldingStrategies || [],
          preventionMethods: ['Regular progress monitoring', 'Adaptive pacing']
        });
      }
    }

    return {
      pathway,
      totalDevelopmentTime,
      criticalMilestones,
      riskPoints,
      alternativePaths: this.generateAlternativePaths(pathway, learnerProfile),
      personalizedAdjustments: this.generatePersonalizedAdjustments(learnerProfile)
    };
  }

  /**
   * Get bridging activities between two specific levels
   */
  public getBridgingActivities(fromLevel: BloomsLevel, toLevel: BloomsLevel): BridgingActivity[] {
    const dependency = SKILL_DEPENDENCIES.find(
      dep => dep.sourceLevel === fromLevel && dep.targetLevel === toLevel
    );
    
    return dependency?.bridgingActivities || [];
  }

  /**
   * Identify common transition errors and interventions
   */
  public getTransitionGuidance(fromLevel: BloomsLevel, toLevel: BloomsLevel): TransitionError[] {
    const dependency = SKILL_DEPENDENCIES.find(
      dep => dep.sourceLevel === fromLevel && dep.targetLevel === toLevel
    );
    
    return dependency?.commonTransitionErrors || [];
  }

  /**
   * Calculate cognitive load for moving between levels
   */
  public calculateTransitionLoad(fromLevel: BloomsLevel, toLevel: BloomsLevel): number {
    const dependency = SKILL_DEPENDENCIES.find(
      dep => dep.sourceLevel === fromLevel && dep.targetLevel === toLevel
    );
    
    return dependency?.developmentalGap || 3.0;
  }

  private classifyDeficitSeverity(masteryGap: number, criticalityScore: number): 'minor' | 'moderate' | 'major' {
    const adjustedGap = masteryGap * criticalityScore;
    
    if (adjustedGap < 0.2) return 'minor';
    if (adjustedGap < 0.4) return 'moderate';
    return 'major';
  }

  private estimateRemediationTime(masteryGap: number, stage: string): number {
    const baseHours = {
      foundational: 2,
      intermediate: 4,
      advanced: 6
    };
    
    return (baseHours[stage as keyof typeof baseHours] || 4) * masteryGap;
  }

  private getLevelComplexity(level: BloomsLevel): number {
    const complexityMap = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 3,
      ANALYZE: 4,
      EVALUATE: 5,
      CREATE: 6
    };
    
    return complexityMap[level] || 3;
  }

  private getValidationMethods(level: BloomsLevel): string[] {
    const methods = {
      REMEMBER: ['Recall tests', 'Recognition exercises', 'Fact checking'],
      UNDERSTAND: ['Explanation tasks', 'Concept mapping', 'Summarization'],
      APPLY: ['Problem solving', 'Case studies', 'Simulations'],
      ANALYZE: ['Comparative analysis', 'Deconstruction tasks', 'Pattern identification'],
      EVALUATE: ['Criteria-based assessment', 'Peer review', 'Evidence evaluation'],
      CREATE: ['Original projects', 'Design challenges', 'Innovation tasks']
    };
    
    return methods[level] || [];
  }

  private getSuccessIndicators(level: BloomsLevel): string[] {
    const indicators = {
      REMEMBER: ['Accurate recall', 'Quick recognition', 'Consistent retrieval'],
      UNDERSTAND: ['Clear explanations', 'Appropriate examples', 'Conceptual connections'],
      APPLY: ['Successful transfer', 'Appropriate tool selection', 'Context awareness'],
      ANALYZE: ['Component identification', 'Relationship mapping', 'Pattern recognition'],
      EVALUATE: ['Evidence-based judgments', 'Criteria application', 'Bias awareness'],
      CREATE: ['Original solutions', 'Innovative combinations', 'Iterative refinement']
    };
    
    return indicators[level] || [];
  }

  private generateAlternativePaths(pathway: BloomsLevel[], learnerProfile?: any): AlternativePathway[] {
    // Generate alternative learning pathways based on learning preferences
    return [
      {
        pathDescription: 'Visual-spatial pathway with graphic organizers',
        suitableFor: ['Visual learners', 'Spatial intelligence'],
        estimatedEffectiveness: 0.85,
        requiredSupport: 'minimal'
      },
      {
        pathDescription: 'Collaborative pathway with peer learning',
        suitableFor: ['Social learners', 'Group work preference'],
        estimatedEffectiveness: 0.8,
        requiredSupport: 'moderate'
      },
      {
        pathDescription: 'Self-directed pathway with metacognitive supports',
        suitableFor: ['Independent learners', 'High self-regulation'],
        estimatedEffectiveness: 0.9,
        requiredSupport: 'minimal'
      }
    ];
  }

  private generatePersonalizedAdjustments(learnerProfile?: any): PersonalizationFactor[] {
    // Generate personalized adjustments based on learner profile
    return [
      {
        factorType: 'learning_style',
        description: 'Adjust for visual/auditory/kinesthetic preferences',
        adjustmentRecommendation: 'Provide multi-modal content delivery',
        impactOnTimeline: 1.0
      },
      {
        factorType: 'prior_knowledge',
        description: 'Account for existing domain knowledge',
        adjustmentRecommendation: 'Accelerate through known concepts',
        impactOnTimeline: 0.8
      },
      {
        factorType: 'cognitive_capacity',
        description: 'Adjust cognitive load management',
        adjustmentRecommendation: 'Optimize chunking and pacing',
        impactOnTimeline: 1.1
      }
    ];
  }
}

export default CognitivePrerequisiteMapper;