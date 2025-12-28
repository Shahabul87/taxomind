// src/types/depth-analysis.types.ts
var WEBB_DOK_DESCRIPTORS = {
  1: {
    name: "Recall",
    description: "Recall of information such as facts, definitions, terms, or simple procedures",
    keywords: ["recall", "identify", "recognize", "list", "name", "define", "match", "quote", "memorize", "label"],
    bloomsMapping: ["REMEMBER"]
  },
  2: {
    name: "Skill/Concept",
    description: "Use of information, conceptual knowledge, and procedures",
    keywords: ["summarize", "interpret", "classify", "compare", "organize", "estimate", "predict", "modify", "explain", "describe"],
    bloomsMapping: ["UNDERSTAND", "APPLY"]
  },
  3: {
    name: "Strategic Thinking",
    description: "Reasoning, planning, and using evidence to solve problems",
    keywords: ["analyze", "investigate", "formulate", "hypothesize", "differentiate", "conclude", "critique", "assess", "justify", "develop"],
    bloomsMapping: ["ANALYZE", "EVALUATE"]
  },
  4: {
    name: "Extended Thinking",
    description: "Complex reasoning, planning, developing, and thinking over extended time",
    keywords: ["design", "create", "synthesize", "apply concepts", "connect", "critique across", "prove", "research", "develop original"],
    bloomsMapping: ["CREATE"]
  }
};
var COURSE_TYPE_PROFILES = {
  foundational: {
    type: "foundational",
    description: "Introductory courses for beginners with no prior knowledge",
    idealBloomsDistribution: {
      REMEMBER: 25,
      UNDERSTAND: 35,
      APPLY: 25,
      ANALYZE: 10,
      EVALUATE: 3,
      CREATE: 2
    },
    idealDOKDistribution: { level1: 30, level2: 50, level3: 15, level4: 5 },
    primaryObjective: "Build fundamental understanding",
    targetAudience: "Complete beginners"
  },
  intermediate: {
    type: "intermediate",
    description: "Building on foundational knowledge with practical applications",
    idealBloomsDistribution: {
      REMEMBER: 10,
      UNDERSTAND: 20,
      APPLY: 35,
      ANALYZE: 20,
      EVALUATE: 10,
      CREATE: 5
    },
    idealDOKDistribution: { level1: 15, level2: 40, level3: 35, level4: 10 },
    primaryObjective: "Develop practical skills",
    targetAudience: "Learners with basic knowledge"
  },
  advanced: {
    type: "advanced",
    description: "Deep exploration with critical analysis and evaluation",
    idealBloomsDistribution: {
      REMEMBER: 5,
      UNDERSTAND: 10,
      APPLY: 20,
      ANALYZE: 30,
      EVALUATE: 25,
      CREATE: 10
    },
    idealDOKDistribution: { level1: 5, level2: 25, level3: 45, level4: 25 },
    primaryObjective: "Master complex concepts",
    targetAudience: "Experienced practitioners"
  },
  professional: {
    type: "professional",
    description: "Industry-focused with real-world problem solving",
    idealBloomsDistribution: {
      REMEMBER: 5,
      UNDERSTAND: 15,
      APPLY: 30,
      ANALYZE: 25,
      EVALUATE: 15,
      CREATE: 10
    },
    idealDOKDistribution: { level1: 10, level2: 30, level3: 40, level4: 20 },
    primaryObjective: "Prepare for professional practice",
    targetAudience: "Working professionals"
  },
  creative: {
    type: "creative",
    description: "Focus on innovation, design, and original creation",
    idealBloomsDistribution: {
      REMEMBER: 5,
      UNDERSTAND: 10,
      APPLY: 15,
      ANALYZE: 15,
      EVALUATE: 20,
      CREATE: 35
    },
    idealDOKDistribution: { level1: 5, level2: 20, level3: 30, level4: 45 },
    primaryObjective: "Foster creativity and innovation",
    targetAudience: "Creative professionals and enthusiasts"
  },
  technical: {
    type: "technical",
    description: "Hands-on technical skills with implementation focus",
    idealBloomsDistribution: {
      REMEMBER: 10,
      UNDERSTAND: 15,
      APPLY: 40,
      ANALYZE: 20,
      EVALUATE: 10,
      CREATE: 5
    },
    idealDOKDistribution: { level1: 15, level2: 45, level3: 30, level4: 10 },
    primaryObjective: "Build technical competency",
    targetAudience: "Technical practitioners"
  },
  theoretical: {
    type: "theoretical",
    description: "Academic focus on concepts, theories, and research",
    idealBloomsDistribution: {
      REMEMBER: 15,
      UNDERSTAND: 25,
      APPLY: 10,
      ANALYZE: 30,
      EVALUATE: 15,
      CREATE: 5
    },
    idealDOKDistribution: { level1: 20, level2: 30, level3: 40, level4: 10 },
    primaryObjective: "Deep theoretical understanding",
    targetAudience: "Researchers and academics"
  }
};
var BLOOMS_KEYWORD_MAP = [
  {
    level: "REMEMBER",
    keywords: ["define", "identify", "list", "name", "recall", "recognize", "state", "describe", "memorize", "repeat", "label", "match", "quote", "select"],
    weight: 1
  },
  {
    level: "UNDERSTAND",
    keywords: ["explain", "summarize", "interpret", "classify", "compare", "contrast", "discuss", "distinguish", "predict", "paraphrase", "translate", "illustrate", "exemplify"],
    weight: 2
  },
  {
    level: "APPLY",
    keywords: ["apply", "demonstrate", "solve", "use", "implement", "execute", "carry out", "practice", "calculate", "complete", "show", "modify", "operate", "experiment"],
    weight: 3
  },
  {
    level: "ANALYZE",
    keywords: ["analyze", "examine", "investigate", "categorize", "differentiate", "distinguish", "organize", "deconstruct", "attribute", "outline", "structure", "integrate", "compare", "contrast"],
    weight: 4
  },
  {
    level: "EVALUATE",
    keywords: ["evaluate", "judge", "critique", "justify", "assess", "defend", "support", "argue", "prioritize", "recommend", "rate", "select", "validate", "appraise"],
    weight: 5
  },
  {
    level: "CREATE",
    keywords: ["create", "design", "develop", "formulate", "construct", "invent", "compose", "generate", "produce", "plan", "devise", "synthesize", "build", "author"],
    weight: 6
  }
];
function getBloomsWeight(level) {
  const mapping = BLOOMS_KEYWORD_MAP.find((m) => m.level === level);
  return mapping?.weight ?? 1;
}
function bloomsToDOK(bloomsLevel) {
  const mapping = {
    REMEMBER: 1,
    UNDERSTAND: 2,
    APPLY: 2,
    ANALYZE: 3,
    EVALUATE: 3,
    CREATE: 4
  };
  return mapping[bloomsLevel];
}

// src/analyzers/webb-dok-analyzer.ts
var WebbDOKAnalyzer = class {
  /**
   * Analyze content to determine Webb's DOK level
   */
  analyzeContent(content, bloomsLevel) {
    const normalizedContent = content.toLowerCase().trim();
    const levelScores = {
      1: 0,
      2: 0,
      3: 0,
      4: 0
    };
    const matchedIndicators = {
      1: [],
      2: [],
      3: [],
      4: []
    };
    for (const [levelKey, descriptor2] of Object.entries(WEBB_DOK_DESCRIPTORS)) {
      const level = Number(levelKey);
      for (const keyword of descriptor2.keywords) {
        const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, "gi");
        const matches = normalizedContent.match(regex);
        if (matches) {
          levelScores[level] += matches.length * level;
          matchedIndicators[level].push(keyword);
        }
      }
    }
    if (bloomsLevel) {
      const expectedDOK = bloomsToDOK(bloomsLevel);
      levelScores[expectedDOK] += 5;
    }
    let primaryLevel = 1;
    let maxScore = 0;
    for (const [levelKey, score] of Object.entries(levelScores)) {
      const level = Number(levelKey);
      if (score > maxScore) {
        maxScore = score;
        primaryLevel = level;
      }
    }
    const totalScore = Object.values(levelScores).reduce((sum, s) => sum + s, 0);
    const confidence = totalScore > 0 ? Math.min(maxScore / totalScore * 100, 100) : 50;
    const descriptor = WEBB_DOK_DESCRIPTORS[primaryLevel];
    return {
      level: primaryLevel,
      levelName: descriptor.name,
      indicators: matchedIndicators[primaryLevel].slice(0, 5),
      // Top 5 indicators
      bloomsCorrelation: bloomsLevel ?? descriptor.bloomsMapping[0],
      confidence: Math.round(confidence)
    };
  }
  /**
   * Analyze multiple content pieces and return distribution
   */
  analyzeDistribution(contents) {
    const distribution = {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0
    };
    if (contents.length === 0) {
      return distribution;
    }
    const levelCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const item of contents) {
      const analysis = this.analyzeContent(item.content, item.bloomsLevel);
      levelCounts[analysis.level]++;
    }
    const total = contents.length;
    distribution.level1 = Math.round(levelCounts[1] / total * 100);
    distribution.level2 = Math.round(levelCounts[2] / total * 100);
    distribution.level3 = Math.round(levelCounts[3] / total * 100);
    distribution.level4 = Math.round(levelCounts[4] / total * 100);
    return distribution;
  }
  /**
   * Calculate DOK depth score (0-100)
   */
  calculateDOKDepth(distribution) {
    const weights = { level1: 1, level2: 2, level3: 3, level4: 4 };
    const weightedSum = distribution.level1 * weights.level1 + distribution.level2 * weights.level2 + distribution.level3 * weights.level3 + distribution.level4 * weights.level4;
    const totalPercentage = distribution.level1 + distribution.level2 + distribution.level3 + distribution.level4;
    if (totalPercentage === 0) return 0;
    return Math.round(weightedSum / totalPercentage * 25);
  }
  /**
   * Determine DOK balance
   */
  determineDOKBalance(distribution) {
    const recallHeavy = distribution.level1 > 40;
    const skillFocused = distribution.level2 > 50;
    const strategic = distribution.level3 + distribution.level4 > 45;
    if (recallHeavy) return "recall-heavy";
    if (skillFocused) return "skill-focused";
    if (strategic) return "strategic";
    return "well-balanced";
  }
  /**
   * Get recommendations based on DOK analysis
   */
  getRecommendations(distribution) {
    const recommendations = [];
    if (distribution.level1 > 30) {
      recommendations.push("Reduce recall-focused content; add more application and analysis activities");
    }
    if (distribution.level3 < 20) {
      recommendations.push("Include more strategic thinking tasks like case studies and problem-solving scenarios");
    }
    if (distribution.level4 < 10) {
      recommendations.push("Add extended thinking projects that require research, synthesis, and original creation");
    }
    if (distribution.level2 > 50) {
      recommendations.push("Balance skill-based content with more complex analytical challenges");
    }
    if (distribution.level1 + distribution.level2 > 70) {
      recommendations.push("Increase cognitive complexity by adding DOK Level 3 and 4 activities");
    }
    return recommendations;
  }
  /**
   * Convert Bloom's distribution to estimated DOK distribution
   */
  bloomsToEstimatedDOK(bloomsDistribution) {
    return {
      level1: bloomsDistribution.REMEMBER ?? bloomsDistribution.remember ?? 0,
      level2: (bloomsDistribution.UNDERSTAND ?? bloomsDistribution.understand ?? 0) + (bloomsDistribution.APPLY ?? bloomsDistribution.apply ?? 0),
      level3: (bloomsDistribution.ANALYZE ?? bloomsDistribution.analyze ?? 0) + (bloomsDistribution.EVALUATE ?? bloomsDistribution.evaluate ?? 0),
      level4: bloomsDistribution.CREATE ?? bloomsDistribution.create ?? 0
    };
  }
  /**
   * Validate alignment between Bloom's and DOK
   */
  validateBloomsDOKAlignment(bloomsLevel, dokLevel) {
    const expectedDOK = bloomsToDOK(bloomsLevel);
    const aligned = expectedDOK === dokLevel;
    let message;
    if (aligned) {
      message = `Bloom's level ${bloomsLevel} correctly aligns with DOK Level ${dokLevel}`;
    } else {
      message = `Potential misalignment: Bloom's ${bloomsLevel} typically maps to DOK Level ${expectedDOK}, but content suggests DOK Level ${dokLevel}`;
    }
    return { aligned, expectedDOK, message };
  }
  /**
   * Escape special regex characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
};
var webbDOKAnalyzer = new WebbDOKAnalyzer();

// src/analyzers/assessment-quality-analyzer.ts
var AssessmentQualityAnalyzer = class {
  IDEAL_BLOOMS_COVERAGE = [
    "REMEMBER",
    "UNDERSTAND",
    "APPLY",
    "ANALYZE",
    "EVALUATE",
    "CREATE"
  ];
  /**
   * Perform comprehensive assessment quality analysis
   */
  analyzeAssessments(exams) {
    const allQuestions = exams.flatMap((exam) => exam.questions);
    if (allQuestions.length === 0) {
      return this.getEmptyMetrics();
    }
    const questionVariety = this.analyzeQuestionVariety(allQuestions);
    const difficultyProgression = this.analyzeDifficultyProgression(allQuestions);
    const bloomsCoverage = this.analyzeBloomsCoverage(allQuestions);
    const feedbackQuality = this.analyzeFeedbackQuality(allQuestions);
    const distractorAnalysis = this.analyzeDistractors(allQuestions);
    const overallScore = this.calculateOverallScore({
      questionVariety,
      difficultyProgression,
      bloomsCoverage,
      feedbackQuality,
      distractorAnalysis
    });
    return {
      overallScore,
      questionVariety,
      difficultyProgression,
      bloomsCoverage,
      feedbackQuality,
      distractorAnalysis
    };
  }
  /**
   * Analyze variety of question types
   */
  analyzeQuestionVariety(questions) {
    const typeDistribution = {};
    for (const question of questions) {
      const type = question.type;
      typeDistribution[type] = (typeDistribution[type] ?? 0) + 1;
    }
    const total = questions.length;
    for (const type of Object.keys(typeDistribution)) {
      typeDistribution[type] = Math.round(typeDistribution[type] / total * 100);
    }
    const uniqueTypes = Object.keys(typeDistribution).length;
    let score;
    if (uniqueTypes >= 5) {
      score = 100;
    } else if (uniqueTypes >= 4) {
      score = 85;
    } else if (uniqueTypes >= 3) {
      score = 70;
    } else if (uniqueTypes >= 2) {
      score = 50;
    } else {
      score = 30;
    }
    const maxPercentage = Math.max(...Object.values(typeDistribution));
    if (maxPercentage > 60) {
      score = Math.max(score - 15, 20);
    }
    const recommendation = this.getVarietyRecommendation(uniqueTypes, typeDistribution);
    return {
      score,
      typeDistribution,
      uniqueTypes,
      recommendation
    };
  }
  /**
   * Analyze difficulty progression across questions
   */
  analyzeDifficultyProgression(questions) {
    const difficulties = questions.map((q, index) => {
      if (q.difficulty) return q.difficulty;
      if (q.bloomsLevel) {
        const bloomsOrder = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
        return bloomsOrder.indexOf(q.bloomsLevel) + 1;
      }
      return Math.min(Math.ceil((index + 1) / (questions.length / 5)), 5);
    });
    const averageDifficulty = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;
    const pattern = this.determineDifficultyPattern(difficulties);
    let score;
    let isAppropriate;
    switch (pattern) {
      case "ascending":
        score = 95;
        isAppropriate = true;
        break;
      case "plateaued":
        score = 75;
        isAppropriate = averageDifficulty >= 2.5 && averageDifficulty <= 3.5;
        break;
      case "descending":
        score = 45;
        isAppropriate = false;
        break;
      case "random":
      default:
        score = 60;
        isAppropriate = false;
    }
    const recommendation = this.getDifficultyRecommendation(pattern, averageDifficulty);
    return {
      score,
      pattern,
      averageDifficulty: Math.round(averageDifficulty * 10) / 10,
      isAppropriate,
      recommendation
    };
  }
  /**
   * Analyze Bloom's Taxonomy coverage
   */
  analyzeBloomsCoverage(questions) {
    const distribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    const coveredLevels = /* @__PURE__ */ new Set();
    for (const question of questions) {
      const level = question.bloomsLevel ?? this.inferBloomsLevel(question.text);
      distribution[level]++;
      coveredLevels.add(level);
    }
    const total = questions.length;
    for (const level of Object.keys(distribution)) {
      distribution[level] = Math.round(distribution[level] / total * 100);
    }
    const missingLevels = this.IDEAL_BLOOMS_COVERAGE.filter((level) => !coveredLevels.has(level));
    const coverageRatio = coveredLevels.size / this.IDEAL_BLOOMS_COVERAGE.length;
    let score = Math.round(coverageRatio * 100);
    const higherOrderCoverage = (distribution.ANALYZE > 0 ? 1 : 0) + (distribution.EVALUATE > 0 ? 1 : 0) + (distribution.CREATE > 0 ? 1 : 0);
    if (higherOrderCoverage === 3) {
      score = Math.min(score + 10, 100);
    }
    const recommendation = this.getBloomsCoverageRecommendation(missingLevels, distribution);
    return {
      score,
      coveredLevels: Array.from(coveredLevels),
      missingLevels,
      distribution,
      recommendation
    };
  }
  /**
   * Analyze quality of feedback and explanations
   */
  analyzeFeedbackQuality(questions) {
    let hasExplanations = false;
    let explanationCount = 0;
    let totalExplanationLength = 0;
    let remediationCount = 0;
    for (const question of questions) {
      const hasExp = Boolean(question.explanation) || Boolean(question.feedback);
      if (hasExp) {
        hasExplanations = true;
        explanationCount++;
        const expLength = (question.explanation?.length ?? 0) + (question.feedback?.length ?? 0);
        totalExplanationLength += expLength;
        const expText = `${question.explanation ?? ""} ${question.feedback ?? ""}`.toLowerCase();
        if (expText.includes("review") || expText.includes("refer to") || expText.includes("see chapter") || expText.includes("revisit")) {
          remediationCount++;
        }
      }
    }
    const explanationRatio = questions.length > 0 ? explanationCount / questions.length : 0;
    const avgLength = explanationCount > 0 ? totalExplanationLength / explanationCount : 0;
    let explanationDepth;
    if (avgLength === 0) {
      explanationDepth = "none";
    } else if (avgLength < 50) {
      explanationDepth = "basic";
    } else if (avgLength < 150) {
      explanationDepth = "detailed";
    } else {
      explanationDepth = "comprehensive";
    }
    const providesRemediation = remediationCount > questions.length * 0.2;
    let score = 0;
    if (hasExplanations) score += 30;
    if (explanationRatio > 0.5) score += 20;
    if (explanationRatio > 0.8) score += 15;
    if (explanationDepth === "detailed" || explanationDepth === "comprehensive") score += 20;
    if (providesRemediation) score += 15;
    const recommendation = this.getFeedbackRecommendation(hasExplanations, explanationDepth, providesRemediation);
    return {
      score,
      hasExplanations,
      explanationDepth,
      providesRemediation,
      recommendation
    };
  }
  /**
   * Analyze distractor quality for multiple choice questions
   */
  analyzeDistractors(questions) {
    const mcQuestions = questions.filter((q) => q.type === "multiple_choice" && q.options);
    if (mcQuestions.length === 0) {
      return null;
    }
    const plausibilityScores = [];
    const commonMistakes = [];
    for (const question of mcQuestions) {
      const options = question.options ?? [];
      const distractors = options.filter((opt) => !opt.isCorrect);
      if (distractors.length === 0) continue;
      const correctOption = options.find((opt) => opt.isCorrect);
      const correctLength = correctOption?.text.length ?? 0;
      let plausibilitySum = 0;
      for (const distractor of distractors) {
        const lengthRatio = correctLength > 0 ? distractor.text.length / correctLength : 1;
        const lengthScore = 1 - Math.abs(1 - lengthRatio);
        if (distractor.explanation) {
          commonMistakes.push(distractor.explanation);
        }
        plausibilitySum += lengthScore * 100;
      }
      plausibilityScores.push(plausibilitySum / distractors.length);
    }
    const averagePlausibility = plausibilityScores.length > 0 ? Math.round(plausibilityScores.reduce((sum, s) => sum + s, 0) / plausibilityScores.length) : 50;
    const discriminationIndex = averagePlausibility > 60 ? 0.7 : averagePlausibility > 40 ? 0.5 : 0.3;
    const score = Math.round((averagePlausibility + discriminationIndex * 100) / 2);
    const recommendation = this.getDistractorRecommendation(averagePlausibility, discriminationIndex);
    return {
      score,
      averagePlausibility,
      discriminationIndex,
      commonMistakes: Array.from(new Set(commonMistakes)).slice(0, 5),
      recommendation
    };
  }
  /**
   * Infer Bloom's level from question text
   */
  inferBloomsLevel(text) {
    const lowerText = text.toLowerCase();
    if (/\b(create|design|develop|formulate|construct|invent|compose|generate|produce)\b/.test(lowerText)) {
      return "CREATE";
    }
    if (/\b(evaluate|judge|critique|justify|assess|defend|support|argue|prioritize)\b/.test(lowerText)) {
      return "EVALUATE";
    }
    if (/\b(analyze|examine|investigate|categorize|differentiate|distinguish|organize)\b/.test(lowerText)) {
      return "ANALYZE";
    }
    if (/\b(apply|demonstrate|solve|use|implement|execute|practice|calculate)\b/.test(lowerText)) {
      return "APPLY";
    }
    if (/\b(explain|summarize|interpret|classify|compare|contrast|discuss|predict)\b/.test(lowerText)) {
      return "UNDERSTAND";
    }
    return "REMEMBER";
  }
  /**
   * Determine difficulty pattern
   */
  determineDifficultyPattern(difficulties) {
    if (difficulties.length < 3) return "plateaued";
    let ascendingCount = 0;
    let descendingCount = 0;
    for (let i = 1; i < difficulties.length; i++) {
      if (difficulties[i] > difficulties[i - 1]) {
        ascendingCount++;
      } else if (difficulties[i] < difficulties[i - 1]) {
        descendingCount++;
      }
    }
    const transitions = difficulties.length - 1;
    const ascendingRatio = ascendingCount / transitions;
    const descendingRatio = descendingCount / transitions;
    if (ascendingRatio > 0.6) return "ascending";
    if (descendingRatio > 0.6) return "descending";
    if (ascendingRatio < 0.3 && descendingRatio < 0.3) return "plateaued";
    return "random";
  }
  /**
   * Calculate overall score
   */
  calculateOverallScore(metrics) {
    const weights = {
      questionVariety: 0.2,
      difficultyProgression: 0.2,
      bloomsCoverage: 0.25,
      feedbackQuality: 0.2,
      distractorAnalysis: 0.15
    };
    let weightedSum = metrics.questionVariety.score * weights.questionVariety + metrics.difficultyProgression.score * weights.difficultyProgression + metrics.bloomsCoverage.score * weights.bloomsCoverage + metrics.feedbackQuality.score * weights.feedbackQuality;
    if (metrics.distractorAnalysis) {
      weightedSum += metrics.distractorAnalysis.score * weights.distractorAnalysis;
    } else {
      const redistributedWeight = weights.distractorAnalysis / 4;
      weightedSum = metrics.questionVariety.score * (weights.questionVariety + redistributedWeight) + metrics.difficultyProgression.score * (weights.difficultyProgression + redistributedWeight) + metrics.bloomsCoverage.score * (weights.bloomsCoverage + redistributedWeight) + metrics.feedbackQuality.score * (weights.feedbackQuality + redistributedWeight);
    }
    return Math.round(weightedSum);
  }
  /**
   * Get empty metrics for courses without assessments
   */
  getEmptyMetrics() {
    return {
      overallScore: 0,
      questionVariety: {
        score: 0,
        typeDistribution: {},
        uniqueTypes: 0,
        recommendation: "Add assessments to evaluate student learning"
      },
      difficultyProgression: {
        score: 0,
        pattern: "random",
        averageDifficulty: 0,
        isAppropriate: false,
        recommendation: "Create questions with increasing difficulty"
      },
      bloomsCoverage: {
        score: 0,
        coveredLevels: [],
        missingLevels: this.IDEAL_BLOOMS_COVERAGE,
        distribution: {
          REMEMBER: 0,
          UNDERSTAND: 0,
          APPLY: 0,
          ANALYZE: 0,
          EVALUATE: 0,
          CREATE: 0
        },
        recommendation: "Add questions covering all Bloom&apos;s Taxonomy levels"
      },
      feedbackQuality: {
        score: 0,
        hasExplanations: false,
        explanationDepth: "none",
        providesRemediation: false,
        recommendation: "Add explanations and feedback to all questions"
      },
      distractorAnalysis: null
    };
  }
  /**
   * Recommendation generators
   */
  getVarietyRecommendation(uniqueTypes, distribution) {
    if (uniqueTypes < 3) {
      return "Diversify question types to include essays, coding challenges, or matching exercises";
    }
    const dominant = Object.entries(distribution).sort(([, a], [, b]) => b - a)[0];
    if (dominant && dominant[1] > 60) {
      return `Reduce reliance on ${dominant[0]} questions; balance with other formats`;
    }
    return "Good question variety; consider adding scenario-based questions";
  }
  getDifficultyRecommendation(pattern, avgDifficulty) {
    if (pattern === "descending") {
      return "Reorder questions from easier to harder for better learning progression";
    }
    if (pattern === "random") {
      return "Structure questions with gradual difficulty increase";
    }
    if (avgDifficulty < 2) {
      return "Include more challenging questions to stretch learner capabilities";
    }
    if (avgDifficulty > 4) {
      return "Add foundational questions to build confidence before complex ones";
    }
    return "Difficulty progression is appropriate";
  }
  getBloomsCoverageRecommendation(missingLevels, distribution) {
    if (missingLevels.length > 3) {
      return `Add questions at ${missingLevels.slice(0, 3).join(", ")} levels for comprehensive assessment`;
    }
    if (missingLevels.includes("CREATE") || missingLevels.includes("EVALUATE")) {
      return "Include higher-order thinking questions requiring creation or critical evaluation";
    }
    if (distribution.REMEMBER > 40) {
      return "Reduce memorization questions; add more application and analysis tasks";
    }
    return "Bloom&apos;s coverage is adequate; consider balancing higher-order levels";
  }
  getFeedbackRecommendation(hasExplanations, depth, hasRemediation) {
    if (!hasExplanations) {
      return "Add explanations to all questions to support learning from mistakes";
    }
    if (depth === "basic") {
      return "Expand explanations to include why incorrect answers are wrong";
    }
    if (!hasRemediation) {
      return "Include remediation links or suggestions for incorrect responses";
    }
    return "Feedback quality is strong; consider adding video explanations";
  }
  getDistractorRecommendation(plausibility, discrimination) {
    if (plausibility < 50) {
      return "Improve distractor plausibility by making them more realistic wrong answers";
    }
    if (discrimination < 0.5) {
      return "Ensure distractors address common misconceptions";
    }
    return "Distractor quality is good; regularly update based on student responses";
  }
};
var assessmentQualityAnalyzer = new AssessmentQualityAnalyzer();

// src/analyzers/course-type-detector.ts
var CourseTypeDetector = class {
  TYPE_KEYWORDS = {
    foundational: [
      "introduction",
      "basics",
      "fundamentals",
      "beginner",
      "getting started",
      "primer",
      "essentials",
      "overview",
      "101",
      "first steps",
      "learn"
    ],
    intermediate: [
      "intermediate",
      "practical",
      "hands-on",
      "applied",
      "skills",
      "building",
      "developing",
      "next level",
      "beyond basics"
    ],
    advanced: [
      "advanced",
      "expert",
      "deep dive",
      "mastery",
      "complex",
      "specialized",
      "in-depth",
      "comprehensive",
      "senior"
    ],
    professional: [
      "professional",
      "enterprise",
      "industry",
      "career",
      "certification",
      "workplace",
      "business",
      "corporate",
      "leadership"
    ],
    creative: [
      "creative",
      "design",
      "art",
      "innovation",
      "portfolio",
      "create",
      "build",
      "make",
      "craft",
      "project-based"
    ],
    technical: [
      "technical",
      "coding",
      "programming",
      "development",
      "engineering",
      "implementation",
      "system",
      "software",
      "data",
      "algorithm"
    ],
    theoretical: [
      "theory",
      "concept",
      "research",
      "academic",
      "scientific",
      "principles",
      "framework",
      "methodology",
      "analysis"
    ]
  };
  CATEGORY_TYPE_MAPPING = {
    "Technology": ["technical", "intermediate", "advanced"],
    "Programming": ["technical", "intermediate"],
    "Data Science": ["technical", "advanced", "theoretical"],
    "Business": ["professional", "intermediate"],
    "Marketing": ["professional", "creative"],
    "Design": ["creative", "intermediate"],
    "Art": ["creative", "foundational"],
    "Science": ["theoretical", "advanced"],
    "Mathematics": ["theoretical", "technical"],
    "Language": ["foundational", "intermediate"],
    "Personal Development": ["foundational", "professional"],
    "Health & Fitness": ["foundational", "intermediate"],
    "Music": ["creative", "foundational"],
    "Photography": ["creative", "technical"],
    "Writing": ["creative", "foundational"]
  };
  /**
   * Detect course type based on metadata
   */
  detectCourseType(metadata) {
    const scores = {
      foundational: 0,
      intermediate: 0,
      advanced: 0,
      professional: 0,
      creative: 0,
      technical: 0,
      theoretical: 0
    };
    this.analyzeText(metadata.title, scores, 3);
    this.analyzeText(metadata.description, scores, 2);
    for (const objective of metadata.learningObjectives) {
      this.analyzeText(objective, scores, 1);
    }
    this.analyzeText(metadata.targetAudience, scores, 2);
    this.scoreByCategoryMapping(metadata.category, scores);
    this.scoreByStructure(metadata, scores);
    this.scoreByActionVerbs(metadata.learningObjectives, scores);
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const normalizedScores = [];
    for (const [type, score] of Object.entries(scores)) {
      normalizedScores.push({
        type,
        confidence: totalScore > 0 ? Math.round(score / totalScore * 100) : 0
      });
    }
    normalizedScores.sort((a, b) => b.confidence - a.confidence);
    const detectedType = normalizedScores[0].type;
    const confidence = normalizedScores[0].confidence;
    const profile = COURSE_TYPE_PROFILES[detectedType];
    return {
      detectedType,
      confidence,
      alternativeTypes: normalizedScores.slice(1, 3),
      profile,
      idealDistribution: profile.idealBloomsDistribution,
      idealDOKDistribution: profile.idealDOKDistribution,
      recommendations: this.generateTypeRecommendations(detectedType, confidence)
    };
  }
  /**
   * Compare current distribution with ideal for course type
   */
  compareWithIdeal(currentDistribution, courseType) {
    const idealDistribution = COURSE_TYPE_PROFILES[courseType].idealBloomsDistribution;
    const gapAnalysis = {};
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    const priorities = [];
    for (const level of levels) {
      const current = currentDistribution[level];
      const ideal = idealDistribution[level];
      const gap = ideal - current;
      const absGap = Math.abs(gap);
      let action;
      if (gap > 10) {
        action = `Increase ${level.toLowerCase()} content significantly (+${Math.round(gap)}%)`;
      } else if (gap > 5) {
        action = `Add more ${level.toLowerCase()} activities (+${Math.round(gap)}%)`;
      } else if (gap < -10) {
        action = `Reduce ${level.toLowerCase()} content (${Math.round(gap)}%)`;
      } else if (gap < -5) {
        action = `Consider reducing ${level.toLowerCase()} activities (${Math.round(gap)}%)`;
      } else {
        action = "Maintain current level";
      }
      gapAnalysis[level] = { current, ideal, gap, action };
      priorities.push({ level, absGap });
    }
    priorities.sort((a, b) => b.absGap - a.absGap);
    const priority = priorities.map((p) => p.level);
    const totalAbsGap = priorities.reduce((sum, p) => sum + p.absGap, 0);
    const avgAbsGap = totalAbsGap / levels.length;
    const alignmentScore = Math.max(0, Math.round(100 - avgAbsGap));
    return {
      currentDistribution,
      idealDistribution,
      gapAnalysis,
      alignmentScore,
      priority
    };
  }
  /**
   * Get adaptive targets based on current state and course type
   */
  getAdaptiveTargets(currentDistribution, courseType, improvementRate = 0.3) {
    const idealDistribution = COURSE_TYPE_PROFILES[courseType].idealBloomsDistribution;
    const adaptiveTargets = {};
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    for (const level of levels) {
      const current = currentDistribution[level];
      const ideal = idealDistribution[level];
      const gap = ideal - current;
      adaptiveTargets[level] = Math.round(current + gap * improvementRate);
    }
    const total = Object.values(adaptiveTargets).reduce((sum, v) => sum + v, 0);
    if (total !== 100) {
      const adjustment = (100 - total) / levels.length;
      for (const level of levels) {
        adaptiveTargets[level] = Math.round(adaptiveTargets[level] + adjustment);
      }
    }
    return adaptiveTargets;
  }
  /**
   * Analyze text for type keywords
   */
  analyzeText(text, scores, weight) {
    const lowerText = text.toLowerCase();
    for (const [type, keywords] of Object.entries(this.TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          scores[type] += weight;
        }
      }
    }
  }
  /**
   * Score based on category mapping
   */
  scoreByCategoryMapping(category, scores) {
    for (const [cat, types] of Object.entries(this.CATEGORY_TYPE_MAPPING)) {
      if (category.toLowerCase().includes(cat.toLowerCase())) {
        for (let i = 0; i < types.length; i++) {
          scores[types[i]] += 3 - i;
        }
        break;
      }
    }
  }
  /**
   * Score based on course structure
   */
  scoreByStructure(metadata, scores) {
    if (metadata.chaptersCount > 10) {
      scores.advanced += 2;
      scores.professional += 1;
    } else if (metadata.chaptersCount < 5) {
      scores.foundational += 2;
    }
    if (metadata.hasProjects) {
      scores.creative += 3;
      scores.technical += 2;
    }
    if (metadata.hasCodingExercises) {
      scores.technical += 4;
    }
    if (metadata.prerequisites.length > 2) {
      scores.advanced += 3;
      scores.professional += 2;
    } else if (metadata.prerequisites.length === 0) {
      scores.foundational += 2;
    }
    if (metadata.averageSectionDuration > 30) {
      scores.advanced += 2;
      scores.theoretical += 2;
    } else if (metadata.averageSectionDuration < 10) {
      scores.foundational += 2;
    }
  }
  /**
   * Score based on action verbs in objectives
   */
  scoreByActionVerbs(objectives, scores) {
    const verbPatterns = {
      foundational: /\b(identify|list|name|recall|define|describe)\b/gi,
      intermediate: /\b(apply|use|implement|demonstrate|solve|calculate)\b/gi,
      advanced: /\b(analyze|evaluate|critique|synthesize|compare|assess)\b/gi,
      creative: /\b(create|design|develop|compose|construct|produce|innovate)\b/gi,
      technical: /\b(code|program|build|debug|deploy|implement|configure)\b/gi,
      theoretical: /\b(theorize|research|hypothesize|conceptualize|formulate)\b/gi,
      professional: /\b(manage|lead|coordinate|optimize|streamline|execute)\b/gi
    };
    for (const objective of objectives) {
      for (const [type, pattern] of Object.entries(verbPatterns)) {
        const matches = objective.match(pattern);
        if (matches) {
          scores[type] += matches.length;
        }
      }
    }
  }
  /**
   * Generate recommendations based on detected type
   */
  generateTypeRecommendations(type, confidence) {
    const recommendations = [];
    if (confidence < 50) {
      recommendations.push("Consider clarifying your course positioning with more specific language");
      recommendations.push("Update title and description to better reflect the course level");
    }
    const profile = COURSE_TYPE_PROFILES[type];
    recommendations.push(`Optimize content for ${profile.targetAudience}`);
    recommendations.push(`Focus on: ${profile.primaryObjective}`);
    switch (type) {
      case "foundational":
        recommendations.push("Include plenty of examples and definitions");
        recommendations.push("Provide scaffolded learning with frequent checkpoints");
        break;
      case "intermediate":
        recommendations.push("Balance theory with practical exercises");
        recommendations.push("Include real-world case studies");
        break;
      case "advanced":
        recommendations.push("Challenge learners with complex problem-solving");
        recommendations.push("Include critical analysis and evaluation tasks");
        break;
      case "professional":
        recommendations.push("Focus on industry-relevant scenarios");
        recommendations.push("Include certification preparation materials");
        break;
      case "creative":
        recommendations.push("Emphasize project-based learning");
        recommendations.push("Provide opportunities for original creation");
        break;
      case "technical":
        recommendations.push("Include hands-on coding exercises");
        recommendations.push("Provide debugging and troubleshooting scenarios");
        break;
      case "theoretical":
        recommendations.push("Include research methodologies");
        recommendations.push("Encourage critical literature review");
        break;
    }
    return recommendations;
  }
};
var courseTypeDetector = new CourseTypeDetector();

// src/analyzers/objective-analyzer.ts
var ObjectiveAnalyzer = class {
  STRONG_VERBS = {
    REMEMBER: ["define", "identify", "list", "name", "recall", "recognize"],
    UNDERSTAND: ["explain", "summarize", "interpret", "classify", "compare", "describe"],
    APPLY: ["apply", "demonstrate", "solve", "implement", "execute", "use"],
    ANALYZE: ["analyze", "differentiate", "examine", "investigate", "categorize", "deconstruct"],
    EVALUATE: ["evaluate", "assess", "critique", "judge", "justify", "defend"],
    CREATE: ["create", "design", "develop", "formulate", "construct", "compose"]
  };
  WEAK_VERBS = [
    "know",
    "learn",
    "understand",
    "appreciate",
    "be aware of",
    "become familiar with",
    "gain knowledge",
    "explore",
    "discover"
  ];
  MEASURABLE_INDICATORS = [
    "correctly",
    "accurately",
    "within",
    "at least",
    "minimum of",
    "percentage",
    "%",
    "score",
    "demonstrate",
    "produce",
    "complete",
    "pass",
    "achieve",
    "meet",
    "criteria",
    "standard"
  ];
  TIME_INDICATORS = [
    "by the end",
    "within",
    "after",
    "upon completion",
    "following",
    "week",
    "module",
    "chapter",
    "session",
    "course"
  ];
  /**
   * Analyze a single learning objective
   */
  analyzeObjective(objective) {
    const normalizedObjective = objective.trim();
    const lowerObjective = normalizedObjective.toLowerCase();
    const verbAnalysis = this.analyzeActionVerb(normalizedObjective);
    const bloomsLevel = verbAnalysis.bloomsLevel;
    const dokLevel = this.determineDOKLevel(lowerObjective, bloomsLevel);
    const smartCriteria = this.analyzeSMARTCriteria(normalizedObjective);
    const clarityScore = this.calculateClarityScore(normalizedObjective, smartCriteria);
    const measurability = this.analyzeMeasurability(normalizedObjective);
    const suggestions = this.generateSuggestions(
      normalizedObjective,
      verbAnalysis,
      smartCriteria,
      measurability
    );
    const improvedVersion = this.generateImprovedVersion(
      normalizedObjective,
      verbAnalysis,
      smartCriteria
    );
    return {
      objective: normalizedObjective,
      bloomsLevel,
      dokLevel,
      actionVerb: verbAnalysis.verb,
      verbStrength: verbAnalysis.strength,
      smartCriteria,
      clarityScore,
      measurability,
      suggestions,
      improvedVersion
    };
  }
  /**
   * Analyze multiple objectives and detect duplicates
   */
  analyzeAndDeduplicate(objectives) {
    if (objectives.length === 0) {
      return {
        totalObjectives: 0,
        uniqueClusters: 0,
        duplicateGroups: [],
        recommendations: ["Add learning objectives to your course"],
        optimizedObjectives: []
      };
    }
    const clusters = this.clusterSimilarObjectives(objectives);
    const duplicateGroups = clusters.filter((c) => c.objectives.length > 1 || c.recommendation !== "keep");
    const recommendations = this.generateDeduplicationRecommendations(clusters);
    const optimizedObjectives = this.generateOptimizedObjectives(clusters);
    return {
      totalObjectives: objectives.length,
      uniqueClusters: clusters.length,
      duplicateGroups,
      recommendations,
      optimizedObjectives
    };
  }
  /**
   * Analyze the action verb in an objective
   */
  analyzeActionVerb(objective) {
    const words = objective.toLowerCase().split(/\s+/);
    let foundVerb = "";
    let foundLevel = "UNDERSTAND";
    let strength = "moderate";
    for (const weakVerb of this.WEAK_VERBS) {
      if (objective.toLowerCase().includes(weakVerb)) {
        foundVerb = weakVerb;
        strength = "weak";
        break;
      }
    }
    if (!foundVerb) {
      const levels = ["CREATE", "EVALUATE", "ANALYZE", "APPLY", "UNDERSTAND", "REMEMBER"];
      for (const level of levels) {
        for (const verb of this.STRONG_VERBS[level]) {
          if (words.includes(verb) || objective.toLowerCase().startsWith(verb)) {
            foundVerb = verb;
            foundLevel = level;
            strength = "strong";
            break;
          }
        }
        if (strength === "strong") break;
      }
    }
    if (!foundVerb) {
      for (const mapping of BLOOMS_KEYWORD_MAP) {
        for (const keyword of mapping.keywords) {
          if (objective.toLowerCase().includes(keyword)) {
            foundVerb = keyword;
            foundLevel = mapping.level;
            strength = "moderate";
            break;
          }
        }
        if (foundVerb) break;
      }
    }
    if (!foundVerb) {
      foundVerb = "understand";
      foundLevel = "UNDERSTAND";
      strength = "weak";
    }
    const alternatives = this.STRONG_VERBS[foundLevel].filter((v) => v !== foundVerb).slice(0, 3);
    return {
      verb: foundVerb,
      bloomsLevel: foundLevel,
      strength,
      alternatives
    };
  }
  /**
   * Determine Webb's DOK level
   */
  determineDOKLevel(objective, bloomsLevel) {
    let dokLevel = bloomsToDOK(bloomsLevel);
    const complexityIndicators = {
      level4: ["design original", "synthesize", "create new", "develop innovative", "research and"],
      level3: ["analyze", "evaluate", "compare and contrast", "justify", "investigate"],
      level2: ["apply", "solve", "use", "demonstrate", "classify"],
      level1: ["recall", "identify", "define", "list", "name"]
    };
    for (const indicator of complexityIndicators.level4) {
      if (objective.includes(indicator)) {
        dokLevel = 4;
        break;
      }
    }
    if (dokLevel < 3) {
      for (const indicator of complexityIndicators.level3) {
        if (objective.includes(indicator)) {
          dokLevel = 3;
          break;
        }
      }
    }
    return dokLevel;
  }
  /**
   * Analyze SMART criteria compliance
   */
  analyzeSMARTCriteria(objective) {
    const specific = this.analyzeSpecific(objective);
    const measurable = this.analyzeMeasurable(objective);
    const achievable = this.analyzeAchievable(objective);
    const relevant = this.analyzeRelevant(objective);
    const timeBound = this.analyzeTimeBound(objective);
    const overallScore = Math.round(
      (specific.score + measurable.score + achievable.score + relevant.score + timeBound.score) / 5
    );
    return {
      specific,
      measurable,
      achievable,
      relevant,
      timeBound,
      overallScore
    };
  }
  analyzeSpecific(objective) {
    let score = 50;
    const suggestions = [];
    const words = objective.split(/\s+/).length;
    if (words >= 8) score += 20;
    if (words >= 15) score += 10;
    if (/\b(concepts?|skills?|techniques?|methods?|procedures?|principles?)\b/i.test(objective)) {
      score += 15;
    }
    if (/\b(things?|stuff|something|various|different)\b/i.test(objective)) {
      score -= 20;
      suggestions.push("Replace vague terms with specific concepts");
    }
    if (/\b(in|for|when|during|within the context of)\b/i.test(objective)) {
      score += 10;
    } else {
      suggestions.push("Add context about when or where this skill applies");
    }
    score = Math.max(0, Math.min(100, score));
    return {
      score,
      feedback: score >= 70 ? "Objective is specific and clear" : "Objective needs more specificity",
      suggestions
    };
  }
  analyzeMeasurable(objective) {
    let score = 30;
    const suggestions = [];
    const lower = objective.toLowerCase();
    for (const indicator of this.MEASURABLE_INDICATORS) {
      if (lower.includes(indicator)) {
        score += 15;
        break;
      }
    }
    if (/\b(demonstrate|produce|create|write|develop|solve|calculate|identify|list)\b/i.test(objective)) {
      score += 25;
    }
    if (/\b\d+\b|percent|percentage|ratio|score/i.test(objective)) {
      score += 20;
    } else {
      suggestions.push('Add quantifiable criteria (e.g., "at least 80% accuracy")');
    }
    if (/\b(understand|know|appreciate|be aware|learn about)\b/i.test(objective)) {
      score -= 25;
      suggestions.push('Replace "understand/know" with observable action verbs');
    }
    score = Math.max(0, Math.min(100, score));
    return {
      score,
      feedback: score >= 70 ? "Outcome is measurable" : "Add measurable criteria",
      suggestions
    };
  }
  analyzeAchievable(objective) {
    let score = 60;
    const suggestions = [];
    if (/\b(master|perfect|complete mastery|expert|all aspects)\b/i.test(objective)) {
      score -= 30;
      suggestions.push('Use more realistic terms like "demonstrate proficiency" instead of "master"');
    }
    const verbCount = (objective.match(/\b(and|also|additionally|furthermore)\b/gi) || []).length;
    if (verbCount > 2) {
      score -= 20;
      suggestions.push("Consider breaking this into multiple focused objectives");
    }
    const words = objective.split(/\s+/).length;
    if (words > 30) {
      score -= 15;
      suggestions.push("Simplify objective - too complex for a single learning outcome");
    }
    score = Math.max(0, Math.min(100, score));
    return {
      score,
      feedback: score >= 70 ? "Objective appears achievable" : "Consider scope and feasibility",
      suggestions
    };
  }
  analyzeRelevant(objective) {
    let score = 50;
    const suggestions = [];
    if (/\b(in order to|to|for|enabling|allowing|so that)\b/i.test(objective)) {
      score += 25;
    } else {
      suggestions.push("Add purpose or connection to broader goals");
    }
    if (/\b(real-world|practical|industry|professional|workplace|project)\b/i.test(objective)) {
      score += 20;
    }
    if (/\b(skill|competency|ability|capability|proficiency)\b/i.test(objective)) {
      score += 15;
    }
    score = Math.max(0, Math.min(100, score));
    return {
      score,
      feedback: score >= 70 ? "Objective is relevant to learning goals" : "Clarify relevance and purpose",
      suggestions
    };
  }
  analyzeTimeBound(objective) {
    let score = 20;
    const suggestions = [];
    for (const indicator of this.TIME_INDICATORS) {
      if (objective.toLowerCase().includes(indicator)) {
        score += 50;
        break;
      }
    }
    if (/\b(module|chapter|section|lesson|unit)\b/i.test(objective)) {
      score += 20;
    }
    if (score < 50) {
      suggestions.push('Add timeframe (e.g., "By the end of this module...")');
    }
    score = Math.max(0, Math.min(100, score));
    return {
      score,
      feedback: score >= 70 ? "Timeframe is specified" : "Add a timeframe or milestone",
      suggestions
    };
  }
  /**
   * Analyze measurability in detail
   */
  analyzeMeasurability(objective) {
    const lower = objective.toLowerCase();
    let score = 50;
    let hasQuantifiableOutcome = false;
    let assessmentMethod = "Observation";
    const verificationCriteria = [];
    if (/\b\d+\b|percent|%|score|rate/i.test(objective)) {
      hasQuantifiableOutcome = true;
      score += 30;
      verificationCriteria.push("Quantitative metrics specified");
    }
    if (/\b(write|create|produce|develop|design)\b/i.test(lower)) {
      assessmentMethod = "Portfolio/Project submission";
      score += 15;
      verificationCriteria.push("Artifact-based assessment");
    } else if (/\b(demonstrate|perform|execute|apply)\b/i.test(lower)) {
      assessmentMethod = "Performance assessment";
      score += 15;
      verificationCriteria.push("Observable demonstration");
    } else if (/\b(analyze|evaluate|compare|critique)\b/i.test(lower)) {
      assessmentMethod = "Written analysis/Essay";
      score += 15;
      verificationCriteria.push("Written response evaluation");
    } else if (/\b(identify|list|name|define)\b/i.test(lower)) {
      assessmentMethod = "Quiz/Test";
      score += 10;
      verificationCriteria.push("Multiple choice or short answer");
    }
    if (/\b(correctly|accurately)\b/i.test(lower)) {
      verificationCriteria.push("Accuracy-based rubric");
    }
    if (/\b(independently|without assistance)\b/i.test(lower)) {
      verificationCriteria.push("Independent completion verification");
    }
    return {
      score: Math.min(100, score),
      hasQuantifiableOutcome,
      assessmentMethod,
      verificationCriteria
    };
  }
  /**
   * Calculate clarity score
   */
  calculateClarityScore(objective, smartCriteria) {
    let score = smartCriteria.overallScore;
    const words = objective.split(/\s+/).length;
    const avgWordLength = objective.replace(/\s+/g, "").length / words;
    if (words >= 10 && words <= 25) {
      score += 10;
    } else if (words < 5 || words > 40) {
      score -= 10;
    }
    if (avgWordLength > 8) {
      score -= 10;
    }
    const startsWithVerb = /^[A-Z]?[a-z]+\s/.test(objective) && BLOOMS_KEYWORD_MAP.some((m) => m.keywords.some(
      (k) => objective.toLowerCase().startsWith(k)
    ));
    if (startsWithVerb) {
      score += 10;
    }
    return Math.max(0, Math.min(100, score));
  }
  /**
   * Generate improvement suggestions
   */
  generateSuggestions(objective, verbAnalysis, smartCriteria, measurability) {
    const suggestions = [];
    if (verbAnalysis.strength === "weak") {
      suggestions.push(
        `Replace "${verbAnalysis.verb}" with stronger verb: ${verbAnalysis.alternatives.join(", ")}`
      );
    }
    for (const [criterion, analysis] of Object.entries(smartCriteria)) {
      if (criterion !== "overallScore" && typeof analysis === "object" && "suggestions" in analysis) {
        const criterionAnalysis = analysis;
        if (criterionAnalysis.score < 70) {
          suggestions.push(...criterionAnalysis.suggestions);
        }
      }
    }
    if (!measurability.hasQuantifiableOutcome) {
      suggestions.push("Add specific success criteria or metrics");
    }
    return Array.from(new Set(suggestions)).slice(0, 5);
  }
  /**
   * Generate improved version of objective
   */
  generateImprovedVersion(objective, verbAnalysis, smartCriteria) {
    let improved = objective;
    if (verbAnalysis.strength === "weak" && verbAnalysis.alternatives.length > 0) {
      const replacement = verbAnalysis.alternatives[0];
      const capitalizedReplacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
      const verbRegex = new RegExp(`^${verbAnalysis.verb}`, "i");
      if (verbRegex.test(improved)) {
        improved = improved.replace(verbRegex, capitalizedReplacement);
      }
    }
    if (smartCriteria.timeBound.score < 50 && !improved.toLowerCase().includes("by the end")) {
      improved = `By the end of this module, learners will ${improved.charAt(0).toLowerCase() + improved.slice(1)}`;
    }
    if (smartCriteria.measurable.score < 50 && !improved.includes("correctly")) {
      improved = improved.replace(/\.$/, " with at least 80% accuracy.");
      if (!improved.endsWith(".")) {
        improved += " with at least 80% accuracy.";
      }
    }
    return improved;
  }
  /**
   * Cluster similar objectives for deduplication
   */
  clusterSimilarObjectives(objectives) {
    const clusters = [];
    const processed = /* @__PURE__ */ new Set();
    for (let i = 0; i < objectives.length; i++) {
      if (processed.has(i)) continue;
      const cluster = {
        clusterId: `cluster-${i}`,
        objectives: [objectives[i]],
        semanticSimilarity: 100,
        recommendation: "keep",
        suggestedMerge: null,
        reason: "Unique objective"
      };
      for (let j = i + 1; j < objectives.length; j++) {
        if (processed.has(j)) continue;
        const similarity = this.calculateSimilarity(objectives[i], objectives[j]);
        if (similarity > 70) {
          cluster.objectives.push(objectives[j]);
          cluster.semanticSimilarity = Math.min(cluster.semanticSimilarity, similarity);
          processed.add(j);
        }
      }
      processed.add(i);
      if (cluster.objectives.length > 1) {
        if (cluster.semanticSimilarity > 90) {
          cluster.recommendation = "merge";
          cluster.reason = "Objectives are nearly identical";
          cluster.suggestedMerge = this.generateMergedObjective(cluster.objectives);
        } else {
          cluster.recommendation = "differentiate";
          cluster.reason = "Objectives are similar but may have distinct aspects";
          cluster.suggestedMerge = null;
        }
      }
      clusters.push(cluster);
    }
    return clusters;
  }
  /**
   * Calculate similarity between two objectives
   */
  calculateSimilarity(obj1, obj2) {
    const words1 = new Set(obj1.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    const words2 = new Set(obj2.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    if (words1.size === 0 || words2.size === 0) return 0;
    let intersection = 0;
    const words1Array = Array.from(words1);
    for (const word of words1Array) {
      if (words2.has(word)) {
        intersection++;
      }
    }
    const union = words1.size + words2.size - intersection;
    return Math.round(intersection / union * 100);
  }
  /**
   * Generate merged objective from similar ones
   */
  generateMergedObjective(objectives) {
    const base = objectives.reduce(
      (longest, current) => current.length > longest.length ? current : longest
    );
    return base;
  }
  /**
   * Generate recommendations for deduplication
   */
  generateDeduplicationRecommendations(clusters) {
    const recommendations = [];
    const mergeCount = clusters.filter((c) => c.recommendation === "merge").length;
    const differentiateCount = clusters.filter((c) => c.recommendation === "differentiate").length;
    if (mergeCount > 0) {
      recommendations.push(`${mergeCount} objective(s) can be consolidated to remove redundancy`);
    }
    if (differentiateCount > 0) {
      recommendations.push(`${differentiateCount} objective group(s) need clearer differentiation`);
    }
    const totalObjectives = clusters.reduce((sum, c) => sum + c.objectives.length, 0);
    const uniqueCount = clusters.length;
    if (totalObjectives > uniqueCount * 1.5) {
      recommendations.push("Consider reducing total objectives for clarity and focus");
    }
    if (uniqueCount < 3) {
      recommendations.push("Add more diverse learning objectives to cover different cognitive levels");
    }
    return recommendations;
  }
  /**
   * Generate optimized list of objectives
   */
  generateOptimizedObjectives(clusters) {
    const optimized = [];
    for (const cluster of clusters) {
      if (cluster.recommendation === "merge" && cluster.suggestedMerge) {
        optimized.push(cluster.suggestedMerge);
      } else {
        optimized.push(...cluster.objectives);
      }
    }
    return optimized;
  }
};
var objectiveAnalyzer = new ObjectiveAnalyzer();

// src/analyzers/deterministic-rubric-engine.ts
var MEASURABLE_VERBS_PATTERN = /\b(define|identify|list|explain|demonstrate|analyze|evaluate|create|design|develop|implement|calculate|compare|contrast|apply|solve|construct|formulate|assess|critique|interpret|classify|predict|summarize|describe|distinguish|organize|examine|investigate|differentiate|justify|defend|recommend|compose|generate|produce|plan|devise|synthesize|build|author)\b/gi;
var BLOOMS_PATTERNS = {
  REMEMBER: /\b(define|list|name|recall|identify|recognize|state|match|select|memorize|repeat|label|quote)\b/gi,
  UNDERSTAND: /\b(explain|summarize|interpret|paraphrase|classify|compare|contrast|discuss|predict|translate|describe|illustrate|exemplify|distinguish)\b/gi,
  APPLY: /\b(apply|demonstrate|solve|use|implement|calculate|execute|practice|compute|show|modify|operate|experiment|complete)\b/gi,
  ANALYZE: /\b(analyze|examine|investigate|differentiate|organize|attribute|deconstruct|outline|structure|integrate|categorize|compare|contrast)\b/gi,
  EVALUATE: /\b(evaluate|judge|critique|justify|assess|defend|support|argue|prioritize|recommend|rate|validate|appraise|conclude)\b/gi,
  CREATE: /\b(create|design|develop|formulate|construct|invent|compose|generate|produce|plan|devise|synthesize|build|author|propose)\b/gi
};
var LEARNER_CENTERED_PATTERN = /\b(you will|learners? will|students? will|be able to|can|will be able|upon completion|by the end)\b/i;
var DeterministicRubricEngine = class {
  VERSION = "1.0.0";
  rules;
  constructor() {
    this.rules = this.initializeRules();
  }
  /**
   * Primary analysis method - fully deterministic
   */
  analyze(input) {
    const categoryScores = /* @__PURE__ */ new Map();
    const rulesApplied = [];
    const recommendations = [];
    let totalEarned = 0;
    let totalMax = 0;
    let rulesPassed = 0;
    let rulesFailed = 0;
    const categories = [
      "LearningObjectives",
      "Assessment",
      "ContentStructure",
      "CognitiveDepth",
      "Accessibility",
      "Engagement"
    ];
    for (const cat of categories) {
      categoryScores.set(cat, { earned: 0, max: 0, percentage: 0, rules: [] });
    }
    for (const rule of this.rules) {
      const passed = rule.condition(input);
      const earned = passed ? rule.score * rule.weight : 0;
      const max = rule.maxScore * rule.weight;
      totalEarned += earned;
      totalMax += max;
      if (passed) {
        rulesPassed++;
      } else {
        rulesFailed++;
      }
      const result = {
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        passed,
        score: earned,
        maxScore: max,
        evidence: passed ? rule.evidence : `NOT MET: ${rule.evidence}`,
        source: rule.source
      };
      rulesApplied.push(result);
      const catScore = categoryScores.get(rule.category);
      if (catScore) {
        catScore.earned += earned;
        catScore.max += max;
        catScore.rules.push(result);
      }
      if (!passed) {
        recommendations.push({
          priority: this.getPriorityFromWeight(rule.weight),
          category: rule.category,
          title: rule.name,
          description: rule.recommendation,
          actionSteps: this.generateActionSteps(rule),
          estimatedImpact: rule.score * rule.weight,
          effort: this.estimateEffort(rule),
          source: rule.source
        });
      }
    }
    for (const [, score] of categoryScores) {
      score.percentage = score.max > 0 ? Math.round(score.earned / score.max * 100) : 0;
    }
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.estimatedImpact - a.estimatedImpact;
    });
    const questionsCount = input.assessments.reduce(
      (sum, a) => sum + (a.questions?.length ?? 0),
      0
    );
    return {
      totalScore: Math.round(totalEarned * 10) / 10,
      maxPossibleScore: Math.round(totalMax * 10) / 10,
      percentageScore: totalMax > 0 ? Math.round(totalEarned / totalMax * 100) : 0,
      categoryScores,
      rulesApplied,
      analysisMethod: "deterministic",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      engineVersion: this.VERSION,
      recommendations,
      llmEnhanced: false,
      metadata: {
        courseId: input.courseId,
        analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
        objectivesCount: input.objectives.length,
        chaptersCount: input.chapters.length,
        assessmentsCount: input.assessments.length,
        questionsCount,
        rulesEvaluated: this.rules.length,
        rulesPassed,
        rulesFailed
      }
    };
  }
  /**
   * Get the engine version
   */
  getVersion() {
    return this.VERSION;
  }
  /**
   * Get all rules for inspection/audit
   */
  getRules() {
    return [...this.rules];
  }
  /**
   * Initialize all rubric rules
   */
  initializeRules() {
    return [
      // ═══════════════════════════════════════════════════════════════
      // LEARNING OBJECTIVES RULES (Based on QM Standards 2.1-2.5)
      // ═══════════════════════════════════════════════════════════════
      {
        id: "LO-001",
        category: "LearningObjectives",
        name: "Measurable Objectives",
        condition: (data) => {
          if (data.objectives.length === 0) return false;
          const measurableCount = data.objectives.filter(
            (obj) => MEASURABLE_VERBS_PATTERN.test(obj)
          ).length;
          MEASURABLE_VERBS_PATTERN.lastIndex = 0;
          return measurableCount / data.objectives.length >= 0.8;
        },
        score: 3,
        maxScore: 3,
        weight: 1.5,
        evidence: "80%+ of objectives use measurable action verbs (QM 2.1)",
        recommendation: "Revise objectives to use measurable action verbs from Bloom's Taxonomy",
        source: {
          standard: "QM",
          id: "2.1",
          description: "Course learning objectives describe outcomes that are measurable",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 2.1"
        }
      },
      {
        id: "LO-002",
        category: "LearningObjectives",
        name: "Bloom's Level Variety",
        condition: (data) => {
          const levels = /* @__PURE__ */ new Set();
          for (const obj of data.objectives) {
            for (const [level, pattern] of Object.entries(BLOOMS_PATTERNS)) {
              if (pattern.test(obj)) {
                levels.add(level);
              }
              pattern.lastIndex = 0;
            }
          }
          return levels.size >= 3;
        },
        score: 3,
        maxScore: 3,
        weight: 1.2,
        evidence: "Objectives span at least 3 Bloom's Taxonomy levels",
        recommendation: "Add objectives at higher cognitive levels (Analyze, Evaluate, Create)",
        source: {
          standard: "QM",
          id: "2.2",
          description: "Module objectives are consistent with course-level objectives",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 2.2"
        }
      },
      {
        id: "LO-003",
        category: "LearningObjectives",
        name: "Optimal Objective Count",
        condition: (data) => data.objectives.length >= 3 && data.objectives.length <= 8,
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "Course has 3-8 learning objectives (research-backed optimal range)",
        recommendation: "Adjust to 3-8 total objectives for optimal learner focus",
        source: {
          standard: "Research",
          id: "Mager-1997",
          description: "Preparing Instructional Objectives recommends 3-8 objectives per course",
          fullCitation: "Mager, R. F. (1997). Preparing Instructional Objectives (3rd ed.). CEP Press."
        }
      },
      {
        id: "LO-004",
        category: "LearningObjectives",
        name: "Learner-Centered Language",
        condition: (data) => {
          if (data.objectives.length === 0) return false;
          const learnerCentered = data.objectives.filter(
            (obj) => LEARNER_CENTERED_PATTERN.test(obj)
          ).length;
          return learnerCentered / data.objectives.length >= 0.5;
        },
        score: 2,
        maxScore: 2,
        weight: 0.8,
        evidence: "50%+ objectives written from learner perspective (QM 2.3)",
        recommendation: 'Rewrite objectives using "Students will be able to..." format',
        source: {
          standard: "QM",
          id: "2.3",
          description: "Objectives are stated clearly from the learner's perspective",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 2.3"
        }
      },
      {
        id: "LO-005",
        category: "LearningObjectives",
        name: "Objectives Present",
        condition: (data) => data.objectives.length >= 1,
        score: 3,
        maxScore: 3,
        weight: 1.5,
        evidence: "Course has at least one learning objective defined",
        recommendation: "Define clear learning objectives for your course before adding content",
        source: {
          standard: "QM",
          id: "2.1",
          description: "Course learning objectives are essential for course design"
        }
      },
      // ═══════════════════════════════════════════════════════════════
      // ASSESSMENT RULES (Based on QM Standards 3.1-3.5)
      // ═══════════════════════════════════════════════════════════════
      {
        id: "AS-001",
        category: "Assessment",
        name: "Assessment-Objective Alignment",
        condition: (data) => {
          if (data.objectives.length === 0 || data.assessments.length === 0)
            return false;
          return data.assessments.length >= Math.ceil(data.objectives.length * 0.5);
        },
        score: 3,
        maxScore: 3,
        weight: 1.5,
        evidence: "Assessments cover at least 50% of learning objectives (QM 3.1)",
        recommendation: "Create assessments aligned with each learning objective",
        source: {
          standard: "QM",
          id: "3.1",
          description: "Assessments measure the achievement of stated learning objectives",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 3.1"
        }
      },
      {
        id: "AS-002",
        category: "Assessment",
        name: "Assessment Type Variety",
        condition: (data) => {
          const types = new Set(data.assessments.map((a) => a.type));
          return types.size >= 2;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "At least 2 different assessment types used",
        recommendation: "Incorporate varied assessment formats (quizzes, projects, discussions, essays)",
        source: {
          standard: "QM",
          id: "3.4",
          description: "Assessment instruments are sequenced and varied",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 3.4"
        }
      },
      {
        id: "AS-003",
        category: "Assessment",
        name: "Formative Assessments Present",
        condition: (data) => {
          const formative = data.assessments.filter(
            (a) => a.type === "quiz" || a.type === "practice" || a.title?.toLowerCase().includes("practice")
          );
          return formative.length >= 1;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "Course includes formative assessments for learning checks",
        recommendation: "Add practice quizzes or knowledge checks throughout the course",
        source: {
          standard: "OLC",
          id: "EA-3",
          description: "Formative assessments provide feedback for improvement",
          fullCitation: "Online Learning Consortium. (2020). OLC Quality Scorecard Suite. EA-3"
        }
      },
      {
        id: "AS-004",
        category: "Assessment",
        name: "Assessment Feedback Quality",
        condition: (data) => {
          const assessmentsWithQuestions = data.assessments.filter(
            (a) => a.questions && a.questions.length > 0
          );
          if (assessmentsWithQuestions.length === 0) return false;
          const withFeedback = assessmentsWithQuestions.filter(
            (a) => a.questions?.some((q) => q.explanation || q.feedback)
          );
          return withFeedback.length / assessmentsWithQuestions.length >= 0.5;
        },
        score: 2,
        maxScore: 2,
        weight: 1.2,
        evidence: "50%+ of assessments have explanations/feedback (QM 3.3)",
        recommendation: "Add detailed explanations to assessment questions",
        source: {
          standard: "QM",
          id: "3.3",
          description: "Specific criteria are provided for evaluation of learners' work",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 3.3"
        }
      },
      {
        id: "AS-005",
        category: "Assessment",
        name: "Minimum Question Count",
        condition: (data) => {
          const totalQuestions = data.assessments.reduce(
            (sum, a) => sum + (a.questions?.length ?? 0),
            0
          );
          return totalQuestions >= 5;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "Course has at least 5 assessment questions",
        recommendation: "Add more assessment questions to adequately measure learning",
        source: {
          standard: "Research",
          id: "Assessment-Design",
          description: "Adequate question pool ensures comprehensive assessment coverage"
        }
      },
      // ═══════════════════════════════════════════════════════════════
      // CONTENT STRUCTURE RULES (Based on QM Standards 4 & 5)
      // ═══════════════════════════════════════════════════════════════
      {
        id: "CS-001",
        category: "ContentStructure",
        name: "Minimum Course Structure",
        condition: (data) => data.chapters.length >= 3,
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "Course has at least 3 chapters/modules",
        recommendation: "Expand course structure to at least 3 modules for comprehensive coverage",
        source: {
          standard: "OLC",
          id: "CS-1",
          description: "Course is organized into logical modules or units",
          fullCitation: "Online Learning Consortium. (2020). OLC Quality Scorecard Suite. CS-1"
        }
      },
      {
        id: "CS-002",
        category: "ContentStructure",
        name: "Chapter Learning Outcomes",
        condition: (data) => {
          if (data.chapters.length === 0) return false;
          const withOutcomes = data.chapters.filter(
            (ch) => ch.learningOutcome && ch.learningOutcome.length > 20
          );
          return withOutcomes.length / data.chapters.length >= 0.8;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "80%+ of chapters have defined learning outcomes",
        recommendation: "Add specific learning outcomes to each chapter",
        source: {
          standard: "QM",
          id: "2.2",
          description: "Module learning objectives are measurable",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 2.2"
        }
      },
      {
        id: "CS-003",
        category: "ContentStructure",
        name: "Consistent Section Depth",
        condition: (data) => {
          if (data.chapters.length < 2) return true;
          const sectionCounts = data.chapters.map(
            (ch) => ch.sections?.length ?? 0
          );
          const avg = sectionCounts.reduce((a, b) => a + b, 0) / sectionCounts.length;
          const variance = sectionCounts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / sectionCounts.length;
          return variance < 4;
        },
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: "Chapters have consistent depth (similar section counts)",
        recommendation: "Balance chapter content for consistent learner workload",
        source: {
          standard: "OLC",
          id: "CS-3",
          description: "Course components are consistent in structure",
          fullCitation: "Online Learning Consortium. (2020). OLC Quality Scorecard Suite. CS-3"
        }
      },
      {
        id: "CS-004",
        category: "ContentStructure",
        name: "Resource Availability",
        condition: (data) => (data.attachments?.length ?? 0) >= 1,
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: "Course includes supplementary resources/attachments",
        recommendation: "Add downloadable resources (PDFs, worksheets, reference materials)",
        source: {
          standard: "QM",
          id: "4.5",
          description: "Instructional materials are accessible",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 4.5"
        }
      },
      {
        id: "CS-005",
        category: "ContentStructure",
        name: "Sections Present",
        condition: (data) => {
          const totalSections = data.chapters.reduce(
            (sum, ch) => sum + (ch.sections?.length ?? 0),
            0
          );
          return totalSections >= data.chapters.length;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "Each chapter has at least one section on average",
        recommendation: "Add sections to chapters for better content organization",
        source: {
          standard: "OLC",
          id: "CS-2",
          description: "Course content is chunked into manageable segments"
        }
      },
      // ═══════════════════════════════════════════════════════════════
      // COGNITIVE DEPTH RULES (Based on Bloom's & Webb's DOK Research)
      // ═══════════════════════════════════════════════════════════════
      {
        id: "CD-001",
        category: "CognitiveDepth",
        name: "Higher-Order Thinking Content",
        condition: (data) => {
          if (!data.contentAnalysis) return false;
          const higherOrder = (data.contentAnalysis.bloomsDistribution.ANALYZE ?? 0) + (data.contentAnalysis.bloomsDistribution.EVALUATE ?? 0) + (data.contentAnalysis.bloomsDistribution.CREATE ?? 0);
          return higherOrder >= 25;
        },
        score: 3,
        maxScore: 3,
        weight: 1.5,
        evidence: "25%+ content at higher-order thinking levels (Analyze, Evaluate, Create)",
        recommendation: "Add more analytical, evaluative, and creative activities",
        source: {
          standard: "Research",
          id: "Hess-2009",
          description: "Cognitive Rigor Matrix recommends 25%+ higher-order activities",
          fullCitation: "Hess, K. K., et al. (2009). Cognitive Rigor: Blending the Strengths of Bloom's Taxonomy and Webb's Depth of Knowledge. Educational Assessment."
        }
      },
      {
        id: "CD-002",
        category: "CognitiveDepth",
        name: "Balanced Cognitive Distribution",
        condition: (data) => {
          if (!data.contentAnalysis) return false;
          const dist = data.contentAnalysis.bloomsDistribution;
          const values = Object.values(dist);
          const max = Math.max(...values);
          return max <= 50;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "No single Bloom's level dominates (\u226450% each)",
        recommendation: "Rebalance content across cognitive levels",
        source: {
          standard: "Research",
          id: "Anderson-2001",
          description: "Revised Bloom's Taxonomy recommends balanced distribution",
          fullCitation: "Anderson, L. W., & Krathwohl, D. R. (2001). A Taxonomy for Learning, Teaching, and Assessing. Longman."
        }
      },
      {
        id: "CD-003",
        category: "CognitiveDepth",
        name: "DOK Level 3+ Content",
        condition: (data) => {
          if (!data.contentAnalysis?.dokDistribution) return false;
          const dok = data.contentAnalysis.dokDistribution;
          return (dok.level3 ?? 0) + (dok.level4 ?? 0) >= 20;
        },
        score: 2,
        maxScore: 2,
        weight: 1.2,
        evidence: "20%+ content at DOK Level 3-4 (Strategic/Extended Thinking)",
        recommendation: "Add strategic thinking tasks and extended projects",
        source: {
          standard: "Research",
          id: "Webb-2002",
          description: "Depth of Knowledge framework for cognitive complexity",
          fullCitation: "Webb, N. L. (2002). Depth-of-Knowledge Levels for Four Content Areas. Wisconsin Center for Education Research."
        }
      },
      {
        id: "CD-004",
        category: "CognitiveDepth",
        name: "Application Level Content",
        condition: (data) => {
          if (!data.contentAnalysis) return false;
          return (data.contentAnalysis.bloomsDistribution.APPLY ?? 0) >= 15;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "15%+ content at Application level",
        recommendation: "Add practical exercises and hands-on application activities",
        source: {
          standard: "Research",
          id: "Freeman-2014",
          description: "Active learning requires application of knowledge",
          fullCitation: "Freeman, S., et al. (2014). Active learning increases student performance in STEM. PNAS, 111(23), 8410-8415."
        }
      },
      // ═══════════════════════════════════════════════════════════════
      // ENGAGEMENT RULES (Based on OLC Standards)
      // ═══════════════════════════════════════════════════════════════
      {
        id: "EN-001",
        category: "Engagement",
        name: "Course Description Quality",
        condition: (data) => (data.description?.length ?? 0) >= 200,
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: "Course has detailed description (200+ characters)",
        recommendation: "Expand course description with learning outcomes and target audience",
        source: {
          standard: "QM",
          id: "1.2",
          description: "Course description provides introduction to course content",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 1.2"
        }
      },
      {
        id: "EN-002",
        category: "Engagement",
        name: "Visual Content Present",
        condition: (data) => {
          const hasVideo = data.chapters.some(
            (ch) => ch.sections?.some((s) => s.videoUrl)
          );
          const hasImage = Boolean(data.imageUrl);
          return hasVideo || hasImage;
        },
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: "Course includes visual content (images or videos)",
        recommendation: "Add video content or visual materials for engagement",
        source: {
          standard: "OLC",
          id: "TL-2",
          description: "Course uses varied instructional methods",
          fullCitation: "Online Learning Consortium. (2020). OLC Quality Scorecard Suite. TL-2"
        }
      },
      {
        id: "EN-003",
        category: "Engagement",
        name: "Course Title Quality",
        condition: (data) => data.title.length >= 10 && data.title.length <= 100,
        score: 1,
        maxScore: 1,
        weight: 0.5,
        evidence: "Course title is appropriately descriptive (10-100 characters)",
        recommendation: "Ensure course title is descriptive but concise (10-100 characters)",
        source: {
          standard: "QM",
          id: "1.1",
          description: "Course title accurately describes course content"
        }
      },
      // ═══════════════════════════════════════════════════════════════
      // ACCESSIBILITY RULES (Based on QM Standard 8)
      // ═══════════════════════════════════════════════════════════════
      {
        id: "AC-001",
        category: "Accessibility",
        name: "Course Image Present",
        condition: (data) => Boolean(data.imageUrl),
        score: 1,
        maxScore: 1,
        weight: 0.5,
        evidence: "Course has a cover image",
        recommendation: "Add a representative course image for visual identification",
        source: {
          standard: "QM",
          id: "8.1",
          description: "Course design facilitates readability"
        }
      },
      {
        id: "AC-002",
        category: "Accessibility",
        name: "Section Descriptions",
        condition: (data) => {
          const sections = data.chapters.flatMap((ch) => ch.sections ?? []);
          if (sections.length === 0) return true;
          const withDesc = sections.filter(
            (s) => s.description && s.description.length > 10
          );
          return withDesc.length / sections.length >= 0.5;
        },
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: "50%+ of sections have descriptions",
        recommendation: "Add descriptive text to sections to help learners navigate",
        source: {
          standard: "QM",
          id: "8.3",
          description: "Course provides accessible text and images within course"
        }
      }
    ];
  }
  getPriorityFromWeight(weight) {
    if (weight >= 1.5) return "critical";
    if (weight >= 1.2) return "high";
    if (weight >= 1) return "medium";
    return "low";
  }
  estimateEffort(rule) {
    const highEffortCategories = [
      "CognitiveDepth",
      "Assessment"
    ];
    const lowEffortCategories = ["Engagement", "Accessibility"];
    if (highEffortCategories.includes(rule.category)) return "high";
    if (lowEffortCategories.includes(rule.category)) return "low";
    return "medium";
  }
  generateActionSteps(rule) {
    const steps = [];
    switch (rule.id) {
      case "LO-001":
        steps.push("Review each learning objective");
        steps.push(
          "Replace vague verbs (understand, know) with measurable ones (analyze, create)"
        );
        steps.push("Use Bloom's Taxonomy verb list as reference");
        break;
      case "LO-002":
        steps.push("Map current objectives to Bloom's levels");
        steps.push("Identify missing levels");
        steps.push("Add objectives for Analyze, Evaluate, and Create levels");
        break;
      case "LO-003":
        steps.push("Review current objective count");
        steps.push("Merge redundant objectives if above 8");
        steps.push("Split broad objectives if below 3");
        break;
      case "LO-004":
        steps.push('Rewrite objectives starting with "Students will be able to..."');
        steps.push("Focus on learner outcomes, not instructor activities");
        break;
      case "AS-001":
        steps.push("Create alignment matrix: objectives vs assessments");
        steps.push("Identify objectives without assessments");
        steps.push("Design assessments for uncovered objectives");
        break;
      case "AS-002":
        steps.push("Review current assessment types");
        steps.push(
          "Add different formats: quizzes, projects, discussions, essays"
        );
        steps.push("Match assessment type to learning objective");
        break;
      case "AS-003":
        steps.push("Add practice quizzes after each chapter");
        steps.push("Include knowledge checks at key points");
        steps.push("Ensure immediate feedback on formative assessments");
        break;
      case "AS-004":
        steps.push("Add explanations to each question");
        steps.push("Explain why correct answer is correct");
        steps.push("Explain why incorrect answers are wrong");
        break;
      case "CS-001":
        steps.push("Organize content into logical modules");
        steps.push("Create at least 3 chapters covering course scope");
        steps.push("Ensure each chapter has clear focus");
        break;
      case "CS-002":
        steps.push("Write learning outcomes for each chapter");
        steps.push("Align chapter outcomes with course objectives");
        steps.push("Use measurable verbs in chapter outcomes");
        break;
      case "CD-001":
        steps.push("Add case studies requiring analysis");
        steps.push("Include evaluation activities (peer review, critique)");
        steps.push("Add creative projects (design, develop, propose)");
        break;
      case "CD-002":
        steps.push("Review content distribution across cognitive levels");
        steps.push("Reduce content at dominant level");
        steps.push("Add content at underrepresented levels");
        break;
      case "EN-001":
        steps.push("Expand course description to 200+ characters");
        steps.push("Include target audience information");
        steps.push("List key learning outcomes");
        break;
      case "EN-002":
        steps.push("Add course cover image");
        steps.push("Include video content in lessons");
        steps.push("Use visuals to explain complex concepts");
        break;
      default:
        steps.push("Review current implementation");
        steps.push("Apply recommended changes");
        steps.push("Verify improvement");
    }
    return steps;
  }
};
function serializeAnalysisResult(result) {
  return {
    ...result,
    categoryScores: Object.fromEntries(result.categoryScores)
  };
}
function calculateCourseTypeAlignment(actual, courseType) {
  const ideal = COURSE_TYPE_PROFILES[courseType].idealBloomsDistribution;
  let totalDiff = 0;
  for (const level of Object.keys(ideal)) {
    totalDiff += Math.abs((actual[level] ?? 0) - ideal[level]);
  }
  return Math.max(0, 100 - totalDiff / 2);
}
var deterministicRubricEngine = new DeterministicRubricEngine();

// src/analyzers/deep-content-analyzer.ts
var BLOOM_PATTERNS = [
  {
    level: "REMEMBER",
    weight: 1,
    patterns: [
      // Action verbs
      /\b(define|list|name|recall|identify|recognize|describe|state|match|select|label|locate|memorize|repeat|reproduce)\b/gi,
      // Question patterns
      /\b(what is|who is|when did|where is|how many|which one|what are|who was|when was)\b/gi,
      // Instructional patterns
      /\b(the definition of|known as|refers to|is called|means|is defined as)\b/gi,
      // Assessment patterns
      /\b(choose the correct|select the right|identify which|name the|list all)\b/gi
    ],
    contextBonus: { assessment: 0.1, instructional: 0.05 }
  },
  {
    level: "UNDERSTAND",
    weight: 2,
    patterns: [
      // Action verbs
      /\b(explain|summarize|interpret|paraphrase|classify|compare|contrast|discuss|predict|translate|describe|distinguish|estimate|generalize|infer)\b/gi,
      // Question patterns
      /\b(why does|how does|what does .{1,30} mean|in other words|what is the difference|how would you explain)\b/gi,
      // Instructional patterns
      /\b(the main idea|the difference between|an example of|this means that|in summary|to summarize|essentially|basically)\b/gi,
      // Comprehension indicators
      /\b(shows that|demonstrates that|indicates|suggests|implies|represents)\b/gi
    ],
    contextBonus: { instructional: 0.1, example: 0.15 }
  },
  {
    level: "APPLY",
    weight: 3,
    patterns: [
      // Action verbs
      /\b(apply|demonstrate|solve|use|implement|calculate|execute|practice|compute|show|illustrate|operate|schedule|sketch|employ|utilize)\b/gi,
      // Problem-solving patterns
      /\b(solve for|calculate the|build a|use .{1,30} to|apply .{1,30} to|how would you use|using this method)\b/gi,
      // Practice patterns
      /\b(in this scenario|given the following|let's practice|try this|now you try|work through|complete the following)\b/gi,
      // Implementation patterns
      /\b(implement the|put into practice|carry out|execute the|perform the)\b/gi
    ],
    contextBonus: { activity: 0.15, assessment: 0.1 }
  },
  {
    level: "ANALYZE",
    weight: 4,
    patterns: [
      // Action verbs
      /\b(analyze|examine|investigate|differentiate|organize|attribute|deconstruct|outline|structure|integrate|distinguish|compare|contrast|categorize)\b/gi,
      // Analysis patterns
      /\b(what are the reasons|what evidence|how does .{1,30} relate|break down|identify the components|what is the relationship)\b/gi,
      // Comparison patterns
      /\b(compare and contrast|categorize the|distinguish between|analyze the relationship|examine how|investigate why)\b/gi,
      // Critical thinking indicators
      /\b(the underlying|the root cause|contributing factors|key components|structural elements)\b/gi
    ],
    contextBonus: { assessment: 0.15, activity: 0.1 }
  },
  {
    level: "EVALUATE",
    weight: 5,
    patterns: [
      // Action verbs
      /\b(evaluate|judge|critique|justify|defend|prioritize|assess|recommend|conclude|appraise|argue|rate|support|validate|verify)\b/gi,
      // Evaluation patterns
      /\b(do you agree|is this valid|what is the best|justify your|argue for|argue against|which is more effective|rate the)\b/gi,
      // Opinion/judgment patterns
      /\b(in your opinion|based on the evidence|evaluate the|assess whether|determine if|judge the quality|critique the)\b/gi,
      // Value judgment indicators
      /\b(the most effective|the best approach|superior to|preferable|optimal|most appropriate)\b/gi
    ],
    contextBonus: { assessment: 0.2, activity: 0.1 }
  },
  {
    level: "CREATE",
    weight: 6,
    patterns: [
      // Action verbs
      /\b(create|design|develop|formulate|construct|propose|invent|compose|generate|produce|plan|devise|originate|author|synthesize)\b/gi,
      // Creation patterns
      /\b(design a solution|develop a plan|propose an alternative|create your own|write your own|build your own)\b/gi,
      // Innovation patterns
      /\b(what if|imagine|generate a|compose a|devise a|formulate a new|invent a)\b/gi,
      // Synthesis indicators
      /\b(combine .{1,30} to create|synthesize|integrate .{1,30} into|merge|blend|fuse)\b/gi
    ],
    contextBonus: { activity: 0.2, assessment: 0.15 }
  }
];
var DeepContentAnalyzer = class {
  VERSION = "1.0.0";
  MIN_SENTENCE_LENGTH = 15;
  MIN_WORD_COUNT = 4;
  MIN_CONTENT_LENGTH = 50;
  /**
   * Analyze multiple content sources for cognitive depth
   */
  async analyzeContent(sources) {
    const sentenceAnalyses = [];
    const verbFrequencyMap = /* @__PURE__ */ new Map();
    const contextCounts = {
      instructional: 0,
      assessment: 0,
      activity: 0,
      example: 0,
      introduction: 0,
      summary: 0
    };
    const contentTypeCounts = {
      video_transcript: 0,
      document: 0,
      quiz: 0,
      discussion: 0,
      assignment: 0,
      text: 0,
      lesson_content: 0
    };
    let totalWords = 0;
    let analyzedSources = 0;
    let skippedSources = 0;
    for (const source of sources) {
      if (!source.content || source.content.length < this.MIN_CONTENT_LENGTH) {
        skippedSources++;
        continue;
      }
      analyzedSources++;
      totalWords += source.metadata.wordCount;
      contentTypeCounts[source.type]++;
      const sentences = this.splitIntoSentences(source.content);
      const baseContext = this.determineContext(source.type);
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const position = this.determinePosition(i, sentences.length);
        const context = this.refineContext(baseContext, sentence, position);
        const analysis = this.analyzeSentence(sentence, context, position);
        sentenceAnalyses.push(analysis);
        contextCounts[analysis.context]++;
        for (const pattern of analysis.triggerPatterns) {
          const key = pattern.toLowerCase();
          const existing = verbFrequencyMap.get(key);
          if (existing) {
            existing.count++;
            if (!existing.contexts.includes(context)) {
              existing.contexts.push(context);
            }
          } else {
            verbFrequencyMap.set(key, {
              verb: key,
              count: 1,
              level: analysis.predictedBloomsLevel,
              contexts: [context]
            });
          }
        }
      }
    }
    const bloomsDistribution = this.calculateBloomsDistribution(sentenceAnalyses);
    const weightedBloomsDistribution = this.calculateWeightedBloomsDistribution(sentenceAnalyses);
    const dokDistribution = this.calculateDOKDistribution(sentenceAnalyses);
    const overallConfidence = this.calculateOverallConfidence(sentenceAnalyses);
    const verbFrequency = Array.from(verbFrequencyMap.values()).sort((a, b) => b.count - a.count).slice(0, 50);
    const totalContexts = Object.values(contextCounts).reduce((a, b) => a + b, 0);
    const contextDistribution = {};
    for (const [ctx, count] of Object.entries(contextCounts)) {
      contextDistribution[ctx] = totalContexts > 0 ? Math.round(count / totalContexts * 100) : 0;
    }
    const contentGaps = this.identifyContentGaps(
      bloomsDistribution,
      dokDistribution,
      contextDistribution
    );
    const recommendations = this.generateRecommendations(
      bloomsDistribution,
      dokDistribution,
      contentGaps,
      overallConfidence
    );
    return {
      bloomsDistribution,
      dokDistribution,
      weightedBloomsDistribution,
      overallConfidence,
      analysisMethod: "hybrid",
      analysisVersion: this.VERSION,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      contentCoverage: {
        totalSources: sources.length,
        analyzedSources,
        skippedSources,
        totalWords,
        totalSentences: sentenceAnalyses.length,
        averageWordsPerSentence: sentenceAnalyses.length > 0 ? Math.round(totalWords / sentenceAnalyses.length) : 0,
        contentTypes: contentTypeCounts
      },
      sentenceAnalyses,
      verbFrequency,
      contextDistribution,
      contentGaps,
      recommendations,
      researchBasis: {
        framework: "Anderson & Krathwohl Revised Taxonomy + Webb DOK",
        citation: "Anderson, L.W. & Krathwohl, D.R. (2001). A Taxonomy for Learning, Teaching, and Assessing. Webb, N.L. (2002). Depth-of-Knowledge Levels.",
        methodology: "Pattern-based sentence classification with context-aware weighting"
      }
    };
  }
  /**
   * Analyze a single content source
   */
  async analyzeSingleSource(source) {
    return this.analyzeContent([source]);
  }
  /**
   * Split text into analyzable sentences
   */
  splitIntoSentences(text) {
    const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{2,}/g, "\n").replace(/\s{2,}/g, " ");
    const rawSentences = cleaned.replace(/([.!?])\s+/g, "$1\n").replace(/([.!?])$/g, "$1\n").split("\n").map((s) => s.trim());
    return rawSentences.filter(
      (s) => s.length >= this.MIN_SENTENCE_LENGTH && s.split(/\s+/).length >= this.MIN_WORD_COUNT && !/^[•\-\*\d]+\.?\s*$/.test(s)
      // Skip bullet points and numbers
    );
  }
  /**
   * Determine base context from content type
   */
  determineContext(type) {
    switch (type) {
      case "quiz":
        return "assessment";
      case "assignment":
        return "activity";
      case "discussion":
        return "activity";
      case "video_transcript":
        return "instructional";
      case "document":
        return "instructional";
      default:
        return "instructional";
    }
  }
  /**
   * Refine context based on sentence content and position
   */
  refineContext(baseContext, sentence, position) {
    const lower = sentence.toLowerCase();
    if (/\b(for example|for instance|such as|e\.g\.|consider this|let's say)\b/i.test(lower)) {
      return "example";
    }
    if (position === "beginning" && /\b(in this|we will|you will learn|this lesson|objectives|overview)\b/i.test(lower)) {
      return "introduction";
    }
    if (position === "end" && /\b(in summary|to summarize|in conclusion|key takeaways|remember that|main points)\b/i.test(lower)) {
      return "summary";
    }
    if (/\b(try this|practice|exercise|your turn|complete the|work through)\b/i.test(lower)) {
      return "activity";
    }
    if (/\b(question|quiz|test|exam|answer|correct|incorrect|true or false|multiple choice)\b/i.test(lower)) {
      return "assessment";
    }
    return baseContext;
  }
  /**
   * Determine sentence position in content
   */
  determinePosition(index, total) {
    const position = index / total;
    if (position < 0.15) return "beginning";
    if (position > 0.85) return "end";
    return "middle";
  }
  /**
   * Analyze a single sentence for cognitive level
   */
  analyzeSentence(sentence, context, position) {
    const matches = [];
    for (const bloomPattern of BLOOM_PATTERNS) {
      const foundPatterns = [];
      let score = 0;
      for (const pattern of bloomPattern.patterns) {
        const matchResults = sentence.match(pattern);
        if (matchResults) {
          foundPatterns.push(...matchResults.map((m) => m.toLowerCase()));
          score += matchResults.length * bloomPattern.weight;
        }
      }
      const contextBonus = bloomPattern.contextBonus[context] ?? 0;
      score *= 1 + contextBonus;
      if (foundPatterns.length > 0) {
        matches.push({
          level: bloomPattern.level,
          patterns: [...new Set(foundPatterns)],
          // Dedupe
          score
        });
      }
    }
    matches.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.5) return b.score - a.score;
      return this.getBloomsWeight(b.level) - this.getBloomsWeight(a.level);
    });
    const best = matches[0];
    const bloomsLevel = best?.level ?? "UNDERSTAND";
    const confidence = this.calculateSentenceConfidence(best, matches, sentence);
    return {
      sentence,
      predictedBloomsLevel: bloomsLevel,
      predictedDOKLevel: this.bloomsToDOK(bloomsLevel),
      confidence,
      triggerPatterns: best?.patterns ?? [],
      context,
      position
    };
  }
  /**
   * Calculate confidence score for a sentence analysis
   */
  calculateSentenceConfidence(best, allMatches, sentence) {
    if (!best) {
      return 25;
    }
    let confidence = 0;
    const patternCount = best.patterns.length;
    if (patternCount >= 3) confidence += 40;
    else if (patternCount >= 2) confidence += 30;
    else confidence += 20;
    if (best.score >= 10) confidence += 25;
    else if (best.score >= 5) confidence += 15;
    else confidence += 10;
    if (allMatches.length >= 2) {
      const gap = best.score - allMatches[1].score;
      if (gap > 3) confidence += 20;
      else if (gap > 1) confidence += 10;
    } else if (allMatches.length === 1) {
      confidence += 15;
    }
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount >= 10 && wordCount <= 30) confidence += 5;
    return Math.min(confidence, 100);
  }
  /**
   * Get Bloom's level weight
   */
  getBloomsWeight(level) {
    const weights = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 3,
      ANALYZE: 4,
      EVALUATE: 5,
      CREATE: 6
    };
    return weights[level];
  }
  /**
   * Map Bloom's level to Webb's DOK
   */
  bloomsToDOK(level) {
    const mapping = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 2,
      ANALYZE: 3,
      EVALUATE: 3,
      CREATE: 4
    };
    return mapping[level];
  }
  /**
   * Calculate Bloom's distribution from sentence analyses
   */
  calculateBloomsDistribution(analyses) {
    const counts = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    for (const analysis of analyses) {
      counts[analysis.predictedBloomsLevel]++;
    }
    const total = analyses.length || 1;
    return {
      REMEMBER: Math.round(counts.REMEMBER / total * 100),
      UNDERSTAND: Math.round(counts.UNDERSTAND / total * 100),
      APPLY: Math.round(counts.APPLY / total * 100),
      ANALYZE: Math.round(counts.ANALYZE / total * 100),
      EVALUATE: Math.round(counts.EVALUATE / total * 100),
      CREATE: Math.round(counts.CREATE / total * 100)
    };
  }
  /**
   * Calculate weighted Bloom's distribution (by confidence)
   */
  calculateWeightedBloomsDistribution(analyses) {
    const weightedCounts = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    let totalWeight = 0;
    for (const analysis of analyses) {
      const weight = analysis.confidence / 100;
      weightedCounts[analysis.predictedBloomsLevel] += weight;
      totalWeight += weight;
    }
    if (totalWeight === 0) {
      return {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0
      };
    }
    return {
      REMEMBER: Math.round(weightedCounts.REMEMBER / totalWeight * 100),
      UNDERSTAND: Math.round(weightedCounts.UNDERSTAND / totalWeight * 100),
      APPLY: Math.round(weightedCounts.APPLY / totalWeight * 100),
      ANALYZE: Math.round(weightedCounts.ANALYZE / totalWeight * 100),
      EVALUATE: Math.round(weightedCounts.EVALUATE / totalWeight * 100),
      CREATE: Math.round(weightedCounts.CREATE / totalWeight * 100)
    };
  }
  /**
   * Calculate DOK distribution from sentence analyses
   */
  calculateDOKDistribution(analyses) {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const analysis of analyses) {
      counts[analysis.predictedDOKLevel]++;
    }
    const total = analyses.length || 1;
    return {
      level1: Math.round(counts[1] / total * 100),
      level2: Math.round(counts[2] / total * 100),
      level3: Math.round(counts[3] / total * 100),
      level4: Math.round(counts[4] / total * 100)
    };
  }
  /**
   * Calculate overall analysis confidence
   */
  calculateOverallConfidence(analyses) {
    if (analyses.length === 0) return 0;
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
    let sampleBonus = 0;
    if (analyses.length >= 100) sampleBonus = 10;
    else if (analyses.length >= 50) sampleBonus = 5;
    return Math.min(Math.round(avgConfidence + sampleBonus), 100);
  }
  /**
   * Identify content gaps based on distributions
   */
  identifyContentGaps(blooms, dok, contexts) {
    const gaps = [];
    const bloomsLevels = [
      "REMEMBER",
      "UNDERSTAND",
      "APPLY",
      "ANALYZE",
      "EVALUATE",
      "CREATE"
    ];
    for (const level of bloomsLevels) {
      if (blooms[level] === 0) {
        gaps.push({
          type: "missing_level",
          level,
          severity: level === "REMEMBER" || level === "UNDERSTAND" ? "low" : "medium",
          description: `No content at ${level} level detected`,
          recommendation: `Add ${level.toLowerCase()}-level activities or content`
        });
      }
    }
    const lowerOrder = blooms.REMEMBER + blooms.UNDERSTAND;
    if (lowerOrder > 60) {
      gaps.push({
        type: "overrepresented",
        severity: "high",
        description: `${lowerOrder}% of content is at lower-order thinking levels (Remember/Understand)`,
        recommendation: "Add more application, analysis, and evaluation activities"
      });
    }
    const higherOrder = blooms.ANALYZE + blooms.EVALUATE + blooms.CREATE;
    if (higherOrder < 20) {
      gaps.push({
        type: "underrepresented",
        severity: "high",
        description: `Only ${higherOrder}% of content targets higher-order thinking`,
        recommendation: "Increase analytical, evaluative, and creative content to at least 25%"
      });
    }
    const strategicThinking = dok.level3 + dok.level4;
    if (strategicThinking < 15) {
      gaps.push({
        type: "underrepresented",
        severity: "medium",
        description: `Only ${strategicThinking}% of content at DOK Level 3-4 (Strategic/Extended Thinking)`,
        recommendation: "Add strategic thinking tasks and extended projects"
      });
    }
    if (contexts.activity < 10 && contexts.assessment < 10) {
      gaps.push({
        type: "context_imbalance",
        context: "activity",
        severity: "medium",
        description: "Limited practice opportunities detected",
        recommendation: "Add more hands-on activities and practice exercises"
      });
    }
    if (contexts.example < 5) {
      gaps.push({
        type: "context_imbalance",
        context: "example",
        severity: "low",
        description: "Few examples detected in content",
        recommendation: "Add more concrete examples to illustrate concepts"
      });
    }
    return gaps;
  }
  /**
   * Generate actionable recommendations
   */
  generateRecommendations(blooms, dok, gaps, confidence) {
    const recommendations = [];
    const highSeverityGaps = gaps.filter((g) => g.severity === "high");
    for (const gap of highSeverityGaps) {
      recommendations.push(`[Critical] ${gap.recommendation}`);
    }
    if (blooms.REMEMBER + blooms.UNDERSTAND > 50) {
      recommendations.push(
        "Reduce recall-focused content; transform definitions into application exercises"
      );
    }
    if (blooms.CREATE < 5) {
      recommendations.push("Add creative projects or synthesis activities");
    }
    if (blooms.EVALUATE < 10) {
      recommendations.push("Include more critical evaluation and judgment tasks");
    }
    if (blooms.APPLY < 15) {
      recommendations.push("Add more hands-on application exercises and problem-solving");
    }
    if (dok.level4 < 5) {
      recommendations.push("Add extended thinking projects requiring sustained investigation");
    }
    if (confidence < 50) {
      recommendations.push(
        "[Note] Analysis confidence is low. Consider adding more structured content with clear learning objectives"
      );
    }
    const mediumGaps = gaps.filter((g) => g.severity === "medium");
    for (const gap of mediumGaps.slice(0, 3)) {
      recommendations.push(gap.recommendation);
    }
    return [...new Set(recommendations)].slice(0, 10);
  }
  /**
   * Get a summary of the analysis
   */
  getSummary(result) {
    const { bloomsDistribution, dokDistribution, contentGaps, overallConfidence } = result;
    const higherOrder = bloomsDistribution.ANALYZE + bloomsDistribution.EVALUATE + bloomsDistribution.CREATE;
    const strategicThinking = dokDistribution.level3 + dokDistribution.level4;
    const criticalGaps = contentGaps.filter((g) => g.severity === "high").length;
    let overallRating;
    if (higherOrder >= 30 && strategicThinking >= 25 && criticalGaps === 0) {
      overallRating = "excellent";
    } else if (higherOrder >= 20 && strategicThinking >= 15 && criticalGaps <= 1) {
      overallRating = "good";
    } else if (higherOrder >= 10 || criticalGaps <= 2) {
      overallRating = "needs_improvement";
    } else {
      overallRating = "poor";
    }
    const keyStrengths = [];
    if (bloomsDistribution.APPLY >= 20) {
      keyStrengths.push("Strong application-focused content");
    }
    if (higherOrder >= 25) {
      keyStrengths.push("Good higher-order thinking coverage");
    }
    if (overallConfidence >= 70) {
      keyStrengths.push("Clear, well-structured content");
    }
    if (bloomsDistribution.CREATE >= 10) {
      keyStrengths.push("Creative activities present");
    }
    const keyWeaknesses = [];
    for (const gap of contentGaps.filter((g) => g.severity === "high")) {
      keyWeaknesses.push(gap.description);
    }
    const priorityActions = result.recommendations.slice(0, 3);
    return {
      overallRating,
      keyStrengths: keyStrengths.slice(0, 4),
      keyWeaknesses: keyWeaknesses.slice(0, 4),
      priorityActions
    };
  }
};
var deepContentAnalyzer = new DeepContentAnalyzer();

// src/analyzers/transcript-analyzer.ts
var TranscriptAnalyzer = class {
  contentAnalyzer;
  MIN_TRANSCRIPT_LENGTH = 100;
  // Minimum characters
  WORDS_PER_MINUTE_THRESHOLD = 100;
  // Typical speech rate
  constructor(contentAnalyzer) {
    this.contentAnalyzer = contentAnalyzer ?? deepContentAnalyzer;
  }
  /**
   * Analyze transcripts for an entire course
   */
  async analyzeCourseTranscripts(courseId, sources) {
    const videoResults = [];
    const contentSources = [];
    let totalWordCount = 0;
    let totalDuration = 0;
    let totalConfidence = 0;
    let analyzedCount = 0;
    const qualityDistribution = {
      excellent: 0,
      good: 0,
      acceptable: 0,
      poor: 0
    };
    for (const source of sources) {
      const result = await this.analyzeTranscript(source);
      videoResults.push(result);
      if (result.hasTranscript && result.contentAnalysis) {
        analyzedCount++;
        totalWordCount += result.wordCount;
        totalConfidence += result.confidence;
        if (result.duration) {
          totalDuration += result.duration;
        }
        if (result.transcriptQuality) {
          qualityDistribution[result.transcriptQuality.qualityRating]++;
        }
        if (source.transcript) {
          contentSources.push({
            type: "video_transcript",
            content: source.transcript,
            metadata: {
              sourceId: source.sectionId,
              sectionId: source.sectionId,
              chapterId: source.chapterId,
              title: source.sectionTitle ?? "Video Transcript",
              wordCount: result.wordCount,
              duration: source.duration
            }
          });
        }
      }
    }
    let aggregatedAnalysis = null;
    if (contentSources.length > 0) {
      aggregatedAnalysis = await this.contentAnalyzer.analyzeContent(contentSources);
    }
    const videosWithTranscripts = videoResults.filter((r) => r.hasTranscript).length;
    const averageWordsPerMinute = totalDuration > 0 ? Math.round(totalWordCount / totalDuration * 60) : 0;
    const recommendations = this.generateCourseRecommendations(
      sources.length,
      videosWithTranscripts,
      qualityDistribution,
      aggregatedAnalysis
    );
    return {
      courseId,
      totalVideos: sources.length,
      videosWithTranscripts,
      videosAnalyzed: analyzedCount,
      videosMissingTranscripts: sources.length - videosWithTranscripts,
      totalWordCount,
      totalDuration,
      averageWordsPerMinute,
      aggregatedAnalysis,
      averageConfidence: analyzedCount > 0 ? Math.round(totalConfidence / analyzedCount) : 0,
      videoResults,
      transcriptCoveragePercent: sources.length > 0 ? Math.round(videosWithTranscripts / sources.length * 100) : 0,
      qualityDistribution,
      recommendations
    };
  }
  /**
   * Analyze a single video transcript
   */
  async analyzeTranscript(source) {
    const extractionResult = await this.getTranscript(source);
    if (!extractionResult.success || !extractionResult.transcript) {
      return {
        sectionId: source.sectionId,
        chapterId: source.chapterId,
        sectionTitle: source.sectionTitle,
        chapterTitle: source.chapterTitle,
        hasTranscript: false,
        transcriptSource: "custom",
        transcriptQuality: null,
        wordCount: 0,
        duration: source.duration,
        contentAnalysis: null,
        confidence: 0,
        error: extractionResult.error ?? "Transcript not available"
      };
    }
    const transcriptQuality = this.assessTranscriptQuality(
      extractionResult.transcript,
      extractionResult.language
    );
    if (transcriptQuality.qualityRating === "poor") {
      return {
        sectionId: source.sectionId,
        chapterId: source.chapterId,
        sectionTitle: source.sectionTitle,
        chapterTitle: source.chapterTitle,
        hasTranscript: true,
        transcriptSource: extractionResult.source,
        transcriptQuality,
        wordCount: transcriptQuality.wordCount,
        duration: source.duration,
        wordsPerMinute: source.duration ? Math.round(transcriptQuality.wordCount / source.duration * 60) : void 0,
        contentAnalysis: null,
        confidence: 0,
        error: "Transcript quality too low for reliable analysis"
      };
    }
    const contentSource = {
      type: "video_transcript",
      content: extractionResult.transcript,
      metadata: {
        sourceId: source.sectionId,
        sectionId: source.sectionId,
        chapterId: source.chapterId,
        title: source.sectionTitle ?? "Video Transcript",
        wordCount: transcriptQuality.wordCount,
        duration: source.duration
      }
    };
    const contentAnalysis = await this.contentAnalyzer.analyzeSingleSource(contentSource);
    return {
      sectionId: source.sectionId,
      chapterId: source.chapterId,
      sectionTitle: source.sectionTitle,
      chapterTitle: source.chapterTitle,
      hasTranscript: true,
      transcriptSource: extractionResult.source,
      transcriptQuality,
      wordCount: transcriptQuality.wordCount,
      duration: source.duration,
      wordsPerMinute: source.duration ? Math.round(transcriptQuality.wordCount / source.duration * 60) : void 0,
      contentAnalysis,
      confidence: contentAnalysis.overallConfidence
    };
  }
  /**
   * Get transcript from various sources
   */
  async getTranscript(source) {
    if (source.transcript && source.transcript.length >= this.MIN_TRANSCRIPT_LENGTH) {
      return {
        success: true,
        transcript: source.transcript,
        source: "provided",
        language: source.language ?? "en",
        wordCount: source.transcript.split(/\s+/).length,
        confidence: 100
      };
    }
    const platform = this.detectVideoPlatform(source.videoUrl);
    switch (platform) {
      case "youtube":
        return this.extractYouTubeTranscript(source.videoUrl);
      case "vimeo":
        return this.extractVimeoTranscript(source.videoUrl);
      case "mux":
        return this.extractMuxTranscript(source.videoUrl);
      default:
        return {
          success: false,
          transcript: null,
          source: "custom",
          language: "en",
          wordCount: 0,
          confidence: 0,
          error: "Transcript extraction not available for this video platform"
        };
    }
  }
  /**
   * Detect video platform from URL
   */
  detectVideoPlatform(url) {
    if (!url) return "custom";
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      return "youtube";
    }
    if (lowerUrl.includes("vimeo.com")) {
      return "vimeo";
    }
    if (lowerUrl.includes("mux.com") || lowerUrl.includes("stream.mux.com")) {
      return "mux";
    }
    if (lowerUrl.includes("cloudflarestream") || lowerUrl.includes("videodelivery.net")) {
      return "cloudflare";
    }
    return "custom";
  }
  /**
   * Extract YouTube transcript
   * Note: Requires YouTube Data API integration
   */
  async extractYouTubeTranscript(url) {
    return {
      success: false,
      transcript: null,
      source: "youtube",
      language: "en",
      wordCount: 0,
      confidence: 0,
      error: "YouTube transcript extraction not yet implemented. Provide transcript directly."
    };
  }
  /**
   * Extract Vimeo transcript
   * Note: Requires Vimeo API integration
   */
  async extractVimeoTranscript(url) {
    return {
      success: false,
      transcript: null,
      source: "vimeo",
      language: "en",
      wordCount: 0,
      confidence: 0,
      error: "Vimeo transcript extraction not yet implemented. Provide transcript directly."
    };
  }
  /**
   * Extract Mux transcript
   * Note: Mux provides auto-generated captions
   */
  async extractMuxTranscript(url) {
    return {
      success: false,
      transcript: null,
      source: "mux",
      language: "en",
      wordCount: 0,
      confidence: 0,
      error: "Mux transcript extraction not yet implemented. Provide transcript directly."
    };
  }
  /**
   * Assess transcript quality
   */
  assessTranscriptQuality(transcript, language = "en") {
    const words = transcript.split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = Math.max(sentences.length, 1);
    const averageSentenceLength = wordCount / sentenceCount;
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    const vocabularyRichness = wordCount > 0 ? uniqueWords.size / wordCount : 0;
    const avgSyllables = this.estimateAverageSyllables(words);
    const readabilityScore = Math.max(
      0,
      0.39 * averageSentenceLength + 11.8 * avgSyllables - 15.59
    );
    const hasTimestamps = /\d{1,2}:\d{2}/.test(transcript);
    let qualityRating;
    if (wordCount < 50) {
      qualityRating = "poor";
    } else if (wordCount < 200 || vocabularyRichness < 0.3) {
      qualityRating = "acceptable";
    } else if (wordCount >= 500 && vocabularyRichness >= 0.4 && averageSentenceLength >= 8) {
      qualityRating = "excellent";
    } else {
      qualityRating = "good";
    }
    return {
      wordCount,
      averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
      vocabularyRichness: Math.round(vocabularyRichness * 100) / 100,
      readabilityScore: Math.round(readabilityScore * 10) / 10,
      hasTimestamps,
      language,
      qualityRating
    };
  }
  /**
   * Estimate average syllables per word
   */
  estimateAverageSyllables(words) {
    if (words.length === 0) return 1;
    let totalSyllables = 0;
    for (const word of words) {
      totalSyllables += this.countSyllables(word);
    }
    return totalSyllables / words.length;
  }
  /**
   * Count syllables in a word (English approximation)
   */
  countSyllables(word) {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
    if (cleanWord.length <= 3) return 1;
    const vowelGroups = cleanWord.match(/[aeiouy]+/g);
    let count = vowelGroups ? vowelGroups.length : 1;
    if (cleanWord.endsWith("e")) {
      count = Math.max(1, count - 1);
    }
    if (cleanWord.match(/[^aeiou]le$/)) {
      count++;
    }
    return Math.max(1, count);
  }
  /**
   * Generate recommendations for course transcript coverage
   */
  generateCourseRecommendations(totalVideos, videosWithTranscripts, qualityDistribution, analysis) {
    const recommendations = [];
    const coveragePercent = totalVideos > 0 ? Math.round(videosWithTranscripts / totalVideos * 100) : 0;
    if (coveragePercent < 50) {
      recommendations.push(
        `[Critical] Only ${coveragePercent}% of videos have transcripts. Add transcripts to improve accessibility and enable cognitive analysis.`
      );
    } else if (coveragePercent < 80) {
      recommendations.push(
        `[Important] ${100 - coveragePercent}% of videos are missing transcripts. Consider adding them for complete coverage.`
      );
    }
    const poorCount = qualityDistribution.poor;
    const acceptableCount = qualityDistribution.acceptable;
    if (poorCount > 0) {
      recommendations.push(
        `${poorCount} video(s) have poor quality transcripts. Review and improve these transcripts.`
      );
    }
    if (acceptableCount > 2) {
      recommendations.push(
        `${acceptableCount} transcripts are only acceptable quality. Consider improving vocabulary and sentence structure.`
      );
    }
    if (analysis) {
      const { bloomsDistribution } = analysis;
      const lowerOrder = bloomsDistribution.REMEMBER + bloomsDistribution.UNDERSTAND;
      if (lowerOrder > 60) {
        recommendations.push(
          "Video content is heavily focused on recall and understanding. Add more application and analysis examples."
        );
      }
      if (bloomsDistribution.CREATE < 5 && bloomsDistribution.EVALUATE < 10) {
        recommendations.push(
          "Video content lacks higher-order thinking prompts. Include evaluation questions and creative challenges."
        );
      }
    }
    if (videosWithTranscripts < totalVideos) {
      recommendations.push(
        "Add transcripts to all videos for accessibility compliance (WCAG 2.1) and improved SEO."
      );
    }
    return recommendations.slice(0, 8);
  }
  /**
   * Get summary statistics for transcript analysis
   */
  getSummary(result) {
    const { transcriptCoveragePercent, qualityDistribution, averageConfidence } = result;
    let status;
    if (transcriptCoveragePercent >= 90) status = "complete";
    else if (transcriptCoveragePercent >= 50) status = "partial";
    else if (transcriptCoveragePercent > 0) status = "minimal";
    else status = "none";
    let coverageGrade;
    const qualityScore = (qualityDistribution.excellent * 4 + qualityDistribution.good * 3 + qualityDistribution.acceptable * 2 + qualityDistribution.poor * 1) / Math.max(result.videosWithTranscripts, 1);
    const combinedScore = transcriptCoveragePercent * 0.6 + qualityScore * 10 * 0.4;
    if (combinedScore >= 85) coverageGrade = "A";
    else if (combinedScore >= 70) coverageGrade = "B";
    else if (combinedScore >= 55) coverageGrade = "C";
    else if (combinedScore >= 40) coverageGrade = "D";
    else coverageGrade = "F";
    const keyMetrics = {
      "Total Videos": result.totalVideos,
      "With Transcripts": result.videosWithTranscripts,
      "Coverage": `${transcriptCoveragePercent}%`,
      "Total Words": result.totalWordCount.toLocaleString(),
      "Avg Confidence": `${averageConfidence}%`
    };
    if (result.totalDuration > 0) {
      const minutes = Math.round(result.totalDuration / 60);
      keyMetrics["Total Duration"] = `${minutes} min`;
      keyMetrics["Words/Min"] = result.averageWordsPerMinute;
    }
    const actionItems = result.recommendations.slice(0, 3);
    return {
      status,
      coverageGrade,
      keyMetrics,
      actionItems
    };
  }
};
var transcriptAnalyzer = new TranscriptAnalyzer();

// src/engines/enhanced-depth-engine.ts
import { createHash } from "crypto";
var ENGINE_VERSION = "2.0.0";
var noopLogger = {
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
function generateCourseContentHash(course) {
  const contentToHash = {
    title: course.title,
    description: course.description,
    whatYouWillLearn: course.whatYouWillLearn,
    categoryId: course.categoryId ?? null,
    price: course.price ?? null,
    chapters: course.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      position: ch.position,
      sections: ch.sections.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        position: s.position,
        duration: s.duration ?? null,
        videoUrl: s.videoUrl ?? null,
        exams: (s.exams ?? []).map((exam) => ({
          id: exam.id,
          title: exam.title,
          questions: (exam.ExamQuestion ?? []).map((q) => ({
            id: q.id,
            text: q.text ?? q.question,
            type: q.type,
            bloomsLevel: q.bloomsLevel,
            options: (q.options ?? []).map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect }))
          }))
        })),
        questions: (s.Question ?? []).map((q) => ({
          id: q.id,
          text: q.text ?? q.question,
          type: q.type,
          bloomsLevel: q.bloomsLevel,
          options: q.options ?? []
        }))
      }))
    })),
    attachmentsCount: course.attachments.length
  };
  const contentString = JSON.stringify(contentToHash, Object.keys(contentToHash).sort());
  return createHash("sha256").update(contentString).digest("hex").substring(0, 16);
}
var EnhancedDepthAnalysisEngine = class {
  startTime = 0;
  storage;
  logger;
  contentHasher;
  constructor(options = {}) {
    this.storage = options.storage;
    this.logger = options.logger ?? noopLogger;
    this.contentHasher = options.contentHasher ?? generateCourseContentHash;
  }
  /**
   * Perform comprehensive enhanced depth analysis
   */
  async analyze(courseData, options = {}) {
    this.startTime = Date.now();
    const { forceReanalyze = false, includeHistoricalSnapshot = true, analysisDepth = "detailed" } = options;
    this.logger.info(`[EnhancedDepthEngine] Starting analysis for course: ${courseData.id}`);
    const contentHash = this.contentHasher(courseData);
    if (!forceReanalyze) {
      const cached = await this.getCachedAnalysis(courseData.id, contentHash, courseData);
      if (cached) {
        this.logger.info(`[EnhancedDepthEngine] Using cached analysis for course: ${courseData.id}`);
        return cached;
      }
    }
    const courseMetadata = this.buildCourseMetadata(courseData);
    const courseTypeResult = courseTypeDetector.detectCourseType(courseMetadata);
    const chapterAnalysis = await this.analyzeChapters(courseData.chapters, analysisDepth);
    const bloomsDistribution = this.calculateBloomsDistribution(chapterAnalysis);
    const dokDistribution = webbDOKAnalyzer.bloomsToEstimatedDOK(bloomsDistribution);
    const objectivesAnalysis = this.analyzeObjectives(courseData.whatYouWillLearn);
    const objectiveDeduplication = objectiveAnalyzer.analyzeAndDeduplicate(courseData.whatYouWillLearn);
    const assessmentQuality = this.analyzeAssessmentQuality(courseData.chapters);
    const cognitiveDepth = this.calculateCognitiveDepth(bloomsDistribution);
    const balance = this.determineBalance(bloomsDistribution);
    const courseTypeMatch = courseTypeDetector.compareWithIdeal(
      bloomsDistribution,
      courseTypeResult.detectedType
    ).alignmentScore;
    const learningPathway = this.generateLearningPathway(
      bloomsDistribution,
      dokDistribution,
      chapterAnalysis,
      courseTypeResult.detectedType
    );
    const recommendations = this.generateEnhancedRecommendations(
      bloomsDistribution,
      dokDistribution,
      courseTypeResult,
      assessmentQuality,
      objectivesAnalysis,
      chapterAnalysis
    );
    const studentImpact = this.analyzeStudentImpact(
      bloomsDistribution,
      dokDistribution,
      courseTypeResult.detectedType
    );
    const processingTimeMs = Date.now() - this.startTime;
    const metadata = {
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
      courseId: courseData.id,
      contentHash,
      engineVersion: ENGINE_VERSION,
      totalChapters: courseData.chapters.length,
      totalSections: courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
      totalObjectives: courseData.whatYouWillLearn.length,
      completionPercentage: this.calculateCompletionPercentage(courseData),
      analysisDepth,
      cached: false,
      processingTimeMs
    };
    const response = {
      courseLevel: {
        bloomsDistribution,
        dokDistribution,
        cognitiveDepth,
        balance,
        courseType: courseTypeResult.detectedType,
        courseTypeMatch
      },
      chapterAnalysis,
      objectivesAnalysis,
      objectiveDeduplication,
      assessmentQuality,
      learningPathway,
      recommendations,
      studentImpact,
      metadata
    };
    await this.storeAnalysis(courseData.id, response, contentHash);
    if (includeHistoricalSnapshot) {
      await this.storeHistoricalSnapshot(courseData.id, response, contentHash);
    }
    this.logger.info(`[EnhancedDepthEngine] Analysis complete for course: ${courseData.id} in ${processingTimeMs}ms`);
    return response;
  }
  /**
   * Get historical trend data for a course
   */
  async getHistoricalTrends(courseId, limit = 10) {
    if (!this.storage?.listHistoricalSnapshots) {
      return { snapshots: [], trends: [] };
    }
    const snapshots = await this.storage.listHistoricalSnapshots(courseId, limit);
    const trends = [];
    if (snapshots.length >= 2) {
      const latest = snapshots[0];
      const previous = snapshots[1];
      const metrics = ["cognitiveDepth", "balanceScore", "completenessScore"];
      for (const metric of metrics) {
        const change = latest[metric] - previous[metric];
        let direction;
        if (Math.abs(change) < 1) {
          direction = "stable";
        } else if (change > 0) {
          direction = "improving";
        } else {
          direction = "declining";
        }
        trends.push({ metric, change: Math.round(change * 10) / 10, direction });
      }
    }
    return { snapshots, trends };
  }
  /**
   * Build course metadata for type detection
   */
  buildCourseMetadata(courseData) {
    const totalDuration = courseData.chapters.reduce(
      (sum, ch) => sum + ch.sections.reduce((sSum, s) => sSum + (s.duration ?? 0), 0),
      0
    );
    const sectionCount = courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
    return {
      title: courseData.title,
      description: courseData.description ?? "",
      category: courseData.category?.name ?? "Uncategorized",
      learningObjectives: courseData.whatYouWillLearn,
      prerequisites: [],
      targetAudience: "",
      chaptersCount: courseData.chapters.length,
      averageSectionDuration: sectionCount > 0 ? totalDuration / sectionCount : 0,
      hasProjects: courseData.whatYouWillLearn.some(
        (obj) => /project|build|create|design/i.test(obj)
      ),
      hasAssessments: courseData.chapters.some(
        (ch) => ch.sections.some((s) => (s.exams?.length ?? 0) > 0 || (s.Question?.length ?? 0) > 0)
      ),
      hasCodingExercises: courseData.whatYouWillLearn.some(
        (obj) => /code|program|develop|implement/i.test(obj)
      )
    };
  }
  /**
   * Analyze chapters with enhanced metrics
   */
  async analyzeChapters(chapters, depth) {
    const analyses = [];
    for (const chapter of chapters) {
      const sectionAnalyses = this.analyzeSections(chapter.sections, depth);
      const bloomsDistribution = this.calculateSectionBloomsDistribution(sectionAnalyses);
      const dokDistribution = webbDOKAnalyzer.bloomsToEstimatedDOK(bloomsDistribution);
      const primaryBloomsLevel = this.getPrimaryLevel(bloomsDistribution);
      const primaryDOKLevel = bloomsToDOK(primaryBloomsLevel);
      const cognitiveDepth = this.calculateCognitiveDepth(bloomsDistribution);
      const { strengths, weaknesses } = this.analyzeChapterStrengthsWeaknesses(
        bloomsDistribution,
        sectionAnalyses
      );
      const recommendations = this.generateChapterRecommendations(
        chapter,
        bloomsDistribution,
        weaknesses
      );
      analyses.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        position: chapter.position,
        bloomsDistribution,
        dokDistribution,
        primaryBloomsLevel,
        primaryDOKLevel,
        cognitiveDepth,
        complexity: {
          vocabularyLevel: cognitiveDepth > 70 ? "advanced" : cognitiveDepth > 50 ? "intermediate" : "basic",
          conceptDensity: sectionAnalyses.length / (chapter.description?.length ?? 100) * 100,
          prerequisiteCount: 0,
          estimatedStudyTime: sectionAnalyses.reduce((sum, s) => sum + 15, 0)
        },
        sections: sectionAnalyses,
        strengths,
        weaknesses,
        recommendations
      });
    }
    return analyses;
  }
  /**
   * Analyze sections
   */
  analyzeSections(sections, depth) {
    return sections.map((section) => {
      const content = `${section.title} ${section.description ?? ""}`;
      const dokAnalysis = webbDOKAnalyzer.analyzeContent(content);
      const bloomsLevel = this.inferBloomsLevel(content);
      return {
        sectionId: section.id,
        sectionTitle: section.title,
        position: section.position,
        bloomsLevel,
        dokLevel: dokAnalysis.level,
        activities: this.extractActivities(section, bloomsLevel),
        learningObjectives: [],
        contentDepth: dokAnalysis.confidence,
        engagementScore: this.calculateEngagementScore(section)
      };
    });
  }
  /**
   * Extract activities from section
   */
  extractActivities(section, bloomsLevel) {
    const activities = [];
    if (section.videoUrl) {
      activities.push({
        type: "Video Lesson",
        bloomsLevel,
        dokLevel: bloomsToDOK(bloomsLevel),
        description: "Watch and understand concepts",
        engagementPotential: 75
      });
    }
    if (section.exams && section.exams.length > 0) {
      activities.push({
        type: "Assessment",
        bloomsLevel: "EVALUATE",
        dokLevel: 3,
        description: "Test understanding through exam",
        engagementPotential: 80
      });
    }
    if (section.Question && section.Question.length > 0) {
      activities.push({
        type: "Practice Questions",
        bloomsLevel: "APPLY",
        dokLevel: 2,
        description: "Apply knowledge through practice",
        engagementPotential: 70
      });
    }
    return activities;
  }
  /**
   * Calculate engagement score
   */
  calculateEngagementScore(section) {
    let score = 50;
    if (section.videoUrl) score += 20;
    if (section.exams && section.exams.length > 0) score += 15;
    if (section.Question && section.Question.length > 0) score += 15;
    return Math.min(score, 100);
  }
  /**
   * Analyze objectives
   */
  analyzeObjectives(objectives) {
    return objectives.map((obj) => objectiveAnalyzer.analyzeObjective(obj));
  }
  /**
   * Analyze assessment quality
   */
  analyzeAssessmentQuality(chapters) {
    const exams = [];
    for (const chapter of chapters) {
      for (const section of chapter.sections) {
        if (section.exams) {
          for (const exam of section.exams) {
            const questions = (exam.ExamQuestion ?? []).map((q) => ({
              id: q.id,
              text: q.text ?? q.question ?? "",
              type: q.type ?? "multiple_choice",
              bloomsLevel: q.bloomsLevel,
              explanation: q.explanation,
              options: q.options?.map((o) => ({
                id: o.id,
                text: o.text,
                isCorrect: o.isCorrect
              }))
            }));
            exams.push({
              id: exam.id,
              title: exam.title,
              questions
            });
          }
        }
      }
    }
    return assessmentQualityAnalyzer.analyzeAssessments(exams);
  }
  /**
   * Calculate Bloom's distribution from chapter analyses
   */
  calculateBloomsDistribution(chapters) {
    if (chapters.length === 0) {
      return { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 };
    }
    const distribution = { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 };
    for (const chapter of chapters) {
      for (const level of Object.keys(distribution)) {
        distribution[level] += chapter.bloomsDistribution[level];
      }
    }
    for (const level of Object.keys(distribution)) {
      distribution[level] = Math.round(distribution[level] / chapters.length);
    }
    return distribution;
  }
  /**
   * Calculate section-level Bloom's distribution
   */
  calculateSectionBloomsDistribution(sections) {
    const distribution = { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 };
    if (sections.length === 0) return distribution;
    for (const section of sections) {
      distribution[section.bloomsLevel]++;
    }
    for (const level of Object.keys(distribution)) {
      distribution[level] = Math.round(distribution[level] / sections.length * 100);
    }
    return distribution;
  }
  /**
   * Calculate cognitive depth score
   */
  calculateCognitiveDepth(distribution) {
    let weightedSum = 0;
    let totalPercentage = 0;
    for (const [level, percentage] of Object.entries(distribution)) {
      const weight = getBloomsWeight(level);
      weightedSum += weight * percentage;
      totalPercentage += percentage;
    }
    if (totalPercentage === 0) return 0;
    return Math.round(weightedSum / totalPercentage * 16.67);
  }
  /**
   * Determine balance
   */
  determineBalance(distribution) {
    const lower = distribution.REMEMBER + distribution.UNDERSTAND;
    const higher = distribution.EVALUATE + distribution.CREATE;
    if (lower > 60) return "bottom-heavy";
    if (higher > 40) return "top-heavy";
    return "well-balanced";
  }
  calculateBalanceScore(distribution) {
    const ideal = {
      REMEMBER: 10,
      UNDERSTAND: 20,
      APPLY: 25,
      ANALYZE: 20,
      EVALUATE: 15,
      CREATE: 10
    };
    let balanceScore = 100;
    Object.keys(ideal).forEach((level) => {
      const diff = Math.abs((distribution[level] ?? 0) - ideal[level]);
      balanceScore -= diff * 0.5;
    });
    return Math.max(0, Math.round(balanceScore));
  }
  /**
   * Get primary Bloom's level
   */
  getPrimaryLevel(distribution) {
    let maxLevel = "UNDERSTAND";
    let maxValue = 0;
    for (const [level, value] of Object.entries(distribution)) {
      if (value > maxValue) {
        maxValue = value;
        maxLevel = level;
      }
    }
    return maxLevel;
  }
  /**
   * Infer Bloom's level from text
   */
  inferBloomsLevel(text) {
    const lowerText = text.toLowerCase();
    const levels = ["CREATE", "EVALUATE", "ANALYZE", "APPLY", "UNDERSTAND", "REMEMBER"];
    for (const level of levels) {
      const mapping = BLOOMS_KEYWORD_MAP.find((m) => m.level === level);
      if (mapping) {
        for (const keyword of mapping.keywords) {
          if (lowerText.includes(keyword)) {
            return level;
          }
        }
      }
    }
    return "UNDERSTAND";
  }
  /**
   * Analyze chapter strengths and weaknesses
   */
  analyzeChapterStrengthsWeaknesses(distribution, sections) {
    const strengths = [];
    const weaknesses = [];
    if (distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE > 30) {
      strengths.push("Good coverage of higher-order thinking skills");
    } else {
      weaknesses.push("Limited higher-order thinking activities");
    }
    const activeTypes = new Set(sections.flatMap((s) => s.activities.map((a) => a.type)));
    if (activeTypes.size >= 3) {
      strengths.push("Diverse activity types");
    } else {
      weaknesses.push("Could benefit from more activity variety");
    }
    const avgEngagement = sections.reduce((sum, s) => sum + s.engagementScore, 0) / sections.length;
    if (avgEngagement >= 70) {
      strengths.push("High engagement potential");
    } else if (avgEngagement < 50) {
      weaknesses.push("Low engagement potential");
    }
    return { strengths, weaknesses };
  }
  /**
   * Generate chapter-specific recommendations
   */
  generateChapterRecommendations(chapter, distribution, weaknesses) {
    const recommendations = [];
    if (distribution.CREATE < 10) {
      recommendations.push({
        type: "activity",
        priority: "high",
        title: "Add Creative Activities",
        description: "Include project-based or creative tasks",
        impact: "Improves cognitive depth and student engagement",
        implementation: ["Add a mini-project", "Include a design challenge", "Create a synthesis activity"]
      });
    }
    if (weaknesses.includes("Limited higher-order thinking activities")) {
      recommendations.push({
        type: "content",
        priority: "medium",
        title: "Add Analysis Tasks",
        description: "Include comparison and analytical exercises",
        impact: "Develops critical thinking skills",
        implementation: ["Add case studies", "Include compare/contrast exercises", "Add data analysis tasks"]
      });
    }
    return recommendations;
  }
  /**
   * Generate learning pathway
   */
  generateLearningPathway(bloomsDistribution, dokDistribution, chapters, courseType) {
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    const currentStages = levels.map((level, index) => ({
      level,
      dokLevel: bloomsToDOK(level),
      mastery: bloomsDistribution[level],
      activities: this.getActivitiesForLevel(chapters, level),
      timeEstimate: Math.round(bloomsDistribution[level] * 0.5)
    }));
    const recommendedStages = levels.map((level, index) => ({
      level,
      dokLevel: bloomsToDOK(level),
      mastery: Math.max(80 - index * 10, 40),
      activities: this.getRecommendedActivities(level),
      timeEstimate: 10 + index * 5
    }));
    const gaps = this.identifyGaps(currentStages, recommendedStages);
    return {
      current: {
        stages: currentStages,
        currentStage: this.determineCurrentStage(currentStages),
        completionPercentage: this.calculatePathCompletion(currentStages)
      },
      recommended: {
        stages: recommendedStages,
        currentStage: 0,
        completionPercentage: 0
      },
      gaps,
      milestones: this.generateMilestones(levels)
    };
  }
  /**
   * Get activities for a level
   */
  getActivitiesForLevel(chapters, level) {
    const activities = /* @__PURE__ */ new Set();
    for (const chapter of chapters) {
      for (const section of chapter.sections) {
        if (section.bloomsLevel === level) {
          for (const activity of section.activities) {
            activities.add(activity.type);
          }
        }
      }
    }
    return Array.from(activities);
  }
  /**
   * Get recommended activities for level
   */
  getRecommendedActivities(level) {
    const activities = {
      REMEMBER: ["Flashcards", "Quizzes", "Memorization exercises"],
      UNDERSTAND: ["Concept maps", "Summaries", "Explanations"],
      APPLY: ["Practice problems", "Case studies", "Simulations"],
      ANALYZE: ["Comparisons", "Research projects", "Data analysis"],
      EVALUATE: ["Critiques", "Debates", "Peer reviews"],
      CREATE: ["Projects", "Presentations", "Original works"]
    };
    return activities[level];
  }
  /**
   * Identify gaps between current and recommended
   */
  identifyGaps(current, recommended) {
    const gaps = [];
    for (let i = 0; i < current.length; i++) {
      const gap = recommended[i].mastery - current[i].mastery;
      if (gap > 20) {
        gaps.push({
          level: current[i].level,
          dokLevel: current[i].dokLevel,
          severity: gap > 40 ? "high" : gap > 30 ? "medium" : "low",
          description: `${current[i].level} mastery is ${current[i].mastery.toFixed(1)}%, recommended is ${recommended[i].mastery}%`,
          suggestions: this.getRecommendedActivities(current[i].level),
          estimatedEffortHours: Math.ceil(gap / 10)
        });
      }
    }
    return gaps;
  }
  /**
   * Determine current stage
   */
  determineCurrentStage(stages) {
    for (let i = stages.length - 1; i >= 0; i--) {
      if (stages[i].mastery > 50) {
        return i;
      }
    }
    return 0;
  }
  /**
   * Calculate path completion
   */
  calculatePathCompletion(stages) {
    const totalMastery = stages.reduce((sum, stage) => sum + stage.mastery, 0);
    return Math.round(totalMastery / stages.length);
  }
  /**
   * Generate milestones
   */
  generateMilestones(levels) {
    return levels.map((level) => ({
      title: `Master ${level.charAt(0) + level.slice(1).toLowerCase()} Skills`,
      bloomsLevel: level,
      dokLevel: bloomsToDOK(level),
      description: `Achieve proficiency in ${level.toLowerCase()}-level activities`,
      assessmentCriteria: [`Pass ${level.toLowerCase()}-level assessment`, `Complete ${level.toLowerCase()}-focused activities`]
    }));
  }
  /**
   * Generate enhanced recommendations
   */
  generateEnhancedRecommendations(bloomsDistribution, dokDistribution, courseTypeResult, assessmentQuality, objectivesAnalysis, chapters) {
    const immediate = [];
    const shortTerm = [];
    const longTerm = [];
    if (assessmentQuality.overallScore < 70) {
      immediate.push({
        id: "assessment-quality",
        priority: "critical",
        type: "assessment",
        category: "Quality",
        title: "Improve Assessment Quality",
        description: assessmentQuality.bloomsCoverage.recommendation,
        impact: "Higher assessment quality leads to better learning outcomes",
        effort: "medium",
        estimatedTime: "2-3 hours",
        actionSteps: ["Review existing questions", "Add varied question types", "Include explanations"],
        examples: ["Add case-based questions", "Include practical scenarios"],
        bloomsTarget: "ANALYZE",
        dokTarget: 3
      });
    }
    const weakObjectives = objectivesAnalysis.filter((o) => o.clarityScore < 60);
    if (weakObjectives.length > 0) {
      immediate.push({
        id: "objective-clarity",
        priority: "high",
        type: "objectives",
        category: "Clarity",
        title: "Clarify Learning Objectives",
        description: `${weakObjectives.length} objectives need improvement`,
        impact: "Clear objectives improve student focus and outcomes",
        effort: "low",
        estimatedTime: "1-2 hours",
        actionSteps: weakObjectives[0].suggestions,
        examples: [weakObjectives[0].improvedVersion],
        bloomsTarget: weakObjectives[0].bloomsLevel,
        dokTarget: weakObjectives[0].dokLevel
      });
    }
    if (courseTypeResult.confidence < 50) {
      shortTerm.push({
        id: "course-positioning",
        priority: "medium",
        type: "content",
        category: "Positioning",
        title: "Clarify Course Positioning",
        description: "Course type is unclear from content",
        impact: "Better positioning attracts target audience",
        effort: "medium",
        estimatedTime: "3-4 hours",
        actionSteps: courseTypeResult.recommendations,
        examples: [],
        bloomsTarget: "UNDERSTAND",
        dokTarget: 2
      });
    }
    if (bloomsDistribution.CREATE < 10) {
      longTerm.push({
        id: "creative-activities",
        priority: "medium",
        type: "activity",
        category: "Cognitive Depth",
        title: "Add Creative Activities",
        description: "Course lacks CREATE-level activities",
        impact: "Creative activities develop innovation skills",
        effort: "high",
        estimatedTime: "5-10 hours",
        actionSteps: ["Design a capstone project", "Add portfolio assignments", "Include open-ended challenges"],
        examples: ["Final project", "Original design task", "Synthesis essay"],
        bloomsTarget: "CREATE",
        dokTarget: 4
      });
    }
    return {
      immediate,
      shortTerm,
      longTerm,
      contentAdjustments: this.generateContentAdjustments(bloomsDistribution, chapters),
      assessmentChanges: this.generateAssessmentChanges(assessmentQuality),
      activitySuggestions: this.generateActivitySuggestions(dokDistribution)
    };
  }
  /**
   * Generate content adjustments
   */
  generateContentAdjustments(distribution, chapters) {
    const adjustments = [];
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    for (const level of levels) {
      if (distribution[level] < 10) {
        adjustments.push({
          type: "add",
          targetChapter: null,
          targetSection: null,
          bloomsLevel: level,
          dokLevel: bloomsToDOK(level),
          description: `Add more ${level.toLowerCase()}-focused content`,
          impact: "high",
          implementation: this.getRecommendedActivities(level)
        });
      }
    }
    return adjustments;
  }
  /**
   * Generate assessment changes
   */
  generateAssessmentChanges(quality) {
    const changes = [];
    for (const level of quality.bloomsCoverage.missingLevels) {
      changes.push({
        type: "add",
        bloomsLevel: level,
        dokLevel: bloomsToDOK(level),
        description: `Add ${level.toLowerCase()}-level assessment questions`,
        examples: this.getRecommendedActivities(level),
        rubricSuggestion: `Create rubric for ${level.toLowerCase()}-level tasks`
      });
    }
    return changes;
  }
  /**
   * Generate activity suggestions
   */
  generateActivitySuggestions(dokDistribution) {
    const suggestions = [];
    if (dokDistribution.level3 < 20) {
      suggestions.push({
        bloomsLevel: "ANALYZE",
        dokLevel: 3,
        activityType: "Case Study Analysis",
        description: "Add strategic thinking activities",
        implementation: "Present real-world scenarios requiring analysis and decision-making",
        expectedOutcome: "Students develop analytical and problem-solving skills",
        materials: ["Case study documents", "Analysis templates", "Discussion guides"],
        timeRequired: "45-60 minutes per case"
      });
    }
    if (dokDistribution.level4 < 10) {
      suggestions.push({
        bloomsLevel: "CREATE",
        dokLevel: 4,
        activityType: "Extended Project",
        description: "Add extended thinking projects",
        implementation: "Assign multi-week projects requiring original research and creation",
        expectedOutcome: "Students develop synthesis and innovation skills",
        materials: ["Project guidelines", "Milestone checkpoints", "Rubric"],
        timeRequired: "2-4 weeks"
      });
    }
    return suggestions;
  }
  /**
   * Analyze student impact
   */
  analyzeStudentImpact(bloomsDistribution, dokDistribution, courseType) {
    const skillsDeveloped = [];
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    for (const level of levels) {
      if (bloomsDistribution[level] > 10) {
        skillsDeveloped.push({
          name: this.getSkillName(level),
          bloomsLevel: level,
          dokLevel: bloomsToDOK(level),
          proficiency: bloomsDistribution[level],
          description: this.getSkillDescription(level),
          industryRelevance: this.getIndustryRelevance(level, courseType)
        });
      }
    }
    const cognitiveDepth = this.calculateCognitiveDepth(bloomsDistribution);
    return {
      skillsDeveloped,
      cognitiveGrowth: {
        currentLevel: cognitiveDepth,
        projectedLevel: Math.min(cognitiveDepth + 20, 100),
        timeframe: "3-6 months",
        keyMilestones: ["Master foundational concepts", "Develop analytical skills", "Create original solutions"],
        confidenceInterval: { low: cognitiveDepth + 10, high: cognitiveDepth + 30 }
      },
      careerAlignment: this.getCareerAlignment(skillsDeveloped, courseType),
      competencyGains: []
    };
  }
  /**
   * Get skill name
   */
  getSkillName(level) {
    const names = {
      REMEMBER: "Information Retention",
      UNDERSTAND: "Conceptual Understanding",
      APPLY: "Practical Application",
      ANALYZE: "Analytical Thinking",
      EVALUATE: "Critical Evaluation",
      CREATE: "Creative Innovation"
    };
    return names[level];
  }
  /**
   * Get skill description
   */
  getSkillDescription(level) {
    const descriptions = {
      REMEMBER: "Ability to recall and recognize key information",
      UNDERSTAND: "Capability to explain concepts and ideas clearly",
      APPLY: "Skill in using knowledge in practical situations",
      ANALYZE: "Competence in breaking down complex problems",
      EVALUATE: "Expertise in making informed judgments",
      CREATE: "Proficiency in generating original solutions"
    };
    return descriptions[level];
  }
  /**
   * Get industry relevance
   */
  getIndustryRelevance(level, courseType) {
    const baseRelevance = {
      REMEMBER: 50,
      UNDERSTAND: 60,
      APPLY: 80,
      ANALYZE: 85,
      EVALUATE: 85,
      CREATE: 90
    };
    let adjustment = 0;
    if (courseType === "technical" && (level === "APPLY" || level === "CREATE")) {
      adjustment = 10;
    }
    if (courseType === "theoretical" && (level === "ANALYZE" || level === "EVALUATE")) {
      adjustment = 10;
    }
    return Math.min(baseRelevance[level] + adjustment, 100);
  }
  /**
   * Get career alignment
   */
  getCareerAlignment(skills, courseType) {
    const careers = [];
    const skillNames = skills.map((s) => s.name);
    if (courseType === "technical" || skillNames.includes("Practical Application")) {
      careers.push({
        role: "Software Developer",
        alignment: 85,
        requiredSkills: ["Problem Solving", "Critical Thinking", "Creativity"],
        matchedSkills: skillNames,
        gapSkills: [],
        developmentPlan: "Focus on practical projects and portfolio building"
      });
    }
    if (skillNames.includes("Analytical Thinking")) {
      careers.push({
        role: "Data Analyst",
        alignment: 75,
        requiredSkills: ["Analytical Thinking", "Problem Solving", "Attention to Detail"],
        matchedSkills: skillNames.filter((s) => s.includes("Analy") || s.includes("Evaluat")),
        gapSkills: ["Statistical Analysis"],
        developmentPlan: "Add statistical and data visualization skills"
      });
    }
    return careers;
  }
  /**
   * Calculate completion percentage
   */
  calculateCompletionPercentage(courseData) {
    let score = 0;
    if (courseData.title) score += 15;
    if (courseData.description) score += 15;
    if (courseData.whatYouWillLearn.length > 0) score += 20;
    if (courseData.category) score += 10;
    if (courseData.chapters.length > 0) score += 25;
    if (courseData.attachments.length > 0) score += 15;
    return score;
  }
  /**
   * Get cached analysis
   */
  async getCachedAnalysis(courseId, contentHash, courseData) {
    if (!this.storage) {
      return null;
    }
    try {
      const existing = await this.storage.getCachedAnalysis(courseId);
      if (existing && existing.contentHash === contentHash) {
        return {
          courseLevel: {
            bloomsDistribution: existing.bloomsDistribution,
            dokDistribution: existing.dokDistribution ?? webbDOKAnalyzer.bloomsToEstimatedDOK(existing.bloomsDistribution),
            cognitiveDepth: existing.cognitiveDepth,
            balance: this.determineBalance(existing.bloomsDistribution),
            courseType: existing.courseType ?? "intermediate",
            courseTypeMatch: existing.courseTypeMatch ?? 50
          },
          chapterAnalysis: [],
          objectivesAnalysis: existing.objectiveAnalysis ?? [],
          objectiveDeduplication: {
            totalObjectives: 0,
            uniqueClusters: 0,
            duplicateGroups: [],
            recommendations: [],
            optimizedObjectives: []
          },
          assessmentQuality: existing.assessmentQuality ?? assessmentQualityAnalyzer.analyzeAssessments([]),
          learningPathway: existing.learningPathway,
          recommendations: existing.recommendations,
          studentImpact: {
            skillsDeveloped: existing.skillsMatrix ?? [],
            cognitiveGrowth: {
              currentLevel: existing.cognitiveDepth,
              projectedLevel: Math.min(existing.cognitiveDepth + 20, 100),
              timeframe: "3-6 months",
              keyMilestones: [],
              confidenceInterval: { low: existing.cognitiveDepth + 10, high: existing.cognitiveDepth + 30 }
            },
            careerAlignment: [],
            competencyGains: []
          },
          metadata: {
            analyzedAt: existing.analyzedAt.toISOString(),
            courseId,
            contentHash,
            engineVersion: ENGINE_VERSION,
            totalChapters: courseData?.chapters.length ?? 0,
            totalSections: courseData ? courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0) : 0,
            totalObjectives: courseData?.whatYouWillLearn.length ?? 0,
            completionPercentage: courseData ? this.calculateCompletionPercentage(courseData) : 0,
            analysisDepth: "detailed",
            cached: true,
            processingTimeMs: 0
          }
        };
      }
    } catch (error) {
      this.logger.error("[EnhancedDepthEngine] Error fetching cached analysis:", error);
    }
    return null;
  }
  /**
   * Store analysis results
   */
  async storeAnalysis(courseId, response, contentHash) {
    if (!this.storage) {
      return;
    }
    try {
      const payload = {
        courseId,
        contentHash,
        analyzedAt: /* @__PURE__ */ new Date(),
        bloomsDistribution: response.courseLevel.bloomsDistribution,
        cognitiveDepth: response.courseLevel.cognitiveDepth,
        learningPathway: response.learningPathway,
        skillsMatrix: response.studentImpact.skillsDeveloped,
        gapAnalysis: response.learningPathway.gaps,
        recommendations: response.recommendations,
        dokDistribution: response.courseLevel.dokDistribution,
        courseType: response.courseLevel.courseType,
        courseTypeMatch: response.courseLevel.courseTypeMatch,
        assessmentQuality: response.assessmentQuality,
        objectiveAnalysis: response.objectivesAnalysis
      };
      await this.storage.saveAnalysis(courseId, payload);
    } catch (error) {
      this.logger.error("[EnhancedDepthEngine] Error storing analysis:", error);
    }
  }
  /**
   * Store historical snapshot
   */
  async storeHistoricalSnapshot(courseId, response, contentHash) {
    if (!this.storage?.createHistoricalSnapshot) {
      return;
    }
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
      if (this.storage.hasRecentSnapshot) {
        const hasRecent = await this.storage.hasRecentSnapshot(courseId, oneHourAgo);
        if (hasRecent) {
          return;
        }
      }
      await this.storage.createHistoricalSnapshot({
        courseId,
        snapshotAt: /* @__PURE__ */ new Date(),
        cognitiveDepth: response.courseLevel.cognitiveDepth,
        balanceScore: this.calculateBalanceScore(response.courseLevel.bloomsDistribution),
        completenessScore: response.metadata.completionPercentage,
        totalChapters: response.metadata.totalChapters,
        totalObjectives: response.metadata.totalObjectives,
        metadata: {
          contentHash,
          engineVersion: ENGINE_VERSION,
          totalSections: response.metadata.totalSections,
          assessmentQuality: response.assessmentQuality.overallScore,
          bloomsDistribution: response.courseLevel.bloomsDistribution,
          dokDistribution: response.courseLevel.dokDistribution
        }
      });
    } catch (error) {
      this.logger.error("[EnhancedDepthEngine] Error storing historical snapshot:", error);
    }
  }
};
var enhancedDepthEngine = new EnhancedDepthAnalysisEngine();
var createEnhancedDepthAnalysisEngine = (options) => new EnhancedDepthAnalysisEngine(options);

export {
  WebbDOKAnalyzer,
  webbDOKAnalyzer,
  AssessmentQualityAnalyzer,
  assessmentQualityAnalyzer,
  CourseTypeDetector,
  courseTypeDetector,
  ObjectiveAnalyzer,
  objectiveAnalyzer,
  DeterministicRubricEngine,
  serializeAnalysisResult,
  calculateCourseTypeAlignment,
  deterministicRubricEngine,
  DeepContentAnalyzer,
  deepContentAnalyzer,
  TranscriptAnalyzer,
  transcriptAnalyzer,
  generateCourseContentHash,
  EnhancedDepthAnalysisEngine,
  enhancedDepthEngine,
  createEnhancedDepthAnalysisEngine
};
