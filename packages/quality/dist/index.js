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
  CompletenessGate: () => CompletenessGate,
  ContentQualityGatePipeline: () => ContentQualityGatePipeline,
  DEFAULT_COMPLETENESS_CONFIG: () => DEFAULT_COMPLETENESS_CONFIG,
  DEFAULT_DEPTH_CONFIG: () => DEFAULT_DEPTH_CONFIG,
  DEFAULT_DIFFICULTY_MATCH_CONFIG: () => DEFAULT_DIFFICULTY_MATCH_CONFIG,
  DEFAULT_EXAMPLE_QUALITY_CONFIG: () => DEFAULT_EXAMPLE_QUALITY_CONFIG,
  DEFAULT_PIPELINE_CONFIG: () => DEFAULT_PIPELINE_CONFIG,
  DEFAULT_STRUCTURE_CONFIG: () => DEFAULT_STRUCTURE_CONFIG,
  DepthGate: () => DepthGate,
  DifficultyMatchGate: () => DifficultyMatchGate,
  ExampleQualityGate: () => ExampleQualityGate,
  StructureGate: () => StructureGate,
  createCompletenessGate: () => createCompletenessGate,
  createDepthGate: () => createDepthGate,
  createDifficultyMatchGate: () => createDifficultyMatchGate,
  createExampleQualityGate: () => createExampleQualityGate,
  createQualityGatePipeline: () => createQualityGatePipeline,
  createStructureGate: () => createStructureGate,
  quickValidateContent: () => quickValidateContent,
  validateContent: () => validateContent
});
module.exports = __toCommonJS(index_exports);

// src/types.ts
var DEFAULT_PIPELINE_CONFIG = {
  threshold: 75,
  maxIterations: 2,
  parallel: true,
  timeoutMs: 1e4,
  enableEnhancement: true
};
var DEFAULT_COMPLETENESS_CONFIG = {
  minWordCount: 100,
  minSections: 2,
  requireIntroduction: true,
  requireConclusion: false,
  objectiveCoverageThreshold: 0.7
};
var DEFAULT_EXAMPLE_QUALITY_CONFIG = {
  minExamples: 1,
  maxExamples: 5,
  requireCodeExamples: false,
  requireRealWorldExamples: false,
  minExampleLength: 20
};
var DEFAULT_DIFFICULTY_MATCH_CONFIG = {
  tolerance: 0.2,
  checkVocabulary: true,
  checkConceptComplexity: true,
  checkSentenceComplexity: true
};
var DEFAULT_STRUCTURE_CONFIG = {
  minHeadingDepth: 1,
  maxHeadingDepth: 4,
  requireLists: false,
  maxParagraphLength: 8,
  requireMarkdown: true
};
var DEFAULT_DEPTH_CONFIG = {
  minDepthScore: 60,
  checkExplanationDepth: true,
  checkConceptConnections: true,
  checkCriticalThinking: true
};

// src/completeness-gate.ts
var CompletenessGate = class {
  name = "CompletenessGate";
  description = "Validates that content is complete with required sections and minimum length";
  defaultWeight = 1.5;
  // Higher weight - completeness is critical
  applicableTypes = [
    "lesson",
    "explanation",
    "tutorial",
    "summary",
    "assessment"
  ];
  config;
  constructor(config) {
    this.config = {
      ...DEFAULT_COMPLETENESS_CONFIG,
      ...config
    };
  }
  async evaluate(content) {
    const startTime = Date.now();
    const issues = [];
    const suggestions = [];
    let score = 100;
    const text = content.content;
    const wordCount = this.countWords(text);
    const minWords = this.getMinWordCount(content);
    if (wordCount < minWords) {
      const shortfall = minWords - wordCount;
      const severity = shortfall > minWords * 0.5 ? "critical" : "high";
      score -= severity === "critical" ? 40 : 25;
      issues.push({
        severity,
        description: `Content has ${wordCount} words, but requires at least ${minWords} words`,
        suggestedFix: `Add approximately ${shortfall} more words to meet the minimum requirement`
      });
      suggestions.push(`Expand the content by adding more detail and examples`);
    }
    if (this.config.requireIntroduction) {
      const hasIntro = this.hasIntroduction(text);
      if (!hasIntro) {
        score -= 15;
        issues.push({
          severity: "high",
          description: "Content is missing an introduction",
          location: "beginning",
          suggestedFix: "Add an introductory paragraph that sets context and previews the content"
        });
        suggestions.push("Start with an introduction that explains what will be covered");
      }
    }
    if (this.config.requireConclusion) {
      const hasConclusion = this.hasConclusion(text);
      if (!hasConclusion) {
        score -= 10;
        issues.push({
          severity: "medium",
          description: "Content is missing a conclusion",
          location: "end",
          suggestedFix: "Add a concluding section that summarizes key points"
        });
        suggestions.push("End with a conclusion that summarizes the main takeaways");
      }
    }
    if (content.expectedSections && content.expectedSections.length > 0) {
      const missingSections = this.findMissingSections(text, content.expectedSections);
      if (missingSections.length > 0) {
        const severity = missingSections.length > 2 ? "critical" : "high";
        score -= missingSections.length * 10;
        issues.push({
          severity,
          description: `Missing required sections: ${missingSections.join(", ")}`,
          suggestedFix: `Add the following sections: ${missingSections.join(", ")}`
        });
        suggestions.push(`Include sections for: ${missingSections.join(", ")}`);
      }
    }
    const sectionCount = this.countSections(text);
    if (sectionCount < this.config.minSections) {
      score -= 15;
      issues.push({
        severity: "medium",
        description: `Content has ${sectionCount} sections, but requires at least ${this.config.minSections}`,
        suggestedFix: `Add ${this.config.minSections - sectionCount} more sections to organize the content better`
      });
      suggestions.push("Break the content into more distinct sections with headings");
    }
    if (content.context?.learningObjectives && content.context.learningObjectives.length > 0) {
      const coverageResult = this.checkObjectiveCoverage(
        text,
        content.context.learningObjectives
      );
      if (coverageResult.coverage < this.config.objectiveCoverageThreshold) {
        const severity = coverageResult.coverage < 0.5 ? "critical" : "high";
        score -= Math.round((1 - coverageResult.coverage) * 30);
        issues.push({
          severity,
          description: `Only ${Math.round(coverageResult.coverage * 100)}% of learning objectives are covered`,
          suggestedFix: `Address the following objectives: ${coverageResult.missing.join(", ")}`
        });
        suggestions.push(
          `Add content covering: ${coverageResult.missing.slice(0, 3).join(", ")}`
        );
      }
    }
    if (this.hasAbruptEnding(text)) {
      score -= 10;
      issues.push({
        severity: "medium",
        description: "Content appears to end abruptly",
        location: "end",
        suggestedFix: "Ensure the content has a proper ending that wraps up the topic"
      });
    }
    score = Math.max(0, Math.min(100, score));
    const passed = score >= 75 && !issues.some((i) => i.severity === "critical");
    return {
      gateName: this.name,
      passed,
      score,
      weight: this.defaultWeight,
      issues,
      suggestions,
      processingTimeMs: Date.now() - startTime,
      metadata: {
        wordCount,
        sectionCount,
        hasIntroduction: this.hasIntroduction(text),
        hasConclusion: this.hasConclusion(text)
      }
    };
  }
  /**
   * Count words in text
   */
  countWords(text) {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  }
  /**
   * Get minimum word count based on content type
   */
  getMinWordCount(content) {
    const typeMinimums = {
      lesson: 300,
      explanation: 150,
      exercise: 100,
      quiz: 50,
      assessment: 100,
      summary: 100,
      tutorial: 400,
      example: 50,
      feedback: 50,
      answer: 30
    };
    const typeMin = typeMinimums[content.type] ?? 100;
    return Math.max(typeMin, this.config.minWordCount);
  }
  /**
   * Check if content has an introduction
   */
  hasIntroduction(text) {
    const introPatterns = [
      /^#\s+\w+/m,
      // Heading at start
      /^##?\s*(introduction|overview|about|getting started)/im,
      /^(in this|this (lesson|tutorial|guide|section)|welcome|let's|we will)/im,
      /^(today|here|this document)/im
    ];
    const firstParagraph = text.split(/\n\n/)[0] ?? "";
    return introPatterns.some((pattern) => pattern.test(firstParagraph));
  }
  /**
   * Check if content has a conclusion
   */
  hasConclusion(text) {
    const conclusionPatterns = [
      /##?\s*(conclusion|summary|wrap up|key takeaways|in summary)/im,
      /(in conclusion|to summarize|in summary|to wrap up|key points)/im,
      /(we (have |)(learned|covered|explored)|remember that)/im,
      /##?\s*(next steps|what's next|further reading)/im
    ];
    const lastParagraphs = text.split(/\n\n/).slice(-3).join("\n\n");
    return conclusionPatterns.some((pattern) => pattern.test(lastParagraphs));
  }
  /**
   * Find sections that are required but missing
   */
  findMissingSections(text, requiredSections) {
    const textLower = text.toLowerCase();
    const missing = [];
    for (const section of requiredSections) {
      const sectionLower = section.toLowerCase();
      const hasSection = textLower.includes(`# ${sectionLower}`) || textLower.includes(`## ${sectionLower}`) || textLower.includes(`### ${sectionLower}`) || this.hasSectionContent(textLower, sectionLower);
      if (!hasSection) {
        missing.push(section);
      }
    }
    return missing;
  }
  /**
   * Check if section topic is covered in content
   */
  hasSectionContent(text, sectionName) {
    const keywords = sectionName.split(/\s+/).filter((word) => word.length > 3).map((word) => word.toLowerCase());
    if (keywords.length === 0) return true;
    const foundCount = keywords.filter((kw) => text.includes(kw)).length;
    return foundCount >= Math.ceil(keywords.length * 0.7);
  }
  /**
   * Count the number of sections/headings in content
   */
  countSections(text) {
    const headingPattern = /^#{1,4}\s+\w/gm;
    const matches = text.match(headingPattern);
    return matches ? matches.length : 0;
  }
  /**
   * Check coverage of learning objectives
   */
  checkObjectiveCoverage(text, objectives) {
    const textLower = text.toLowerCase();
    const missing = [];
    for (const objective of objectives) {
      const objectiveKeywords = this.extractKeywords(objective);
      const keywordMatches = objectiveKeywords.filter((kw) => textLower.includes(kw)).length;
      const coverageRatio = keywordMatches / objectiveKeywords.length;
      if (coverageRatio < 0.5) {
        missing.push(objective);
      }
    }
    const coverage = (objectives.length - missing.length) / objectives.length;
    return { coverage, missing };
  }
  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const stopWords = /* @__PURE__ */ new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "shall",
      "can",
      "need",
      "this",
      "that",
      "these",
      "those",
      "what",
      "which",
      "who",
      "how",
      "why",
      "when",
      "where"
    ]);
    return text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((word) => word.length > 2 && !stopWords.has(word));
  }
  /**
   * Check if content ends abruptly
   */
  hasAbruptEnding(text) {
    const trimmed = text.trim();
    const lastChar = trimmed[trimmed.length - 1];
    if (lastChar && ![".", "!", "?", ":", '"', "'", ")"].includes(lastChar)) {
      return true;
    }
    const lastLine = trimmed.split("\n").pop() ?? "";
    const incompletePatterns = [/and\s*$/i, /or\s*$/i, /with\s*$/i, /for\s*$/i, /:\s*$/];
    return incompletePatterns.some((pattern) => pattern.test(lastLine));
  }
};
function createCompletenessGate(config) {
  return new CompletenessGate(config);
}

// src/example-quality-gate.ts
var ExampleQualityGate = class {
  name = "ExampleQualityGate";
  description = "Validates that content has adequate, high-quality examples";
  defaultWeight = 1.2;
  applicableTypes = [
    "lesson",
    "explanation",
    "tutorial",
    "exercise",
    "example"
  ];
  config;
  constructor(config) {
    this.config = {
      ...DEFAULT_EXAMPLE_QUALITY_CONFIG,
      ...config
    };
  }
  async evaluate(content) {
    const startTime = Date.now();
    const issues = [];
    const suggestions = [];
    let score = 100;
    const text = content.content;
    const examples = this.detectExamples(text);
    const expectedExamples = content.expectedExamples ?? this.config.minExamples;
    if (examples.length < expectedExamples) {
      const shortage = expectedExamples - examples.length;
      const severity = shortage > 2 ? "critical" : "high";
      score -= severity === "critical" ? 35 : 20;
      issues.push({
        severity,
        description: `Content has ${examples.length} examples, but requires at least ${expectedExamples}`,
        suggestedFix: `Add ${shortage} more examples to illustrate key concepts`
      });
      suggestions.push("Add more examples to clarify the concepts being explained");
    }
    if (examples.length > this.config.maxExamples) {
      score -= 10;
      issues.push({
        severity: "low",
        description: `Content has ${examples.length} examples, which exceeds the recommended maximum of ${this.config.maxExamples}`,
        suggestedFix: "Consider consolidating or removing some examples to improve focus"
      });
      suggestions.push("Consider removing less relevant examples to maintain focus");
    }
    const lowQualityExamples = examples.filter((e) => e.quality === "low");
    if (lowQualityExamples.length > examples.length * 0.3) {
      score -= 20;
      issues.push({
        severity: "high",
        description: `${lowQualityExamples.length} of ${examples.length} examples are low quality (too short or vague)`,
        suggestedFix: "Expand examples with more detail and context"
      });
      suggestions.push("Improve example quality by adding more context and explanation");
    }
    if (this.isProgrammingContent(content)) {
      const codeExamples = examples.filter((e) => e.type === "code");
      if (this.config.requireCodeExamples && codeExamples.length === 0) {
        score -= 25;
        issues.push({
          severity: "high",
          description: "Programming content should include code examples",
          suggestedFix: "Add code snippets demonstrating the concepts"
        });
        suggestions.push("Include executable code examples that readers can try");
      }
      if (codeExamples.length > 0) {
        const codeIssues = this.checkCodeExampleQuality(codeExamples);
        if (codeIssues.length > 0) {
          score -= codeIssues.length * 5;
          issues.push(...codeIssues);
        }
      }
    }
    if (this.config.requireRealWorldExamples) {
      const realWorldExamples = examples.filter((e) => e.type === "realWorld");
      if (realWorldExamples.length === 0) {
        score -= 15;
        issues.push({
          severity: "medium",
          description: "Content lacks real-world examples",
          suggestedFix: "Add practical, real-world scenarios to make concepts relatable"
        });
        suggestions.push("Include real-world scenarios showing practical applications");
      }
    }
    const tooShortExamples = examples.filter(
      (e) => e.wordCount < this.config.minExampleLength
    );
    if (tooShortExamples.length > 0 && examples.length > 0) {
      const ratio = tooShortExamples.length / examples.length;
      if (ratio > 0.5) {
        score -= 15;
        issues.push({
          severity: "medium",
          description: `${tooShortExamples.length} examples are too brief (under ${this.config.minExampleLength} words)`,
          suggestedFix: "Expand brief examples with more detail and explanation"
        });
        suggestions.push("Make examples more detailed with step-by-step explanations");
      }
    }
    if (examples.length >= 2) {
      const varietyResult = this.checkExampleVariety(examples);
      if (!varietyResult.hasVariety) {
        score -= 10;
        issues.push({
          severity: "low",
          description: "Examples lack variety in type or approach",
          suggestedFix: varietyResult.suggestion
        });
        suggestions.push(varietyResult.suggestion);
      }
    }
    const placementIssues = this.checkExamplePlacement(text, examples);
    if (placementIssues.length > 0) {
      score -= placementIssues.length * 3;
      issues.push(...placementIssues);
    }
    score = Math.max(0, Math.min(100, score));
    const passed = score >= 75 && !issues.some((i) => i.severity === "critical");
    return {
      gateName: this.name,
      passed,
      score,
      weight: this.defaultWeight,
      issues,
      suggestions,
      processingTimeMs: Date.now() - startTime,
      metadata: {
        exampleCount: examples.length,
        exampleTypes: this.countExampleTypes(examples),
        averageExampleLength: this.calculateAverageLength(examples),
        hasCodeExamples: examples.some((e) => e.type === "code"),
        hasRealWorldExamples: examples.some((e) => e.type === "realWorld")
      }
    };
  }
  /**
   * Detect examples in the content
   */
  detectExamples(text) {
    const examples = [];
    const explicitPatterns = [
      /(?:for example|e\.g\.|such as|consider|let's say|imagine|suppose)[,:]?\s*(.{20,500}?)(?=\n\n|\.|$)/gim,
      /(?:here'?s an example|example:|for instance)[,:]?\s*(.{20,500}?)(?=\n\n|$)/gim
    ];
    for (const pattern of explicitPatterns) {
      let match2;
      while ((match2 = pattern.exec(text)) !== null) {
        const exampleContent = match2[1]?.trim();
        if (exampleContent && exampleContent.length > 20) {
          examples.push(this.createExample(exampleContent, match2.index, text));
        }
      }
    }
    const codeBlockPattern = /```[\w]*\n([\s\S]*?)```/gm;
    let match;
    while ((match = codeBlockPattern.exec(text)) !== null) {
      const codeContent = match[1]?.trim();
      if (codeContent && codeContent.length > 10) {
        examples.push({
          type: "code",
          content: codeContent,
          wordCount: this.countWords(codeContent),
          startIndex: match.index,
          quality: this.assessCodeQuality(codeContent)
        });
      }
    }
    const inlineCodePattern = /`([^`]+)`/g;
    let inlineCount = 0;
    while ((match = inlineCodePattern.exec(text)) !== null) {
      inlineCount++;
      if (match[1] && match[1].length > 15) {
        examples.push({
          type: "code",
          content: match[1],
          wordCount: this.countWords(match[1]),
          startIndex: match.index,
          quality: "low"
          // Inline code is typically less detailed
        });
      }
    }
    const listExamplePattern = /^\s*[-*\d.]+\s*(?:Example\s*\d*[:.])?\s*(.{30,300})/gim;
    while ((match = listExamplePattern.exec(text)) !== null) {
      const exampleContent = match[1]?.trim();
      if (exampleContent && this.looksLikeExample(exampleContent)) {
        examples.push(this.createExample(exampleContent, match.index, text));
      }
    }
    const scenarioPattern = /(?:scenario|case study|real-world|in practice)[:\s]*(.{50,500}?)(?=\n\n|$)/gim;
    while ((match = scenarioPattern.exec(text)) !== null) {
      const scenarioContent = match[1]?.trim();
      if (scenarioContent) {
        examples.push({
          type: "realWorld",
          content: scenarioContent,
          wordCount: this.countWords(scenarioContent),
          startIndex: match.index,
          quality: this.assessExampleQuality(scenarioContent)
        });
      }
    }
    return this.deduplicateExamples(examples);
  }
  /**
   * Create an example object from detected content
   */
  createExample(content, startIndex, fullText) {
    const wordCount = this.countWords(content);
    const type = this.classifyExampleType(content, fullText);
    const quality = this.assessExampleQuality(content);
    return { type, content, wordCount, startIndex, quality };
  }
  /**
   * Classify the type of example
   */
  classifyExampleType(content, _fullText) {
    const lowerContent = content.toLowerCase();
    if (/[{}\[\]();=]/.test(content) && /(function|const|let|var|class|import|export|if|for|while)/.test(content)) {
      return "code";
    }
    if (/[\d+\-*/=×÷∑∫]/.test(content) && /\d/.test(content)) {
      return "mathematical";
    }
    if (/\b(company|business|customer|user|market|industry|organization|team)\b/i.test(
      content
    )) {
      return "realWorld";
    }
    if (/\b(imagine|suppose|consider|scenario|case)\b/i.test(lowerContent)) {
      return "scenario";
    }
    return "conceptual";
  }
  /**
   * Assess the quality of an example
   */
  assessExampleQuality(content) {
    const wordCount = this.countWords(content);
    if (wordCount < 15) return "low";
    const hasExplanation = /\b(because|therefore|this means|as a result|shows|demonstrates|illustrates)\b/i.test(
      content
    );
    const hasSpecifics = /\b(\d+|specifically|particular|exact)\b/i.test(content);
    if (wordCount >= 50 && (hasExplanation || hasSpecifics)) {
      return "high";
    } else if (wordCount >= 25 || hasExplanation || hasSpecifics) {
      return "medium";
    }
    return "low";
  }
  /**
   * Assess code example quality
   */
  assessCodeQuality(code) {
    const lines = code.split("\n").filter((l) => l.trim().length > 0);
    const hasComments = /\/\/|\/\*|#/.test(code);
    const hasGoodNames = /\b[a-z][a-zA-Z0-9]{3,}\b/.test(code);
    const hasStructure = lines.length >= 3;
    if (hasComments && hasGoodNames && hasStructure) {
      return "high";
    } else if (hasStructure || hasGoodNames && lines.length >= 2) {
      return "medium";
    }
    return "low";
  }
  /**
   * Check if text looks like an example
   */
  looksLikeExample(text) {
    const exampleIndicators = [
      /\b(would|could|might|can)\b/i,
      /\b(shows|demonstrates|illustrates)\b/i,
      /\b(such as|like|including)\b/i,
      /\d+/,
      // Contains numbers
      /"[^"]+"/
      // Contains quoted text
    ];
    return exampleIndicators.filter((pattern) => pattern.test(text)).length >= 2;
  }
  /**
   * Check code example quality issues
   */
  checkCodeExampleQuality(examples) {
    const issues = [];
    for (const example of examples) {
      if (!/\/\/|\/\*|#/.test(example.content)) {
        issues.push({
          severity: "low",
          description: "Code example lacks explanatory comments",
          location: `at position ${example.startIndex}`,
          suggestedFix: "Add comments explaining what the code does"
        });
      }
      const lines = example.content.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        issues.push({
          severity: "low",
          description: "Code example is too brief to be instructive",
          location: `at position ${example.startIndex}`,
          suggestedFix: "Expand the code example with more context"
        });
      }
    }
    return issues;
  }
  /**
   * Check if content is programming-related
   */
  isProgrammingContent(content) {
    const programmingKeywords = [
      "code",
      "programming",
      "function",
      "variable",
      "class",
      "method",
      "algorithm",
      "syntax",
      "debug",
      "compile",
      "execute",
      "javascript",
      "python",
      "typescript",
      "java",
      "c++",
      "react",
      "nodejs"
    ];
    const text = content.content.toLowerCase();
    const topic = (content.context?.topic ?? "").toLowerCase();
    return programmingKeywords.some(
      (keyword) => text.includes(keyword) || topic.includes(keyword)
    );
  }
  /**
   * Check example variety
   */
  checkExampleVariety(examples) {
    const types = new Set(examples.map((e) => e.type));
    if (types.size === 1 && examples.length >= 3) {
      const missingTypes = ["code", "realWorld", "scenario", "conceptual"].filter(
        (t) => !types.has(t)
      );
      return {
        hasVariety: false,
        suggestion: `Add different types of examples, such as ${missingTypes.slice(0, 2).join(" or ")} examples`
      };
    }
    return { hasVariety: true, suggestion: "" };
  }
  /**
   * Check example placement
   */
  checkExamplePlacement(text, examples) {
    const issues = [];
    const textLength = text.length;
    const lastQuarterStart = textLength * 0.75;
    const examplesInLastQuarter = examples.filter(
      (e) => e.startIndex > lastQuarterStart
    );
    if (examples.length >= 3 && examplesInLastQuarter.length > examples.length * 0.7) {
      issues.push({
        severity: "low",
        description: "Most examples are clustered at the end of the content",
        suggestedFix: "Distribute examples throughout the content near relevant concepts"
      });
    }
    return issues;
  }
  /**
   * Remove duplicate examples
   */
  deduplicateExamples(examples) {
    const unique = [];
    for (const example of examples) {
      const isDuplicate = unique.some(
        (u) => Math.abs(u.startIndex - example.startIndex) < 50 || this.similarContent(u.content, example.content)
      );
      if (!isDuplicate) {
        unique.push(example);
      }
    }
    return unique;
  }
  /**
   * Check if two contents are similar
   */
  similarContent(a, b) {
    const normalize = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const normA = normalize(a);
    const normB = normalize(b);
    if (normA === normB) return true;
    if (normA.includes(normB) || normB.includes(normA)) return true;
    return false;
  }
  /**
   * Count words
   */
  countWords(text) {
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  }
  /**
   * Count example types
   */
  countExampleTypes(examples) {
    const counts = {};
    for (const example of examples) {
      counts[example.type] = (counts[example.type] ?? 0) + 1;
    }
    return counts;
  }
  /**
   * Calculate average example length
   */
  calculateAverageLength(examples) {
    if (examples.length === 0) return 0;
    const total = examples.reduce((sum, e) => sum + e.wordCount, 0);
    return Math.round(total / examples.length);
  }
};
function createExampleQualityGate(config) {
  return new ExampleQualityGate(config);
}

// src/difficulty-gate.ts
var DifficultyMatchGate = class {
  name = "DifficultyMatchGate";
  description = "Validates that content difficulty matches the target level";
  defaultWeight = 1.3;
  applicableTypes = [
    "lesson",
    "explanation",
    "tutorial",
    "exercise",
    "assessment",
    "quiz"
  ];
  config;
  // Difficulty level numeric mapping
  difficultyOrder = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4
  };
  constructor(config) {
    this.config = {
      ...DEFAULT_DIFFICULTY_MATCH_CONFIG,
      ...config
    };
  }
  async evaluate(content) {
    const startTime = Date.now();
    const issues = [];
    const suggestions = [];
    let score = 100;
    const text = content.content;
    const targetLevel = content.targetDifficulty ?? "intermediate";
    const metrics = this.calculateDifficultyMetrics(text);
    const levelDiff = this.getLevelDifference(metrics.overallLevel, targetLevel);
    if (levelDiff > this.config.tolerance) {
      const severity = levelDiff > 0.5 ? "critical" : "high";
      score -= severity === "critical" ? 35 : 20;
      const direction = this.difficultyOrder[metrics.overallLevel] > this.difficultyOrder[targetLevel] ? "too difficult" : "too easy";
      issues.push({
        severity,
        description: `Content is ${direction} for ${targetLevel} level (detected: ${metrics.overallLevel})`,
        suggestedFix: this.getSuggestionForMismatch(metrics.overallLevel, targetLevel)
      });
      suggestions.push(this.getSuggestionForMismatch(metrics.overallLevel, targetLevel));
    }
    if (this.config.checkVocabulary) {
      const vocabResult = this.checkVocabularyMatch(metrics, targetLevel);
      if (!vocabResult.matches) {
        score -= 15;
        issues.push({
          severity: "high",
          description: vocabResult.issue,
          suggestedFix: vocabResult.suggestion
        });
        suggestions.push(vocabResult.suggestion);
      }
    }
    if (this.config.checkConceptComplexity) {
      const conceptResult = this.checkConceptMatch(metrics, targetLevel, text);
      if (!conceptResult.matches) {
        score -= 15;
        issues.push({
          severity: "high",
          description: conceptResult.issue,
          suggestedFix: conceptResult.suggestion
        });
        suggestions.push(conceptResult.suggestion);
      }
    }
    if (this.config.checkSentenceComplexity) {
      const sentenceResult = this.checkSentenceMatch(metrics, targetLevel);
      if (!sentenceResult.matches) {
        score -= 10;
        issues.push({
          severity: "medium",
          description: sentenceResult.issue,
          suggestedFix: sentenceResult.suggestion
        });
        suggestions.push(sentenceResult.suggestion);
      }
    }
    if (targetLevel === "beginner") {
      const accessibilityIssues = this.checkBeginnerAccessibility(text, metrics);
      if (accessibilityIssues.length > 0) {
        score -= accessibilityIssues.length * 5;
        issues.push(...accessibilityIssues);
      }
    }
    if (targetLevel === "expert") {
      const depthIssues = this.checkExpertDepth(text, metrics);
      if (depthIssues.length > 0) {
        score -= depthIssues.length * 5;
        issues.push(...depthIssues);
      }
    }
    score = Math.max(0, Math.min(100, score));
    const passed = score >= 75 && !issues.some((i) => i.severity === "critical");
    return {
      gateName: this.name,
      passed,
      score,
      weight: this.defaultWeight,
      issues,
      suggestions,
      processingTimeMs: Date.now() - startTime,
      metadata: {
        targetLevel,
        detectedLevel: metrics.overallLevel,
        vocabularyLevel: metrics.vocabularyLevel,
        conceptLevel: metrics.conceptLevel,
        sentenceLevel: metrics.sentenceLevel,
        readabilityScore: metrics.readabilityScore,
        averageSentenceLength: metrics.averageSentenceLength,
        complexWordRatio: Math.round(metrics.complexWordRatio * 100),
        technicalTermRatio: Math.round(metrics.technicalTermRatio * 100)
      }
    };
  }
  /**
   * Calculate difficulty metrics for the content
   */
  calculateDifficultyMetrics(text) {
    const words = this.getWords(text);
    const sentences = this.getSentences(text);
    const complexWords = this.countComplexWords(words);
    const technicalTerms = this.countTechnicalTerms(words);
    const complexWordRatio = words.length > 0 ? complexWords / words.length : 0;
    const technicalTermRatio = words.length > 0 ? technicalTerms / words.length : 0;
    const averageSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    const syllables = this.countSyllables(words);
    const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;
    const readabilityScore = this.calculateReadability(
      averageSentenceLength,
      avgSyllablesPerWord
    );
    const vocabularyLevel = this.getVocabularyLevel(complexWordRatio, technicalTermRatio);
    const sentenceLevel = this.getSentenceLevel(averageSentenceLength);
    const conceptLevel = this.getConceptLevel(text);
    const overallLevel = this.calculateOverallLevel(
      vocabularyLevel,
      sentenceLevel,
      conceptLevel
    );
    return {
      vocabularyLevel,
      conceptLevel,
      sentenceLevel,
      overallLevel,
      readabilityScore,
      averageSentenceLength,
      complexWordRatio,
      technicalTermRatio
    };
  }
  /**
   * Get words from text
   */
  getWords(text) {
    return text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "").split(/\s+/).filter((w) => w.length > 0 && /^[a-zA-Z]/.test(w));
  }
  /**
   * Get sentences from text
   */
  getSentences(text) {
    return text.replace(/```[\s\S]*?```/g, "").split(/[.!?]+/).filter((s) => s.trim().length > 10);
  }
  /**
   * Count complex words (3+ syllables)
   */
  countComplexWords(words) {
    return words.filter((w) => this.countWordSyllables(w) >= 3).length;
  }
  /**
   * Count technical terms
   */
  countTechnicalTerms(words) {
    const technicalPatterns = [
      /^[A-Z]{2,}$/,
      // Acronyms
      /^\w+(?:tion|sion|ment|ance|ence|ity|ness|ism)$/,
      // Technical suffixes
      /^\w+-\w+$/,
      // Hyphenated terms
      /^(?:algorithm|function|variable|parameter|instance|interface|abstract|implement)/i,
      /^(?:analyze|synthesize|evaluate|configure|initialize|optimize|implement)/i
    ];
    return words.filter(
      (w) => technicalPatterns.some((p) => p.test(w))
    ).length;
  }
  /**
   * Count syllables in all words
   */
  countSyllables(words) {
    return words.reduce((sum, word) => sum + this.countWordSyllables(word), 0);
  }
  /**
   * Count syllables in a single word
   */
  countWordSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    word = word.replace(/^y/, "");
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }
  /**
   * Calculate readability score (0-100, higher = easier)
   */
  calculateReadability(avgSentenceLength, avgSyllablesPerWord) {
    const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
    return Math.max(0, Math.min(100, score));
  }
  /**
   * Get vocabulary difficulty level
   */
  getVocabularyLevel(complexRatio, technicalRatio) {
    const combinedScore = complexRatio * 0.6 + technicalRatio * 0.4;
    if (combinedScore < 0.1) return "beginner";
    if (combinedScore < 0.2) return "intermediate";
    if (combinedScore < 0.35) return "advanced";
    return "expert";
  }
  /**
   * Get sentence complexity level
   */
  getSentenceLevel(avgLength) {
    if (avgLength < 12) return "beginner";
    if (avgLength < 18) return "intermediate";
    if (avgLength < 25) return "advanced";
    return "expert";
  }
  /**
   * Get concept complexity level
   */
  getConceptLevel(text) {
    const lowerText = text.toLowerCase();
    const expertIndicators = [
      /\b(?:theorem|proof|axiom|corollary|lemma)\b/,
      /\b(?:polynomial|logarithmic|exponential|derivative|integral)\b/,
      /\b(?:asynchronous|concurrency|distributed|scalability)\b/,
      /\b(?:epistemological|ontological|phenomenological)\b/
    ];
    const advancedIndicators = [
      /\b(?:algorithm|complexity|optimization|architecture)\b/,
      /\b(?:analysis|synthesis|evaluation|hypothesis)\b/,
      /\b(?:implementation|abstraction|encapsulation)\b/
    ];
    const intermediateIndicators = [
      /\b(?:function|variable|method|class|object)\b/,
      /\b(?:process|system|structure|pattern)\b/,
      /\b(?:compare|contrast|explain|describe)\b/
    ];
    const expertCount = expertIndicators.filter((p) => p.test(lowerText)).length;
    const advancedCount = advancedIndicators.filter((p) => p.test(lowerText)).length;
    const intermediateCount = intermediateIndicators.filter((p) => p.test(lowerText)).length;
    if (expertCount >= 2) return "expert";
    if (advancedCount >= 2 || expertCount >= 1 && advancedCount >= 1) return "advanced";
    if (intermediateCount >= 2 || advancedCount >= 1) return "intermediate";
    return "beginner";
  }
  /**
   * Calculate overall difficulty level
   */
  calculateOverallLevel(vocab, sentence, concept) {
    const vocabScore = this.difficultyOrder[vocab];
    const sentenceScore = this.difficultyOrder[sentence];
    const conceptScore = this.difficultyOrder[concept];
    const weightedScore = conceptScore * 0.4 + vocabScore * 0.35 + sentenceScore * 0.25;
    if (weightedScore < 1.5) return "beginner";
    if (weightedScore < 2.5) return "intermediate";
    if (weightedScore < 3.5) return "advanced";
    return "expert";
  }
  /**
   * Get level difference (normalized 0-1)
   */
  getLevelDifference(actual, target) {
    const diff = Math.abs(
      this.difficultyOrder[actual] - this.difficultyOrder[target]
    );
    return diff / 3;
  }
  /**
   * Get suggestion for difficulty mismatch
   */
  getSuggestionForMismatch(actual, target) {
    const actualNum = this.difficultyOrder[actual];
    const targetNum = this.difficultyOrder[target];
    if (actualNum > targetNum) {
      const suggestions = {
        beginner: "Use simpler vocabulary, shorter sentences, and more basic examples. Define all technical terms.",
        intermediate: "Reduce technical jargon and break down complex concepts. Add more foundational explanations.",
        advanced: "Simplify some concepts and reduce the assumption of prior knowledge.",
        expert: "This content is appropriate for expert level."
      };
      return suggestions[target];
    } else {
      const suggestions = {
        beginner: "This content is appropriate for beginner level.",
        intermediate: "Add more depth and introduce some technical terminology. Include more complex examples.",
        advanced: "Include more sophisticated concepts and assume more prior knowledge. Use advanced terminology.",
        expert: "Add cutting-edge concepts, research references, and assume mastery of foundational material."
      };
      return suggestions[target];
    }
  }
  /**
   * Check vocabulary match
   */
  checkVocabularyMatch(metrics, target) {
    const diff = this.getLevelDifference(metrics.vocabularyLevel, target);
    if (diff > this.config.tolerance) {
      const isTooDifficult = this.difficultyOrder[metrics.vocabularyLevel] > this.difficultyOrder[target];
      return {
        matches: false,
        issue: isTooDifficult ? `Vocabulary is too complex for ${target} level (${Math.round(metrics.complexWordRatio * 100)}% complex words)` : `Vocabulary is too simple for ${target} level (${Math.round(metrics.complexWordRatio * 100)}% complex words)`,
        suggestion: isTooDifficult ? "Use simpler words and define technical terms when first introduced" : "Incorporate more advanced terminology appropriate to the topic"
      };
    }
    return { matches: true, issue: "", suggestion: "" };
  }
  /**
   * Check concept match
   */
  checkConceptMatch(metrics, target, _text) {
    const diff = this.getLevelDifference(metrics.conceptLevel, target);
    if (diff > this.config.tolerance) {
      const isTooDifficult = this.difficultyOrder[metrics.conceptLevel] > this.difficultyOrder[target];
      return {
        matches: false,
        issue: isTooDifficult ? `Concepts are too advanced for ${target} level` : `Concepts are too basic for ${target} level`,
        suggestion: isTooDifficult ? "Break down complex concepts into smaller, more digestible pieces" : "Introduce more advanced concepts and deeper analysis"
      };
    }
    return { matches: true, issue: "", suggestion: "" };
  }
  /**
   * Check sentence match
   */
  checkSentenceMatch(metrics, target) {
    const diff = this.getLevelDifference(metrics.sentenceLevel, target);
    if (diff > this.config.tolerance) {
      const isTooComplex = this.difficultyOrder[metrics.sentenceLevel] > this.difficultyOrder[target];
      return {
        matches: false,
        issue: isTooComplex ? `Sentences are too long/complex for ${target} level (avg: ${Math.round(metrics.averageSentenceLength)} words)` : `Sentences are too short/simple for ${target} level (avg: ${Math.round(metrics.averageSentenceLength)} words)`,
        suggestion: isTooComplex ? "Break long sentences into shorter, clearer statements" : "Combine simple sentences into more sophisticated constructions"
      };
    }
    return { matches: true, issue: "", suggestion: "" };
  }
  /**
   * Check accessibility for beginner level
   */
  checkBeginnerAccessibility(text, metrics) {
    const issues = [];
    const jargonPattern = /\b[A-Z]{2,}\b/g;
    const jargonMatches = text.match(jargonPattern) ?? [];
    const undefinedJargon = jargonMatches.filter(
      (j) => !text.toLowerCase().includes(`${j.toLowerCase()} is`) && !text.toLowerCase().includes(`${j.toLowerCase()} means`) && !text.toLowerCase().includes(`(${j.toLowerCase()})`)
    );
    if (undefinedJargon.length > 2) {
      issues.push({
        severity: "medium",
        description: `Beginner content contains undefined acronyms/jargon: ${undefinedJargon.slice(0, 3).join(", ")}`,
        suggestedFix: "Define all acronyms and technical terms when first introduced"
      });
    }
    const assumptionPhrases = [
      "as you know",
      "obviously",
      "clearly",
      "of course",
      "as mentioned earlier",
      "as we discussed"
    ];
    for (const phrase of assumptionPhrases) {
      if (text.toLowerCase().includes(phrase)) {
        issues.push({
          severity: "low",
          description: `Beginner content assumes prior knowledge ("${phrase}")`,
          suggestedFix: "Avoid assuming what the reader knows; explain concepts from scratch"
        });
        break;
      }
    }
    if (metrics.readabilityScore < 50) {
      issues.push({
        severity: "medium",
        description: `Content readability is too low for beginners (score: ${Math.round(metrics.readabilityScore)})`,
        suggestedFix: "Simplify language and sentence structure for better accessibility"
      });
    }
    return issues;
  }
  /**
   * Check depth for expert level
   */
  checkExpertDepth(text, _metrics) {
    const issues = [];
    const hasReferences = /\b(?:according to|research shows|studies indicate|[A-Z][a-z]+ et al\.?|(?:19|20)\d{2})\b/i.test(text);
    if (!hasReferences) {
      issues.push({
        severity: "low",
        description: "Expert content lacks academic references or citations",
        suggestedFix: "Include references to research, studies, or authoritative sources"
      });
    }
    const hasNuance = /\b(?:however|although|nevertheless|exception|edge case|caveat|limitation)\b/i.test(text);
    if (!hasNuance) {
      issues.push({
        severity: "low",
        description: "Expert content lacks discussion of nuances, edge cases, or limitations",
        suggestedFix: "Add discussion of edge cases, limitations, and nuanced considerations"
      });
    }
    const hasAnalysis = /\b(?:analysis|evaluation|comparison|trade-?off|optimization|performance)\b/i.test(text);
    if (!hasAnalysis) {
      issues.push({
        severity: "medium",
        description: "Expert content lacks analytical depth",
        suggestedFix: "Include detailed analysis, comparisons, and trade-off discussions"
      });
    }
    return issues;
  }
};
function createDifficultyMatchGate(config) {
  return new DifficultyMatchGate(config);
}

// src/structure-gate.ts
var StructureGate = class {
  name = "StructureGate";
  description = "Validates content structure including headings, lists, and formatting";
  defaultWeight = 1;
  applicableTypes = [
    "lesson",
    "explanation",
    "tutorial",
    "summary",
    "assessment"
  ];
  config;
  constructor(config) {
    this.config = {
      ...DEFAULT_STRUCTURE_CONFIG,
      ...config
    };
  }
  async evaluate(content) {
    const startTime = Date.now();
    const issues = [];
    const suggestions = [];
    let score = 100;
    const text = content.content;
    const metrics = this.analyzeStructure(text);
    if (metrics.headingCount === 0 && this.shouldHaveHeadings(content)) {
      score -= 20;
      issues.push({
        severity: "high",
        description: "Content lacks section headings",
        suggestedFix: "Add headings to organize the content into logical sections"
      });
      suggestions.push("Add section headings (## Heading) to organize the content");
    }
    if (!metrics.hasProperHierarchy && metrics.headingCount > 1) {
      score -= 15;
      issues.push({
        severity: "medium",
        description: "Heading hierarchy is inconsistent (e.g., jumping from h1 to h3)",
        suggestedFix: "Use a consistent heading hierarchy (h1 > h2 > h3)"
      });
      suggestions.push("Fix heading levels to follow proper hierarchy");
    }
    const maxHeadingLevel = Math.max(...metrics.headingLevels, 0);
    const minHeadingLevel = Math.min(...metrics.headingLevels.filter((l) => l > 0), 6);
    if (minHeadingLevel < this.config.minHeadingDepth) {
      score -= 5;
      issues.push({
        severity: "low",
        description: `Content uses h${minHeadingLevel}, but h${this.config.minHeadingDepth} or deeper is recommended`,
        suggestedFix: `Start with h${this.config.minHeadingDepth} or deeper headings`
      });
    }
    if (maxHeadingLevel > this.config.maxHeadingDepth) {
      score -= 5;
      issues.push({
        severity: "low",
        description: `Content uses h${maxHeadingLevel}, which is too deep (max: h${this.config.maxHeadingDepth})`,
        suggestedFix: "Reduce heading depth to improve readability"
      });
    }
    if (this.config.requireLists && metrics.listCount === 0) {
      score -= 10;
      issues.push({
        severity: "medium",
        description: "Content lacks bullet points or numbered lists",
        suggestedFix: "Use lists to present related items or steps clearly"
      });
      suggestions.push("Add bullet points or numbered lists where appropriate");
    }
    if (metrics.longestParagraphLength > this.config.maxParagraphLength) {
      const severity = metrics.longestParagraphLength > this.config.maxParagraphLength * 2 ? "high" : "medium";
      score -= severity === "high" ? 15 : 10;
      issues.push({
        severity,
        description: `Some paragraphs are too long (${metrics.longestParagraphLength} sentences, max: ${this.config.maxParagraphLength})`,
        suggestedFix: "Break long paragraphs into smaller, focused ones"
      });
      suggestions.push("Split long paragraphs into smaller chunks");
    }
    if (this.config.requireMarkdown) {
      const markdownIssues = this.checkMarkdownFormatting(text, metrics);
      if (markdownIssues.length > 0) {
        score -= markdownIssues.length * 3;
        issues.push(...markdownIssues);
      }
    }
    if (this.isWallOfText(text, metrics)) {
      score -= 20;
      issues.push({
        severity: "high",
        description: "Content appears as a wall of text without visual breaks",
        suggestedFix: "Add headings, lists, and whitespace to improve readability"
      });
      suggestions.push("Break up the content with headings, lists, and shorter paragraphs");
    }
    const flowResult = this.checkLogicalFlow(text);
    if (!flowResult.hasGoodFlow) {
      score -= 10;
      issues.push({
        severity: "medium",
        description: flowResult.issue,
        suggestedFix: flowResult.suggestion
      });
      suggestions.push(flowResult.suggestion);
    }
    const consistencyIssues = this.checkFormattingConsistency(text);
    if (consistencyIssues.length > 0) {
      score -= consistencyIssues.length * 3;
      issues.push(...consistencyIssues);
    }
    if (this.isTechnicalContent(content) && metrics.codeBlockCount === 0) {
      const hasInlineCode = /`[^`]+`/.test(text);
      if (!hasInlineCode) {
        score -= 10;
        issues.push({
          severity: "medium",
          description: "Technical content lacks code formatting",
          suggestedFix: "Use code blocks (```) or inline code (`) for code snippets"
        });
      }
    }
    score = Math.max(0, Math.min(100, score));
    const passed = score >= 75 && !issues.some((i) => i.severity === "critical");
    return {
      gateName: this.name,
      passed,
      score,
      weight: this.defaultWeight,
      issues,
      suggestions,
      processingTimeMs: Date.now() - startTime,
      metadata: {
        headingCount: metrics.headingCount,
        headingLevels: metrics.headingLevels,
        listCount: metrics.listCount,
        codeBlockCount: metrics.codeBlockCount,
        paragraphCount: metrics.paragraphCount,
        averageParagraphLength: Math.round(metrics.averageParagraphLength * 10) / 10,
        longestParagraphLength: metrics.longestParagraphLength,
        hasProperHierarchy: metrics.hasProperHierarchy,
        markdownElements: metrics.markdownElements
      }
    };
  }
  /**
   * Analyze content structure
   */
  analyzeStructure(text) {
    const headingMatches = text.match(/^#{1,6}\s+.+/gm) ?? [];
    const headingLevels = headingMatches.map((h) => {
      const match = h.match(/^(#+)/);
      return match ? match[1].length : 0;
    });
    const bulletListItems = (text.match(/^\s*[-*+]\s+.+/gm) ?? []).length;
    const numberedListItems = (text.match(/^\s*\d+\.\s+.+/gm) ?? []).length;
    const listCount = bulletListItems + numberedListItems;
    const codeBlockCount = (text.match(/```[\s\S]*?```/g) ?? []).length;
    const paragraphs = this.getParagraphs(text);
    const paragraphLengths = paragraphs.map((p) => this.countSentences(p));
    const averageParagraphLength = paragraphLengths.length > 0 ? paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length : 0;
    const longestParagraphLength = Math.max(...paragraphLengths, 0);
    const hasProperHierarchy = this.checkHeadingHierarchy(headingLevels);
    const markdownElements = this.detectMarkdownElements(text);
    return {
      headingCount: headingMatches.length,
      headingLevels,
      listCount,
      codeBlockCount,
      paragraphCount: paragraphs.length,
      averageParagraphLength,
      longestParagraphLength,
      hasProperHierarchy,
      markdownElements
    };
  }
  /**
   * Get paragraphs from text
   */
  getParagraphs(text) {
    const withoutCode = text.replace(/```[\s\S]*?```/g, "");
    return withoutCode.split(/\n\s*\n/).filter((p) => {
      const trimmed = p.trim();
      return trimmed.length > 50 && !trimmed.startsWith("#") && !trimmed.match(/^[-*+\d]/);
    });
  }
  /**
   * Count sentences in a paragraph
   */
  countSentences(paragraph) {
    const sentences = paragraph.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    return sentences.length;
  }
  /**
   * Check heading hierarchy
   */
  checkHeadingHierarchy(levels) {
    if (levels.length <= 1) return true;
    for (let i = 1; i < levels.length; i++) {
      const current = levels[i];
      const previous = levels[i - 1];
      if (current !== void 0 && previous !== void 0) {
        if (current > previous && current - previous > 1) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Detect markdown elements used
   */
  detectMarkdownElements(text) {
    const elements = [];
    if (/^#{1,6}\s+/m.test(text)) elements.push("headings");
    if (/^\s*[-*+]\s+/m.test(text)) elements.push("bullet-list");
    if (/^\s*\d+\.\s+/m.test(text)) elements.push("numbered-list");
    if (/```[\s\S]*?```/.test(text)) elements.push("code-block");
    if (/`[^`]+`/.test(text)) elements.push("inline-code");
    if (/\*\*[^*]+\*\*/.test(text)) elements.push("bold");
    if (/\*[^*]+\*/.test(text) || /_[^_]+_/.test(text)) elements.push("italic");
    if (/\[.+\]\(.+\)/.test(text)) elements.push("link");
    if (/!\[.+\]\(.+\)/.test(text)) elements.push("image");
    if (/^\s*>\s+/m.test(text)) elements.push("blockquote");
    if (/\|.+\|/.test(text) && /[-:]+\|/.test(text)) elements.push("table");
    return elements;
  }
  /**
   * Check if content should have headings
   */
  shouldHaveHeadings(content) {
    const wordCount = content.content.split(/\s+/).length;
    if (wordCount < 150) return false;
    const needsHeadings = ["lesson", "tutorial", "explanation"];
    return needsHeadings.includes(content.type);
  }
  /**
   * Check if content is a wall of text
   */
  isWallOfText(text, metrics) {
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 200) return false;
    if (metrics.headingCount === 0 && metrics.listCount === 0 && metrics.codeBlockCount === 0) {
      return true;
    }
    const totalBreaks = metrics.headingCount + metrics.listCount + metrics.codeBlockCount;
    const breakRatio = wordCount / Math.max(totalBreaks, 1);
    return breakRatio > 200;
  }
  /**
   * Check for logical flow indicators
   */
  checkLogicalFlow(text) {
    const transitionPatterns = [
      /\b(first|second|third|finally|next|then|after|before)\b/gi,
      /\b(however|therefore|moreover|furthermore|additionally|consequently)\b/gi,
      /\b(for example|for instance|such as|specifically)\b/gi,
      /\b(in conclusion|to summarize|in summary|overall)\b/gi
    ];
    const wordCount = text.split(/\s+/).length;
    let transitionCount = 0;
    for (const pattern of transitionPatterns) {
      const matches = text.match(pattern);
      transitionCount += matches ? matches.length : 0;
    }
    const expectedTransitions = Math.floor(wordCount / 200);
    if (wordCount > 300 && transitionCount < expectedTransitions) {
      return {
        hasGoodFlow: false,
        issue: "Content lacks transition words to guide the reader",
        suggestion: 'Add transition phrases like "first", "however", "for example" to improve flow'
      };
    }
    return { hasGoodFlow: true, issue: "", suggestion: "" };
  }
  /**
   * Check markdown formatting
   */
  checkMarkdownFormatting(text, metrics) {
    const issues = [];
    const urlPattern = /(?<![(\[])(https?:\/\/[^\s\)]+)(?![)\]])/g;
    const plainUrls = text.match(urlPattern);
    if (plainUrls && plainUrls.length > 0) {
      issues.push({
        severity: "low",
        description: "Contains plain URLs that should be markdown links",
        suggestedFix: "Convert URLs to markdown links: [link text](url)"
      });
    }
    if (metrics.markdownElements.length < 2) {
      const hasLongContent = text.split(/\s+/).length > 200;
      if (hasLongContent) {
        issues.push({
          severity: "low",
          description: "Content lacks text formatting (bold, italic)",
          suggestedFix: "Use **bold** for key terms and *italic* for emphasis"
        });
      }
    }
    const brokenPatterns = [
      { pattern: /\*\*[^*]+$/, issue: "Unclosed bold formatting" },
      { pattern: /\*[^*]+$/, issue: "Unclosed italic formatting" },
      { pattern: /\[[^\]]+\]\([^)]+$/, issue: "Unclosed markdown link" },
      { pattern: /```[^`]*$/, issue: "Unclosed code block" }
    ];
    for (const { pattern, issue } of brokenPatterns) {
      if (pattern.test(text)) {
        issues.push({
          severity: "medium",
          description: issue,
          suggestedFix: "Close all markdown formatting properly"
        });
      }
    }
    return issues;
  }
  /**
   * Check formatting consistency
   */
  checkFormattingConsistency(text) {
    const issues = [];
    const hasMixedBullets = /^\s*-\s+/m.test(text) && /^\s*\*\s+/m.test(text);
    if (hasMixedBullets) {
      issues.push({
        severity: "low",
        description: "Uses mixed bullet styles (- and *)",
        suggestedFix: "Use consistent bullet style throughout"
      });
    }
    const hashHeadings = text.match(/^#{1,6}\s+/gm) ?? [];
    const underlineH1 = text.match(/^.+\n=+$/gm) ?? [];
    const underlineH2 = text.match(/^.+\n-+$/gm) ?? [];
    if (hashHeadings.length > 0 && (underlineH1.length > 0 || underlineH2.length > 0)) {
      issues.push({
        severity: "low",
        description: "Uses mixed heading styles (# and underline)",
        suggestedFix: "Use consistent heading style (prefer # style)"
      });
    }
    return issues;
  }
  /**
   * Check if content is technical
   */
  isTechnicalContent(content) {
    const technicalKeywords = [
      "code",
      "function",
      "variable",
      "algorithm",
      "api",
      "database",
      "query",
      "syntax",
      "command",
      "terminal",
      "script"
    ];
    const text = content.content.toLowerCase();
    const topic = (content.context?.topic ?? "").toLowerCase();
    return technicalKeywords.some((kw) => text.includes(kw) || topic.includes(kw));
  }
};
function createStructureGate(config) {
  return new StructureGate(config);
}

// src/depth-gate.ts
var DepthGate = class {
  name = "DepthGate";
  description = "Validates cognitive depth including explanations, connections, and critical thinking";
  defaultWeight = 1.4;
  applicableTypes = [
    "lesson",
    "explanation",
    "tutorial",
    "assessment",
    "exercise"
  ];
  config;
  constructor(config) {
    this.config = {
      ...DEFAULT_DEPTH_CONFIG,
      ...config
    };
  }
  async evaluate(content) {
    const startTime = Date.now();
    const issues = [];
    const suggestions = [];
    let score = 100;
    const text = content.content;
    const metrics = this.analyzeDepth(text);
    if (metrics.depthScore < this.config.minDepthScore) {
      const shortfall = this.config.minDepthScore - metrics.depthScore;
      const severity = shortfall > 30 ? "critical" : shortfall > 15 ? "high" : "medium";
      score -= severity === "critical" ? 35 : severity === "high" ? 25 : 15;
      issues.push({
        severity,
        description: `Cognitive depth score is ${Math.round(metrics.depthScore)}, below minimum of ${this.config.minDepthScore}`,
        suggestedFix: this.getDepthImprovementSuggestion(metrics)
      });
      suggestions.push(this.getDepthImprovementSuggestion(metrics));
    }
    if (this.config.checkExplanationDepth) {
      const explanationResult = this.checkExplanationDepth(metrics);
      if (!explanationResult.adequate) {
        score -= 15;
        issues.push({
          severity: "high",
          description: explanationResult.issue,
          suggestedFix: explanationResult.suggestion
        });
        suggestions.push(explanationResult.suggestion);
      }
    }
    if (this.config.checkConceptConnections) {
      const connectionResult = this.checkConceptConnections(metrics, text);
      if (!connectionResult.adequate) {
        score -= 12;
        issues.push({
          severity: "medium",
          description: connectionResult.issue,
          suggestedFix: connectionResult.suggestion
        });
        suggestions.push(connectionResult.suggestion);
      }
    }
    if (this.config.checkCriticalThinking) {
      const criticalResult = this.checkCriticalThinking(metrics, content);
      if (!criticalResult.adequate) {
        score -= 10;
        issues.push({
          severity: "medium",
          description: criticalResult.issue,
          suggestedFix: criticalResult.suggestion
        });
        suggestions.push(criticalResult.suggestion);
      }
    }
    const shallowPatterns = this.detectShallowPatterns(text);
    if (shallowPatterns.length > 0) {
      score -= shallowPatterns.length * 5;
      for (const pattern of shallowPatterns) {
        issues.push({
          severity: "medium",
          description: pattern.description,
          location: pattern.location,
          suggestedFix: pattern.fix
        });
      }
    }
    if (content.targetBloomsLevel) {
      const bloomsResult = this.checkBloomsAlignment(metrics, content.targetBloomsLevel);
      if (!bloomsResult.aligned) {
        score -= 15;
        issues.push({
          severity: "high",
          description: bloomsResult.issue,
          suggestedFix: bloomsResult.suggestion
        });
        suggestions.push(bloomsResult.suggestion);
      }
    }
    if (!metrics.evidencePresent && this.requiresEvidence(content)) {
      score -= 10;
      issues.push({
        severity: "medium",
        description: "Content lacks supporting evidence or references",
        suggestedFix: "Add examples, data, or references to support claims"
      });
    }
    if (!metrics.multiPerspective && this.benefitsFromPerspectives(content)) {
      score -= 5;
      issues.push({
        severity: "low",
        description: "Content presents only one perspective",
        suggestedFix: "Consider presenting alternative viewpoints or approaches"
      });
    }
    const superficialResult = this.checkSuperficialTreatment(text, content);
    if (superficialResult.isSuperficial) {
      score -= 15;
      issues.push({
        severity: "high",
        description: superficialResult.issue,
        suggestedFix: superficialResult.suggestion
      });
    }
    score = Math.max(0, Math.min(100, score));
    const passed = score >= 75 && !issues.some((i) => i.severity === "critical");
    return {
      gateName: this.name,
      passed,
      score,
      weight: this.defaultWeight,
      issues,
      suggestions,
      processingTimeMs: Date.now() - startTime,
      metadata: {
        depthScore: Math.round(metrics.depthScore),
        explanationDepth: Math.round(metrics.explanationDepth),
        conceptConnections: metrics.conceptConnections,
        criticalThinkingPrompts: metrics.criticalThinkingPrompts,
        bloomsIndicators: metrics.bloomsIndicators,
        reasoningPatterns: metrics.reasoningPatterns,
        evidencePresent: metrics.evidencePresent,
        multiPerspective: metrics.multiPerspective
      }
    };
  }
  /**
   * Analyze cognitive depth of content
   */
  analyzeDepth(text) {
    const explanationDepth = this.measureExplanationDepth(text);
    const conceptConnections = this.countConceptConnections(text);
    const criticalThinkingPrompts = this.countCriticalThinkingPrompts(text);
    const bloomsIndicators = this.analyzeBloomsIndicators(text);
    const reasoningPatterns = this.countReasoningPatterns(text);
    const evidencePresent = this.hasEvidence(text);
    const multiPerspective = this.hasMultiplePerspectives(text);
    const depthScore = this.calculateDepthScore({
      explanationDepth,
      conceptConnections,
      criticalThinkingPrompts,
      reasoningPatterns,
      evidencePresent,
      multiPerspective
    });
    return {
      depthScore,
      explanationDepth,
      conceptConnections,
      criticalThinkingPrompts,
      bloomsIndicators,
      reasoningPatterns,
      evidencePresent,
      multiPerspective
    };
  }
  /**
   * Measure explanation depth
   */
  measureExplanationDepth(text) {
    let depth = 0;
    const causalPatterns = [
      /\b(because|since|as a result|therefore|consequently|thus)\b/gi,
      /\b(due to|owing to|leads to|causes|results in)\b/gi,
      /\b(the reason|this means|this implies|this suggests)\b/gi
    ];
    for (const pattern of causalPatterns) {
      const matches = text.match(pattern);
      depth += (matches?.length ?? 0) * 5;
    }
    const elaborationPatterns = [
      /\b(in other words|that is to say|specifically|namely)\b/gi,
      /\b(to elaborate|more precisely|in particular)\b/gi,
      /\b(let me explain|to understand this|to clarify)\b/gi
    ];
    for (const pattern of elaborationPatterns) {
      const matches = text.match(pattern);
      depth += (matches?.length ?? 0) * 4;
    }
    const stepPatterns = /\b(first|second|third|then|next|finally|step)\b/gi;
    const stepMatches = text.match(stepPatterns);
    depth += (stepMatches?.length ?? 0) * 3;
    const wordCount = text.split(/\s+/).length;
    const normalizedDepth = depth / Math.max(wordCount, 100) * 500;
    return Math.min(100, normalizedDepth);
  }
  /**
   * Count concept connections
   */
  countConceptConnections(text) {
    const connectionPatterns = [
      /\b(relates to|connected to|associated with|linked to)\b/gi,
      /\b(similar to|differs from|in contrast to|compared to)\b/gi,
      /\b(builds on|extends|combines with|integrates)\b/gi,
      /\b(is a type of|is part of|consists of|includes)\b/gi,
      /\b(depends on|requires|enables|supports)\b/gi
    ];
    let connections = 0;
    for (const pattern of connectionPatterns) {
      const matches = text.match(pattern);
      connections += matches?.length ?? 0;
    }
    return connections;
  }
  /**
   * Count critical thinking prompts
   */
  countCriticalThinkingPrompts(text) {
    const criticalPatterns = [
      /\b(consider|think about|reflect on|ask yourself)\b/gi,
      /\b(what if|how would|why might|could this)\b/gi,
      /\b(analyze|evaluate|critique|assess|examine)\b/gi,
      /\b(implications|consequences|assumptions|limitations)\b/gi,
      /\?\s*(?=\n|$)/g
      // Questions
    ];
    let prompts = 0;
    for (const pattern of criticalPatterns) {
      const matches = text.match(pattern);
      prompts += matches?.length ?? 0;
    }
    return prompts;
  }
  /**
   * Analyze Bloom's taxonomy indicators
   */
  analyzeBloomsIndicators(text) {
    const indicators = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    const rememberPatterns = /\b(define|list|identify|recall|name|state|recognize)\b/gi;
    indicators.REMEMBER = (text.match(rememberPatterns) ?? []).length;
    const understandPatterns = /\b(explain|describe|summarize|interpret|paraphrase|discuss|illustrate)\b/gi;
    indicators.UNDERSTAND = (text.match(understandPatterns) ?? []).length;
    const applyPatterns = /\b(apply|demonstrate|use|implement|solve|execute|practice)\b/gi;
    indicators.APPLY = (text.match(applyPatterns) ?? []).length;
    const analyzePatterns = /\b(analyze|compare|contrast|differentiate|examine|investigate|categorize)\b/gi;
    indicators.ANALYZE = (text.match(analyzePatterns) ?? []).length;
    const evaluatePatterns = /\b(evaluate|judge|critique|assess|justify|argue|defend|recommend)\b/gi;
    indicators.EVALUATE = (text.match(evaluatePatterns) ?? []).length;
    const createPatterns = /\b(create|design|develop|construct|compose|formulate|generate|synthesize)\b/gi;
    indicators.CREATE = (text.match(createPatterns) ?? []).length;
    return indicators;
  }
  /**
   * Count reasoning patterns
   */
  countReasoningPatterns(text) {
    const reasoningPatterns = [
      /\b(if|when)\s+.+\s+(then|will|would)\b/gi,
      // Conditional reasoning
      /\b(premise|conclusion|argument|evidence|proof)\b/gi,
      // Logical terms
      /\b(assumption|hypothesis|theory|principle)\b/gi,
      // Theoretical terms
      /\b(data|statistics|research|study|experiment)\b/gi
      // Empirical terms
    ];
    let patterns = 0;
    for (const pattern of reasoningPatterns) {
      const matches = text.match(pattern);
      patterns += matches?.length ?? 0;
    }
    return patterns;
  }
  /**
   * Check if content has evidence
   */
  hasEvidence(text) {
    const evidencePatterns = [
      /\b(according to|research shows|studies indicate|data suggests)\b/i,
      /\b(for example|for instance|such as|e\.g\.)\b/i,
      /\b(evidence|proof|demonstration|illustration)\b/i,
      /\d+%/,
      // Statistics
      /\b[A-Z][a-z]+ et al\.?/i,
      // Citations
      /\(\d{4}\)/
      // Year citations
    ];
    return evidencePatterns.some((p) => p.test(text));
  }
  /**
   * Check for multiple perspectives
   */
  hasMultiplePerspectives(text) {
    const perspectivePatterns = [
      /\b(on the other hand|alternatively|another view|different perspective)\b/i,
      /\b(however|conversely|in contrast|whereas)\b/i,
      /\b(some argue|others believe|one approach|another approach)\b/i,
      /\b(pros and cons|advantages and disadvantages|benefits and drawbacks)\b/i
    ];
    return perspectivePatterns.some((p) => p.test(text));
  }
  /**
   * Calculate overall depth score
   */
  calculateDepthScore(metrics) {
    let score = 0;
    score += metrics.explanationDepth * 0.4;
    const connectionScore = Math.min(100, metrics.conceptConnections * 10);
    score += connectionScore * 0.2;
    const criticalScore = Math.min(100, metrics.criticalThinkingPrompts * 8);
    score += criticalScore * 0.2;
    const reasoningScore = Math.min(100, metrics.reasoningPatterns * 10);
    score += reasoningScore * 0.1;
    if (metrics.evidencePresent) score += 5;
    if (metrics.multiPerspective) score += 5;
    return Math.min(100, score);
  }
  /**
   * Get depth improvement suggestion
   */
  getDepthImprovementSuggestion(metrics) {
    if (metrics.explanationDepth < 30) {
      return "Add more causal explanations (why/how) and elaborate on key points";
    }
    if (metrics.conceptConnections < 3) {
      return "Connect concepts to related ideas and show relationships between topics";
    }
    if (metrics.criticalThinkingPrompts < 2) {
      return "Include questions or prompts that encourage critical thinking";
    }
    return "Increase overall depth by adding explanations, examples, and analysis";
  }
  /**
   * Check explanation depth
   */
  checkExplanationDepth(metrics) {
    if (metrics.explanationDepth < 30) {
      return {
        adequate: false,
        issue: "Explanations lack depth - missing causal reasoning and elaboration",
        suggestion: 'Explain why things work, not just what they are. Add "because", "therefore", and "this means" explanations'
      };
    }
    return { adequate: true, issue: "", suggestion: "" };
  }
  /**
   * Check concept connections
   */
  checkConceptConnections(metrics, text) {
    const wordCount = text.split(/\s+/).length;
    const expectedConnections = Math.max(2, Math.floor(wordCount / 200));
    if (metrics.conceptConnections < expectedConnections) {
      return {
        adequate: false,
        issue: `Content has only ${metrics.conceptConnections} concept connections (expected: ${expectedConnections}+)`,
        suggestion: "Show how concepts relate to each other and to prior knowledge"
      };
    }
    return { adequate: true, issue: "", suggestion: "" };
  }
  /**
   * Check critical thinking
   */
  checkCriticalThinking(metrics, content) {
    const educationalTypes = ["lesson", "tutorial", "exercise"];
    if (educationalTypes.includes(content.type)) {
      if (metrics.criticalThinkingPrompts < 2) {
        return {
          adequate: false,
          issue: "Content lacks critical thinking prompts",
          suggestion: 'Add questions like "What if...?", "Why might...?", or "Consider..."'
        };
      }
    }
    return { adequate: true, issue: "", suggestion: "" };
  }
  /**
   * Detect shallow content patterns
   */
  detectShallowPatterns(text) {
    const patterns = [];
    if (/\b(important|useful|helpful|necessary)\b/gi.test(text)) {
      const hasSpecific = /\b(specifically|because|for example)\b/i.test(text);
      if (!hasSpecific) {
        patterns.push({
          description: "Uses generic statements without explaining why",
          fix: "Explain why something is important/useful with specific reasons"
        });
      }
    }
    const listItems = text.match(/^\s*[-*\d]+\.\s+.+$/gm) ?? [];
    const shortLists = listItems.filter((item) => item.split(/\s+/).length < 8);
    if (shortLists.length > 3 && shortLists.length > listItems.length * 0.7) {
      patterns.push({
        description: "Contains lists without adequate explanations",
        fix: "Expand list items with explanations or combine into prose"
      });
    }
    const oversimplificationPatterns = [
      /\b(simply|just|only need to|all you have to do)\b/gi,
      /\b(easy|simple|straightforward|basic)\b/gi
    ];
    for (const pattern of oversimplificationPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 3) {
        patterns.push({
          description: "May be oversimplifying complex topics",
          fix: "Acknowledge complexity and provide nuanced explanations"
        });
        break;
      }
    }
    return patterns;
  }
  /**
   * Check Bloom's alignment
   */
  checkBloomsAlignment(metrics, targetLevel) {
    const levelOrder = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    const targetIndex = levelOrder.indexOf(targetLevel.toUpperCase());
    if (targetIndex === -1) {
      return { aligned: true, issue: "", suggestion: "" };
    }
    let maxLevel = "REMEMBER";
    let maxCount = 0;
    for (const [level, count] of Object.entries(metrics.bloomsIndicators)) {
      if (count > maxCount) {
        maxCount = count;
        maxLevel = level;
      }
    }
    const actualIndex = levelOrder.indexOf(maxLevel);
    const diff = Math.abs(targetIndex - actualIndex);
    if (diff > 1) {
      const isBelow = actualIndex < targetIndex;
      return {
        aligned: false,
        issue: `Content operates at ${maxLevel} level, but targets ${targetLevel}`,
        suggestion: isBelow ? `Add more ${targetLevel}-level activities and language` : `Include more foundational content before advancing to higher-order thinking`
      };
    }
    return { aligned: true, issue: "", suggestion: "" };
  }
  /**
   * Check if content requires evidence
   */
  requiresEvidence(content) {
    const evidenceTypes = ["lesson", "explanation", "assessment"];
    const wordCount = content.content.split(/\s+/).length;
    return evidenceTypes.includes(content.type) && wordCount > 200;
  }
  /**
   * Check if content benefits from multiple perspectives
   */
  benefitsFromPerspectives(content) {
    const perspectiveTypes = ["lesson", "explanation"];
    const wordCount = content.content.split(/\s+/).length;
    return perspectiveTypes.includes(content.type) && wordCount > 300;
  }
  /**
   * Check for superficial treatment
   */
  checkSuperficialTreatment(text, content) {
    const wordCount = text.split(/\s+/).length;
    if (content.context?.learningObjectives) {
      const objectiveCount = content.context.learningObjectives.length;
      const wordsPerObjective = wordCount / Math.max(objectiveCount, 1);
      if (objectiveCount > 2 && wordsPerObjective < 100) {
        return {
          isSuperficial: true,
          issue: `Content covers ${objectiveCount} objectives in only ${wordCount} words (${Math.round(wordsPerObjective)} words per objective)`,
          suggestion: "Expand coverage of each learning objective with more depth"
        };
      }
    }
    const driveByPattern = /\b(we will cover|we'll discuss|we will see|we'll learn)\b/gi;
    const driveByMatches = text.match(driveByPattern) ?? [];
    const actualCoverage = text.match(/\b(here's how|let's explore|to understand|specifically)\b/gi) ?? [];
    if (driveByMatches.length > actualCoverage.length * 2) {
      return {
        isSuperficial: true,
        issue: "Content promises to cover topics but doesn't deliver adequate depth",
        suggestion: "Follow through on promises to cover topics with actual content"
      };
    }
    return { isSuperficial: false, issue: "", suggestion: "" };
  }
};
function createDepthGate(config) {
  return new DepthGate(config);
}

// src/pipeline.ts
var ContentQualityGatePipeline = class {
  gates;
  config;
  iterationCount = 0;
  constructor(config) {
    this.config = {
      ...DEFAULT_PIPELINE_CONFIG,
      ...config
    };
    this.gates = /* @__PURE__ */ new Map();
    this.initializeDefaultGates();
  }
  /**
   * Initialize default quality gates
   */
  initializeDefaultGates() {
    const defaultGates = [
      new CompletenessGate(),
      new ExampleQualityGate(),
      new DifficultyMatchGate(),
      new StructureGate(),
      new DepthGate()
    ];
    for (const gate of defaultGates) {
      this.gates.set(gate.name, gate);
    }
  }
  /**
   * Add a custom gate to the pipeline
   */
  addGate(gate) {
    this.gates.set(gate.name, gate);
  }
  /**
   * Remove a gate from the pipeline
   */
  removeGate(gateName) {
    return this.gates.delete(gateName);
  }
  /**
   * Get a gate by name
   */
  getGate(gateName) {
    return this.gates.get(gateName);
  }
  /**
   * Get all gate names
   */
  getGateNames() {
    return Array.from(this.gates.keys());
  }
  /**
   * Validate content through all quality gates
   */
  async validate(content) {
    const startTime = Date.now();
    this.iterationCount = 0;
    return this.validateWithRetry(content, startTime);
  }
  /**
   * Validate with retry/enhancement logic
   */
  async validateWithRetry(content, startTime) {
    this.iterationCount++;
    const applicableGates = this.getApplicableGates(content);
    const gateResults = await this.runGates(applicableGates, content);
    const overallScore = this.calculateWeightedScore(gateResults);
    const failedGates = gateResults.filter((r) => !r.passed).map((r) => r.gateName);
    const criticalIssues = gateResults.flatMap(
      (r) => r.issues.filter((i) => i.severity === "critical")
    );
    const allSuggestions = [...new Set(gateResults.flatMap((r) => r.suggestions))];
    const passed = overallScore >= this.config.threshold && criticalIssues.length === 0;
    const result = {
      passed,
      overallScore,
      content,
      gateResults,
      failedGates,
      iterations: this.iterationCount,
      totalProcessingTimeMs: Date.now() - startTime,
      allSuggestions,
      criticalIssues,
      metadata: this.buildMetadata(passed, overallScore, criticalIssues)
    };
    if (!passed && this.config.enableEnhancement && this.iterationCount < this.config.maxIterations) {
      const enhancedContent = await this.enhanceContent(content, gateResults);
      if (enhancedContent) {
        return this.validateWithRetry(enhancedContent, startTime);
      }
    }
    return result;
  }
  /**
   * Get gates applicable to the content type
   */
  getApplicableGates(content) {
    return Array.from(this.gates.values()).filter((gate) => {
      if (this.config.enabledGates && this.config.enabledGates.length > 0 && !this.config.enabledGates.includes(gate.name)) {
        return false;
      }
      if (this.config.disabledGates && this.config.disabledGates.includes(gate.name)) {
        return false;
      }
      return gate.applicableTypes.includes(content.type);
    });
  }
  /**
   * Run gates on content
   */
  async runGates(gates, content) {
    if (this.config.parallel) {
      const promises = gates.map(
        (gate) => this.runGateWithTimeout(gate, content)
      );
      return Promise.all(promises);
    } else {
      const results = [];
      for (const gate of gates) {
        const result = await this.runGateWithTimeout(gate, content);
        results.push(result);
        if (result.issues.some((i) => i.severity === "critical")) {
          break;
        }
      }
      return results;
    }
  }
  /**
   * Run a single gate with timeout
   */
  async runGateWithTimeout(gate, content) {
    const gateTimeout = this.config.timeoutMs / this.gates.size;
    try {
      const resultPromise = gate.evaluate(content);
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Gate timeout")), gateTimeout)
      );
      const result = await Promise.race([resultPromise, timeoutPromise]);
      if (this.config.gateWeights?.[gate.name]) {
        result.weight = this.config.gateWeights[gate.name];
      }
      return result;
    } catch (error) {
      return {
        gateName: gate.name,
        passed: false,
        score: 0,
        weight: gate.defaultWeight,
        issues: [
          {
            severity: "high",
            description: `Gate failed to evaluate: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ],
        suggestions: [],
        processingTimeMs: gateTimeout,
        metadata: { error: true }
      };
    }
  }
  /**
   * Calculate weighted overall score
   */
  calculateWeightedScore(results) {
    if (results.length === 0) return 100;
    let totalWeight = 0;
    let weightedSum = 0;
    for (const result of results) {
      weightedSum += result.score * result.weight;
      totalWeight += result.weight;
    }
    return Math.round(weightedSum / totalWeight * 10) / 10;
  }
  /**
   * Attempt to enhance content based on gate failures
   */
  async enhanceContent(content, results) {
    const failedResults = results.filter((r) => !r.passed);
    for (const result of failedResults) {
      const gate = this.gates.get(result.gateName);
      if (gate?.enhance) {
        try {
          const enhanced = await gate.enhance(content, result.issues);
          if (enhanced.content !== content.content) {
            return enhanced;
          }
        } catch {
        }
      }
    }
    return null;
  }
  /**
   * Build validation metadata
   */
  buildMetadata(passed, score, criticalIssues) {
    let reason;
    if (passed) {
      reason = "All quality gates passed";
    } else if (criticalIssues.length > 0) {
      reason = `Critical issues found: ${criticalIssues.map((i) => i.description).join("; ")}`;
    } else {
      reason = `Overall score ${score} is below threshold ${this.config.threshold}`;
    }
    return {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      config: this.config,
      enhancementAttempted: this.iterationCount > 1,
      reason
    };
  }
  /**
   * Quick validation - runs only essential gates
   */
  async quickValidate(content) {
    const essentialGates = ["CompletenessGate", "StructureGate"];
    const gates = Array.from(this.gates.values()).filter(
      (g) => essentialGates.includes(g.name)
    );
    const results = await this.runGates(gates, content);
    const score = this.calculateWeightedScore(results);
    const criticalIssues = results.flatMap(
      (r) => r.issues.filter((i) => i.severity === "critical")
    );
    return {
      passed: score >= this.config.threshold && criticalIssues.length === 0,
      score,
      criticalIssues
    };
  }
  /**
   * Get pipeline statistics
   */
  getStats() {
    return {
      gateCount: this.gates.size,
      gateNames: Array.from(this.gates.keys()),
      config: this.config
    };
  }
  /**
   * Update pipeline configuration
   */
  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config
    };
  }
};
function createQualityGatePipeline(config) {
  return new ContentQualityGatePipeline(config);
}
async function validateContent(content, config) {
  const pipeline = createQualityGatePipeline(config);
  return pipeline.validate(content);
}
async function quickValidateContent(content) {
  const pipeline = createQualityGatePipeline({
    parallel: true,
    enableEnhancement: false
  });
  return pipeline.quickValidate(content);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CompletenessGate,
  ContentQualityGatePipeline,
  DEFAULT_COMPLETENESS_CONFIG,
  DEFAULT_DEPTH_CONFIG,
  DEFAULT_DIFFICULTY_MATCH_CONFIG,
  DEFAULT_EXAMPLE_QUALITY_CONFIG,
  DEFAULT_PIPELINE_CONFIG,
  DEFAULT_STRUCTURE_CONFIG,
  DepthGate,
  DifficultyMatchGate,
  ExampleQualityGate,
  StructureGate,
  createCompletenessGate,
  createDepthGate,
  createDifficultyMatchGate,
  createExampleQualityGate,
  createQualityGatePipeline,
  createStructureGate,
  quickValidateContent,
  validateContent
});
