/**
 * AI Content Generation Criteria
 *
 * This module defines structured thinking frameworks that guide AI when generating
 * chapter descriptions, section descriptions, and learning objectives.
 *
 * The criteria ensure the AI considers pedagogical best practices, Bloom's taxonomy,
 * practical applications, and skill development.
 */

// ============================================================================
// Bloom's Taxonomy Reference
// ============================================================================

export const BLOOMS_TAXONOMY = {
  REMEMBER: {
    level: 1,
    description: 'Recall facts and basic concepts',
    verbs: ['Define', 'List', 'Recall', 'Identify', 'Name', 'State', 'Recognize', 'Describe', 'Retrieve', 'Label'],
    questionStems: ['What is...?', 'Where is...?', 'How did...?', 'When did...?', 'Who was...?'],
    cognitiveProcess: 'Retrieving relevant knowledge from long-term memory',
    studentOutcome: 'Can recall and recognize information accurately',
  },
  UNDERSTAND: {
    level: 2,
    description: 'Explain ideas and concepts',
    verbs: ['Explain', 'Summarize', 'Interpret', 'Classify', 'Compare', 'Discuss', 'Distinguish', 'Illustrate', 'Paraphrase', 'Predict'],
    questionStems: ['How would you explain...?', 'What is the meaning of...?', 'How are these similar/different...?'],
    cognitiveProcess: 'Constructing meaning from instructional messages',
    studentOutcome: 'Can explain concepts in their own words and make connections',
  },
  APPLY: {
    level: 3,
    description: 'Use information in new situations',
    verbs: ['Apply', 'Demonstrate', 'Implement', 'Execute', 'Use', 'Solve', 'Practice', 'Calculate', 'Operate', 'Show'],
    questionStems: ['How would you use...?', 'What would happen if...?', 'How would you solve...?'],
    cognitiveProcess: 'Carrying out or using a procedure in a given situation',
    studentOutcome: 'Can use learned concepts to solve problems and complete tasks',
  },
  ANALYZE: {
    level: 4,
    description: 'Draw connections among ideas',
    verbs: ['Analyze', 'Differentiate', 'Organize', 'Examine', 'Investigate', 'Categorize', 'Deconstruct', 'Contrast', 'Diagram', 'Outline'],
    questionStems: ['What are the parts of...?', 'How does X relate to Y...?', 'What evidence supports...?'],
    cognitiveProcess: 'Breaking material into parts and determining relationships',
    studentOutcome: 'Can break down complex information and identify patterns',
  },
  EVALUATE: {
    level: 5,
    description: 'Justify decisions and actions',
    verbs: ['Evaluate', 'Judge', 'Assess', 'Critique', 'Justify', 'Recommend', 'Validate', 'Prioritize', 'Defend', 'Argue'],
    questionStems: ['What criteria would you use to assess...?', 'How would you evaluate...?', 'What is most important...?'],
    cognitiveProcess: 'Making judgments based on criteria and standards',
    studentOutcome: 'Can make informed decisions and defend their reasoning',
  },
  CREATE: {
    level: 6,
    description: 'Produce new or original work',
    verbs: ['Create', 'Design', 'Develop', 'Construct', 'Produce', 'Formulate', 'Compose', 'Generate', 'Invent', 'Build'],
    questionStems: ['What would you create...?', 'How would you design...?', 'What alternative can you propose...?'],
    cognitiveProcess: 'Putting elements together to form a coherent whole',
    studentOutcome: 'Can synthesize information to create something new and original',
  },
} as const;

// ============================================================================
// Chapter Description Thinking Criteria
// ============================================================================

export interface ChapterThinkingCriteria {
  intuitionBehindDevelopment: string;
  mainTopicsCovered: string[];
  bloomsCognitiveIntegration: string;
  practicalApplications: string[];
  skillsDeveloped: string[];
  prerequisiteKnowledge: string;
  connectionToPreviousChapter: string;
  connectionToNextChapter: string;
  realWorldRelevance: string;
  assessmentApproach: string;
}

export const CHAPTER_THINKING_FRAMEWORK = `
## CHAPTER DESCRIPTION THINKING FRAMEWORK

When generating a chapter description, I must think through these critical dimensions:

### 1. INTUITION BEHIND DEVELOPMENT
Ask yourself: "Why does this chapter exist in the learning journey?"
- What gap in knowledge does this chapter fill?
- What misconceptions might students have that this chapter addresses?
- How does this chapter prepare students for more advanced concepts?
- What would students miss if this chapter was removed?

### 2. MAIN TOPICS TO COVER
Identify the core concepts that MUST be in this description:
- Primary concept: The central idea students must grasp
- Supporting concepts: Building blocks that enable understanding
- Connecting concepts: How this relates to broader subject matter
- Practical concepts: Hands-on elements students will work with

### 3. BLOOM'S COGNITIVE INTEGRATION
For the assigned Bloom's level, incorporate ALL cognitive abilities progressively:

**If REMEMBER level**: Focus on definitions, terminology, facts, and foundational knowledge
**If UNDERSTAND level**: Explain concepts, show relationships, use analogies
**If APPLY level**: Demonstrate use cases, provide scenarios, show problem-solving
**If ANALYZE level**: Break down complexity, compare/contrast, identify patterns
**If EVALUATE level**: Present criteria for judgment, discuss trade-offs, quality assessment
**If CREATE level**: Design challenges, synthesis opportunities, innovation prompts

### 4. PRACTICAL APPLICATIONS
Always address:
- "How will students USE this in real work?"
- "What problems can they solve after this chapter?"
- Industry/real-world scenarios where this applies
- Hands-on projects or exercises that reinforce learning

### 5. SKILLS DEVELOPED
Be explicit about:
- Technical skills gained
- Cognitive abilities enhanced
- Problem-solving capabilities built
- Professional competencies developed
- Soft skills practiced (communication, collaboration, critical thinking)

### 6. LEARNING PROGRESSION
Consider the learning journey:
- What must students know BEFORE this chapter?
- How does this build on previous chapters?
- What does this chapter enable in future learning?
- How does complexity appropriately increase?
`;

// ============================================================================
// Section Description Thinking Criteria
// ============================================================================

export interface SectionThinkingCriteria {
  focusedLearningOutcome: string;
  keyConceptsExplained: string[];
  practicalExercise: string;
  skillPracticed: string;
  estimatedCognitiveLoad: 'light' | 'moderate' | 'heavy';
  engagementStrategy: string;
}

export const SECTION_THINKING_FRAMEWORK = `
## SECTION DESCRIPTION THINKING FRAMEWORK

Each section is a focused learning unit. Think through:

### 1. FOCUSED LEARNING OUTCOME
- What SINGLE thing will students accomplish in this section?
- How is this measurable?
- What evidence shows mastery?

### 2. KEY CONCEPTS
- What are the 2-3 essential concepts covered?
- How are they sequenced for optimal understanding?
- What examples illustrate each concept?

### 3. PRACTICAL EXERCISE
- What hands-on activity reinforces learning?
- How does the exercise connect theory to practice?
- What feedback will students receive?

### 4. SKILL BUILDING
- What specific skill is practiced?
- How does this skill transfer to real situations?
- What level of proficiency should students achieve?

### 5. COGNITIVE LOAD MANAGEMENT
- Is the content appropriately chunked?
- Are there scaffolding supports for complex ideas?
- Are there opportunities for practice before moving on?

### 6. ENGAGEMENT
- What makes this section interesting?
- How are different learning styles accommodated?
- What motivates continued learning?
`;

// ============================================================================
// Learning Objectives Thinking Criteria
// ============================================================================

export interface ObjectiveThinkingCriteria {
  bloomsVerb: string;
  specificContent: string;
  measurableBehavior: string;
  conditionsOfPerformance: string;
  standardsOfAcceptability: string;
  realWorldApplication: string;
}

export const LEARNING_OBJECTIVES_FRAMEWORK = `
## LEARNING OBJECTIVES THINKING FRAMEWORK

Each learning objective must be SMART (Specific, Measurable, Achievable, Relevant, Time-bound).

### OBJECTIVE CONSTRUCTION CRITERIA:

1. **START WITH BLOOM'S VERB** (appropriate to cognitive level)
   - Use active, observable verbs
   - Match verb to intended cognitive process
   - Avoid vague verbs like "understand", "know", "learn"

2. **SPECIFY THE CONTENT**
   - What exactly will students do?
   - What knowledge/skill is demonstrated?
   - Be specific, not general

3. **MAKE IT MEASURABLE**
   - How will we know students achieved this?
   - What evidence demonstrates success?
   - Can this be observed or assessed?

4. **DEFINE CONDITIONS** (when appropriate)
   - Under what circumstances?
   - With what resources?
   - Given what constraints?

5. **SET STANDARDS** (when appropriate)
   - To what degree of accuracy?
   - How many? How quickly?
   - What quality level?

6. **CONNECT TO REAL WORLD**
   - Why does this matter professionally?
   - Where will students use this?
   - What problem does this solve?

### OBJECTIVE QUALITY CHECKLIST:
- [ ] Uses appropriate Bloom's taxonomy verb
- [ ] Is specific and focused (not too broad)
- [ ] Can be observed or measured
- [ ] Is achievable within the section/chapter timeframe
- [ ] Aligns with overall course goals
- [ ] Is relevant to target audience
- [ ] Connects to practical application
`;

// ============================================================================
// Complete AI Prompt Builder
// ============================================================================

export function buildChapterDescriptionPrompt(context: {
  chapterTitle: string;
  chapterPosition: number;
  totalChapters: number;
  bloomsLevel: string;
  courseTitle: string;
  targetAudience: string;
  difficulty: string;
  previousChapterTitle?: string;
  nextChapterTitle?: string;
  courseObjectives: string[];
  learningObjectivesPerChapter: number;
}): string {
  const bloomsInfo = BLOOMS_TAXONOMY[context.bloomsLevel as keyof typeof BLOOMS_TAXONOMY] || BLOOMS_TAXONOMY.UNDERSTAND;

  return `You are an expert instructional designer creating educational content.

${CHAPTER_THINKING_FRAMEWORK}

## YOUR TASK

Create a comprehensive chapter description and learning objectives for:

**Chapter ${context.chapterPosition} of ${context.totalChapters}: "${context.chapterTitle}"**

**Course Context:**
- Course: "${context.courseTitle}"
- Target Audience: ${context.targetAudience}
- Difficulty Level: ${context.difficulty}
- Bloom's Level for this chapter: ${context.bloomsLevel} (Level ${bloomsInfo.level})
${context.previousChapterTitle ? `- Previous Chapter: "${context.previousChapterTitle}"` : '- This is the first chapter'}
${context.nextChapterTitle ? `- Next Chapter: "${context.nextChapterTitle}"` : '- This is the final chapter'}

**Bloom's Level Details:**
- Description: ${bloomsInfo.description}
- Cognitive Process: ${bloomsInfo.cognitiveProcess}
- Student Outcome: ${bloomsInfo.studentOutcome}
- Recommended Verbs: ${bloomsInfo.verbs.join(', ')}

**Course Learning Objectives to Address:**
${context.courseObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

## THINK THROUGH EACH DIMENSION:

1. **Intuition Behind This Chapter:**
   - Why is this chapter positioned here in the learning sequence?
   - What knowledge gap does it address?
   - How does it prepare students for advanced concepts?

2. **Main Topics:**
   - What are the 3-5 core topics this chapter MUST cover?
   - How do these topics build on each other?

3. **Bloom's Integration:**
   - How does the description reflect ${context.bloomsLevel} level thinking?
   - What cognitive activities align with "${bloomsInfo.cognitiveProcess}"?

4. **Practical Applications:**
   - What real-world problems can students solve after this chapter?
   - What hands-on activities reinforce the learning?

5. **Skills Developed:**
   - What technical skills will students gain?
   - What cognitive abilities will be enhanced?
   - What professional competencies will be built?

## OUTPUT FORMAT

Return JSON with this exact structure:
{
  "description": "A compelling 3-4 sentence chapter description that incorporates intuition, main topics, Bloom's level thinking, practical applications, and skill development. Write as if speaking directly to the learner about what they will discover and achieve.",
  "learningOutcomes": [
    "Learning objective 1 starting with a ${context.bloomsLevel} level verb...",
    "Learning objective 2...",
    // Generate exactly ${context.learningObjectivesPerChapter} objectives
  ],
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "practicalApplications": ["Application 1", "Application 2"],
  "skillsDeveloped": ["Skill 1", "Skill 2", "Skill 3"],
  "estimatedTime": "X hours",
  "prerequisites": "What students should know before this chapter",
  "thinkingRationale": "Brief explanation of why this chapter is structured this way"
}

IMPORTANT: Each learning objective MUST:
- Start with a verb from this list: ${bloomsInfo.verbs.join(', ')}
- Be specific and measurable
- Connect to practical application
- Be achievable within this chapter`;
}

export function buildSectionDescriptionPrompt(context: {
  sectionTitle: string;
  sectionPosition: number;
  totalSections: number;
  chapterTitle: string;
  chapterBloomsLevel: string;
  contentType: string;
  learningObjectivesPerSection: number;
  targetAudience: string;
  difficulty: string;
}): string {
  const bloomsInfo = BLOOMS_TAXONOMY[context.chapterBloomsLevel as keyof typeof BLOOMS_TAXONOMY] || BLOOMS_TAXONOMY.APPLY;

  return `You are an expert instructional designer creating focused learning content.

${SECTION_THINKING_FRAMEWORK}

## YOUR TASK

Create a focused section description and learning objectives for:

**Section ${context.sectionPosition} of ${context.totalSections}: "${context.sectionTitle}"**
**In Chapter: "${context.chapterTitle}"**

**Context:**
- Content Type: ${context.contentType}
- Target Audience: ${context.targetAudience}
- Difficulty: ${context.difficulty}
- Bloom's Level (inherited from chapter): ${context.chapterBloomsLevel}

**Bloom's Level Details:**
- Cognitive Process: ${bloomsInfo.cognitiveProcess}
- Recommended Verbs: ${bloomsInfo.verbs.slice(0, 5).join(', ')}

## THINK THROUGH:

1. **Focused Outcome:**
   - What SINGLE thing will students accomplish?
   - How is this measurable?

2. **Key Concepts:**
   - What 2-3 essential concepts are covered?
   - How are they sequenced?

3. **Practical Exercise:**
   - What hands-on activity reinforces learning?
   - How does it connect theory to practice?

4. **Skill Building:**
   - What specific skill is practiced?
   - How does it transfer to real situations?

## OUTPUT FORMAT

Return JSON with this exact structure:
{
  "description": "A 2-3 sentence section description focused on what students will learn and do. Be specific about the hands-on activities and outcomes.",
  "learningObjectives": [
    "Specific objective 1 with ${context.chapterBloomsLevel} level verb...",
    // Generate exactly ${context.learningObjectivesPerSection} objectives
  ],
  "keyConceptsCovered": ["Concept 1", "Concept 2"],
  "practicalActivity": "Description of hands-on activity",
  "estimatedDuration": "X minutes"
}

IMPORTANT: Each objective MUST use verbs from: ${bloomsInfo.verbs.slice(0, 5).join(', ')}`;
}

// ============================================================================
// Quality Validation
// ============================================================================

export function validateObjective(objective: string, bloomsLevel: string): {
  isValid: boolean;
  issues: string[];
  score: number;
} {
  const issues: string[] = [];
  let score = 100;

  const bloomsInfo = BLOOMS_TAXONOMY[bloomsLevel as keyof typeof BLOOMS_TAXONOMY];
  if (!bloomsInfo) {
    issues.push(`Unknown Bloom's level: ${bloomsLevel}`);
    score -= 30;
  }

  // Check for Bloom's verb
  const objectiveLower = objective.toLowerCase();
  const hasBloomsVerb = bloomsInfo?.verbs.some(verb =>
    objectiveLower.startsWith(verb.toLowerCase())
  );

  if (!hasBloomsVerb) {
    issues.push(`Should start with a ${bloomsLevel} level verb: ${bloomsInfo?.verbs.slice(0, 4).join(', ')}`);
    score -= 25;
  }

  // Check for vague words
  const vagueWords = ['understand', 'know', 'learn', 'appreciate', 'be aware'];
  const hasVagueWord = vagueWords.some(word => objectiveLower.includes(word));
  if (hasVagueWord) {
    issues.push('Avoid vague words like "understand", "know", "learn" - use specific action verbs');
    score -= 20;
  }

  // Check length
  if (objective.length < 30) {
    issues.push('Objective is too short - add more specificity');
    score -= 15;
  }
  if (objective.length > 200) {
    issues.push('Objective is too long - focus on one measurable outcome');
    score -= 10;
  }

  // Check for measurability indicators
  const measurableIndicators = ['by', 'using', 'with', 'through', 'given', 'within'];
  const hasMeasurability = measurableIndicators.some(word => objectiveLower.includes(word));
  if (!hasMeasurability && objective.length > 50) {
    // Only flag for longer objectives that should have conditions
    issues.push('Consider adding conditions or criteria for measurability');
    score -= 10;
  }

  return {
    isValid: score >= 70,
    issues,
    score: Math.max(0, score),
  };
}

export function validateChapterDescription(description: string, context: {
  bloomsLevel: string;
  targetAudience: string;
}): {
  isValid: boolean;
  issues: string[];
  score: number;
} {
  const issues: string[] = [];
  let score = 100;

  // Check length
  if (description.length < 100) {
    issues.push('Description is too short - should be at least 100 characters');
    score -= 25;
  }
  if (description.length > 800) {
    issues.push('Description is too long - aim for 200-500 characters');
    score -= 10;
  }

  // Check for practical application mentions
  const practicalWords = ['apply', 'use', 'practice', 'build', 'create', 'solve', 'implement', 'hands-on', 'real-world'];
  const hasPractical = practicalWords.some(word => description.toLowerCase().includes(word));
  if (!hasPractical) {
    issues.push('Consider mentioning practical applications or hands-on activities');
    score -= 15;
  }

  // Check for skill/outcome mentions
  const outcomeWords = ['will', 'able', 'learn', 'master', 'develop', 'skill', 'ability', 'competenc'];
  const hasOutcome = outcomeWords.some(word => description.toLowerCase().includes(word));
  if (!hasOutcome) {
    issues.push('Should mention what students will be able to do after this chapter');
    score -= 15;
  }

  // Check for audience relevance
  if (context.targetAudience && !description.toLowerCase().includes(context.targetAudience.toLowerCase().split(' ')[0])) {
    // Only a minor suggestion, not a requirement
    score -= 5;
  }

  return {
    isValid: score >= 70,
    issues,
    score: Math.max(0, score),
  };
}
