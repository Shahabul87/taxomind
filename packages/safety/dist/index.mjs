// src/types.ts
var DEFAULT_FAIRNESS_CONFIG = {
  minPassingScore: 70,
  checkDiscouragingLanguage: true,
  checkBias: true,
  checkAccessibility: true,
  checkConstructiveFraming: true,
  targetGradeLevel: 8,
  maxReadingLevel: 12
};
var SEVERITY_WEIGHTS = {
  low: 5,
  medium: 15,
  high: 30,
  critical: 50
};

// src/discouraging-language-detector.ts
var ABSOLUTE_NEGATIVE_PATTERNS = [
  {
    pattern: /\byou\s+(will\s+)?never\b/gi,
    category: "absolute_negative",
    severity: "high",
    alternative: "With practice, you can improve on..."
  },
  {
    pattern: /\byou\s+can'?t\s+(do|understand|learn|get)\b/gi,
    category: "absolute_negative",
    severity: "high",
    alternative: "This is challenging, but you can work towards..."
  },
  {
    pattern: /\b(impossible|hopeless)\s+for\s+you\b/gi,
    category: "absolute_negative",
    severity: "critical",
    alternative: "This requires additional effort, but is achievable..."
  },
  {
    pattern: /\bwill\s+always\s+(fail|struggle|have\s+trouble)\b/gi,
    category: "absolute_negative",
    severity: "critical",
    alternative: "Currently, there are challenges with..."
  },
  {
    pattern: /\bthere'?s\s+no\s+(hope|point|chance)\b/gi,
    category: "hopelessness",
    severity: "critical",
    alternative: "There is an opportunity to improve by..."
  }
];
var PERSONAL_ATTACK_PATTERNS = [
  {
    pattern: /\byou'?re\s+(not\s+)?(smart|intelligent|bright|capable)\s+enough\b/gi,
    category: "personal_attack",
    severity: "critical",
    alternative: "This concept requires additional practice..."
  },
  {
    pattern: /\byou\s+(are|seem)\s+(lazy|careless|sloppy|stupid)\b/gi,
    category: "personal_attack",
    severity: "critical",
    alternative: "More attention to detail would help..."
  },
  {
    pattern: /\bwhat'?s\s+wrong\s+with\s+you\b/gi,
    category: "personal_attack",
    severity: "critical",
    alternative: "Let me help identify areas for improvement..."
  },
  {
    pattern: /\bhow\s+could\s+you\s+(not\s+know|miss|forget)\b/gi,
    category: "personal_attack",
    severity: "high",
    alternative: "This is an important concept to remember..."
  }
];
var DISMISSIVE_PATTERNS = [
  {
    pattern: /\bthis\s+is\s+(completely\s+)?(wrong|incorrect|bad)\b/gi,
    category: "dismissive",
    severity: "medium",
    alternative: "This needs some adjustment. Consider..."
  },
  {
    pattern: /\byou\s+(clearly\s+)?didn'?t\s+(read|understand|pay\s+attention)\b/gi,
    category: "dismissive",
    severity: "high",
    alternative: "It appears there may be a misunderstanding about..."
  },
  {
    pattern: /\b(totally|completely|utterly)\s+(wrong|missed|failed)\b/gi,
    category: "dismissive",
    severity: "medium",
    alternative: "There are some areas that need revision..."
  },
  {
    pattern: /\bdon'?t\s+(even\s+)?bother\b/gi,
    category: "dismissive",
    severity: "high",
    alternative: "Focus your efforts on..."
  }
];
var COMPARISON_PATTERNS = [
  {
    pattern: /\bunlike\s+(other|most|your)\s+students\b/gi,
    category: "comparing_negatively",
    severity: "high",
    alternative: "In this area, you can improve by..."
  },
  {
    pattern: /\beveryone\s+else\s+(got|understands|knows)\b/gi,
    category: "comparing_negatively",
    severity: "high",
    alternative: "This is a common challenge. To address it..."
  },
  {
    pattern: /\byou'?re\s+(falling\s+)?behind\s+(the\s+)?(class|others)\b/gi,
    category: "comparing_negatively",
    severity: "medium",
    alternative: "There is an opportunity to strengthen this area..."
  },
  {
    pattern: /\b(worst|lowest|weakest)\s+(in\s+the\s+)?(class|group)\b/gi,
    category: "comparing_negatively",
    severity: "high",
    alternative: "This is an area where focused practice would help..."
  }
];
var HOPELESSNESS_PATTERNS = [
  {
    pattern: /\bit'?s\s+too\s+late\s+(to|for)\b/gi,
    category: "hopelessness",
    severity: "high",
    alternative: "There is still time to improve by focusing on..."
  },
  {
    pattern: /\b(give\s+up|giving\s+up)\b/gi,
    category: "hopelessness",
    severity: "critical",
    alternative: "Consider a different approach to..."
  },
  {
    pattern: /\bno\s+point\s+(in\s+)?(trying|continuing)\b/gi,
    category: "hopelessness",
    severity: "critical",
    alternative: "Each attempt brings learning. Focus on..."
  },
  {
    pattern: /\bwaste\s+of\s+(time|effort)\b/gi,
    category: "hopelessness",
    severity: "high",
    alternative: "The effort is valuable. To make it more effective..."
  }
];
var LABELING_PATTERNS = [
  {
    pattern: /\byou'?re\s+a\s+(bad|poor|weak|terrible)\s+student\b/gi,
    category: "labeling",
    severity: "critical",
    alternative: "Your work in this area can be improved..."
  },
  {
    pattern: /\b(failure|loser)\b/gi,
    category: "labeling",
    severity: "critical",
    alternative: "This attempt did not meet expectations, but..."
  },
  {
    pattern: /\byou'?re\s+(just\s+)?(not\s+)?(good|cut\s+out)\s+for\s+this\b/gi,
    category: "labeling",
    severity: "critical",
    alternative: "This topic requires different strategies. Try..."
  }
];
var SARCASM_PATTERNS = [
  {
    pattern: /\b(oh\s+)?great\s+(job|work)\s*[.!]*\s*(not|wrong|but)\b/gi,
    category: "sarcasm",
    severity: "high",
    alternative: "This needs some work. Specifically..."
  },
  {
    pattern: /\bwow,?\s+(really|seriously)\b/gi,
    category: "sarcasm",
    severity: "medium",
    alternative: "I noticed..."
  },
  {
    pattern: /\b(sure|right),?\s+(if\s+you\s+say\s+so|whatever)\b/gi,
    category: "sarcasm",
    severity: "high",
    alternative: "Let me explain further..."
  }
];
var CONDESCENDING_PATTERNS = [
  {
    pattern: /\b(obviously|clearly|of\s+course)\s+(you|this)\b/gi,
    category: "condescending",
    severity: "medium",
    alternative: "It appears that..."
  },
  {
    pattern: /\beven\s+a\s+(child|beginner|novice)\s+(could|would|can)\b/gi,
    category: "condescending",
    severity: "high",
    alternative: "This is a fundamental concept that..."
  },
  {
    pattern: /\b(surely|certainly)\s+you\s+(know|understand|realize)\b/gi,
    category: "condescending",
    severity: "medium",
    alternative: "Remember that..."
  },
  {
    pattern: /\bi'?m\s+surprised\s+you\s+don'?t\s+know\b/gi,
    category: "condescending",
    severity: "high",
    alternative: "This is an important point to understand..."
  },
  {
    pattern: /\bhow\s+many\s+times\s+(do\s+I|must\s+I)\s+tell\b/gi,
    category: "condescending",
    severity: "high",
    alternative: "To reinforce this concept..."
  }
];
var ALL_PATTERNS = [
  ...ABSOLUTE_NEGATIVE_PATTERNS,
  ...PERSONAL_ATTACK_PATTERNS,
  ...DISMISSIVE_PATTERNS,
  ...COMPARISON_PATTERNS,
  ...HOPELESSNESS_PATTERNS,
  ...LABELING_PATTERNS,
  ...SARCASM_PATTERNS,
  ...CONDESCENDING_PATTERNS
];
var DiscouragingLanguageDetector = class {
  constructor(config = {}) {
    this.patterns = [...ALL_PATTERNS];
    if (config.customPatterns) {
      this.patterns.push(...config.customPatterns);
    }
    if (config.customPhrases) {
      for (const phrase of config.customPhrases) {
        this.patterns.push({
          pattern: new RegExp(`\\b${this.escapeRegex(phrase)}\\b`, "gi"),
          category: "dismissive",
          severity: "medium",
          alternative: "Consider rephrasing this."
        });
      }
    }
    this.minSeverity = config.minSeverity ?? "low";
    this.logger = config.logger;
  }
  /**
   * Detect discouraging language in text
   */
  detect(text) {
    const matches = [];
    const severityOrder = [
      "low",
      "medium",
      "high",
      "critical"
    ];
    const minSeverityIndex = severityOrder.indexOf(this.minSeverity);
    for (const patternDef of this.patterns) {
      if (severityOrder.indexOf(patternDef.severity) < minSeverityIndex) {
        continue;
      }
      patternDef.pattern.lastIndex = 0;
      let match;
      while ((match = patternDef.pattern.exec(text)) !== null) {
        matches.push({
          phrase: match[0],
          category: patternDef.category,
          severity: patternDef.severity,
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          alternative: patternDef.alternative
        });
      }
    }
    const uniqueMatches = this.deduplicateMatches(matches);
    const score = this.calculateScore(uniqueMatches);
    this.logger?.debug("Discouraging language detection complete", {
      matchCount: uniqueMatches.length,
      score
    });
    return {
      found: uniqueMatches.length > 0,
      matches: uniqueMatches,
      score
    };
  }
  /**
   * Get suggested positive alternatives for matches
   */
  suggestAlternatives(matches) {
    const suggestions = /* @__PURE__ */ new Map();
    for (const match of matches) {
      suggestions.set(match.phrase, match.alternative);
    }
    return suggestions;
  }
  /**
   * Rewrite text with positive alternatives
   */
  rewriteWithAlternatives(text, matches) {
    const sortedMatches = [...matches].sort(
      (a, b) => b.position.start - a.position.start
    );
    let result = text;
    for (const match of sortedMatches) {
      result = result.slice(0, match.position.start) + match.alternative + result.slice(match.position.end);
    }
    return result;
  }
  /**
   * Remove duplicate/overlapping matches
   */
  deduplicateMatches(matches) {
    const sorted = [...matches].sort((a, b) => {
      if (a.position.start !== b.position.start) {
        return a.position.start - b.position.start;
      }
      return b.position.end - b.position.start - (a.position.end - a.position.start);
    });
    const result = [];
    let lastEnd = -1;
    for (const match of sorted) {
      if (match.position.start < lastEnd) {
        continue;
      }
      result.push(match);
      lastEnd = match.position.end;
    }
    return result;
  }
  /**
   * Calculate score based on matches (higher is better)
   */
  calculateScore(matches) {
    if (matches.length === 0) {
      return 100;
    }
    const severityPenalties = {
      low: 5,
      medium: 15,
      high: 25,
      critical: 40
    };
    let totalPenalty = 0;
    for (const match of matches) {
      totalPenalty += severityPenalties[match.severity];
    }
    return Math.max(0, 100 - totalPenalty);
  }
  /**
   * Escape special regex characters
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  /**
   * Get pattern count
   */
  getPatternCount() {
    return this.patterns.length;
  }
};
function createDiscouragingLanguageDetector(config) {
  return new DiscouragingLanguageDetector(config);
}
function createStrictDiscouragingDetector(config) {
  return new DiscouragingLanguageDetector({
    ...config,
    minSeverity: "low"
  });
}
function createLenientDiscouragingDetector(config) {
  return new DiscouragingLanguageDetector({
    ...config,
    minSeverity: "high"
  });
}

// src/bias-detector.ts
var GENDER_BIAS_PATTERNS = [
  {
    pattern: /\b(boys|men|males)\s+(are|do)\s+(better|naturally)\b/gi,
    category: "gender",
    confidence: 0.9,
    explanation: "Implies gender-based ability differences",
    neutralAlternative: "Students can develop these skills through practice"
  },
  {
    pattern: /\b(girls|women|females)\s+(aren'?t|don'?t)\s+(as\s+)?(good|capable)\b/gi,
    category: "gender",
    confidence: 0.9,
    explanation: "Implies gender-based ability limitations",
    neutralAlternative: "All students can improve with focused effort"
  },
  {
    pattern: /\bfor\s+a\s+(boy|girl|man|woman)\b/gi,
    category: "gender",
    confidence: 0.8,
    explanation: "Implies different expectations based on gender",
    neutralAlternative: "Your performance shows..."
  },
  {
    pattern: /\b(typical|like\s+a)\s+(boy|girl|male|female)\b/gi,
    category: "gender",
    confidence: 0.8,
    explanation: "Uses gender stereotypes",
    neutralAlternative: "This approach shows..."
  },
  {
    pattern: /\b(masculine|feminine)\s+(approach|style|way)\b/gi,
    category: "gender",
    confidence: 0.7,
    explanation: "Associates learning styles with gender",
    neutralAlternative: "This approach demonstrates..."
  }
];
var RACIAL_ETHNIC_BIAS_PATTERNS = [
  {
    pattern: /\bfor\s+(your|a)\s+(background|culture|community)\b/gi,
    category: "racial_ethnic",
    confidence: 0.7,
    explanation: "May imply different expectations based on background",
    neutralAlternative: "Your work demonstrates..."
  },
  {
    pattern: /\b(surprisingly|unexpectedly)\s+(good|well|articulate)\b/gi,
    category: "racial_ethnic",
    confidence: 0.8,
    explanation: "Suggests surprise at competence, implies low expectations",
    neutralAlternative: "Your work shows excellent..."
  },
  {
    pattern: /\byour\s+(people|kind|type)\b/gi,
    category: "racial_ethnic",
    confidence: 0.9,
    explanation: "Groups individuals by assumed identity",
    neutralAlternative: "Students who..."
  }
];
var AGE_BIAS_PATTERNS = [
  {
    pattern: /\bat\s+your\s+age\b/gi,
    category: "age",
    confidence: 0.6,
    explanation: "May imply age-based expectations",
    neutralAlternative: "At this stage of learning..."
  },
  {
    pattern: /\b(too\s+)(young|old)\s+(to|for)\b/gi,
    category: "age",
    confidence: 0.8,
    explanation: "Sets limitations based on age",
    neutralAlternative: "This concept requires..."
  },
  {
    pattern: /\b(kids|children)\s+(these\s+days|nowadays)\b/gi,
    category: "age",
    confidence: 0.7,
    explanation: "Generational stereotyping",
    neutralAlternative: "Students at this level..."
  }
];
var DISABILITY_BIAS_PATTERNS = [
  {
    pattern: /\b(despite|considering)\s+your\s+(condition|disability|challenges)\b/gi,
    category: "disability",
    confidence: 0.8,
    explanation: "Highlights disability as a limitation",
    neutralAlternative: "Your work demonstrates..."
  },
  {
    pattern: /\b(normal|regular)\s+students\b/gi,
    category: "disability",
    confidence: 0.9,
    explanation: "Implies abnormality for students with disabilities",
    neutralAlternative: "Other students..."
  },
  {
    pattern: /\byou'?re\s+(so\s+)?(brave|inspiring|special)\s+(for|to)\b/gi,
    category: "disability",
    confidence: 0.7,
    explanation: "Inspiration porn - patronizing praise",
    neutralAlternative: "Your achievement in..."
  },
  {
    pattern: /\b(suffering\s+from|afflicted\s+with)\b/gi,
    category: "disability",
    confidence: 0.8,
    explanation: "Negative framing of disability",
    neutralAlternative: "Students with..."
  }
];
var SOCIOECONOMIC_BIAS_PATTERNS = [
  {
    pattern: /\bfor\s+(someone\s+from|your)\s+(background|neighborhood|family)\b/gi,
    category: "socioeconomic",
    confidence: 0.7,
    explanation: "May imply socioeconomic-based expectations",
    neutralAlternative: "Your work shows..."
  },
  {
    pattern: /\b(privileged|underprivileged|disadvantaged)\s+students?\b/gi,
    category: "socioeconomic",
    confidence: 0.6,
    explanation: "Labels based on socioeconomic status",
    neutralAlternative: "Students who..."
  },
  {
    pattern: /\byou\s+(probably|must)\s+(don'?t|can'?t)\s+have\s+access\b/gi,
    category: "socioeconomic",
    confidence: 0.8,
    explanation: "Assumes limitations based on perceived status",
    neutralAlternative: "If you need resources..."
  }
];
var NEURODIVERSITY_BIAS_PATTERNS = [
  {
    pattern: /\b(ADD|ADHD|autistic|dyslexic)\s+(excuse|problem)\b/gi,
    category: "neurodiversity",
    confidence: 0.9,
    explanation: "Frames neurodiversity as an excuse or problem",
    neutralAlternative: "Students with different learning needs..."
  },
  {
    pattern: /\byou\s+(just\s+)?need\s+to\s+(focus|try\s+harder|pay\s+attention)\b/gi,
    category: "neurodiversity",
    confidence: 0.6,
    explanation: "May dismiss attention-related challenges",
    neutralAlternative: "Strategies that might help include..."
  },
  {
    pattern: /\b(normal|typical)\s+(brain|thinking|learning)\b/gi,
    category: "neurodiversity",
    confidence: 0.8,
    explanation: "Implies neurotypical as the norm",
    neutralAlternative: "Different learning approaches..."
  }
];
var CULTURAL_BIAS_PATTERNS = [
  {
    pattern: /\b(your|their)\s+culture\s+(doesn'?t|won'?t)\b/gi,
    category: "cultural",
    confidence: 0.8,
    explanation: "Makes assumptions about cultural limitations",
    neutralAlternative: "Consider exploring..."
  },
  {
    pattern: /\b(Western|American|proper)\s+(way|approach|style)\b/gi,
    category: "cultural",
    confidence: 0.7,
    explanation: "Implies cultural superiority",
    neutralAlternative: "One approach is to..."
  },
  {
    pattern: /\b(broken|incorrect)\s+English\b/gi,
    category: "linguistic",
    confidence: 0.8,
    explanation: "Negative framing of language variation",
    neutralAlternative: "To strengthen English expression..."
  }
];
var EDUCATIONAL_BIAS_PATTERNS = [
  {
    pattern: /\b(homeschooled|public\s+school|private\s+school)\s+(students|kids)\s+(always|never)\b/gi,
    category: "educational_background",
    confidence: 0.8,
    explanation: "Stereotypes based on educational background",
    neutralAlternative: "Students with different backgrounds..."
  },
  {
    pattern: /\b(first[- ]generation|immigrant)\s+(student|family)\b/gi,
    category: "educational_background",
    confidence: 0.6,
    explanation: "May create different expectations",
    neutralAlternative: "To build on your experience..."
  }
];
var ALL_BIAS_PATTERNS = [
  ...GENDER_BIAS_PATTERNS,
  ...RACIAL_ETHNIC_BIAS_PATTERNS,
  ...AGE_BIAS_PATTERNS,
  ...DISABILITY_BIAS_PATTERNS,
  ...SOCIOECONOMIC_BIAS_PATTERNS,
  ...NEURODIVERSITY_BIAS_PATTERNS,
  ...CULTURAL_BIAS_PATTERNS,
  ...EDUCATIONAL_BIAS_PATTERNS
];
var BiasDetector = class {
  constructor(config = {}) {
    this.patterns = [...ALL_BIAS_PATTERNS];
    if (config.customPatterns) {
      this.patterns.push(...config.customPatterns);
    }
    this.minConfidence = config.minConfidence ?? 0.5;
    this.categoriesToCheck = config.categoriesToCheck;
    this.logger = config.logger;
  }
  /**
   * Detect bias patterns in text
   */
  detect(text) {
    const indicators = [];
    const detectedCategories = /* @__PURE__ */ new Set();
    for (const patternDef of this.patterns) {
      if (this.categoriesToCheck && !this.categoriesToCheck.includes(patternDef.category)) {
        continue;
      }
      if (patternDef.confidence < this.minConfidence) {
        continue;
      }
      patternDef.pattern.lastIndex = 0;
      let match;
      while ((match = patternDef.pattern.exec(text)) !== null) {
        indicators.push({
          type: patternDef.category,
          trigger: match[0],
          confidence: patternDef.confidence,
          explanation: patternDef.explanation,
          neutralAlternative: patternDef.neutralAlternative
        });
        detectedCategories.add(patternDef.category);
      }
    }
    const riskScore = this.calculateRiskScore(indicators);
    this.logger?.debug("Bias detection complete", {
      indicatorCount: indicators.length,
      categories: Array.from(detectedCategories),
      riskScore
    });
    return {
      detected: indicators.length > 0,
      indicators,
      riskScore,
      categories: Array.from(detectedCategories)
    };
  }
  /**
   * Get suggestions for neutralizing biased text
   */
  getSuggestions(indicators) {
    const suggestions = /* @__PURE__ */ new Map();
    for (const indicator of indicators) {
      if (indicator.neutralAlternative) {
        suggestions.set(indicator.trigger, indicator.neutralAlternative);
      }
    }
    return suggestions;
  }
  /**
   * Check if specific category has potential bias
   */
  hasCategory(text, category) {
    const result = this.detect(text);
    return result.categories.includes(category);
  }
  /**
   * Get indicators by category
   */
  getIndicatorsByCategory(indicators) {
    const grouped = /* @__PURE__ */ new Map();
    for (const indicator of indicators) {
      const existing = grouped.get(indicator.type) ?? [];
      existing.push(indicator);
      grouped.set(indicator.type, existing);
    }
    return grouped;
  }
  /**
   * Calculate risk score (0-100, lower is better)
   */
  calculateRiskScore(indicators) {
    if (indicators.length === 0) {
      return 0;
    }
    const uniqueCategories = new Set(indicators.map((i) => i.type)).size;
    const totalConfidence = indicators.reduce(
      (sum, i) => sum + i.confidence,
      0
    );
    const confidenceScore = Math.min(
      totalConfidence / indicators.length * 50,
      50
    );
    const categoryMultiplier = 1 + (uniqueCategories - 1) * 0.2;
    const countMultiplier = 1 + Math.log(indicators.length + 1) * 0.3;
    const riskScore = confidenceScore * categoryMultiplier * countMultiplier;
    return Math.min(Math.round(riskScore), 100);
  }
  /**
   * Get pattern count
   */
  getPatternCount() {
    return this.patterns.length;
  }
  /**
   * Get supported categories
   */
  getSupportedCategories() {
    return [
      "gender",
      "racial_ethnic",
      "age",
      "disability",
      "socioeconomic",
      "religious",
      "cultural",
      "linguistic",
      "educational_background",
      "neurodiversity"
    ];
  }
};
function createBiasDetector(config) {
  return new BiasDetector(config);
}
function createStrictBiasDetector(config) {
  return new BiasDetector({
    ...config,
    minConfidence: 0.3
  });
}
function createLenientBiasDetector(config) {
  return new BiasDetector({
    ...config,
    minConfidence: 0.8
  });
}
function createCategoryBiasDetector(categories, config) {
  return new BiasDetector({
    ...config,
    categoriesToCheck: categories
  });
}

// src/accessibility-checker.ts
function countSyllables(word) {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
  if (cleanWord.length <= 3) {
    return 1;
  }
  const vowelGroups = cleanWord.match(/[aeiouy]+/g) ?? [];
  let count = vowelGroups.length;
  if (cleanWord.endsWith("e") && count > 1) {
    count--;
  }
  if (cleanWord.endsWith("le") && cleanWord.length > 2) {
    const beforeLe = cleanWord.charAt(cleanWord.length - 3);
    if (!"aeiouy".includes(beforeLe)) {
      count++;
    }
  }
  if (cleanWord.endsWith("ed") && cleanWord.length > 2) {
    const beforeEd = cleanWord.charAt(cleanWord.length - 3);
    if (!["t", "d"].includes(beforeEd)) {
      count--;
    }
  }
  return Math.max(1, count);
}
function calculateFleschKincaidGradeLevel(wordCount, sentenceCount, syllableCount) {
  if (sentenceCount === 0 || wordCount === 0) {
    return 0;
  }
  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllableCount / wordCount;
  const grade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}
function calculateFleschReadingEase(wordCount, sentenceCount, syllableCount) {
  if (sentenceCount === 0 || wordCount === 0) {
    return 100;
  }
  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllableCount / wordCount;
  const score = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  return Math.max(0, Math.min(100, Math.round(score)));
}
function extractWords(text) {
  return text.split(/\s+/).map((w) => w.replace(/[^a-zA-Z'-]/g, "")).filter((w) => w.length > 0);
}
function extractSentences(text) {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);
}
function detectPassiveVoice(text) {
  const passivePatterns = [
    /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi,
    /\b(is|are|was|were|be|been|being)\s+\w+en\b/gi,
    /\b(has|have|had)\s+been\s+\w+ed\b/gi,
    /\b(has|have|had)\s+been\s+\w+en\b/gi
  ];
  let passiveCount = 0;
  for (const pattern of passivePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      passiveCount += matches.length;
    }
  }
  const sentences = extractSentences(text);
  if (sentences.length === 0) return 0;
  return Math.round(passiveCount / sentences.length * 100);
}
var JARGON_TERMS = [
  "methodology",
  "paradigm",
  "synergy",
  "leverage",
  "utilize",
  "facilitate",
  "implement",
  "optimize",
  "synthesize",
  "conceptualize",
  "contextualize",
  "operationalize",
  "actualize",
  "extrapolate",
  "interpolate",
  "metacognitive",
  "epistemological",
  "ontological",
  "heuristic",
  "pedagogical",
  "didactic",
  "hermeneutic",
  "phenomenological",
  "axiological",
  "deontological",
  "teleological",
  "juxtaposition",
  "dichotomy",
  "ambiguity",
  "prerequisite",
  "aforementioned",
  "notwithstanding",
  "heretofore",
  "hitherto",
  "inasmuch",
  "wherefore",
  "whereby"
];
function detectJargon(text) {
  const words = extractWords(text).map((w) => w.toLowerCase());
  const foundJargon = [];
  for (const term of JARGON_TERMS) {
    if (words.includes(term.toLowerCase())) {
      foundJargon.push(term);
    }
  }
  return foundJargon;
}
var DEFAULT_ACCESSIBILITY_CONFIG = {
  targetGradeLevel: 8,
  maxGradeLevel: 12,
  maxSentenceLength: 25,
  maxPassiveVoicePercentage: 30,
  maxComplexWordPercentage: 20
};
var AccessibilityChecker = class {
  constructor(config = {}) {
    this.config = { ...DEFAULT_ACCESSIBILITY_CONFIG, ...config };
    this.logger = config.logger;
  }
  /**
   * Check text accessibility
   */
  check(text, targetAudience) {
    const targetGradeLevel = targetAudience ?? this.config.targetGradeLevel;
    const words = extractWords(text);
    const sentences = extractSentences(text);
    let totalSyllables = 0;
    let complexWordCount = 0;
    for (const word of words) {
      const syllables = countSyllables(word);
      totalSyllables += syllables;
      if (syllables >= 3) {
        complexWordCount++;
      }
    }
    const statistics = this.calculateStatistics(
      words,
      sentences,
      totalSyllables,
      complexWordCount,
      text
    );
    const gradeLevel = calculateFleschKincaidGradeLevel(
      words.length,
      sentences.length,
      totalSyllables
    );
    const readabilityScore = calculateFleschReadingEase(
      words.length,
      sentences.length,
      totalSyllables
    );
    const issues = this.identifyIssues(
      statistics,
      gradeLevel,
      targetGradeLevel,
      sentences,
      text
    );
    const criticalIssues = issues.filter(
      (i) => i.severity === "critical" || i.severity === "high"
    );
    const passed = criticalIssues.length === 0;
    this.logger?.debug("Accessibility check complete", {
      gradeLevel,
      readabilityScore,
      issueCount: issues.length,
      passed
    });
    return {
      passed,
      readabilityScore,
      gradeLevel,
      issues,
      statistics
    };
  }
  /**
   * Calculate text statistics
   */
  calculateStatistics(words, sentences, syllableCount, complexWordCount, text) {
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    return {
      wordCount,
      sentenceCount,
      averageSentenceLength: sentenceCount > 0 ? Math.round(wordCount / sentenceCount * 10) / 10 : 0,
      averageWordSyllables: wordCount > 0 ? Math.round(syllableCount / wordCount * 10) / 10 : 0,
      complexWordPercentage: wordCount > 0 ? Math.round(complexWordCount / wordCount * 100) : 0,
      passiveVoicePercentage: detectPassiveVoice(text)
    };
  }
  /**
   * Identify accessibility issues
   */
  identifyIssues(statistics, gradeLevel, targetGradeLevel, sentences, text) {
    const issues = [];
    if (gradeLevel > this.config.maxGradeLevel) {
      issues.push({
        type: "reading_level_too_high",
        description: `Reading level (grade ${gradeLevel}) exceeds maximum (grade ${this.config.maxGradeLevel})`,
        severity: "high",
        suggestion: "Simplify vocabulary and shorten sentences to lower reading level"
      });
    } else if (gradeLevel > targetGradeLevel + 2) {
      issues.push({
        type: "reading_level_too_high",
        description: `Reading level (grade ${gradeLevel}) is significantly above target (grade ${targetGradeLevel})`,
        severity: "medium",
        suggestion: "Consider simplifying for the target audience"
      });
    }
    const longSentences = sentences.filter(
      (s) => extractWords(s).length > this.config.maxSentenceLength
    );
    if (longSentences.length > 0) {
      const severity = longSentences.length > sentences.length * 0.3 ? "high" : "medium";
      issues.push({
        type: "sentence_too_long",
        description: `${longSentences.length} sentence(s) exceed ${this.config.maxSentenceLength} words`,
        severity,
        suggestion: "Break long sentences into shorter, clearer ones"
      });
    }
    if (statistics.complexWordPercentage > this.config.maxComplexWordPercentage) {
      issues.push({
        type: "complex_vocabulary",
        description: `Complex word usage (${statistics.complexWordPercentage}%) exceeds limit (${this.config.maxComplexWordPercentage}%)`,
        severity: "medium",
        suggestion: "Replace complex words with simpler alternatives where possible"
      });
    }
    if (statistics.passiveVoicePercentage > this.config.maxPassiveVoicePercentage) {
      issues.push({
        type: "passive_voice_overuse",
        description: `Passive voice usage (${statistics.passiveVoicePercentage}%) exceeds limit (${this.config.maxPassiveVoicePercentage}%)`,
        severity: "low",
        suggestion: "Convert passive constructions to active voice for clarity"
      });
    }
    const jargon = detectJargon(text);
    if (jargon.length > 0) {
      issues.push({
        type: "jargon_without_explanation",
        description: `Technical jargon detected: ${jargon.slice(0, 5).join(", ")}${jargon.length > 5 ? "..." : ""}`,
        severity: jargon.length > 3 ? "medium" : "low",
        suggestion: "Either define technical terms or use simpler alternatives"
      });
    }
    const ambiguousPronouns = this.detectAmbiguousPronouns(text);
    if (ambiguousPronouns > 0) {
      issues.push({
        type: "ambiguous_pronouns",
        description: `${ambiguousPronouns} potentially ambiguous pronoun reference(s) detected`,
        severity: "low",
        suggestion: "Clarify pronoun references to avoid confusion"
      });
    }
    const paragraphs = text.split(/\n\s*\n/);
    const denseParagraphs = paragraphs.filter(
      (p) => extractWords(p).length > 100
    );
    if (denseParagraphs.length > 0) {
      issues.push({
        type: "dense_paragraphs",
        description: `${denseParagraphs.length} paragraph(s) are very dense (>100 words)`,
        severity: "low",
        suggestion: "Break large paragraphs into smaller, focused ones"
      });
    }
    return issues;
  }
  /**
   * Detect potentially ambiguous pronoun usage
   */
  detectAmbiguousPronouns(text) {
    const sentences = extractSentences(text);
    let ambiguousCount = 0;
    for (let i = 1; i < sentences.length; i++) {
      const sentence = sentences[i].toLowerCase();
      if (/^\s*(it|this|that|they|these|those|which)\s/i.test(sentence)) {
        const prevSentence = sentences[i - 1];
        if (extractWords(prevSentence).length < 4) {
          ambiguousCount++;
        }
      }
    }
    return ambiguousCount;
  }
  /**
   * Get improvement suggestions
   */
  getSuggestions(result) {
    const suggestions = [];
    const sortedIssues = [...result.issues].sort((a, b) => {
      const severityOrder = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    for (const issue of sortedIssues) {
      suggestions.push(`[${issue.severity.toUpperCase()}] ${issue.suggestion}`);
    }
    if (result.gradeLevel > this.config.targetGradeLevel) {
      const difference = result.gradeLevel - this.config.targetGradeLevel;
      suggestions.push(
        `Aim to reduce reading level by ${difference.toFixed(1)} grades for target audience.`
      );
    }
    return suggestions;
  }
};
function createAccessibilityChecker(config) {
  return new AccessibilityChecker(config);
}
function createElementaryAccessibilityChecker(config) {
  return new AccessibilityChecker({
    ...config,
    targetGradeLevel: 5,
    maxGradeLevel: 8
  });
}
function createHighSchoolAccessibilityChecker(config) {
  return new AccessibilityChecker({
    ...config,
    targetGradeLevel: 10,
    maxGradeLevel: 14
  });
}
function createCollegeAccessibilityChecker(config) {
  return new AccessibilityChecker({
    ...config,
    targetGradeLevel: 12,
    maxGradeLevel: 16
  });
}

// src/constructive-framing-checker.ts
var POSITIVE_PATTERNS = {
  strengths: [
    /\b(great|excellent|good|strong|impressive|outstanding)\s+(work|job|effort|understanding|analysis)\b/gi,
    /\b(well|clearly|effectively)\s+(demonstrated|explained|articulated|organized)\b/gi,
    /\b(shows|demonstrates|exhibits)\s+(understanding|mastery|skill|growth)\b/gi,
    /\byou\s+(did|have)\s+(well|great|excellently)\b/gi,
    /\bkeep\s+up\s+the\s+(good|great|excellent)\s+work\b/gi
  ],
  encouragement: [
    /\byou\s+can\s+(do|achieve|improve|succeed)\b/gi,
    /\bwith\s+(practice|effort|time),?\s+you\b/gi,
    /\bbelieve\s+in\s+(your|yourself)\b/gi,
    /\b(keep|continue)\s+(trying|working|practicing)\b/gi,
    /\byou'?re\s+(on\s+the\s+right\s+track|making\s+progress|improving)\b/gi
  ],
  progress: [
    /\b(improved|progress|growth|advancement)\s+(in|on|with)\b/gi,
    /\b(better|stronger)\s+than\s+(before|last\s+time|previously)\b/gi,
    /\bshowing\s+(improvement|progress|development)\b/gi,
    /\b(getting|becoming)\s+(better|stronger)\b/gi
  ],
  specificPraise: [
    /\bI\s+(particularly\s+)?(liked|appreciated|noticed)\b/gi,
    /\b(your|the)\s+\w+\s+(was|were)\s+(particularly\s+)?(effective|strong|clear)\b/gi,
    /\b(highlight|standout|notable)\s+(point|aspect|strength)\b/gi
  ],
  growthAcknowledgment: [
    /\blearning\s+(is\s+a\s+)?(process|journey)\b/gi,
    /\bmistakes\s+(are|help)\s+(learning|opportunities)\b/gi,
    /\bevery\s+(attempt|effort)\s+(counts|matters|helps)\b/gi,
    /\bgrowth\s+mindset\b/gi
  ]
};
var FIXED_MINDSET_PATTERNS = [
  {
    pattern: /\byou'?re\s+(not\s+)?(a\s+)?(math|science|writing|reading)\s+person\b/gi,
    suggestion: "Focus on specific skills that can be developed"
  },
  {
    pattern: /\bsome\s+(people|students)\s+(just\s+)?(can'?t|aren'?t\s+able)\b/gi,
    suggestion: "All students can improve with appropriate support and practice"
  },
  {
    pattern: /\b(natural|born)\s+(talent|ability)\b/gi,
    suggestion: "Emphasize effort and practice over innate ability"
  },
  {
    pattern: /\byou\s+(either\s+)?(have|got)\s+it\s+or\s+you\s+don'?t\b/gi,
    suggestion: "Skills can be developed through dedicated practice"
  },
  {
    pattern: /\b(smart|intelligent)\s+(enough|or\s+not)\b/gi,
    suggestion: "Intelligence grows through learning and effort"
  }
];
var ACTIONABLE_PATTERNS = [
  /\b(try|consider|next\s+time)\b/gi,
  /\b(to\s+improve|for\s+improvement)\b/gi,
  /\b(suggest|recommend)\b/gi,
  /\b(one\s+way|another\s+approach)\b/gi,
  /\b(you\s+could|you\s+might)\b/gi,
  /\b(focus\s+on|work\s+on)\b/gi
];
var VAGUE_PATTERNS = [
  {
    pattern: /^(good|nice|okay|fine)\.?$/gi,
    suggestion: "Provide specific feedback about what was good"
  },
  {
    pattern: /\bneeds\s+(work|improvement)\.?$/gi,
    suggestion: "Specify what needs improvement and how to improve it"
  },
  {
    pattern: /\bnot\s+quite\s+(right|there)\.?$/gi,
    suggestion: "Explain what is missing and how to address it"
  },
  {
    pattern: /\b(wrong|incorrect)\.?$/gi,
    suggestion: "Explain why it is incorrect and the correct approach"
  }
];
var DEFAULT_CONSTRUCTIVE_CONFIG = {
  minPositiveElements: 1,
  requireActionableSuggestions: true,
  minConstructivenessScore: 60,
  minGrowthMindsetScore: 50
};
var ConstructiveFramingChecker = class {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONSTRUCTIVE_CONFIG, ...config };
    this.logger = config.logger;
  }
  /**
   * Check feedback for constructive framing
   */
  check(feedback) {
    const text = this.combineText(feedback);
    const issues = [];
    const positiveElements = this.findPositiveElements(text);
    const fixedMindsetIssues = this.checkFixedMindsetLanguage(text);
    issues.push(...fixedMindsetIssues);
    const vagueIssues = this.checkVagueFeedback(text);
    issues.push(...vagueIssues);
    if (positiveElements.length < this.config.minPositiveElements) {
      issues.push({
        type: "missing_positives",
        description: `Feedback should include at least ${this.config.minPositiveElements} positive element(s)`,
        text: "",
        suggestion: "Start with something the student did well before addressing areas for improvement"
      });
    }
    if (this.config.requireActionableSuggestions) {
      const hasActionable = this.hasActionableSuggestions(text);
      if (!hasActionable && feedback.improvements && feedback.improvements.length > 0) {
        issues.push({
          type: "no_next_steps",
          description: "Improvements identified but no actionable suggestions provided",
          text: feedback.improvements.join("; "),
          suggestion: "Include specific, actionable steps the student can take to improve"
        });
      }
    }
    const balanceIssue = this.checkCriticismBalance(feedback, positiveElements);
    if (balanceIssue) {
      issues.push(balanceIssue);
    }
    if (feedback.score / feedback.maxScore < 0.6) {
      const hasEncouragement = this.hasEncouragement(text);
      if (!hasEncouragement) {
        issues.push({
          type: "missing_encouragement",
          description: "Low-scoring work should include encouraging language",
          text: "",
          suggestion: "Add supportive language that acknowledges effort and potential for growth"
        });
      }
    }
    const constructivenessScore = this.calculateConstructivenessScore(
      positiveElements,
      issues
    );
    const growthMindsetScore = this.calculateGrowthMindsetScore(text);
    const passed = issues.filter(
      (i) => i.type === "fixed_mindset_language" || i.type === "unbalanced_criticism" || i.type === "missing_positives"
    ).length === 0 && constructivenessScore >= this.config.minConstructivenessScore;
    this.logger?.debug("Constructive framing check complete", {
      positiveElements: positiveElements.length,
      issueCount: issues.length,
      constructivenessScore,
      growthMindsetScore,
      passed
    });
    return {
      passed,
      score: constructivenessScore,
      issues,
      positiveElements,
      growthMindsetScore
    };
  }
  /**
   * Combine all text from feedback
   */
  combineText(feedback) {
    const parts = [feedback.text];
    if (feedback.strengths) {
      parts.push(...feedback.strengths);
    }
    if (feedback.improvements) {
      parts.push(...feedback.improvements);
    }
    if (feedback.comments) {
      parts.push(feedback.comments);
    }
    return parts.join(" ");
  }
  /**
   * Find positive elements in text
   */
  findPositiveElements(text) {
    const elements = [];
    for (const [type, patterns] of Object.entries(POSITIVE_PATTERNS)) {
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
          elements.push({
            type,
            text: match[0],
            position: match.index
          });
        }
      }
    }
    return this.deduplicateElements(elements);
  }
  /**
   * Check for fixed mindset language
   */
  checkFixedMindsetLanguage(text) {
    const issues = [];
    for (const patternDef of FIXED_MINDSET_PATTERNS) {
      patternDef.pattern.lastIndex = 0;
      let match;
      while ((match = patternDef.pattern.exec(text)) !== null) {
        issues.push({
          type: "fixed_mindset_language",
          description: "Uses fixed mindset language that may limit student belief in growth",
          text: match[0],
          suggestion: patternDef.suggestion
        });
      }
    }
    return issues;
  }
  /**
   * Check for vague feedback
   */
  checkVagueFeedback(text) {
    const issues = [];
    for (const patternDef of VAGUE_PATTERNS) {
      patternDef.pattern.lastIndex = 0;
      let match;
      while ((match = patternDef.pattern.exec(text)) !== null) {
        issues.push({
          type: "vague_feedback",
          description: "Feedback is too vague to be actionable",
          text: match[0],
          suggestion: patternDef.suggestion
        });
      }
    }
    return issues;
  }
  /**
   * Check if text has actionable suggestions
   */
  hasActionableSuggestions(text) {
    for (const pattern of ACTIONABLE_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Check if text has encouragement
   */
  hasEncouragement(text) {
    for (const pattern of POSITIVE_PATTERNS.encouragement) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Check balance of criticism vs positives
   */
  checkCriticismBalance(feedback, positiveElements) {
    const improvementCount = feedback.improvements?.length ?? 0;
    const strengthCount = (feedback.strengths?.length ?? 0) + positiveElements.length;
    if (improvementCount > 3 && strengthCount === 0) {
      return {
        type: "unbalanced_criticism",
        description: "Feedback focuses heavily on criticisms without acknowledging strengths",
        text: `${improvementCount} improvements vs ${strengthCount} positives`,
        suggestion: "Balance criticism with recognition of what the student did well"
      };
    }
    if (improvementCount > strengthCount * 3 && strengthCount > 0) {
      return {
        type: "unbalanced_criticism",
        description: "Ratio of criticism to positive feedback is unbalanced",
        text: `${improvementCount} improvements vs ${strengthCount} positives`,
        suggestion: "Consider the feedback sandwich approach: positive-constructive-positive"
      };
    }
    return null;
  }
  /**
   * Calculate constructiveness score
   */
  calculateConstructivenessScore(positiveElements, issues) {
    let score = 50;
    score += Math.min(positiveElements.length * 10, 30);
    const issuePenalties = {
      missing_positives: 15,
      criticism_without_guidance: 10,
      fixed_mindset_language: 20,
      no_next_steps: 10,
      vague_feedback: 10,
      unbalanced_criticism: 15,
      missing_encouragement: 5
    };
    for (const issue of issues) {
      score -= issuePenalties[issue.type] ?? 5;
    }
    return Math.max(0, Math.min(100, score));
  }
  /**
   * Calculate growth mindset score
   */
  calculateGrowthMindsetScore(text) {
    let score = 50;
    for (const pattern of [
      ...POSITIVE_PATTERNS.encouragement,
      ...POSITIVE_PATTERNS.growthAcknowledgment
    ]) {
      pattern.lastIndex = 0;
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 5;
      }
    }
    for (const patternDef of FIXED_MINDSET_PATTERNS) {
      patternDef.pattern.lastIndex = 0;
      const matches = text.match(patternDef.pattern);
      if (matches) {
        score -= matches.length * 15;
      }
    }
    return Math.max(0, Math.min(100, score));
  }
  /**
   * Remove duplicate elements
   */
  deduplicateElements(elements) {
    const seen = /* @__PURE__ */ new Set();
    return elements.filter((el) => {
      const key = `${el.type}:${el.text.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  /**
   * Get improvement suggestions
   */
  getSuggestions(result) {
    const suggestions = [];
    for (const issue of result.issues) {
      suggestions.push(`[${issue.type}] ${issue.suggestion}`);
    }
    if (result.growthMindsetScore < 50) {
      suggestions.push(
        'Add more growth mindset language like "with practice you can improve" or "mistakes help us learn"'
      );
    }
    if (result.positiveElements.length === 0) {
      suggestions.push(
        "Include at least one specific positive element before addressing areas for improvement"
      );
    }
    return suggestions;
  }
};
function createConstructiveFramingChecker(config) {
  return new ConstructiveFramingChecker(config);
}
function createStrictConstructiveChecker(config) {
  return new ConstructiveFramingChecker({
    ...config,
    minPositiveElements: 2,
    minConstructivenessScore: 70
  });
}
function createLenientConstructiveChecker(config) {
  return new ConstructiveFramingChecker({
    ...config,
    minPositiveElements: 0,
    requireActionableSuggestions: false
  });
}

// src/fairness-validator.ts
var FairnessSafetyValidator = class {
  constructor(config = {}) {
    this.config = { ...DEFAULT_FAIRNESS_CONFIG, ...config };
    this.logger = config.logger;
    this.discouragingDetector = new DiscouragingLanguageDetector({
      ...config.discouragingConfig,
      customPhrases: config.customDiscouragingPhrases,
      logger: config.logger
    });
    this.biasDetector = new BiasDetector({
      ...config.biasConfig,
      customPatterns: config.customBiasPatterns?.map((pattern) => ({
        pattern,
        category: "cultural",
        confidence: 0.7,
        explanation: "Custom bias pattern detected",
        neutralAlternative: "Consider rephrasing"
      })),
      logger: config.logger
    });
    this.accessibilityChecker = new AccessibilityChecker({
      ...config.accessibilityConfig,
      targetGradeLevel: config.targetGradeLevel ?? DEFAULT_FAIRNESS_CONFIG.targetGradeLevel,
      maxGradeLevel: config.maxReadingLevel ?? DEFAULT_FAIRNESS_CONFIG.maxReadingLevel,
      logger: config.logger
    });
    this.constructiveChecker = new ConstructiveFramingChecker({
      ...config.constructiveConfig,
      logger: config.logger
    });
  }
  /**
   * Validate feedback for safety and fairness
   */
  async validateFeedback(feedback) {
    const startTime = Date.now();
    const issues = [];
    this.logger?.info("Starting safety validation", { feedbackId: feedback.id });
    const fullText = this.combineText(feedback);
    if (this.config.checkDiscouragingLanguage) {
      const discouragingResult = this.discouragingDetector.detect(fullText);
      if (discouragingResult.found) {
        for (const match of discouragingResult.matches) {
          issues.push({
            type: "discouraging_language",
            severity: match.severity,
            description: `Discouraging language detected: "${match.phrase}"`,
            details: [match.phrase],
            suggestion: match.alternative,
            location: match.position,
            confidence: 0.9
          });
        }
      }
    }
    if (this.config.checkBias) {
      const biasResult = this.biasDetector.detect(fullText);
      if (biasResult.detected) {
        for (const indicator of biasResult.indicators) {
          issues.push({
            type: "potential_bias",
            severity: indicator.confidence > 0.8 ? "critical" : "high",
            description: indicator.explanation,
            details: [indicator.trigger],
            suggestion: indicator.neutralAlternative,
            confidence: indicator.confidence
          });
        }
      }
    }
    if (this.config.checkAccessibility) {
      const accessibilityResult = this.accessibilityChecker.check(
        fullText,
        feedback.targetGradeLevel
      );
      for (const issue of accessibilityResult.issues) {
        issues.push({
          type: "accessibility",
          severity: issue.severity,
          description: issue.description,
          details: [issue.suggestion],
          suggestion: issue.suggestion,
          confidence: 0.8
        });
      }
    }
    if (this.config.checkConstructiveFraming) {
      const constructiveResult = this.constructiveChecker.check(feedback);
      for (const issue of constructiveResult.issues) {
        issues.push({
          type: "non_constructive",
          severity: issue.type === "fixed_mindset_language" ? "high" : "medium",
          description: issue.description,
          details: [issue.text].filter(Boolean),
          suggestion: issue.suggestion,
          confidence: 0.85
        });
      }
    }
    const score = this.calculateOverallScore(issues);
    const criticalOrHighIssues = issues.filter(
      (i) => i.severity === "critical" || i.severity === "high"
    );
    const passed = criticalOrHighIssues.length === 0 && score >= this.config.minPassingScore;
    const recommendations = this.generateRecommendations(issues);
    const result = {
      passed,
      score,
      issues,
      recommendations,
      validatedAt: /* @__PURE__ */ new Date(),
      validationTimeMs: Date.now() - startTime
    };
    this.logger?.info("Safety validation complete", {
      feedbackId: feedback.id,
      passed,
      score,
      issueCount: issues.length,
      validationTimeMs: result.validationTimeMs
    });
    return result;
  }
  /**
   * Quick validation (only critical checks)
   */
  async quickValidate(feedback) {
    const fullText = this.combineText(feedback);
    const criticalIssues = [];
    const discouragingResult = this.discouragingDetector.detect(fullText);
    for (const match of discouragingResult.matches) {
      if (match.severity === "critical") {
        criticalIssues.push({
          type: "discouraging_language",
          severity: "critical",
          description: `Critical discouraging language: "${match.phrase}"`,
          details: [match.phrase],
          suggestion: match.alternative,
          confidence: 0.9
        });
      }
    }
    const biasResult = this.biasDetector.detect(fullText);
    for (const indicator of biasResult.indicators) {
      if (indicator.confidence > 0.8) {
        criticalIssues.push({
          type: "potential_bias",
          severity: "critical",
          description: indicator.explanation,
          details: [indicator.trigger],
          suggestion: indicator.neutralAlternative,
          confidence: indicator.confidence
        });
      }
    }
    return {
      passed: criticalIssues.length === 0,
      criticalIssues
    };
  }
  /**
   * Suggest improvements for feedback
   */
  suggestImprovements(feedback) {
    const fullText = this.combineText(feedback);
    const suggestions = [];
    const discouragingResult = this.discouragingDetector.detect(fullText);
    if (discouragingResult.found) {
      const alternatives = this.discouragingDetector.suggestAlternatives(
        discouragingResult.matches
      );
      Array.from(alternatives.entries()).forEach(([phrase, alternative]) => {
        suggestions.push(`Replace "${phrase}" with: ${alternative}`);
      });
    }
    const biasResult = this.biasDetector.detect(fullText);
    const biasSuggestions = this.biasDetector.getSuggestions(
      biasResult.indicators
    );
    Array.from(biasSuggestions.entries()).forEach(([trigger, alternative]) => {
      suggestions.push(`Consider rephrasing "${trigger}": ${alternative}`);
    });
    const accessibilityResult = this.accessibilityChecker.check(fullText);
    suggestions.push(
      ...this.accessibilityChecker.getSuggestions(accessibilityResult)
    );
    const constructiveResult = this.constructiveChecker.check(feedback);
    suggestions.push(
      ...this.constructiveChecker.getSuggestions(constructiveResult)
    );
    return Array.from(new Set(suggestions));
  }
  /**
   * Rewrite feedback with suggested improvements
   */
  rewriteFeedback(feedback) {
    const discouragingResult = this.discouragingDetector.detect(feedback.text);
    const rewrittenText = this.discouragingDetector.rewriteWithAlternatives(
      feedback.text,
      discouragingResult.matches
    );
    return {
      ...feedback,
      text: rewrittenText
    };
  }
  /**
   * Get detailed analysis
   */
  getDetailedAnalysis(feedback) {
    const fullText = this.combineText(feedback);
    return {
      discouraging: this.discouragingDetector.detect(fullText),
      bias: this.biasDetector.detect(fullText),
      accessibility: this.accessibilityChecker.check(
        fullText,
        feedback.targetGradeLevel
      ),
      constructive: this.constructiveChecker.check(feedback)
    };
  }
  /**
   * Combine all text from feedback
   */
  combineText(feedback) {
    const parts = [feedback.text];
    if (feedback.strengths) {
      parts.push(...feedback.strengths);
    }
    if (feedback.improvements) {
      parts.push(...feedback.improvements);
    }
    if (feedback.comments) {
      parts.push(feedback.comments);
    }
    return parts.join(" ");
  }
  /**
   * Calculate overall safety score
   */
  calculateOverallScore(issues) {
    if (issues.length === 0) {
      return 100;
    }
    const severityWeights = {
      low: 5,
      medium: 15,
      high: 30,
      critical: 50
    };
    let totalPenalty = 0;
    for (const issue of issues) {
      totalPenalty += severityWeights[issue.severity];
    }
    return Math.max(0, 100 - totalPenalty);
  }
  /**
   * Generate recommendations based on issues
   */
  generateRecommendations(issues) {
    const recommendations = [];
    const issueTypes = new Set(issues.map((i) => i.type));
    if (issueTypes.has("discouraging_language")) {
      recommendations.push({
        priority: "high",
        action: "Replace discouraging language with growth-oriented alternatives",
        expectedImpact: "Improves student motivation and self-efficacy",
        relatedIssues: ["discouraging_language"]
      });
    }
    if (issueTypes.has("potential_bias")) {
      recommendations.push({
        priority: "high",
        action: "Review and neutralize potentially biased language",
        expectedImpact: "Ensures equitable feedback for all students",
        relatedIssues: ["potential_bias"]
      });
    }
    if (issueTypes.has("accessibility")) {
      recommendations.push({
        priority: "medium",
        action: "Simplify language and improve readability",
        expectedImpact: "Makes feedback accessible to all reading levels",
        relatedIssues: ["accessibility"]
      });
    }
    if (issueTypes.has("non_constructive")) {
      recommendations.push({
        priority: "medium",
        action: "Add positive elements and actionable suggestions",
        expectedImpact: "Creates more motivating and useful feedback",
        relatedIssues: ["non_constructive"]
      });
    }
    if (recommendations.length === 0) {
      recommendations.push({
        priority: "low",
        action: "Continue following best practices for feedback",
        expectedImpact: "Maintains high-quality, fair feedback",
        relatedIssues: []
      });
    }
    return recommendations;
  }
};
function createFairnessSafetyValidator(config) {
  return new FairnessSafetyValidator(config);
}
function createStrictFairnessValidator(config) {
  return new FairnessSafetyValidator({
    ...config,
    minPassingScore: 80,
    checkDiscouragingLanguage: true,
    checkBias: true,
    checkAccessibility: true,
    checkConstructiveFraming: true
  });
}
function createLenientFairnessValidator(config) {
  return new FairnessSafetyValidator({
    ...config,
    minPassingScore: 50,
    checkDiscouragingLanguage: true,
    checkBias: true,
    checkAccessibility: false,
    checkConstructiveFraming: false
  });
}
function createQuickFairnessValidator(config) {
  return new FairnessSafetyValidator({
    ...config,
    minPassingScore: 60,
    checkDiscouragingLanguage: true,
    checkBias: true,
    checkAccessibility: false,
    checkConstructiveFraming: false
  });
}
var defaultValidator;
function getDefaultFairnessValidator() {
  if (!defaultValidator) {
    defaultValidator = new FairnessSafetyValidator();
  }
  return defaultValidator;
}
function resetDefaultFairnessValidator() {
  defaultValidator = void 0;
}

// src/fairness-auditor.ts
var DEFAULT_AUDIT_CONFIG = {
  minSampleSize: 30,
  significanceThreshold: 0.05,
  disparityThreshold: 0.15,
  checkScoreDistribution: true,
  checkFeedbackSentiment: true,
  checkIssuePatterns: true
};
var FairnessAuditor = class {
  constructor(config = {}) {
    this.config = { ...DEFAULT_AUDIT_CONFIG, ...config };
    this.validator = new FairnessSafetyValidator(config.validatorConfig);
    this.logger = config.logger;
  }
  /**
   * Run comprehensive fairness audit
   */
  async runFairnessAudit(evaluations) {
    const startTime = Date.now();
    this.logger?.info("Starting fairness audit", {
      evaluationCount: evaluations.length
    });
    const validationResults = await this.validateAllEvaluations(evaluations);
    const demographicGroups = this.groupByDemographics(evaluations);
    const demographicAnalysis = await this.analyzeDemographics(
      evaluations,
      demographicGroups,
      validationResults
    );
    const scoreDistribution = this.config.checkScoreDistribution ? this.analyzeScoreDistribution(evaluations, demographicGroups) : void 0;
    const sentimentAnalysis = this.config.checkFeedbackSentiment ? this.analyzeFeedbackSentiment(
      evaluations,
      demographicGroups,
      validationResults
    ) : void 0;
    const issuePatterns = this.config.checkIssuePatterns ? this.analyzeIssuePatterns(validationResults) : void 0;
    const overallStatistics = this.calculateOverallStatistics(
      evaluations,
      validationResults
    );
    const recommendations = this.generateRecommendations(
      demographicAnalysis,
      scoreDistribution,
      sentimentAnalysis,
      issuePatterns
    );
    const fairnessScore = this.calculateFairnessScore(
      demographicAnalysis,
      overallStatistics
    );
    const passed = fairnessScore >= 70 && recommendations.filter((r) => r.priority === "critical").length === 0;
    const report = {
      passed,
      fairnessScore,
      evaluationsAnalyzed: evaluations.length,
      demographicAnalysis,
      scoreDistribution,
      sentimentAnalysis,
      issuePatterns,
      overallStatistics,
      recommendations,
      auditedAt: /* @__PURE__ */ new Date(),
      auditDurationMs: Date.now() - startTime
    };
    this.logger?.info("Fairness audit complete", {
      passed,
      fairnessScore,
      recommendationCount: recommendations.length,
      auditDurationMs: report.auditDurationMs
    });
    return report;
  }
  /**
   * Validate all evaluations
   */
  async validateAllEvaluations(evaluations) {
    const results = /* @__PURE__ */ new Map();
    for (const evaluation of evaluations) {
      const result = await this.validator.validateFeedback(evaluation);
      results.set(evaluation.id, {
        issues: result.issues,
        score: result.score
      });
    }
    return results;
  }
  /**
   * Group evaluations by demographic indicators
   */
  groupByDemographics(evaluations) {
    const groups = /* @__PURE__ */ new Map();
    const dimensions = [
      "gradeLevel",
      "subject",
      "school",
      "region",
      "learnerType",
      "performanceLevel"
    ];
    for (const dimension of dimensions) {
      const dimensionGroups = /* @__PURE__ */ new Map();
      for (const evaluation of evaluations) {
        const value = evaluation.demographics?.[dimension];
        if (value !== void 0) {
          const key = String(value);
          const existing = dimensionGroups.get(key) ?? [];
          existing.push(evaluation);
          dimensionGroups.set(key, existing);
        }
      }
      const validGroups = Array.from(dimensionGroups.entries()).filter(
        ([, evals]) => evals.length >= this.config.minSampleSize
      );
      if (validGroups.length >= 2) {
        groups.set(dimension, new Map(validGroups));
      }
    }
    return groups;
  }
  /**
   * Analyze demographics for disparities
   */
  async analyzeDemographics(_evaluations, groups, validationResults) {
    const analyses = [];
    for (const [dimension, dimensionGroups] of Array.from(groups.entries())) {
      const groupStats = [];
      for (const [groupName, groupEvals] of Array.from(
        dimensionGroups.entries()
      )) {
        const scores = groupEvals.map((e) => e.score / e.maxScore);
        const safetyScores = groupEvals.map((e) => validationResults.get(e.id)?.score ?? 100).filter((s) => s !== void 0);
        const issueCount = groupEvals.reduce((sum, e) => {
          return sum + (validationResults.get(e.id)?.issues.length ?? 0);
        }, 0);
        groupStats.push({
          groupName,
          sampleSize: groupEvals.length,
          averageScore: this.calculateMean(scores),
          scoreStandardDeviation: this.calculateStdDev(scores),
          averageSafetyScore: this.calculateMean(safetyScores),
          issueRate: issueCount / groupEvals.length,
          passRate: groupEvals.filter((e) => e.score / e.maxScore >= 0.6).length / groupEvals.length
        });
      }
      const disparity = this.calculateDisparity(groupStats);
      analyses.push({
        dimension,
        groups: groupStats,
        disparity,
        isSignificant: disparity > this.config.disparityThreshold
      });
    }
    return analyses;
  }
  /**
   * Analyze score distribution
   */
  analyzeScoreDistribution(evaluations, groups) {
    const allScores = evaluations.map((e) => e.score / e.maxScore);
    const overall = {
      mean: this.calculateMean(allScores),
      median: this.calculateMedian(allScores),
      stdDev: this.calculateStdDev(allScores),
      skewness: this.calculateSkewness(allScores)
    };
    const byGroup = /* @__PURE__ */ new Map();
    for (const [dimension, dimensionGroups] of Array.from(groups.entries())) {
      for (const [groupName, groupEvals] of Array.from(
        dimensionGroups.entries()
      )) {
        const scores = groupEvals.map((e) => e.score / e.maxScore);
        byGroup.set(`${dimension}:${groupName}`, {
          mean: this.calculateMean(scores),
          median: this.calculateMedian(scores),
          stdDev: this.calculateStdDev(scores)
        });
      }
    }
    return { overall, byGroup };
  }
  /**
   * Analyze feedback sentiment by group
   */
  analyzeFeedbackSentiment(evaluations, groups, validationResults) {
    const overallScores = evaluations.map(
      (e) => validationResults.get(e.id)?.score ?? 100
    );
    const overallPositivityRate = this.calculateMean(overallScores) / 100;
    const byGroup = /* @__PURE__ */ new Map();
    const disparities = [];
    for (const [dimension, dimensionGroups] of Array.from(groups.entries())) {
      const groupRates = [];
      for (const [groupName, groupEvals] of Array.from(
        dimensionGroups.entries()
      )) {
        const scores = groupEvals.map(
          (e) => validationResults.get(e.id)?.score ?? 100
        );
        const rate = this.calculateMean(scores) / 100;
        byGroup.set(`${dimension}:${groupName}`, rate);
        groupRates.push(rate);
      }
      if (groupRates.length >= 2) {
        const maxRate = Math.max(...groupRates);
        const minRate = Math.min(...groupRates);
        disparities.push({
          dimension,
          disparity: maxRate - minRate
        });
      }
    }
    return { overallPositivityRate, byGroup, disparities };
  }
  /**
   * Analyze issue patterns
   */
  analyzeIssuePatterns(validationResults) {
    const issuesByType = /* @__PURE__ */ new Map();
    const issuesBySeverity = /* @__PURE__ */ new Map();
    let totalIssues = 0;
    for (const [, result] of Array.from(validationResults.entries())) {
      for (const issue of result.issues) {
        totalIssues++;
        const typeCount = issuesByType.get(issue.type) ?? 0;
        issuesByType.set(issue.type, typeCount + 1);
        const severityCount = issuesBySeverity.get(issue.severity) ?? 0;
        issuesBySeverity.set(issue.severity, severityCount + 1);
      }
    }
    const mostCommonIssues = Array.from(issuesByType.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: totalIssues > 0 ? count / totalIssues * 100 : 0
    })).sort((a, b) => b.count - a.count).slice(0, 5);
    return { totalIssues, issuesByType, issuesBySeverity, mostCommonIssues };
  }
  /**
   * Calculate overall statistics
   */
  calculateOverallStatistics(evaluations, validationResults) {
    const scores = evaluations.map((e) => e.score / e.maxScore);
    const safetyScores = Array.from(validationResults.values()).map(
      (r) => r.score
    );
    const totalIssues = Array.from(validationResults.values()).reduce(
      (sum, r) => sum + r.issues.length,
      0
    );
    return {
      totalEvaluations: evaluations.length,
      averageScore: this.calculateMean(scores),
      averageSafetyScore: this.calculateMean(safetyScores),
      passRate: scores.filter((s) => s >= 0.6).length / scores.length,
      safetyPassRate: Array.from(validationResults.values()).filter(
        (r) => r.issues.length === 0
      ).length / validationResults.size,
      issuesPerEvaluation: totalIssues / evaluations.length
    };
  }
  /**
   * Generate recommendations
   */
  generateRecommendations(demographicAnalysis, scoreDistribution, sentimentAnalysis, issuePatterns) {
    const recommendations = [];
    for (const analysis of demographicAnalysis) {
      if (analysis.isSignificant) {
        recommendations.push({
          priority: analysis.disparity > 0.25 ? "critical" : "high",
          category: "demographic_disparity",
          description: `Significant disparity detected in ${analysis.dimension} (${(analysis.disparity * 100).toFixed(1)}% difference)`,
          action: `Review evaluations for ${analysis.dimension} groups and investigate potential sources of bias`,
          expectedImpact: "Ensures equitable feedback across all student groups",
          affectedDimensions: [analysis.dimension]
        });
      }
    }
    if (scoreDistribution) {
      const { skewness } = scoreDistribution.overall;
      if (Math.abs(skewness) > 1) {
        recommendations.push({
          priority: "medium",
          category: "score_distribution",
          description: `Score distribution is ${skewness > 0 ? "positively" : "negatively"} skewed (${skewness.toFixed(2)})`,
          action: skewness > 0 ? "Review grading criteria - scores may be too lenient" : "Review grading criteria - scores may be too harsh",
          expectedImpact: "Creates more balanced score distribution"
        });
      }
    }
    if (sentimentAnalysis) {
      for (const disparity of sentimentAnalysis.disparities) {
        if (disparity.disparity > this.config.disparityThreshold) {
          recommendations.push({
            priority: "high",
            category: "sentiment_disparity",
            description: `Feedback sentiment varies significantly by ${disparity.dimension}`,
            action: `Review feedback tone consistency across ${disparity.dimension} groups`,
            expectedImpact: "Ensures consistently constructive feedback for all students",
            affectedDimensions: [disparity.dimension]
          });
        }
      }
    }
    if (issuePatterns) {
      for (const issue of issuePatterns.mostCommonIssues.slice(0, 3)) {
        if (issue.percentage > 10) {
          recommendations.push({
            priority: issue.percentage > 25 ? "high" : "medium",
            category: "common_issue",
            description: `${issue.type} appears in ${issue.percentage.toFixed(1)}% of evaluations`,
            action: this.getIssueActionRecommendation(issue.type),
            expectedImpact: "Reduces occurrence of problematic feedback patterns"
          });
        }
      }
    }
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
    if (recommendations.length === 0) {
      recommendations.push({
        priority: "low",
        category: "maintenance",
        description: "No significant fairness issues detected",
        action: "Continue monitoring and run periodic audits",
        expectedImpact: "Maintains current high standards"
      });
    }
    return recommendations;
  }
  /**
   * Get action recommendation for specific issue type
   */
  getIssueActionRecommendation(issueType) {
    const recommendations = {
      discouraging_language: "Train evaluators on growth-oriented language and provide phrase alternatives",
      potential_bias: "Implement bias awareness training and review evaluation rubrics",
      accessibility: "Simplify feedback language and provide readability guidelines",
      non_constructive: "Ensure all feedback includes specific actionable suggestions"
    };
    return recommendations[issueType] ?? "Review and address the specific issue pattern";
  }
  /**
   * Calculate fairness score
   */
  calculateFairnessScore(demographicAnalysis, overallStatistics) {
    let score = overallStatistics.averageSafetyScore;
    const significantDisparities = demographicAnalysis.filter(
      (a) => a.isSignificant
    );
    for (const disparity of significantDisparities) {
      score -= disparity.disparity * 20;
    }
    if (overallStatistics.safetyPassRate > 0.9) {
      score += 5;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  /**
   * Calculate disparity between groups
   */
  calculateDisparity(groups) {
    if (groups.length < 2) return 0;
    const passRates = groups.map((g) => g.passRate);
    const maxRate = Math.max(...passRates);
    const minRate = Math.min(...passRates);
    return maxRate - minRate;
  }
  // ============================================================================
  // STATISTICAL HELPERS
  // ============================================================================
  calculateMean(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  calculateMedian(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  calculateStdDev(values) {
    if (values.length < 2) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return Math.sqrt(
      squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length
    );
  }
  calculateSkewness(values) {
    if (values.length < 3) return 0;
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values);
    if (stdDev === 0) return 0;
    const n = values.length;
    const cubedDiffs = values.map((v) => Math.pow((v - mean) / stdDev, 3));
    const sumCubed = cubedDiffs.reduce((sum, v) => sum + v, 0);
    return n / ((n - 1) * (n - 2)) * sumCubed;
  }
  // ============================================================================
  // QUICK AUDIT
  // ============================================================================
  /**
   * Run quick fairness check (critical issues only)
   */
  async quickAudit(evaluations) {
    let criticalIssues = 0;
    let totalSafetyScore = 0;
    const recommendations = [];
    for (const evaluation of evaluations) {
      const result = await this.validator.quickValidate(evaluation);
      criticalIssues += result.criticalIssues.length;
      const fullResult = await this.validator.validateFeedback(evaluation);
      totalSafetyScore += fullResult.score;
    }
    const averageSafetyScore = totalSafetyScore / evaluations.length;
    const passed = criticalIssues === 0 && averageSafetyScore >= 70;
    if (criticalIssues > 0) {
      recommendations.push(
        `Address ${criticalIssues} critical safety issue(s) immediately`
      );
    }
    if (averageSafetyScore < 70) {
      recommendations.push(
        `Improve overall feedback quality (current score: ${averageSafetyScore.toFixed(1)})`
      );
    }
    return { passed, criticalIssues, averageSafetyScore, recommendations };
  }
  /**
   * Get trend analysis comparing two audit reports
   */
  compareTrends(previousReport, currentReport) {
    const scoreChange = currentReport.fairnessScore - previousReport.fairnessScore;
    const passRateChange = currentReport.overallStatistics.safetyPassRate - previousReport.overallStatistics.safetyPassRate;
    const issueChange = currentReport.overallStatistics.issuesPerEvaluation - previousReport.overallStatistics.issuesPerEvaluation;
    const improving = scoreChange > 0 && issueChange < 0;
    let summary;
    if (improving) {
      summary = `Fairness improved by ${scoreChange.toFixed(1)} points with ${Math.abs(issueChange).toFixed(2)} fewer issues per evaluation`;
    } else if (scoreChange > 0) {
      summary = `Fairness score improved by ${scoreChange.toFixed(1)} points, but issue rate increased`;
    } else if (scoreChange < 0) {
      summary = `Fairness score decreased by ${Math.abs(scoreChange).toFixed(1)} points - review recommended`;
    } else {
      summary = "Fairness metrics remained stable";
    }
    return {
      scoreChange,
      passRateChange,
      issueChange,
      improving,
      summary
    };
  }
};
function createFairnessAuditor(config) {
  return new FairnessAuditor(config);
}
function createStrictFairnessAuditor(config) {
  return new FairnessAuditor({
    ...config,
    disparityThreshold: 0.1,
    significanceThreshold: 0.01
  });
}
function createLenientFairnessAuditor(config) {
  return new FairnessAuditor({
    ...config,
    disparityThreshold: 0.25,
    minSampleSize: 10
  });
}
var ScheduledFairnessAuditRunner = class {
  constructor(config) {
    this.auditHistory = [];
    this.auditor = new FairnessAuditor(config);
    this.logger = config?.logger;
  }
  /**
   * Run scheduled audit and store in history
   */
  async runScheduledAudit(evaluations) {
    this.logger?.info("Running scheduled fairness audit", {
      evaluationCount: evaluations.length
    });
    const report = await this.auditor.runFairnessAudit(evaluations);
    this.auditHistory.push(report);
    if (this.auditHistory.length > 10) {
      this.auditHistory = this.auditHistory.slice(-10);
    }
    if (this.auditHistory.length >= 2) {
      const previousReport = this.auditHistory[this.auditHistory.length - 2];
      const trend = this.auditor.compareTrends(previousReport, report);
      this.logger?.info("Audit trend analysis", trend);
    }
    return report;
  }
  /**
   * Get audit history
   */
  getAuditHistory() {
    return [...this.auditHistory];
  }
  /**
   * Get latest audit report
   */
  getLatestAudit() {
    return this.auditHistory[this.auditHistory.length - 1];
  }
  /**
   * Get trend over time
   */
  getTrend() {
    const scores = this.auditHistory.map((r) => r.fairnessScore);
    const passRates = this.auditHistory.map(
      (r) => r.overallStatistics.safetyPassRate
    );
    const dates = this.auditHistory.map((r) => r.auditedAt);
    let overallTrend = "stable";
    if (scores.length >= 3) {
      const recentAvg = (scores[scores.length - 1] + scores[scores.length - 2]) / 2;
      const olderAvg = (scores[0] + scores[1]) / 2;
      if (recentAvg > olderAvg + 5) {
        overallTrend = "improving";
      } else if (recentAvg < olderAvg - 5) {
        overallTrend = "declining";
      }
    }
    return { scores, passRates, dates, overallTrend };
  }
};

// src/safe-evaluation-wrapper.ts
var SafeEvaluationWrapper = class {
  constructor(config = {}) {
    this.config = {
      autoRewrite: config.autoRewrite ?? true,
      strictMode: config.strictMode ?? false,
      targetGradeLevel: config.targetGradeLevel ?? 8,
      skipValidation: config.skipValidation ?? false,
      logResults: config.logResults ?? true
    };
    this.validator = config.validator ?? (config.strictMode ? createStrictFairnessValidator({
      targetGradeLevel: this.config.targetGradeLevel
    }) : createFairnessSafetyValidator({
      targetGradeLevel: this.config.targetGradeLevel
    }));
  }
  /**
   * Wrap an AI evaluation result with safety validation
   */
  async wrapEvaluation(evaluation, evaluationId) {
    if (this.config.skipValidation) {
      return {
        ...evaluation,
        safetyValidation: {
          passed: true,
          score: 100,
          issueCount: 0,
          wasRewritten: false
        }
      };
    }
    const feedback = {
      id: evaluationId ?? `eval-${Date.now()}`,
      text: evaluation.feedback,
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      targetGradeLevel: this.config.targetGradeLevel
    };
    const safetyResult = await this.validator.validateFeedback(feedback);
    if (this.config.logResults) {
      this.logSafetyResult(evaluationId, safetyResult);
    }
    if (safetyResult.passed) {
      return {
        ...evaluation,
        safetyValidation: {
          passed: true,
          score: safetyResult.score,
          issueCount: safetyResult.issues.length,
          wasRewritten: false
        }
      };
    }
    if (this.config.autoRewrite) {
      const rewrittenFeedback = this.validator.rewriteFeedback(feedback);
      return {
        ...evaluation,
        feedback: rewrittenFeedback.text,
        strengths: this.ensurePositiveStrengths(evaluation.strengths),
        improvements: this.ensureConstructiveImprovements(
          evaluation.improvements
        ),
        safetyValidation: {
          passed: false,
          score: safetyResult.score,
          issueCount: safetyResult.issues.length,
          wasRewritten: true,
          originalFeedback: evaluation.feedback,
          issues: safetyResult.issues.map((issue) => ({
            type: issue.type,
            severity: issue.severity,
            description: issue.description
          }))
        }
      };
    }
    return {
      ...evaluation,
      safetyValidation: {
        passed: false,
        score: safetyResult.score,
        issueCount: safetyResult.issues.length,
        wasRewritten: false,
        issues: safetyResult.issues.map((issue) => ({
          type: issue.type,
          severity: issue.severity,
          description: issue.description
        }))
      }
    };
  }
  /**
   * Quick check if feedback is safe (without full result)
   */
  async isSafe(feedback) {
    if (this.config.skipValidation) {
      return true;
    }
    const result = await this.validator.quickValidate({
      id: "quick-check",
      text: feedback,
      score: 0,
      maxScore: 100
    });
    return result.passed;
  }
  /**
   * Get improvement suggestions for feedback
   */
  getSuggestions(feedback) {
    return this.validator.suggestImprovements({
      id: "suggestion-check",
      text: feedback,
      score: 0,
      maxScore: 100
    });
  }
  /**
   * Ensure strengths are positively framed
   */
  ensurePositiveStrengths(strengths) {
    if (!strengths || strengths.length === 0) {
      return ["Shows effort in attempting the question"];
    }
    return strengths.map((s) => {
      if (s.toLowerCase().includes("but") || s.toLowerCase().includes("however")) {
        return s.split(/\s+but\s+|\s+however\s+/i)[0].trim();
      }
      return s;
    });
  }
  /**
   * Ensure improvements are constructively framed
   */
  ensureConstructiveImprovements(improvements) {
    if (!improvements || improvements.length === 0) {
      return [];
    }
    const constructiveStarters = [
      "Consider",
      "Try",
      "You might",
      "One way to improve is",
      "A helpful approach would be"
    ];
    return improvements.map((imp) => {
      const lowerImp = imp.toLowerCase();
      if (lowerImp.startsWith("consider") || lowerImp.startsWith("try") || lowerImp.startsWith("you might") || lowerImp.startsWith("one way") || lowerImp.startsWith("a helpful")) {
        return imp;
      }
      if (lowerImp.startsWith("don't") || lowerImp.startsWith("never") || lowerImp.startsWith("avoid") || lowerImp.startsWith("stop")) {
        const starter = constructiveStarters[Math.floor(Math.random() * constructiveStarters.length)];
        return `${starter} ${imp.replace(/^(don't|never|avoid|stop)\s+/i, "")}`;
      }
      return imp;
    });
  }
  /**
   * Log safety validation result
   */
  logSafetyResult(evaluationId, result) {
    if (result.passed) {
      console.log(
        `[SafeEvaluation] ${evaluationId ?? "unknown"}: PASSED (score: ${result.score})`
      );
    } else {
      console.warn(
        `[SafeEvaluation] ${evaluationId ?? "unknown"}: FAILED (score: ${result.score}, issues: ${result.issues.length})`
      );
      for (const issue of result.issues) {
        console.warn(
          `  - [${issue.severity}] ${issue.type}: ${issue.description}`
        );
      }
    }
  }
};
function createSafeEvaluationWrapper(config) {
  return new SafeEvaluationWrapper(config);
}
function createStrictSafeEvaluationWrapper(config) {
  return new SafeEvaluationWrapper({ ...config, strictMode: true });
}
var defaultWrapper;
function getDefaultSafeEvaluationWrapper() {
  if (!defaultWrapper) {
    defaultWrapper = new SafeEvaluationWrapper();
  }
  return defaultWrapper;
}
function resetDefaultSafeEvaluationWrapper() {
  defaultWrapper = void 0;
}
async function wrapEvaluationWithSafety(evaluation, evaluationId) {
  return getDefaultSafeEvaluationWrapper().wrapEvaluation(
    evaluation,
    evaluationId
  );
}
async function isFeedbackTextSafe(feedback) {
  return getDefaultSafeEvaluationWrapper().isSafe(feedback);
}
function getFeedbackSuggestions(feedback) {
  return getDefaultSafeEvaluationWrapper().getSuggestions(feedback);
}

// src/index.ts
async function validateFeedbackSafety(feedback) {
  const validator = getDefaultFairnessValidator();
  return validator.validateFeedback(feedback);
}
async function isFeedbackSafe(feedback) {
  const validator = getDefaultFairnessValidator();
  const result = await validator.quickValidate(feedback);
  return result.passed;
}
function getFeedbackImprovements(feedback) {
  const validator = getDefaultFairnessValidator();
  return validator.suggestImprovements(feedback);
}
function rewriteFeedbackSafely(feedback) {
  const validator = getDefaultFairnessValidator();
  return validator.rewriteFeedback(feedback);
}
export {
  AccessibilityChecker,
  BiasDetector,
  ConstructiveFramingChecker,
  DEFAULT_ACCESSIBILITY_CONFIG,
  DEFAULT_AUDIT_CONFIG,
  DEFAULT_CONSTRUCTIVE_CONFIG,
  DEFAULT_FAIRNESS_CONFIG,
  DiscouragingLanguageDetector,
  FairnessAuditor,
  FairnessSafetyValidator,
  SEVERITY_WEIGHTS,
  SafeEvaluationWrapper,
  ScheduledFairnessAuditRunner,
  createAccessibilityChecker,
  createBiasDetector,
  createCategoryBiasDetector,
  createCollegeAccessibilityChecker,
  createConstructiveFramingChecker,
  createDiscouragingLanguageDetector,
  createElementaryAccessibilityChecker,
  createFairnessAuditor,
  createFairnessSafetyValidator,
  createHighSchoolAccessibilityChecker,
  createLenientBiasDetector,
  createLenientConstructiveChecker,
  createLenientDiscouragingDetector,
  createLenientFairnessAuditor,
  createLenientFairnessValidator,
  createQuickFairnessValidator,
  createSafeEvaluationWrapper,
  createStrictBiasDetector,
  createStrictConstructiveChecker,
  createStrictDiscouragingDetector,
  createStrictFairnessAuditor,
  createStrictFairnessValidator,
  createStrictSafeEvaluationWrapper,
  getDefaultFairnessValidator,
  getDefaultSafeEvaluationWrapper,
  getFeedbackImprovements,
  getFeedbackSuggestions,
  isFeedbackSafe,
  isFeedbackTextSafe,
  resetDefaultFairnessValidator,
  resetDefaultSafeEvaluationWrapper,
  rewriteFeedbackSafely,
  validateFeedbackSafety,
  wrapEvaluationWithSafety
};
