"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BLOOMS_ACTIVITIES: () => BLOOMS_ACTIVITIES,
  BLOOMS_LEVEL_ORDER: () => BLOOMS_LEVEL_ORDER,
  BLOOMS_VERBS: () => BLOOMS_VERBS,
  BloomsAligner: () => BloomsAligner,
  COMPLEXITY_INDICATORS: () => COMPLEXITY_INDICATORS,
  DEFAULT_BLOOMS_ALIGNER_CONFIG: () => DEFAULT_BLOOMS_ALIGNER_CONFIG,
  DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG: () => DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG,
  DEFAULT_SCAFFOLDING_CONFIG: () => DEFAULT_SCAFFOLDING_CONFIG,
  DEFAULT_ZPD_CONFIG: () => DEFAULT_ZPD_CONFIG,
  DIFFICULTY_LEVEL_ORDER: () => DIFFICULTY_LEVEL_ORDER,
  GRADUAL_RELEASE_INDICATORS: () => GRADUAL_RELEASE_INDICATORS,
  PedagogicalPipeline: () => PedagogicalPipeline,
  SUPPORT_INDICATORS: () => SUPPORT_INDICATORS,
  SUPPORT_TYPES: () => SUPPORT_TYPES,
  ScaffoldingEvaluator: () => ScaffoldingEvaluator,
  ZONE_ENGAGEMENT_MAP: () => ZONE_ENGAGEMENT_MAP,
  ZPDEvaluator: () => ZPDEvaluator,
  ZPD_ZONE_RANGES: () => ZPD_ZONE_RANGES,
  createBloomsAligner: () => createBloomsAligner,
  createBloomsPipeline: () => createBloomsPipeline,
  createLenientBloomsAligner: () => createLenientBloomsAligner,
  createLenientScaffoldingEvaluator: () => createLenientScaffoldingEvaluator,
  createLenientZPDEvaluator: () => createLenientZPDEvaluator,
  createPedagogicalPipeline: () => createPedagogicalPipeline,
  createScaffoldingEvaluator: () => createScaffoldingEvaluator,
  createScaffoldingPipeline: () => createScaffoldingPipeline,
  createStrictBloomsAligner: () => createStrictBloomsAligner,
  createStrictPedagogicalPipeline: () => createStrictPedagogicalPipeline,
  createStrictScaffoldingEvaluator: () => createStrictScaffoldingEvaluator,
  createStrictZPDEvaluator: () => createStrictZPDEvaluator,
  createZPDEvaluator: () => createZPDEvaluator,
  createZPDPipeline: () => createZPDPipeline,
  evaluatePedagogically: () => evaluatePedagogically,
  getBloomsLevelIndex: () => getBloomsLevelIndex,
  getDifficultyLevelIndex: () => getDifficultyLevelIndex
});
module.exports = __toCommonJS(index_exports);

// src/types.ts
var BLOOMS_LEVEL_ORDER = [
  "REMEMBER",
  "UNDERSTAND",
  "APPLY",
  "ANALYZE",
  "EVALUATE",
  "CREATE"
];
function getBloomsLevelIndex(level) {
  return BLOOMS_LEVEL_ORDER.indexOf(level);
}
var DIFFICULTY_LEVEL_ORDER = [
  "beginner",
  "intermediate",
  "advanced",
  "expert"
];
function getDifficultyLevelIndex(level) {
  return DIFFICULTY_LEVEL_ORDER.indexOf(level);
}
var DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG = {
  evaluators: ["blooms", "scaffolding", "zpd"],
  threshold: 70,
  parallel: true,
  timeoutMs: 1e4,
  requireStudentProfile: false
};

// src/blooms-aligner.ts
var BLOOMS_VERBS = {
  REMEMBER: [
    "list",
    "define",
    "identify",
    "recall",
    "name",
    "state",
    "describe",
    "recognize",
    "label",
    "match",
    "reproduce",
    "memorize",
    "repeat",
    "outline",
    "select",
    "tell",
    "locate",
    "find",
    "know",
    "remember"
  ],
  UNDERSTAND: [
    "explain",
    "summarize",
    "interpret",
    "classify",
    "compare",
    "contrast",
    "discuss",
    "distinguish",
    "illustrate",
    "paraphrase",
    "predict",
    "relate",
    "translate",
    "understand",
    "clarify",
    "infer",
    "generalize",
    "express",
    "review",
    "restate"
  ],
  APPLY: [
    "apply",
    "demonstrate",
    "solve",
    "use",
    "calculate",
    "complete",
    "construct",
    "execute",
    "implement",
    "modify",
    "operate",
    "practice",
    "schedule",
    "show",
    "utilize",
    "experiment",
    "compute",
    "illustrate",
    "produce",
    "employ"
  ],
  ANALYZE: [
    "analyze",
    "break down",
    "categorize",
    "compare",
    "contrast",
    "differentiate",
    "discriminate",
    "examine",
    "investigate",
    "organize",
    "question",
    "separate",
    "test",
    "deconstruct",
    "dissect",
    "inspect",
    "probe",
    "survey",
    "detect",
    "deduce"
  ],
  EVALUATE: [
    "evaluate",
    "assess",
    "critique",
    "defend",
    "judge",
    "justify",
    "prioritize",
    "rate",
    "recommend",
    "support",
    "value",
    "appraise",
    "argue",
    "decide",
    "determine",
    "estimate",
    "measure",
    "rank",
    "score",
    "validate"
  ],
  CREATE: [
    "create",
    "design",
    "develop",
    "formulate",
    "generate",
    "invent",
    "plan",
    "produce",
    "compose",
    "construct",
    "devise",
    "hypothesize",
    "imagine",
    "originate",
    "propose",
    "synthesize",
    "assemble",
    "build",
    "combine",
    "innovate"
  ]
};
var BLOOMS_ACTIVITIES = {
  REMEMBER: [
    "flashcard",
    "quiz recall",
    "matching exercise",
    "fill in the blank",
    "multiple choice recognition",
    "listing",
    "labeling diagram",
    "timeline ordering"
  ],
  UNDERSTAND: [
    "summary writing",
    "concept mapping",
    "explaining in own words",
    "classification exercise",
    "comparison chart",
    "paraphrasing",
    "example finding",
    "analogy making"
  ],
  APPLY: [
    "problem solving",
    "simulation",
    "hands-on exercise",
    "practical demonstration",
    "case study application",
    "role play",
    "experiment",
    "coding exercise"
  ],
  ANALYZE: [
    "case study analysis",
    "data interpretation",
    "pattern recognition",
    "cause and effect analysis",
    "comparative analysis",
    "error analysis",
    "systems analysis",
    "root cause analysis"
  ],
  EVALUATE: [
    "peer review",
    "critique writing",
    "debate",
    "rubric assessment",
    "decision making exercise",
    "priority ranking",
    "pro/con analysis",
    "recommendation writing"
  ],
  CREATE: [
    "project creation",
    "original design",
    "creative writing",
    "research proposal",
    "prototype building",
    "solution development",
    "hypothesis formulation",
    "innovation challenge"
  ]
};
var DEFAULT_BLOOMS_ALIGNER_CONFIG = {
  significanceThreshold: 10,
  acceptableVariance: 1,
  verbWeight: 0.6,
  activityWeight: 0.4,
  passingScore: 70
};
var BloomsAligner = class {
  name = "BloomsAligner";
  description = "Evaluates content alignment with Bloom's Taxonomy cognitive levels";
  config;
  constructor(config = {}) {
    this.config = { ...DEFAULT_BLOOMS_ALIGNER_CONFIG, ...config };
  }
  /**
   * Evaluate content for Bloom's alignment
   */
  async evaluate(content) {
    const startTime = Date.now();
    const targetLevel = content.targetBloomsLevel ?? "UNDERSTAND";
    const verbAnalysis = this.analyzeVerbs(content.content);
    const activityAnalysis = this.analyzeActivities(content.content);
    const detectedDistribution = this.calculateDistribution(
      verbAnalysis,
      activityAnalysis
    );
    const dominantLevel = this.findDominantLevel(detectedDistribution);
    const levelDistance = getBloomsLevelIndex(dominantLevel) - getBloomsLevelIndex(targetLevel);
    const alignmentStatus = this.determineAlignmentStatus(levelDistance);
    const score = this.calculateScore(
      detectedDistribution,
      targetLevel,
      alignmentStatus
    );
    const { issues, recommendations } = this.analyzeIssuesAndRecommendations(
      alignmentStatus,
      targetLevel,
      dominantLevel,
      detectedDistribution,
      verbAnalysis,
      activityAnalysis
    );
    const passed = score >= this.config.passingScore && (alignmentStatus === "aligned" || Math.abs(levelDistance) <= this.config.acceptableVariance);
    return {
      evaluatorName: "BloomsAligner",
      passed,
      score,
      confidence: this.calculateConfidence(verbAnalysis, activityAnalysis),
      issues,
      recommendations,
      processingTimeMs: Date.now() - startTime,
      analysis: {
        targetLevel,
        dominantLevel,
        alignmentStatus,
        levelDistance,
        verbCount: verbAnalysis.totalVerbs,
        activityCount: activityAnalysis.activityTypes.length
      },
      detectedDistribution,
      dominantLevel,
      targetLevel,
      alignmentStatus,
      levelDistance,
      verbAnalysis,
      activityAnalysis
    };
  }
  /**
   * Analyze cognitive verbs in content
   */
  analyzeVerbs(content) {
    const lowerContent = content.toLowerCase();
    const verbsByLevel = {
      REMEMBER: [],
      UNDERSTAND: [],
      APPLY: [],
      ANALYZE: [],
      EVALUATE: [],
      CREATE: []
    };
    let totalVerbs = 0;
    for (const level of BLOOMS_LEVEL_ORDER) {
      for (const verb of BLOOMS_VERBS[level]) {
        const regex = new RegExp(`\\b${verb}\\b`, "gi");
        const matches = lowerContent.match(regex);
        if (matches) {
          verbsByLevel[level].push(
            ...Array(matches.length).fill(verb)
          );
          totalVerbs += matches.length;
        }
      }
    }
    const dominantCategory = this.findDominantLevel(
      this.verbsToDistribution(verbsByLevel, totalVerbs)
    );
    return {
      verbsByLevel,
      totalVerbs,
      dominantCategory
    };
  }
  /**
   * Analyze learning activities in content
   */
  analyzeActivities(content) {
    const lowerContent = content.toLowerCase();
    const activityTypes = [];
    const activitiesByLevel = {
      REMEMBER: [],
      UNDERSTAND: [],
      APPLY: [],
      ANALYZE: [],
      EVALUATE: [],
      CREATE: []
    };
    for (const level of BLOOMS_LEVEL_ORDER) {
      for (const activity of BLOOMS_ACTIVITIES[level]) {
        if (lowerContent.includes(activity.toLowerCase())) {
          activityTypes.push(activity);
          activitiesByLevel[level].push(activity);
        }
      }
    }
    const hasHigherOrderActivities = activitiesByLevel.ANALYZE.length > 0 || activitiesByLevel.EVALUATE.length > 0 || activitiesByLevel.CREATE.length > 0;
    return {
      activityTypes,
      activitiesByLevel,
      hasHigherOrderActivities
    };
  }
  /**
   * Calculate Bloom's distribution from verb and activity analysis
   */
  calculateDistribution(verbAnalysis, activityAnalysis) {
    const distribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    const totalVerbs = verbAnalysis.totalVerbs || 1;
    const totalActivities = activityAnalysis.activityTypes.length || 1;
    for (const level of BLOOMS_LEVEL_ORDER) {
      const verbPercentage = verbAnalysis.verbsByLevel[level].length / totalVerbs * 100;
      const activityPercentage = activityAnalysis.activitiesByLevel[level].length / totalActivities * 100;
      distribution[level] = this.config.verbWeight * verbPercentage + this.config.activityWeight * activityPercentage;
    }
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const level of BLOOMS_LEVEL_ORDER) {
        distribution[level] = distribution[level] / total * 100;
      }
    } else {
      distribution.UNDERSTAND = 100;
    }
    return distribution;
  }
  /**
   * Convert verbs by level to distribution
   */
  verbsToDistribution(verbsByLevel, totalVerbs) {
    const distribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    if (totalVerbs === 0) {
      distribution.UNDERSTAND = 100;
      return distribution;
    }
    for (const level of BLOOMS_LEVEL_ORDER) {
      distribution[level] = verbsByLevel[level].length / totalVerbs * 100;
    }
    return distribution;
  }
  /**
   * Find dominant Bloom's level from distribution
   */
  findDominantLevel(distribution) {
    let maxLevel = "UNDERSTAND";
    let maxValue = 0;
    for (const level of BLOOMS_LEVEL_ORDER) {
      if (distribution[level] > maxValue) {
        maxValue = distribution[level];
        maxLevel = level;
      }
    }
    return maxLevel;
  }
  /**
   * Determine alignment status
   */
  determineAlignmentStatus(levelDistance) {
    if (Math.abs(levelDistance) <= this.config.acceptableVariance) {
      return "aligned";
    }
    if (levelDistance < 0) {
      return "below_target";
    }
    if (levelDistance > 0) {
      return "above_target";
    }
    return "mixed";
  }
  /**
   * Calculate alignment score
   */
  calculateScore(distribution, targetLevel, alignmentStatus) {
    let score = distribution[targetLevel];
    const targetIndex = getBloomsLevelIndex(targetLevel);
    if (targetIndex > 0) {
      const lowerLevel = BLOOMS_LEVEL_ORDER[targetIndex - 1];
      score += distribution[lowerLevel] * 0.5;
    }
    if (targetIndex < BLOOMS_LEVEL_ORDER.length - 1) {
      const higherLevel = BLOOMS_LEVEL_ORDER[targetIndex + 1];
      score += distribution[higherLevel] * 0.5;
    }
    if (alignmentStatus === "aligned") {
      score = Math.min(100, score * 1.1);
    }
    if (alignmentStatus === "below_target") {
      score = score * 0.8;
    }
    if (alignmentStatus === "above_target") {
      score = score * 0.9;
    }
    return Math.round(Math.min(100, Math.max(0, score)));
  }
  /**
   * Calculate confidence in the analysis
   */
  calculateConfidence(verbAnalysis, activityAnalysis) {
    const verbConfidence = Math.min(1, verbAnalysis.totalVerbs / 20);
    const activityConfidence = Math.min(
      1,
      activityAnalysis.activityTypes.length / 5
    );
    return (verbConfidence + activityConfidence) / 2;
  }
  /**
   * Analyze issues and generate recommendations
   */
  analyzeIssuesAndRecommendations(alignmentStatus, targetLevel, dominantLevel, distribution, verbAnalysis, activityAnalysis) {
    const issues = [];
    const recommendations = [];
    if (alignmentStatus === "below_target") {
      issues.push({
        type: "cognitive_level_mismatch",
        severity: "high",
        description: `Content is at ${dominantLevel} level but target is ${targetLevel}`,
        learningImpact: "Students may not develop the intended cognitive skills",
        suggestedFix: `Add more ${targetLevel} level activities and questions`
      });
      recommendations.push(
        `Incorporate more ${targetLevel} level verbs: ${BLOOMS_VERBS[targetLevel].slice(0, 5).join(", ")}`,
        `Add ${targetLevel} level activities: ${BLOOMS_ACTIVITIES[targetLevel].slice(0, 3).join(", ")}`
      );
    }
    if (alignmentStatus === "above_target") {
      issues.push({
        type: "cognitive_level_mismatch",
        severity: "medium",
        description: `Content is at ${dominantLevel} level but target is ${targetLevel}`,
        learningImpact: "Content may be too challenging for learning stage",
        suggestedFix: `Consider adding more foundational ${targetLevel} level content`
      });
      recommendations.push(
        `Balance higher-order activities with ${targetLevel} level exercises`,
        `Ensure prerequisite ${targetLevel} skills are addressed first`
      );
    }
    if (verbAnalysis.totalVerbs < 5) {
      issues.push({
        type: "low_verb_diversity",
        severity: "low",
        description: "Content has limited cognitive action verbs",
        learningImpact: "May lack clear learning directions",
        suggestedFix: "Add more explicit cognitive action verbs"
      });
      recommendations.push(
        `Add more explicit cognitive verbs to guide learning activities`
      );
    }
    if (getBloomsLevelIndex(targetLevel) >= 3 && !activityAnalysis.hasHigherOrderActivities) {
      issues.push({
        type: "missing_higher_order_activities",
        severity: "medium",
        description: "Target requires higher-order thinking but activities are lower-level",
        learningImpact: "Students may not develop critical thinking skills",
        suggestedFix: "Add analysis, evaluation, or creation activities"
      });
      recommendations.push(
        `Include higher-order thinking activities such as case studies, debates, or projects`
      );
    }
    const significantLevels = BLOOMS_LEVEL_ORDER.filter(
      (level) => distribution[level] >= this.config.significanceThreshold
    );
    if (significantLevels.length === 1 && significantLevels[0] !== targetLevel) {
      issues.push({
        type: "narrow_cognitive_focus",
        severity: "low",
        description: `Content heavily focused on ${significantLevels[0]} level only`,
        learningImpact: "May limit cognitive development range",
        suggestedFix: `Diversify activities to include more ${targetLevel} level content`
      });
    }
    return { issues, recommendations };
  }
};
function createBloomsAligner(config) {
  return new BloomsAligner(config);
}
function createStrictBloomsAligner() {
  return new BloomsAligner({
    acceptableVariance: 0,
    passingScore: 80
  });
}
function createLenientBloomsAligner() {
  return new BloomsAligner({
    acceptableVariance: 2,
    passingScore: 60
  });
}

// src/scaffolding-evaluator.ts
var SUPPORT_INDICATORS = {
  example: [
    "for example",
    "for instance",
    "such as",
    "like this",
    "consider this example",
    "here is an example",
    "let me illustrate",
    "to demonstrate",
    "e.g.",
    "sample",
    "demonstration"
  ],
  hint: [
    "hint:",
    "tip:",
    "remember that",
    "keep in mind",
    "note that",
    "think about",
    "consider",
    "clue:",
    "suggestion:",
    "try thinking"
  ],
  scaffold: [
    "first,",
    "then,",
    "next,",
    "finally,",
    "step 1",
    "step 2",
    "step 3",
    "let us start",
    "let's begin",
    "before we",
    "building on",
    "now that we"
  ],
  prompt: [
    "what do you think",
    "how would you",
    "why might",
    "can you explain",
    "try to",
    "your turn to",
    "now you try",
    "practice by",
    "attempt to"
  ],
  feedback: [
    "correct!",
    "well done",
    "great job",
    "not quite",
    "try again",
    "almost",
    "you got it",
    "that is right",
    "good thinking",
    "excellent"
  ],
  model: [
    "watch how",
    "i'll show you",
    "let me demonstrate",
    "observe as",
    "here's how",
    "follow along",
    "my approach",
    "the process is",
    "this is done by"
  ]
};
var GRADUAL_RELEASE_INDICATORS = {
  I_DO: [
    "i'll show",
    "let me demonstrate",
    "watch as",
    "here's how",
    "observe",
    "i will explain",
    "i'm going to",
    "demonstration",
    "modeling"
  ],
  WE_DO: [
    "let's try together",
    "work with me",
    "together we",
    "as a class",
    "guided practice",
    "let's do this",
    "we'll work through",
    "collaborate"
  ],
  YOU_DO_TOGETHER: [
    "with a partner",
    "in groups",
    "discuss with",
    "work together",
    "collaborative",
    "peer",
    "team exercise",
    "group activity"
  ],
  YOU_DO_ALONE: [
    "independently",
    "on your own",
    "by yourself",
    "individual",
    "solo",
    "try it yourself",
    "your turn",
    "now you",
    "practice independently"
  ]
};
var COMPLEXITY_INDICATORS = {
  low: [
    "basic",
    "simple",
    "introduction",
    "fundamental",
    "begin",
    "first",
    "easy",
    "straightforward"
  ],
  medium: [
    "building on",
    "extending",
    "applying",
    "combining",
    "intermediate",
    "develop",
    "expand"
  ],
  high: [
    "advanced",
    "complex",
    "sophisticated",
    "challenging",
    "integration",
    "synthesis",
    "expert",
    "nuanced"
  ]
};
var DEFAULT_SCAFFOLDING_CONFIG = {
  maxComplexityJump: 30,
  minPrerequisiteCoverage: 70,
  minSupportStructures: 2,
  passingScore: 70,
  requireGradualRelease: false
};
var ScaffoldingEvaluator = class {
  name = "ScaffoldingEvaluator";
  description = "Evaluates content for proper pedagogical scaffolding and progressive complexity";
  config;
  constructor(config = {}) {
    this.config = { ...DEFAULT_SCAFFOLDING_CONFIG, ...config };
  }
  /**
   * Evaluate content for scaffolding quality
   */
  async evaluate(content, studentProfile) {
    const startTime = Date.now();
    const complexityProgression = this.analyzeComplexityProgression(
      content,
      studentProfile
    );
    const prerequisiteCoverage = this.analyzePrerequisiteCoverage(
      content,
      studentProfile
    );
    const supportStructures = this.analyzeSupportStructures(content.content);
    const gradualRelease = this.analyzeGradualRelease(content.content);
    const properlyScaffolded = this.determineProperScaffolding(
      complexityProgression,
      prerequisiteCoverage,
      supportStructures,
      gradualRelease
    );
    const score = this.calculateScore(
      complexityProgression,
      prerequisiteCoverage,
      supportStructures,
      gradualRelease
    );
    const { issues, recommendations } = this.analyzeIssuesAndRecommendations(
      complexityProgression,
      prerequisiteCoverage,
      supportStructures,
      gradualRelease
    );
    const passed = score >= this.config.passingScore && properlyScaffolded;
    return {
      evaluatorName: "ScaffoldingEvaluator",
      passed,
      score,
      confidence: this.calculateConfidence(content, supportStructures),
      issues,
      recommendations,
      processingTimeMs: Date.now() - startTime,
      analysis: {
        complexityRange: `${complexityProgression.startingComplexity}-${complexityProgression.endingComplexity}`,
        supportCount: supportStructures.length,
        prerequisiteCoveragePercentage: prerequisiteCoverage.coveragePercentage,
        gradualReleasePhases: gradualRelease.phasesPresent
      },
      properlyScaffolded,
      complexityProgression,
      prerequisiteCoverage,
      supportStructures,
      gradualRelease
    };
  }
  /**
   * Analyze complexity progression through content
   */
  analyzeComplexityProgression(content, studentProfile) {
    const lowerContent = content.content.toLowerCase();
    const startingComplexity = this.estimateComplexity(
      lowerContent.slice(0, Math.floor(lowerContent.length / 3))
    );
    const endingComplexity = this.estimateComplexity(
      lowerContent.slice(-Math.floor(lowerContent.length / 3))
    );
    const complexityJumps = this.detectComplexityJumps(content);
    const curveType = this.determineCurveType(
      startingComplexity,
      endingComplexity,
      complexityJumps
    );
    let appropriate = true;
    if (studentProfile) {
      const studentLevel = getDifficultyLevelIndex(
        studentProfile.currentDifficultyLevel
      );
      const contentStartLevel = Math.floor(startingComplexity / 25);
      appropriate = Math.abs(contentStartLevel - studentLevel) <= 1;
    }
    const hasProblematicJumps = complexityJumps.some((j) => j.problematic);
    appropriate = appropriate && !hasProblematicJumps;
    return {
      appropriate,
      startingComplexity,
      endingComplexity,
      curveType,
      complexityJumps
    };
  }
  /**
   * Estimate complexity of text segment
   */
  estimateComplexity(text) {
    let score = 50;
    for (const indicator of COMPLEXITY_INDICATORS.low) {
      if (text.includes(indicator)) score -= 10;
    }
    for (const indicator of COMPLEXITY_INDICATORS.medium) {
      if (text.includes(indicator)) score += 5;
    }
    for (const indicator of COMPLEXITY_INDICATORS.high) {
      if (text.includes(indicator)) score += 15;
    }
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(" ").length, 0) / (sentences.length || 1);
    if (avgSentenceLength > 20) score += 10;
    if (avgSentenceLength > 30) score += 10;
    if (avgSentenceLength < 10) score -= 10;
    return Math.max(0, Math.min(100, score));
  }
  /**
   * Detect sudden complexity jumps in content
   */
  detectComplexityJumps(content) {
    const jumps = [];
    const text = content.content;
    const sections = text.split(/\n\n+|(?=#+\s)/).filter((s) => s.trim());
    let previousComplexity = 0;
    for (let i = 0; i < sections.length; i++) {
      const currentComplexity = this.estimateComplexity(
        sections[i].toLowerCase()
      );
      if (i > 0) {
        const magnitude = currentComplexity - previousComplexity;
        if (Math.abs(magnitude) > this.config.maxComplexityJump) {
          jumps.push({
            location: `Section ${i + 1}`,
            magnitude,
            problematic: magnitude > this.config.maxComplexityJump
          });
        }
      }
      previousComplexity = currentComplexity;
    }
    if (content.priorContent && content.priorContent.length > 0) {
      const lastPrior = content.priorContent[content.priorContent.length - 1];
      const priorComplexity = getDifficultyLevelIndex(lastPrior.difficulty) * 25 + getBloomsLevelIndex(lastPrior.bloomsLevel) * 10;
      const currentStartComplexity = this.estimateComplexity(
        text.slice(0, Math.floor(text.length / 3)).toLowerCase()
      );
      const sequenceJump = currentStartComplexity - priorComplexity;
      if (Math.abs(sequenceJump) > this.config.maxComplexityJump) {
        jumps.unshift({
          location: "Transition from prior content",
          magnitude: sequenceJump,
          problematic: sequenceJump > this.config.maxComplexityJump
        });
      }
    }
    return jumps;
  }
  /**
   * Determine complexity curve type
   */
  determineCurveType(start, end, jumps) {
    const diff = end - start;
    if (jumps.filter((j) => j.problematic).length > 1) {
      return "irregular";
    }
    if (Math.abs(diff) < 10) {
      return "flat";
    }
    if (jumps.length > 2) {
      return "stepped";
    }
    if (diff > 30) {
      return "exponential";
    }
    return "linear";
  }
  /**
   * Analyze prerequisite coverage
   */
  analyzePrerequisiteCoverage(content, studentProfile) {
    const required = content.prerequisites ?? [];
    const addressed = [];
    const assumed = [];
    const missing = [];
    const lowerContent = content.content.toLowerCase();
    for (const prereq of required) {
      const lowerPrereq = prereq.toLowerCase();
      if (lowerContent.includes(lowerPrereq) || lowerContent.includes(`understanding of ${lowerPrereq}`) || lowerContent.includes(`knowledge of ${lowerPrereq}`)) {
        addressed.push(prereq);
      } else if (lowerContent.includes(`assuming you know ${lowerPrereq}`) || lowerContent.includes(`prerequisite: ${lowerPrereq}`)) {
        assumed.push(prereq);
      } else {
        if (studentProfile && studentProfile.completedTopics.some(
          (t) => t.toLowerCase().includes(lowerPrereq)
        )) {
          assumed.push(prereq);
        } else {
          missing.push(prereq);
        }
      }
    }
    if (content.priorContent) {
      for (const prior of content.priorContent) {
        for (const concept of prior.conceptsIntroduced) {
          if (!addressed.includes(concept) && !assumed.includes(concept) && lowerContent.includes(concept.toLowerCase())) {
            addressed.push(concept);
          }
        }
      }
    }
    const coveragePercentage = required.length > 0 ? (addressed.length + assumed.length) / required.length * 100 : 100;
    return {
      required,
      addressed,
      assumed,
      missing,
      coveragePercentage
    };
  }
  /**
   * Analyze support structures in content
   */
  analyzeSupportStructures(content) {
    const structures = [];
    const lowerContent = content.toLowerCase();
    for (const [type, indicators] of Object.entries(SUPPORT_INDICATORS)) {
      for (const indicator of indicators) {
        if (lowerContent.includes(indicator)) {
          const index = lowerContent.indexOf(indicator);
          const lineNumber = lowerContent.slice(0, index).split("\n").length;
          structures.push({
            type,
            description: `${type} support found: "${indicator}"`,
            location: `Line ${lineNumber}`,
            effectiveness: this.estimateSupportEffectiveness(
              type,
              content,
              index
            )
          });
        }
      }
    }
    return structures;
  }
  /**
   * Estimate effectiveness of a support structure
   */
  estimateSupportEffectiveness(type, content, index) {
    const contextStart = Math.max(0, index - 100);
    const contextEnd = Math.min(content.length, index + 200);
    const context = content.slice(contextStart, contextEnd).toLowerCase();
    let effectiveness = 70;
    if (type === "example" && context.includes("step")) {
      effectiveness += 10;
    }
    if (type === "hint" && context.includes("try")) {
      effectiveness += 10;
    }
    if (type === "feedback" && (context.includes("because") || context.includes("why"))) {
      effectiveness += 15;
    }
    if (type === "model" && context.includes("observe")) {
      effectiveness += 10;
    }
    return Math.min(100, effectiveness);
  }
  /**
   * Analyze gradual release of responsibility
   */
  analyzeGradualRelease(content) {
    const lowerContent = content.toLowerCase();
    const phasesPresent = [];
    for (const [phase, indicators] of Object.entries(
      GRADUAL_RELEASE_INDICATORS
    )) {
      for (const indicator of indicators) {
        if (lowerContent.includes(indicator)) {
          if (!phasesPresent.includes(phase)) {
            phasesPresent.push(phase);
          }
          break;
        }
      }
    }
    const complete = phasesPresent.length >= 3;
    const teacherPhases = phasesPresent.filter(
      (p) => p === "I_DO" || p === "WE_DO"
    ).length;
    const studentPhases = phasesPresent.filter(
      (p) => p === "YOU_DO_TOGETHER" || p === "YOU_DO_ALONE"
    ).length;
    let balance = "balanced";
    if (teacherPhases > studentPhases + 1) {
      balance = "teacher-heavy";
    } else if (studentPhases > teacherPhases + 1) {
      balance = "student-heavy";
    }
    return {
      phasesPresent,
      complete,
      balance
    };
  }
  /**
   * Determine if content is properly scaffolded
   */
  determineProperScaffolding(complexityProgression, prerequisiteCoverage, supportStructures, gradualRelease) {
    if (!complexityProgression.appropriate) {
      return false;
    }
    if (prerequisiteCoverage.coveragePercentage < this.config.minPrerequisiteCoverage) {
      return false;
    }
    if (supportStructures.length < this.config.minSupportStructures) {
      return false;
    }
    if (this.config.requireGradualRelease && !gradualRelease.complete) {
      return false;
    }
    return true;
  }
  /**
   * Calculate scaffolding score
   */
  calculateScore(complexityProgression, prerequisiteCoverage, supportStructures, gradualRelease) {
    let score = 0;
    if (complexityProgression.appropriate) {
      score += 25;
      if (complexityProgression.curveType === "linear") {
        score += 5;
      } else if (complexityProgression.curveType === "stepped") {
        score += 5;
      }
    } else {
      score += 10;
    }
    score += prerequisiteCoverage.coveragePercentage / 100 * 25;
    const supportScore = Math.min(
      25,
      supportStructures.length * 5 + supportStructures.reduce((sum, s) => sum + s.effectiveness / 100, 0) * 5
    );
    score += supportScore;
    if (gradualRelease.complete) {
      score += 20;
    } else {
      score += gradualRelease.phasesPresent.length * 5;
    }
    return Math.round(Math.min(100, score));
  }
  /**
   * Calculate confidence in the analysis
   */
  calculateConfidence(content, supportStructures) {
    let confidence = 0.5;
    if (content.content.length > 500) confidence += 0.1;
    if (content.content.length > 1e3) confidence += 0.1;
    if (content.prerequisites && content.prerequisites.length > 0) {
      confidence += 0.1;
    }
    if (supportStructures.length >= 3) confidence += 0.1;
    if (supportStructures.length >= 5) confidence += 0.1;
    return Math.min(1, confidence);
  }
  /**
   * Analyze issues and generate recommendations
   */
  analyzeIssuesAndRecommendations(complexityProgression, prerequisiteCoverage, supportStructures, gradualRelease) {
    const issues = [];
    const recommendations = [];
    if (!complexityProgression.appropriate) {
      issues.push({
        type: "complexity_progression",
        severity: complexityProgression.complexityJumps.filter((j) => j.problematic).length > 2 ? "high" : "medium",
        description: "Complexity progression is not appropriate",
        learningImpact: "Students may struggle with sudden difficulty increases",
        suggestedFix: "Add transitional content to smooth complexity jumps"
      });
      recommendations.push(
        "Add bridging content between complex topics",
        "Introduce concepts more gradually"
      );
    }
    for (const jump of complexityProgression.complexityJumps.filter(
      (j) => j.problematic
    )) {
      issues.push({
        type: "complexity_jump",
        severity: jump.magnitude > 50 ? "high" : "medium",
        description: `Sudden complexity jump at ${jump.location} (magnitude: ${jump.magnitude})`,
        learningImpact: "Students may become confused or frustrated",
        suggestedFix: "Add intermediate explanations or examples"
      });
    }
    if (prerequisiteCoverage.missing.length > 0) {
      issues.push({
        type: "missing_prerequisites",
        severity: prerequisiteCoverage.missing.length > 2 ? "high" : "medium",
        description: `Missing prerequisites: ${prerequisiteCoverage.missing.join(", ")}`,
        learningImpact: "Students may lack foundational knowledge",
        suggestedFix: "Add brief explanations or links to prerequisite content"
      });
      recommendations.push(
        `Address missing prerequisites: ${prerequisiteCoverage.missing.join(", ")}`
      );
    }
    if (supportStructures.length < this.config.minSupportStructures) {
      issues.push({
        type: "insufficient_support",
        severity: supportStructures.length === 0 ? "high" : "medium",
        description: `Only ${supportStructures.length} support structures found`,
        learningImpact: "Students may not have enough guidance",
        suggestedFix: "Add examples, hints, or scaffolded activities"
      });
      recommendations.push(
        "Add more examples to illustrate concepts",
        "Include hints or prompts to guide learners"
      );
    }
    if (this.config.requireGradualRelease && !gradualRelease.complete) {
      issues.push({
        type: "incomplete_gradual_release",
        severity: "medium",
        description: "Content does not include all gradual release phases",
        learningImpact: "Students may not transition smoothly to independent practice",
        suggestedFix: "Add modeling, guided practice, and independent activities"
      });
      const missingPhases = [];
      if (!gradualRelease.phasesPresent.includes("I_DO")) {
        missingPhases.push("teacher modeling");
      }
      if (!gradualRelease.phasesPresent.includes("WE_DO")) {
        missingPhases.push("guided practice");
      }
      if (!gradualRelease.phasesPresent.includes("YOU_DO_ALONE")) {
        missingPhases.push("independent practice");
      }
      if (missingPhases.length > 0) {
        recommendations.push(`Add ${missingPhases.join(", ")} activities`);
      }
    }
    if (gradualRelease.balance !== "balanced") {
      issues.push({
        type: "unbalanced_release",
        severity: "low",
        description: `Gradual release is ${gradualRelease.balance}`,
        learningImpact: gradualRelease.balance === "teacher-heavy" ? "Students may not get enough practice" : "Students may not have enough scaffolding",
        suggestedFix: gradualRelease.balance === "teacher-heavy" ? "Add more student practice opportunities" : "Add more modeling and guided practice"
      });
    }
    return { issues, recommendations };
  }
};
function createScaffoldingEvaluator(config) {
  return new ScaffoldingEvaluator(config);
}
function createStrictScaffoldingEvaluator() {
  return new ScaffoldingEvaluator({
    maxComplexityJump: 20,
    minPrerequisiteCoverage: 80,
    minSupportStructures: 4,
    passingScore: 80,
    requireGradualRelease: true
  });
}
function createLenientScaffoldingEvaluator() {
  return new ScaffoldingEvaluator({
    maxComplexityJump: 40,
    minPrerequisiteCoverage: 50,
    minSupportStructures: 1,
    passingScore: 60,
    requireGradualRelease: false
  });
}

// src/zpd-evaluator.ts
var ZPD_ZONE_RANGES = {
  TOO_EASY: { min: 0, max: 20 },
  COMFORT_ZONE: { min: 20, max: 35 },
  ZPD_LOWER: { min: 35, max: 50 },
  ZPD_OPTIMAL: { min: 50, max: 70 },
  ZPD_UPPER: { min: 70, max: 85 },
  FRUSTRATION: { min: 85, max: 95 },
  UNREACHABLE: { min: 95, max: 100 }
};
var ZONE_ENGAGEMENT_MAP = {
  TOO_EASY: "bored",
  COMFORT_ZONE: "comfortable",
  ZPD_LOWER: "engaged",
  ZPD_OPTIMAL: "challenged",
  ZPD_UPPER: "challenged",
  FRUSTRATION: "frustrated",
  UNREACHABLE: "anxious"
};
var SUPPORT_TYPES = [
  "examples",
  "hints",
  "scaffolding",
  "feedback",
  "modeling",
  "guidance",
  "resources",
  "explanations"
];
var DEFAULT_ZPD_CONFIG = {
  targetZone: "ZPD_OPTIMAL",
  minChallengeScore: 35,
  maxChallengeScore: 85,
  minSupportAdequacy: 60,
  passingScore: 70,
  challengeWeight: 0.4,
  supportWeight: 0.35,
  personalizationWeight: 0.25
};
var ZPDEvaluator = class {
  name = "ZPDEvaluator";
  description = "Evaluates content fit within student's Zone of Proximal Development";
  config;
  constructor(config = {}) {
    this.config = { ...DEFAULT_ZPD_CONFIG, ...config };
  }
  /**
   * Evaluate content for ZPD fit
   */
  async evaluate(content, studentProfile) {
    const startTime = Date.now();
    const challengeLevel = this.analyzeChallengeLevel(content, studentProfile);
    const zpdZone = this.determineZPDZone(challengeLevel.score);
    const supportAdequacy = this.analyzeSupportAdequacy(
      content,
      challengeLevel
    );
    const engagementPrediction = this.predictEngagement(
      zpdZone,
      challengeLevel,
      supportAdequacy
    );
    const personalizationFit = this.analyzePersonalizationFit(
      content,
      studentProfile
    );
    const inZPD = this.isInZPD(zpdZone);
    const score = this.calculateScore(
      challengeLevel,
      supportAdequacy,
      personalizationFit,
      zpdZone
    );
    const { issues, recommendations } = this.analyzeIssuesAndRecommendations(
      zpdZone,
      challengeLevel,
      supportAdequacy,
      engagementPrediction,
      personalizationFit,
      studentProfile
    );
    const passed = score >= this.config.passingScore && inZPD;
    return {
      evaluatorName: "ZPDEvaluator",
      passed,
      score,
      confidence: this.calculateConfidence(studentProfile),
      issues,
      recommendations,
      processingTimeMs: Date.now() - startTime,
      analysis: {
        zpdZone,
        challengeScore: challengeLevel.score,
        supportScore: supportAdequacy.score,
        engagementPrediction: engagementPrediction.predictedState,
        personalizationScore: personalizationFit.score
      },
      inZPD,
      zpdZone,
      challengeLevel,
      supportAdequacy,
      engagementPrediction,
      personalizationFit
    };
  }
  /**
   * Analyze challenge level of content
   */
  analyzeChallengeLevel(content, studentProfile) {
    const factors = [];
    let totalChallenge = 0;
    const difficultyFactor = this.calculateDifficultyFactor(
      content,
      studentProfile
    );
    factors.push(difficultyFactor);
    totalChallenge += difficultyFactor.contribution;
    const bloomsFactor = this.calculateBloomsFactor(content, studentProfile);
    factors.push(bloomsFactor);
    totalChallenge += bloomsFactor.contribution;
    const prerequisiteFactor = this.calculatePrerequisiteFactor(
      content,
      studentProfile
    );
    factors.push(prerequisiteFactor);
    totalChallenge += prerequisiteFactor.contribution;
    const complexityFactor = this.calculateComplexityFactor(content);
    factors.push(complexityFactor);
    totalChallenge += complexityFactor.contribution;
    const score = Math.min(100, Math.max(0, totalChallenge / factors.length));
    const appropriate = score >= this.config.minChallengeScore && score <= this.config.maxChallengeScore;
    let recommendedAdjustment = "maintain";
    if (score < this.config.minChallengeScore) {
      recommendedAdjustment = "increase";
    } else if (score > this.config.maxChallengeScore) {
      recommendedAdjustment = "decrease";
    }
    return {
      score,
      appropriate,
      factors,
      recommendedAdjustment
    };
  }
  /**
   * Calculate difficulty factor
   */
  calculateDifficultyFactor(content, studentProfile) {
    const contentDifficulty = content.targetDifficulty ?? "intermediate";
    const contentDifficultyIndex = getDifficultyLevelIndex(contentDifficulty);
    let studentDifficultyIndex = 1;
    if (studentProfile) {
      studentDifficultyIndex = getDifficultyLevelIndex(
        studentProfile.currentDifficultyLevel
      );
    }
    const gap = contentDifficultyIndex - studentDifficultyIndex;
    const contribution = 50 + gap * 20;
    return {
      name: "difficulty_gap",
      contribution: Math.min(100, Math.max(0, contribution)),
      appropriate: Math.abs(gap) <= 1
    };
  }
  /**
   * Calculate Bloom's level factor
   */
  calculateBloomsFactor(content, studentProfile) {
    const contentBloomsLevel = content.targetBloomsLevel ?? "UNDERSTAND";
    const contentBloomsIndex = getBloomsLevelIndex(contentBloomsLevel);
    let studentBloomsIndex = 1;
    if (studentProfile && content.topic) {
      const demonstrated = studentProfile.demonstratedBloomsLevels[content.topic];
      if (demonstrated) {
        studentBloomsIndex = getBloomsLevelIndex(demonstrated);
      }
    }
    const gap = contentBloomsIndex - studentBloomsIndex;
    const contribution = 50 + gap * 15;
    return {
      name: "blooms_gap",
      contribution: Math.min(100, Math.max(0, contribution)),
      appropriate: gap >= 0 && gap <= 2
    };
  }
  /**
   * Calculate prerequisite factor
   */
  calculatePrerequisiteFactor(content, studentProfile) {
    if (!content.prerequisites || content.prerequisites.length === 0) {
      return {
        name: "prerequisite_coverage",
        contribution: 50,
        appropriate: true
      };
    }
    let coveredCount = 0;
    if (studentProfile) {
      for (const prereq of content.prerequisites) {
        const hasMastery = studentProfile.completedTopics.includes(prereq) || (studentProfile.masteryLevels[prereq]?.mastery ?? 0) >= 70;
        if (hasMastery) {
          coveredCount++;
        }
      }
    }
    const coverageRatio = coveredCount / content.prerequisites.length;
    const contribution = 100 - coverageRatio * 50;
    return {
      name: "prerequisite_coverage",
      contribution: Math.min(100, Math.max(0, contribution)),
      appropriate: coverageRatio >= 0.7
    };
  }
  /**
   * Calculate content complexity factor
   */
  calculateComplexityFactor(content) {
    const text = content.content;
    let complexity = 50;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(" ").length, 0) / (sentences.length || 1);
    if (avgSentenceLength > 25) complexity += 15;
    if (avgSentenceLength > 35) complexity += 10;
    if (avgSentenceLength < 10) complexity -= 15;
    const technicalPatterns = /\b\w{10,}\b/g;
    const technicalMatches = text.match(technicalPatterns);
    if (technicalMatches && technicalMatches.length > 10) {
      complexity += 10;
    }
    if (content.learningObjectives) {
      if (content.learningObjectives.length > 5) complexity += 10;
      if (content.learningObjectives.length > 8) complexity += 10;
    }
    return {
      name: "content_complexity",
      contribution: Math.min(100, Math.max(0, complexity)),
      appropriate: complexity >= 40 && complexity <= 75
    };
  }
  /**
   * Determine ZPD zone based on challenge score
   */
  determineZPDZone(challengeScore) {
    for (const [zone, range] of Object.entries(ZPD_ZONE_RANGES)) {
      if (challengeScore >= range.min && challengeScore < range.max) {
        return zone;
      }
    }
    return challengeScore >= 95 ? "UNREACHABLE" : "TOO_EASY";
  }
  /**
   * Check if content is within ZPD
   */
  isInZPD(zone) {
    return ["ZPD_LOWER", "ZPD_OPTIMAL", "ZPD_UPPER"].includes(zone);
  }
  /**
   * Analyze support adequacy
   */
  analyzeSupportAdequacy(content, challengeLevel) {
    const lowerContent = content.content.toLowerCase();
    const supportPresent = [];
    const supportMissing = [];
    for (const supportType of SUPPORT_TYPES) {
      if (lowerContent.includes(supportType)) {
        supportPresent.push(supportType);
      } else {
        supportMissing.push(supportType);
      }
    }
    const supportIndicators = {
      examples: ["for example", "such as", "e.g.", "consider this"],
      hints: ["hint:", "tip:", "remember that", "keep in mind"],
      scaffolding: ["step by step", "first,", "then,", "next,"],
      feedback: ["correct!", "well done", "try again", "not quite"],
      modeling: ["let me show", "watch how", "here's how"],
      guidance: ["try to", "your turn", "now you", "practice"]
    };
    for (const [type, indicators] of Object.entries(supportIndicators)) {
      for (const indicator of indicators) {
        if (lowerContent.includes(indicator) && !supportPresent.includes(type)) {
          supportPresent.push(type);
          const missingIndex = supportMissing.indexOf(type);
          if (missingIndex !== -1) {
            supportMissing.splice(missingIndex, 1);
          }
          break;
        }
      }
    }
    const baseScore = supportPresent.length / SUPPORT_TYPES.length * 100;
    let adjustedScore = baseScore;
    if (challengeLevel.score > 70) {
      adjustedScore = baseScore * 0.8;
    } else if (challengeLevel.score < 40) {
      adjustedScore = Math.min(100, baseScore * 1.2);
    }
    const score = Math.round(adjustedScore);
    const adequate = score >= this.config.minSupportAdequacy;
    let challengeSupportBalance = "balanced";
    if (challengeLevel.score > 70 && score < 60) {
      challengeSupportBalance = "too_little_support";
    } else if (challengeLevel.score < 40 && score > 80) {
      challengeSupportBalance = "too_much_support";
    }
    return {
      score,
      adequate,
      supportPresent,
      supportMissing,
      challengeSupportBalance
    };
  }
  /**
   * Predict student engagement
   */
  predictEngagement(zpdZone, challengeLevel, supportAdequacy) {
    const predictedState = ZONE_ENGAGEMENT_MAP[zpdZone];
    let score = 50;
    if (this.isInZPD(zpdZone)) {
      score = 80;
      if (zpdZone === "ZPD_OPTIMAL") score = 90;
    } else if (zpdZone === "COMFORT_ZONE") {
      score = 65;
    } else if (zpdZone === "TOO_EASY") {
      score = 40;
    } else if (zpdZone === "FRUSTRATION") {
      score = 35;
    } else if (zpdZone === "UNREACHABLE") {
      score = 20;
    }
    if (supportAdequacy.adequate) {
      score = Math.min(100, score + 5);
    } else {
      score = Math.max(0, score - 10);
    }
    let disengagementRisk = 0;
    if (zpdZone === "TOO_EASY") disengagementRisk = 0.6;
    if (zpdZone === "FRUSTRATION") disengagementRisk = 0.7;
    if (zpdZone === "UNREACHABLE") disengagementRisk = 0.9;
    if (supportAdequacy.challengeSupportBalance === "too_little_support") {
      disengagementRisk = Math.min(1, disengagementRisk + 0.2);
    }
    const engagementFactors = [];
    if (this.isInZPD(zpdZone)) {
      engagementFactors.push("Content is appropriately challenging");
    }
    if (supportAdequacy.adequate) {
      engagementFactors.push("Adequate support provided");
    }
    if (challengeLevel.appropriate) {
      engagementFactors.push("Challenge level matches student ability");
    }
    if (zpdZone === "TOO_EASY") {
      engagementFactors.push("Content may be too easy, risking boredom");
    }
    if (zpdZone === "FRUSTRATION" || zpdZone === "UNREACHABLE") {
      engagementFactors.push("Content is too difficult, risking frustration");
    }
    return {
      score,
      predictedState,
      disengagementRisk,
      engagementFactors
    };
  }
  /**
   * Analyze personalization fit
   */
  analyzePersonalizationFit(content, studentProfile) {
    const opportunities = [];
    let score = 50;
    if (!studentProfile) {
      opportunities.push({
        area: "Student Profile",
        suggestion: "Gather student data to enable personalization",
        expectedImpact: "high"
      });
      return {
        score: 40,
        assessment: "poor",
        opportunities
      };
    }
    const contentDifficulty = content.targetDifficulty ?? "intermediate";
    if (contentDifficulty === studentProfile.currentDifficultyLevel) {
      score += 15;
    } else {
      opportunities.push({
        area: "Difficulty Level",
        suggestion: `Adjust content difficulty to match student level (${studentProfile.currentDifficultyLevel})`,
        expectedImpact: "high"
      });
    }
    const hasGaps = studentProfile.knowledgeGaps.length > 0;
    if (hasGaps && content.topic) {
      const relevantGaps = studentProfile.knowledgeGaps.filter(
        (gap) => gap.topicId === content.topic
      );
      if (relevantGaps.length > 0) {
        opportunities.push({
          area: "Knowledge Gaps",
          suggestion: `Address knowledge gaps: ${relevantGaps.map((g) => g.concept).join(", ")}`,
          expectedImpact: "high"
        });
      } else {
        score += 10;
      }
    }
    if (studentProfile.learningVelocity === "slow") {
      opportunities.push({
        area: "Pacing",
        suggestion: "Consider slower pacing with more examples",
        expectedImpact: "medium"
      });
    } else if (studentProfile.learningVelocity === "accelerated") {
      opportunities.push({
        area: "Pacing",
        suggestion: "Consider faster pacing with more challenge",
        expectedImpact: "medium"
      });
      score += 5;
    }
    if (studentProfile.recentPerformance.engagementLevel === "low") {
      opportunities.push({
        area: "Engagement",
        suggestion: "Add interactive elements to boost engagement",
        expectedImpact: "high"
      });
    } else {
      score += 10;
    }
    if (studentProfile.recentPerformance.trend === "declining") {
      opportunities.push({
        area: "Support Level",
        suggestion: "Increase scaffolding and support for struggling learner",
        expectedImpact: "high"
      });
    } else if (studentProfile.recentPerformance.trend === "improving") {
      score += 10;
    }
    let assessment = "fair";
    if (score >= 80) assessment = "excellent";
    else if (score >= 65) assessment = "good";
    else if (score < 50) assessment = "poor";
    return {
      score: Math.min(100, score),
      assessment,
      opportunities
    };
  }
  /**
   * Calculate overall ZPD score
   */
  calculateScore(challengeLevel, supportAdequacy, personalizationFit, zpdZone) {
    let score = this.config.challengeWeight * (challengeLevel.appropriate ? 85 : 50) + this.config.supportWeight * supportAdequacy.score + this.config.personalizationWeight * personalizationFit.score;
    if (zpdZone === "ZPD_OPTIMAL") {
      score = Math.min(100, score * 1.1);
    } else if (this.isInZPD(zpdZone)) {
      score = Math.min(100, score * 1.05);
    }
    if (!this.isInZPD(zpdZone)) {
      if (zpdZone === "FRUSTRATION" || zpdZone === "UNREACHABLE") {
        score *= 0.7;
      } else {
        score *= 0.85;
      }
    }
    return Math.round(score);
  }
  /**
   * Calculate confidence in the analysis
   */
  calculateConfidence(studentProfile) {
    if (!studentProfile) {
      return 0.4;
    }
    let confidence = 0.6;
    if (studentProfile.completedTopics.length > 5) confidence += 0.1;
    if (studentProfile.recentPerformance.assessmentCount > 5) confidence += 0.1;
    if (Object.keys(studentProfile.masteryLevels).length > 3) confidence += 0.1;
    if (Object.keys(studentProfile.demonstratedBloomsLevels).length > 3) {
      confidence += 0.1;
    }
    return Math.min(1, confidence);
  }
  /**
   * Analyze issues and generate recommendations
   */
  analyzeIssuesAndRecommendations(zpdZone, challengeLevel, supportAdequacy, engagementPrediction, personalizationFit, studentProfile) {
    const issues = [];
    const recommendations = [];
    if (zpdZone === "TOO_EASY") {
      issues.push({
        type: "zpd_mismatch",
        severity: "high",
        description: "Content is too easy for the student",
        learningImpact: "Student may become bored and disengage",
        suggestedFix: "Increase complexity and challenge level"
      });
      recommendations.push(
        "Add more challenging exercises",
        "Increase cognitive level to match student ability"
      );
    }
    if (zpdZone === "COMFORT_ZONE") {
      issues.push({
        type: "zpd_mismatch",
        severity: "medium",
        description: "Content is slightly below optimal challenge level",
        learningImpact: "Limited growth potential",
        suggestedFix: "Add some stretch goals or advanced extensions"
      });
      recommendations.push("Include optional challenge activities");
    }
    if (zpdZone === "FRUSTRATION") {
      issues.push({
        type: "zpd_mismatch",
        severity: "high",
        description: "Content is too difficult for the student",
        learningImpact: "Student may become frustrated and give up",
        suggestedFix: "Add more scaffolding or reduce complexity"
      });
      recommendations.push(
        "Add more examples and guided practice",
        "Break down complex concepts into smaller steps",
        "Ensure prerequisites are covered"
      );
    }
    if (zpdZone === "UNREACHABLE") {
      issues.push({
        type: "zpd_mismatch",
        severity: "critical",
        description: "Content is far beyond student ability",
        learningImpact: "Learning is nearly impossible at this level",
        suggestedFix: "Start with prerequisite content first"
      });
      recommendations.push(
        "Provide prerequisite content before this material",
        "Consider adaptive pathways based on student readiness"
      );
    }
    for (const factor of challengeLevel.factors) {
      if (!factor.appropriate) {
        issues.push({
          type: "challenge_factor",
          severity: "medium",
          description: `Challenge factor "${factor.name}" is not appropriate`,
          learningImpact: "May affect learning effectiveness",
          suggestedFix: `Adjust ${factor.name} to better match student level`
        });
      }
    }
    if (!supportAdequacy.adequate) {
      issues.push({
        type: "insufficient_support",
        severity: challengeLevel.score > 70 ? "high" : "medium",
        description: "Insufficient learning support provided",
        learningImpact: "Students may struggle without adequate guidance",
        suggestedFix: `Add more support: ${supportAdequacy.supportMissing.slice(0, 3).join(", ")}`
      });
      recommendations.push(
        `Add missing support elements: ${supportAdequacy.supportMissing.slice(0, 3).join(", ")}`
      );
    }
    if (supportAdequacy.challengeSupportBalance === "too_little_support") {
      issues.push({
        type: "support_balance",
        severity: "high",
        description: "High challenge with insufficient support",
        learningImpact: "Students may become frustrated",
        suggestedFix: "Add more scaffolding, examples, and hints"
      });
    }
    if (engagementPrediction.disengagementRisk > 0.5) {
      issues.push({
        type: "engagement_risk",
        severity: engagementPrediction.disengagementRisk > 0.7 ? "high" : "medium",
        description: `High disengagement risk (${Math.round(engagementPrediction.disengagementRisk * 100)}%)`,
        learningImpact: "Student likely to disengage from learning",
        suggestedFix: "Adjust content to ZPD optimal zone"
      });
    }
    for (const opportunity of personalizationFit.opportunities) {
      if (opportunity.expectedImpact === "high") {
        recommendations.push(opportunity.suggestion);
      }
    }
    if (studentProfile) {
      if (studentProfile.learningVelocity === "slow") {
        recommendations.push("Provide more practice opportunities and repetition");
      }
      if (studentProfile.recentPerformance.trend === "declining") {
        recommendations.push("Consider diagnostic assessment to identify issues");
      }
    }
    return { issues, recommendations };
  }
};
function createZPDEvaluator(config) {
  return new ZPDEvaluator(config);
}
function createStrictZPDEvaluator() {
  return new ZPDEvaluator({
    targetZone: "ZPD_OPTIMAL",
    minChallengeScore: 50,
    maxChallengeScore: 70,
    minSupportAdequacy: 70,
    passingScore: 80
  });
}
function createLenientZPDEvaluator() {
  return new ZPDEvaluator({
    targetZone: "ZPD_LOWER",
    minChallengeScore: 25,
    maxChallengeScore: 90,
    minSupportAdequacy: 50,
    passingScore: 60
  });
}

// src/pipeline.ts
var PedagogicalPipeline = class {
  config;
  bloomsAligner;
  scaffoldingEvaluator;
  zpdEvaluator;
  logger;
  constructor(config = {}) {
    this.config = {
      ...DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG,
      evaluators: config.evaluators ?? DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG.evaluators,
      threshold: config.threshold ?? DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG.threshold,
      parallel: config.parallel ?? DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG.parallel,
      timeoutMs: config.timeoutMs ?? DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG.timeoutMs,
      requireStudentProfile: config.requireStudentProfile ?? DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG.requireStudentProfile
    };
    this.bloomsAligner = createBloomsAligner(config.bloomsConfig);
    this.scaffoldingEvaluator = createScaffoldingEvaluator(
      config.scaffoldingConfig
    );
    this.zpdEvaluator = createZPDEvaluator(config.zpdConfig);
    this.logger = config.logger;
  }
  /**
   * Evaluate content through the pipeline
   */
  async evaluate(content, studentProfile) {
    const startTime = Date.now();
    if (this.config.requireStudentProfile && !studentProfile) {
      this.logger?.warn("Student profile required but not provided");
      return this.createErrorResult(
        "Student profile is required for ZPD evaluation",
        startTime
      );
    }
    const evaluatorResults = {};
    const evaluatorsRun = [];
    try {
      if (this.config.parallel) {
        await this.runParallel(content, studentProfile, evaluatorResults, evaluatorsRun);
      } else {
        await this.runSequential(content, studentProfile, evaluatorResults, evaluatorsRun);
      }
    } catch (error) {
      this.logger?.error("Pipeline evaluation error", error);
      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown error",
        startTime
      );
    }
    return this.aggregateResults(
      evaluatorResults,
      evaluatorsRun,
      startTime,
      studentProfile !== void 0
    );
  }
  /**
   * Run evaluators in parallel
   */
  async runParallel(content, studentProfile, evaluatorResults, evaluatorsRun) {
    const promises = [];
    if (this.config.evaluators.includes("blooms")) {
      promises.push(
        this.runWithTimeout(
          async () => {
            evaluatorResults.blooms = await this.bloomsAligner.evaluate(
              content
            );
            evaluatorsRun.push("blooms");
          },
          "blooms"
        )
      );
    }
    if (this.config.evaluators.includes("scaffolding")) {
      promises.push(
        this.runWithTimeout(
          async () => {
            evaluatorResults.scaffolding = await this.scaffoldingEvaluator.evaluate(content, studentProfile);
            evaluatorsRun.push("scaffolding");
          },
          "scaffolding"
        )
      );
    }
    if (this.config.evaluators.includes("zpd")) {
      promises.push(
        this.runWithTimeout(
          async () => {
            evaluatorResults.zpd = await this.zpdEvaluator.evaluate(
              content,
              studentProfile
            );
            evaluatorsRun.push("zpd");
          },
          "zpd"
        )
      );
    }
    await Promise.all(promises);
  }
  /**
   * Run evaluators sequentially
   */
  async runSequential(content, studentProfile, evaluatorResults, evaluatorsRun) {
    if (this.config.evaluators.includes("blooms")) {
      await this.runWithTimeout(async () => {
        evaluatorResults.blooms = await this.bloomsAligner.evaluate(
          content
        );
        evaluatorsRun.push("blooms");
      }, "blooms");
    }
    if (this.config.evaluators.includes("scaffolding")) {
      await this.runWithTimeout(async () => {
        evaluatorResults.scaffolding = await this.scaffoldingEvaluator.evaluate(content, studentProfile);
        evaluatorsRun.push("scaffolding");
      }, "scaffolding");
    }
    if (this.config.evaluators.includes("zpd")) {
      await this.runWithTimeout(async () => {
        evaluatorResults.zpd = await this.zpdEvaluator.evaluate(
          content,
          studentProfile
        );
        evaluatorsRun.push("zpd");
      }, "zpd");
    }
  }
  /**
   * Run an evaluator with timeout
   */
  async runWithTimeout(fn, evaluatorName) {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Evaluator ${evaluatorName} timed out`));
      }, this.config.timeoutMs);
    });
    try {
      await Promise.race([fn(), timeout]);
    } catch (error) {
      this.logger?.error(`Error in ${evaluatorName} evaluator`, error);
      throw error;
    }
  }
  /**
   * Aggregate results from all evaluators
   */
  aggregateResults(evaluatorResults, evaluatorsRun, startTime, studentProfileUsed) {
    const allIssues = [];
    if (evaluatorResults.blooms) {
      allIssues.push(...evaluatorResults.blooms.issues);
    }
    if (evaluatorResults.scaffolding) {
      allIssues.push(...evaluatorResults.scaffolding.issues);
    }
    if (evaluatorResults.zpd) {
      allIssues.push(...evaluatorResults.zpd.issues);
    }
    const allRecommendations = /* @__PURE__ */ new Set();
    if (evaluatorResults.blooms) {
      evaluatorResults.blooms.recommendations.forEach(
        (r) => allRecommendations.add(r)
      );
    }
    if (evaluatorResults.scaffolding) {
      evaluatorResults.scaffolding.recommendations.forEach(
        (r) => allRecommendations.add(r)
      );
    }
    if (evaluatorResults.zpd) {
      evaluatorResults.zpd.recommendations.forEach(
        (r) => allRecommendations.add(r)
      );
    }
    const scores = [];
    if (evaluatorResults.blooms) scores.push(evaluatorResults.blooms.score);
    if (evaluatorResults.scaffolding) scores.push(evaluatorResults.scaffolding.score);
    if (evaluatorResults.zpd) scores.push(evaluatorResults.zpd.score);
    const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const passed = overallScore >= this.config.threshold && (evaluatorResults.blooms?.passed ?? true) && (evaluatorResults.scaffolding?.passed ?? true) && (evaluatorResults.zpd?.passed ?? true);
    return {
      passed,
      overallScore,
      evaluatorResults,
      allIssues,
      allRecommendations: Array.from(allRecommendations),
      metadata: {
        totalTimeMs: Date.now() - startTime,
        evaluatorsRun,
        studentProfileUsed
      }
    };
  }
  /**
   * Create an error result
   */
  createErrorResult(errorMessage, startTime) {
    return {
      passed: false,
      overallScore: 0,
      evaluatorResults: {},
      allIssues: [
        {
          type: "pipeline_error",
          severity: "critical",
          description: errorMessage,
          learningImpact: "Evaluation could not be completed"
        }
      ],
      allRecommendations: ["Fix the evaluation error and retry"],
      metadata: {
        totalTimeMs: Date.now() - startTime,
        evaluatorsRun: [],
        studentProfileUsed: false
      }
    };
  }
  /**
   * Get individual evaluators for direct access
   */
  getEvaluators() {
    return {
      blooms: this.bloomsAligner,
      scaffolding: this.scaffoldingEvaluator,
      zpd: this.zpdEvaluator
    };
  }
};
function createPedagogicalPipeline(config) {
  return new PedagogicalPipeline(config);
}
function createBloomsPipeline(config) {
  return new PedagogicalPipeline({
    evaluators: ["blooms"],
    bloomsConfig: config
  });
}
function createScaffoldingPipeline(config) {
  return new PedagogicalPipeline({
    evaluators: ["scaffolding"],
    scaffoldingConfig: config
  });
}
function createZPDPipeline(config) {
  return new PedagogicalPipeline({
    evaluators: ["zpd"],
    zpdConfig: config,
    requireStudentProfile: true
  });
}
function createStrictPedagogicalPipeline() {
  return new PedagogicalPipeline({
    threshold: 80,
    requireStudentProfile: true,
    bloomsConfig: {
      acceptableVariance: 0,
      passingScore: 80
    },
    scaffoldingConfig: {
      maxComplexityJump: 20,
      minPrerequisiteCoverage: 80,
      passingScore: 80
    },
    zpdConfig: {
      targetZone: "ZPD_OPTIMAL",
      minSupportAdequacy: 70,
      passingScore: 80
    }
  });
}
async function evaluatePedagogically(content, studentProfile, config) {
  const pipeline = createPedagogicalPipeline(config);
  return pipeline.evaluate(content, studentProfile);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BLOOMS_ACTIVITIES,
  BLOOMS_LEVEL_ORDER,
  BLOOMS_VERBS,
  BloomsAligner,
  COMPLEXITY_INDICATORS,
  DEFAULT_BLOOMS_ALIGNER_CONFIG,
  DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG,
  DEFAULT_SCAFFOLDING_CONFIG,
  DEFAULT_ZPD_CONFIG,
  DIFFICULTY_LEVEL_ORDER,
  GRADUAL_RELEASE_INDICATORS,
  PedagogicalPipeline,
  SUPPORT_INDICATORS,
  SUPPORT_TYPES,
  ScaffoldingEvaluator,
  ZONE_ENGAGEMENT_MAP,
  ZPDEvaluator,
  ZPD_ZONE_RANGES,
  createBloomsAligner,
  createBloomsPipeline,
  createLenientBloomsAligner,
  createLenientScaffoldingEvaluator,
  createLenientZPDEvaluator,
  createPedagogicalPipeline,
  createScaffoldingEvaluator,
  createScaffoldingPipeline,
  createStrictBloomsAligner,
  createStrictPedagogicalPipeline,
  createStrictScaffoldingEvaluator,
  createStrictZPDEvaluator,
  createZPDEvaluator,
  createZPDPipeline,
  evaluatePedagogically,
  getBloomsLevelIndex,
  getDifficultyLevelIndex
});
