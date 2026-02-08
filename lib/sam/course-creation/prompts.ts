/**
 * SAM Sequential Course Creation Prompts
 *
 * These prompts guide SAM through the 3-stage course creation process
 * with deep thinking, concept flow tracking, and context awareness at each step.
 */

import {
  type CourseContext,
  type GeneratedChapter,
  type GeneratedSection,
  type BloomsLevel,
  BLOOMS_TAXONOMY,
  type ConceptTracker,
  type EnrichedChapterContext,
  type ContentAwareBloomsInput,
} from './types';
import {
  CHAPTER_THINKING_FRAMEWORK,
  LEARNING_OBJECTIVES_FRAMEWORK,
} from '@/lib/sam/prompts/content-generation-criteria';

// ============================================================================
// Stage 1: Chapter Generation Prompt
// ============================================================================

export function buildStage1Prompt(
  courseContext: CourseContext,
  currentChapterNumber: number,
  previousChapters: GeneratedChapter[],
  conceptTracker?: ConceptTracker
): string {
  const bloomsLevel = getContentAwareBloomsLevel({
    chapterNumber: currentChapterNumber,
    totalChapters: courseContext.totalChapters,
    focusLevels: courseContext.bloomsFocus,
    difficulty: courseContext.difficulty,
    isFoundational: currentChapterNumber <= 2,
    isCapstone: currentChapterNumber >= courseContext.totalChapters - 1,
    previousBloomsLevels: previousChapters.map(ch => ch.bloomsLevel),
  });
  const bloomsInfo = BLOOMS_TAXONOMY[bloomsLevel];

  // Full previous chapter context (not just 2 objectives)
  const previousChaptersSummary = previousChapters.length > 0
    ? previousChapters.map(ch => `
- Chapter ${ch.position}: "${ch.title}"
  Level: ${ch.bloomsLevel}
  Description: ${ch.description.slice(0, 200)}...
  Topics: ${ch.keyTopics.join(', ')}
  All Objectives: ${ch.learningObjectives.join('; ')}
  Skills: ${(ch.conceptsIntroduced ?? ch.keyTopics).join(', ')}`).join('\n')
    : 'This is the first chapter.';

  // Build concept flow section
  let conceptFlowSection = '';
  if (conceptTracker && conceptTracker.concepts.size > 0) {
    const conceptsByChapter = new Map<number, string[]>();
    for (const [name, entry] of conceptTracker.concepts) {
      const chConcepts = conceptsByChapter.get(entry.introducedInChapter) ?? [];
      chConcepts.push(name);
      conceptsByChapter.set(entry.introducedInChapter, chConcepts);
    }
    const conceptFlowLines = Array.from(conceptsByChapter.entries())
      .sort(([a], [b]) => a - b)
      .map(([chNum, concepts]) => `  Chapter ${chNum}: ${concepts.join(', ')}`)
      .join('\n');

    conceptFlowSection = `
## CONCEPT FLOW
The following concepts have been introduced so far (students already know these):
${conceptFlowLines}

## PREREQUISITE CHAIN
The following concepts have been established: ${conceptTracker.vocabulary.join(', ')}.
This chapter should BUILD on these existing concepts, not re-explain them.
Introduce 3-7 NEW concepts that extend the student's knowledge.

## BLOOM'S PROGRESSION
Cognitive levels used so far: ${previousChapters.map(ch => `Ch${ch.position}=${ch.bloomsLevel}`).join(', ')}
This chapter's suggested level is ${bloomsLevel}. If the content demands a different level, you may propose one, but it must be >= the previous chapter's level.
`;
  }

  return `You are SAM, an expert educational course designer. You are creating Chapter ${currentChapterNumber} of ${courseContext.totalChapters} for a course.

## COURSE CONTEXT
- **Title**: "${courseContext.courseTitle}"
- **Description**: ${courseContext.courseDescription}
- **Category**: ${courseContext.courseCategory}${courseContext.courseSubcategory ? ` > ${courseContext.courseSubcategory}` : ''}
- **Target Audience**: ${courseContext.targetAudience}
- **Difficulty**: ${courseContext.difficulty}
- **Course Learning Objectives**:
${courseContext.courseLearningObjectives.map((obj, i) => `  ${i + 1}. ${obj}`).join('\n')}

## PREVIOUS CHAPTERS
${previousChaptersSummary}
${conceptFlowSection}
${CHAPTER_THINKING_FRAMEWORK}

## YOUR TASK
Create Chapter ${currentChapterNumber} with Bloom's Level: **${bloomsLevel}** (Level ${bloomsInfo.level})
- Cognitive Process: ${bloomsInfo.cognitiveProcess}
- Required Verbs: ${bloomsInfo.verbs.join(', ')}

## THINKING FRAMEWORK (Think through each step)

### 1. POSITION ANALYSIS
- This is chapter ${currentChapterNumber} of ${courseContext.totalChapters}
- ${currentChapterNumber === 1 ? 'As the FIRST chapter, it should establish foundational concepts' : ''}
- ${currentChapterNumber === courseContext.totalChapters ? 'As the FINAL chapter, it should synthesize and apply all learning' : ''}
- What should students already know from previous chapters?
- What will this chapter prepare students for?

### 2. UNIQUE TOPIC SELECTION
- Given the course "${courseContext.courseTitle}", what specific topic fits this position?
- The topic must NOT overlap with previous chapters: ${previousChapters.map(c => c.title).join(', ') || 'N/A'}
- Consider the natural learning progression

### 3. BLOOM'S INTEGRATION
- At ${bloomsLevel} level, students should be able to ${bloomsInfo.description.toLowerCase()}
- All learning objectives MUST start with verbs: ${bloomsInfo.verbs.join(', ')}

### 4. PRACTICAL APPLICATION
- How will students USE this knowledge in real work?
- What problems can they solve after this chapter?

## OUTPUT REQUIREMENTS

Return a JSON object with this EXACT structure:
{
  "thinking": "Your 2-3 sentence reasoning about why this chapter topic and structure was chosen",
  "chapter": {
    "position": ${currentChapterNumber},
    "title": "Specific, unique chapter title (not generic like 'Introduction to X')",
    "description": "150-300 word description covering: (1) why this chapter matters, (2) what students will learn, (3) practical applications, (4) skills developed",
    "bloomsLevel": "${bloomsLevel}",
    "learningObjectives": [
      // Exactly ${courseContext.learningObjectivesPerChapter} objectives
      // Each MUST start with a ${bloomsLevel}-level verb
      // Each should be specific and measurable
    ],
    "keyTopics": [
      // 3-5 main topics this chapter covers
      // These will become sections in Stage 2
    ],
    "conceptsIntroduced": [
      // 3-7 NEW concepts this chapter introduces (not from previous chapters)
      // These track what students learn cumulatively
    ],
    "prerequisites": "What students should know before this chapter",
    "estimatedTime": "X hours Y minutes",
    "topicsToExpand": [
      // Same as keyTopics - these become section focus areas
    ]
  }
}

IMPORTANT:
- Chapter title must be UNIQUE and SPECIFIC to the course topic
- Do NOT use generic titles like "Getting Started", "Introduction", "Fundamentals"
- Learning objectives must be measurable and actionable
- conceptsIntroduced must be NEW concepts not covered in previous chapters
- Return ONLY valid JSON, no markdown formatting`;
}

// ============================================================================
// Stage 2: Section Generation Prompt
// ============================================================================

export function buildStage2Prompt(
  courseContext: CourseContext,
  chapter: GeneratedChapter,
  currentSectionNumber: number,
  previousSections: GeneratedSection[],
  allExistingSectionTitles: string[],
  enrichedContext?: EnrichedChapterContext
): string {
  const previousSectionsSummary = previousSections.length > 0
    ? previousSections.map(s => `- Section ${s.position}: "${s.title}" (${s.contentType}) - Focus: ${s.topicFocus}`).join('\n')
    : 'This is the first section of this chapter.';

  const remainingTopics = chapter.keyTopics.filter(
    topic => !previousSections.some(s => s.topicFocus.toLowerCase().includes(topic.toLowerCase()))
  );

  // Build course-wide context section
  let courseWideSection = '';
  if (enrichedContext) {
    const chapterSummaries = enrichedContext.allChapters
      .map(ch => `  Ch${ch.position}: "${ch.title}" [${ch.bloomsLevel}] - ${ch.keyTopics.slice(0, 3).join(', ')}`)
      .join('\n');

    // Concepts available to students at this point
    const availableConcepts: string[] = [];
    for (const [name, entry] of enrichedContext.conceptTracker.concepts) {
      // Include concepts from all previous chapters
      if (entry.introducedInChapter < chapter.position) {
        availableConcepts.push(name);
      }
      // Include concepts from earlier sections in this chapter
      if (entry.introducedInChapter === chapter.position && entry.introducedInSection !== undefined && entry.introducedInSection < currentSectionNumber) {
        availableConcepts.push(name);
      }
    }

    courseWideSection = `
## COURSE-WIDE CONTEXT
All chapters in this course:
${chapterSummaries}

## CONCEPTS AVAILABLE TO STUDENTS
Students already know these concepts from prior chapters and sections:
${availableConcepts.length > 0 ? availableConcepts.join(', ') : 'None yet (this is early in the course)'}
Reference these concepts where relevant. Do NOT re-explain them.
`;
  }

  // Build scaffolding guidance based on section position
  let scaffoldingGuidance = '';
  if (currentSectionNumber === 1) {
    scaffoldingGuidance = `
## SCAFFOLDING GUIDANCE
This is the FIRST section of the chapter. Your role:
- Introduce foundational concepts for this chapter
- Use concrete examples and analogies to ground abstract ideas
- Connect to what students learned in previous chapters
- Set up the vocabulary and mental models for subsequent sections`;
  } else if (currentSectionNumber === courseContext.sectionsPerChapter) {
    scaffoldingGuidance = `
## SCAFFOLDING GUIDANCE
This is the FINAL section of the chapter. Your role:
- Synthesize and apply ALL chapter concepts together
- Create integration exercises that combine earlier section concepts
- Connect this chapter's learning to the next chapter's topics
- Provide a capstone activity that demonstrates mastery`;
  } else {
    scaffoldingGuidance = `
## SCAFFOLDING GUIDANCE
This is a MIDDLE section (${currentSectionNumber} of ${courseContext.sectionsPerChapter}). Your role:
- Build on concepts from previous sections in this chapter
- Increase complexity gradually from the previous section
- Introduce new sub-concepts that deepen understanding
- Provide practice opportunities before the final synthesis section`;
  }

  return `You are SAM, creating Section ${currentSectionNumber} of ${courseContext.sectionsPerChapter} for Chapter ${chapter.position}: "${chapter.title}".

## COURSE CONTEXT
- **Course**: "${courseContext.courseTitle}"
- **Target Audience**: ${courseContext.targetAudience}
- **Difficulty**: ${courseContext.difficulty}

## CHAPTER CONTEXT
- **Title**: "${chapter.title}"
- **Description**: ${chapter.description}
- **Bloom's Level**: ${chapter.bloomsLevel}
- **Chapter Learning Objectives**:
${chapter.learningObjectives.map((obj, i) => `  ${i + 1}. ${obj}`).join('\n')}
- **Topics to Cover**: ${chapter.keyTopics.join(', ')}
${courseWideSection}
## PREVIOUS SECTIONS IN THIS CHAPTER
${previousSectionsSummary}

## TOPICS REMAINING TO COVER
${remainingTopics.length > 0 ? remainingTopics.join(', ') : 'All main topics covered - create a synthesis/practice section'}

## EXISTING SECTION TITLES IN COURSE (MUST BE UNIQUE)
${allExistingSectionTitles.length > 0 ? allExistingSectionTitles.map(t => `- "${t}"`).join('\n') : 'None yet'}
${scaffoldingGuidance}

## THINKING FRAMEWORK

### 1. SECTION POSITIONING
- Section ${currentSectionNumber} of ${courseContext.sectionsPerChapter}
- ${currentSectionNumber === 1 ? 'FIRST section: Should introduce the chapter topic' : ''}
- ${currentSectionNumber === courseContext.sectionsPerChapter ? 'FINAL section: Should synthesize and apply' : ''}

### 2. TOPIC ASSIGNMENT
- Remaining topics: ${remainingTopics.join(', ') || 'synthesis needed'}
- Pick ONE specific topic for deep coverage
- DO NOT repeat topics from previous sections

### 3. UNIQUENESS CHECK
- Title MUST be different from ALL existing titles
- Avoid generic titles like "Key Concepts", "Overview", "Fundamentals"
- Use specific, action-oriented titles

### 4. CONTENT TYPE SELECTION
- video: Best for demonstrations, visual concepts
- reading: Best for deep theory, reference material
- assignment: Best for hands-on practice
- quiz: Best for knowledge verification
- project: Best for synthesis and application

## OUTPUT REQUIREMENTS

Return a JSON object with this EXACT structure:
{
  "thinking": "Your 2-3 sentence reasoning about this section's focus and why",
  "section": {
    "position": ${currentSectionNumber},
    "title": "Unique, specific section title",
    "contentType": "video|reading|assignment|quiz|project",
    "estimatedDuration": "XX minutes",
    "topicFocus": "The specific topic from chapter this section covers",
    "conceptsIntroduced": [
      // New concepts this section introduces (if any)
    ],
    "conceptsReferenced": [
      // Existing concepts from previous chapters/sections that this section builds on
    ],
    "parentChapterContext": {
      "title": "${chapter.title}",
      "bloomsLevel": "${chapter.bloomsLevel}",
      "relevantObjectives": [
        // 1-2 chapter objectives this section addresses
      ]
    }
  }
}

CRITICAL UNIQUENESS RULES:
1. Title CANNOT match or be similar to: ${allExistingSectionTitles.join(', ') || 'N/A'}
2. Title must include specific topic reference
3. NO generic titles like "Getting Started", "Core Concepts", "Key Principles"

Return ONLY valid JSON, no markdown formatting`;
}

// ============================================================================
// Stage 3: Detail Generation Prompt
// ============================================================================

export function buildStage3Prompt(
  courseContext: CourseContext,
  chapter: GeneratedChapter,
  section: GeneratedSection,
  chapterSections: GeneratedSection[],
  enrichedContext?: EnrichedChapterContext
): string {
  const bloomsInfo = BLOOMS_TAXONOMY[chapter.bloomsLevel];

  const otherSectionsSummary = chapterSections
    .filter(s => s.position !== section.position)
    .map(s => `- Section ${s.position}: "${s.title}" (${s.contentType})`)
    .join('\n');

  // Build cumulative knowledge state
  let cumulativeKnowledgeSection = '';
  if (enrichedContext) {
    const knownConcepts: string[] = [];
    for (const [name, entry] of enrichedContext.conceptTracker.concepts) {
      // All concepts from prior chapters
      if (entry.introducedInChapter < chapter.position) {
        knownConcepts.push(name);
      }
      // Concepts from earlier sections in this chapter
      if (entry.introducedInChapter === chapter.position && entry.introducedInSection !== undefined && entry.introducedInSection < section.position) {
        knownConcepts.push(name);
      }
    }

    cumulativeKnowledgeSection = `
## CUMULATIVE KNOWLEDGE STATE
At this point in the course, students have learned these concepts:
${knownConcepts.length > 0 ? knownConcepts.join(', ') : 'This is early in the course - establish foundational concepts.'}
Build descriptions and objectives that reference and extend this knowledge.

## STYLE AND DEPTH GUIDELINES
- Description: 50-150 words, specific to this section's topic
- Objectives: Use ONLY ${chapter.bloomsLevel}-level verbs (${bloomsInfo.verbs.join(', ')})
- Activity: Must match content type "${section.contentType}" and demonstrate measurable skill
- Each objective should be achievable within ${section.estimatedDuration}
`;
  }

  return `You are SAM, filling in the details for Section ${section.position}: "${section.title}".

## COURSE CONTEXT
- **Course**: "${courseContext.courseTitle}"
- **Target Audience**: ${courseContext.targetAudience}
- **Difficulty**: ${courseContext.difficulty}

## CHAPTER CONTEXT
- **Chapter ${chapter.position}**: "${chapter.title}"
- **Bloom's Level**: ${chapter.bloomsLevel}
- **Chapter Description**: ${chapter.description}
- **Chapter Objectives**:
${chapter.learningObjectives.map((obj, i) => `  ${i + 1}. ${obj}`).join('\n')}

## OTHER SECTIONS IN THIS CHAPTER
${otherSectionsSummary || 'This is the only section'}
${cumulativeKnowledgeSection}
## CURRENT SECTION TO FILL
- **Title**: "${section.title}"
- **Content Type**: ${section.contentType}
- **Topic Focus**: ${section.topicFocus}
- **Duration**: ${section.estimatedDuration}

## BLOOM'S TAXONOMY GUIDANCE
Level: ${chapter.bloomsLevel} (Level ${bloomsInfo.level})
- Description: ${bloomsInfo.description}
- Verbs to use: ${bloomsInfo.verbs.join(', ')}

${LEARNING_OBJECTIVES_FRAMEWORK}

## THINKING FRAMEWORK

### 1. DESCRIPTION GENERATION
- What SPECIFIC knowledge does this section deliver?
- Why is "${section.title}" important for ${courseContext.targetAudience}?
- How does this connect to the chapter's learning goals?
- What will students DO in this ${section.contentType}?

### 2. LEARNING OBJECTIVES
- Each objective MUST start with a ${chapter.bloomsLevel}-level verb
- Objectives must be specific to "${section.topicFocus}"
- Each should be measurable and achievable in ${section.estimatedDuration}

### 3. PRACTICAL ACTIVITY
- Based on content type "${section.contentType}", what activity reinforces learning?
- How does the activity connect to real-world application?

## OUTPUT REQUIREMENTS

Return a JSON object with this EXACT structure:
{
  "thinking": "Your 2-3 sentence reasoning about the description and objectives",
  "details": {
    "description": "50-150 words describing: (1) what this section covers, (2) why it matters, (3) what students will do, (4) expected outcomes",
    "learningObjectives": [
      // Exactly ${courseContext.learningObjectivesPerSection} objectives
      // Each MUST start with: ${bloomsInfo.verbs.slice(0, 5).join(', ')}
      // Each must be specific to "${section.topicFocus}"
    ],
    "keyConceptsCovered": [
      // 3-5 specific concepts/skills covered
    ],
    "conceptsIntroduced": [
      // New concepts this section teaches
    ],
    "practicalActivity": "Description of hands-on activity for this ${section.contentType}"
  }
}

QUALITY REQUIREMENTS:
1. Description must mention "${section.topicFocus}" specifically
2. Objectives must use ${chapter.bloomsLevel}-level verbs ONLY
3. Activity must match content type: ${section.contentType}
4. All content must be specific to "${courseContext.courseTitle}"

Return ONLY valid JSON, no markdown formatting`;
}

// ============================================================================
// Content-Aware Bloom's Level Assignment
// ============================================================================

/**
 * Assigns Bloom's level based on content demands, difficulty, and position,
 * ensuring monotonic non-decreasing progression across chapters.
 */
export function getContentAwareBloomsLevel(input: ContentAwareBloomsInput): BloomsLevel {
  const { chapterNumber, totalChapters, focusLevels, difficulty, isFoundational, isCapstone, previousBloomsLevels } = input;

  // If user-specified focus levels exist, distribute proportionally (honor user choice)
  if (focusLevels.length > 0) {
    const index = Math.min(
      Math.floor((chapterNumber - 1) / totalChapters * focusLevels.length),
      focusLevels.length - 1
    );
    return focusLevels[index];
  }

  const allLevels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

  // Start with position-based suggestion as baseline
  const progressRatio = (chapterNumber - 1) / (totalChapters - 1 || 1);
  let baseIndex = Math.min(
    Math.floor(progressRatio * allLevels.length),
    allLevels.length - 1
  );

  // Adjust for difficulty level
  switch (difficulty) {
    case 'beginner':
      // Beginner: stay in REMEMBER-APPLY for first 60% of chapters
      if (progressRatio < 0.6) {
        baseIndex = Math.min(baseIndex, 2); // Cap at APPLY
      }
      break;
    case 'intermediate':
      // Intermediate: standard progression (no adjustment)
      break;
    case 'advanced':
      // Advanced: reach ANALYZE by chapter 2-3
      if (chapterNumber >= 2 && baseIndex < 3) {
        baseIndex = Math.max(baseIndex, 2); // Floor at APPLY
      }
      break;
    case 'expert':
      // Expert: reach ANALYZE by chapter 2, EVALUATE earlier
      if (chapterNumber >= 2 && baseIndex < 3) {
        baseIndex = 3; // Floor at ANALYZE
      }
      break;
  }

  // Foundational chapters (first 1-2): cap at UNDERSTAND
  if (isFoundational && chapterNumber <= 2) {
    baseIndex = Math.min(baseIndex, 1); // Cap at UNDERSTAND
  }

  // Capstone chapters (last 1-2): floor at EVALUATE
  if (isCapstone && chapterNumber >= totalChapters - 1 && totalChapters > 2) {
    baseIndex = Math.max(baseIndex, 4); // Floor at EVALUATE
  }

  // Ensure monotonic non-decreasing: never go below previous chapter's level
  if (previousBloomsLevels.length > 0) {
    const lastLevel = previousBloomsLevels[previousBloomsLevels.length - 1];
    const lastIndex = allLevels.indexOf(lastLevel);
    if (lastIndex >= 0 && baseIndex < lastIndex) {
      baseIndex = lastIndex;
    }
  }

  // Clamp to valid range
  baseIndex = Math.max(0, Math.min(baseIndex, allLevels.length - 1));

  return allLevels[baseIndex];
}

// ============================================================================
// Legacy Helper (kept as private fallback)
// ============================================================================

/**
 * Determines the appropriate Bloom's level for a chapter based on its position.
 * @deprecated Use getContentAwareBloomsLevel for richer assignment.
 */
export function getBloomsLevelForChapter(
  chapterNumber: number,
  totalChapters: number,
  focusLevels: BloomsLevel[]
): BloomsLevel {
  // If specific focus levels provided, distribute them
  if (focusLevels.length > 0) {
    const index = Math.min(
      Math.floor((chapterNumber - 1) / totalChapters * focusLevels.length),
      focusLevels.length - 1
    );
    return focusLevels[index];
  }

  // Default progression through all levels
  const allLevels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const progressRatio = (chapterNumber - 1) / (totalChapters - 1 || 1);
  const index = Math.min(
    Math.floor(progressRatio * allLevels.length),
    allLevels.length - 1
  );

  return allLevels[index];
}

/**
 * Suggests content type based on section position and chapter level
 */
export function suggestContentType(
  sectionNumber: number,
  totalSections: number,
  bloomsLevel: BloomsLevel
): string {
  // First section often introduces with video
  if (sectionNumber === 1) return 'video';

  // Last section often applies with project or assignment
  if (sectionNumber === totalSections) {
    return bloomsLevel === 'CREATE' || bloomsLevel === 'EVALUATE' ? 'project' : 'assignment';
  }

  // Middle sections vary
  const middleTypes = ['reading', 'video', 'assignment'];
  return middleTypes[(sectionNumber - 1) % middleTypes.length];
}
