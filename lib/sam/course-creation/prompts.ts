/**
 * SAM Sequential Course Creation Prompts
 *
 * These prompts guide SAM through the 3-stage course creation process
 * with deep thinking and context awareness at each step.
 */

import {
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  BloomsLevel,
  BLOOMS_TAXONOMY,
} from './types';

// ============================================================================
// Stage 1: Chapter Generation Prompt
// ============================================================================

export function buildStage1Prompt(
  courseContext: CourseContext,
  currentChapterNumber: number,
  previousChapters: GeneratedChapter[]
): string {
  const bloomsLevel = getBloomsLevelForChapter(currentChapterNumber, courseContext.totalChapters, courseContext.bloomsFocus);
  const bloomsInfo = BLOOMS_TAXONOMY[bloomsLevel];

  const previousChaptersSummary = previousChapters.length > 0
    ? previousChapters.map(ch => `
- Chapter ${ch.position}: "${ch.title}"
  Level: ${ch.bloomsLevel}
  Topics: ${ch.keyTopics.join(', ')}
  Key Objectives: ${ch.learningObjectives.slice(0, 2).join('; ')}`).join('\n')
    : 'This is the first chapter.';

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

## YOUR TASK
Create Chapter ${currentChapterNumber} with Bloom's Level: **${bloomsLevel}** (Level ${bloomsInfo.level})
- Cognitive Process: ${bloomsInfo.cognitiveProcess}
- Required Verbs: ${bloomsInfo.verbs.slice(0, 6).join(', ')}

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
- All learning objectives MUST start with verbs: ${bloomsInfo.verbs.slice(0, 6).join(', ')}

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
  allExistingSectionTitles: string[]
): string {
  const previousSectionsSummary = previousSections.length > 0
    ? previousSections.map(s => `- Section ${s.position}: "${s.title}" (${s.contentType}) - Focus: ${s.topicFocus}`).join('\n')
    : 'This is the first section of this chapter.';

  const remainingTopics = chapter.keyTopics.filter(
    topic => !previousSections.some(s => s.topicFocus.toLowerCase().includes(topic.toLowerCase()))
  );

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

## PREVIOUS SECTIONS IN THIS CHAPTER
${previousSectionsSummary}

## TOPICS REMAINING TO COVER
${remainingTopics.length > 0 ? remainingTopics.join(', ') : 'All main topics covered - create a synthesis/practice section'}

## EXISTING SECTION TITLES IN COURSE (MUST BE UNIQUE)
${allExistingSectionTitles.length > 0 ? allExistingSectionTitles.map(t => `- "${t}"`).join('\n') : 'None yet'}

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
  chapterSections: GeneratedSection[]
): string {
  const bloomsInfo = BLOOMS_TAXONOMY[chapter.bloomsLevel];

  const otherSectionsSummary = chapterSections
    .filter(s => s.position !== section.position)
    .map(s => `- Section ${s.position}: "${s.title}" (${s.contentType})`)
    .join('\n');

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

## CURRENT SECTION TO FILL
- **Title**: "${section.title}"
- **Content Type**: ${section.contentType}
- **Topic Focus**: ${section.topicFocus}
- **Duration**: ${section.estimatedDuration}

## BLOOM'S TAXONOMY GUIDANCE
Level: ${chapter.bloomsLevel} (Level ${bloomsInfo.level})
- Description: ${bloomsInfo.description}
- Verbs to use: ${bloomsInfo.verbs.join(', ')}

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
// Helper Functions
// ============================================================================

/**
 * Determines the appropriate Bloom's level for a chapter based on its position
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
