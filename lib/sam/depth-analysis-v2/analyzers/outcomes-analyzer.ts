/**
 * Outcomes Analyzer (Step 6)
 *
 * Determines learning outcomes, skills gained, knowledge gaps,
 * and career alignment from course content.
 */

import type {
  CourseInput,
  BloomsAnalysisResult,
  OutcomesAnalysisResult,
  LearningOutcome,
  BloomsLevel,
} from '../types';

/**
 * Map Bloom's level to outcome category
 */
function mapLevelToCategory(level: BloomsLevel): LearningOutcome['category'] {
  switch (level) {
    case 'REMEMBER':
    case 'UNDERSTAND':
      return 'knowledge';
    case 'APPLY':
    case 'ANALYZE':
      return 'skill';
    case 'EVALUATE':
    case 'CREATE':
      return 'competency';
  }
}

/**
 * Map Bloom's level to proficiency
 */
function mapLevelToProficiency(
  level: BloomsLevel
): OutcomesAnalysisResult['skillsGained'][0]['proficiencyLevel'] {
  switch (level) {
    case 'REMEMBER':
      return 'awareness';
    case 'UNDERSTAND':
      return 'foundational';
    case 'APPLY':
    case 'ANALYZE':
      return 'intermediate';
    case 'EVALUATE':
    case 'CREATE':
      return 'advanced';
  }
}

/**
 * Extract learning outcomes from course objectives
 */
function extractLearningOutcomes(
  course: CourseInput,
  bloomsResult: BloomsAnalysisResult
): LearningOutcome[] {
  const outcomes: LearningOutcome[] = [];

  // Extract from course-level "what you will learn"
  for (const learn of course.whatYouWillLearn) {
    // Determine Bloom's level from keywords
    const lowerLearn = learn.toLowerCase();
    let level: BloomsLevel = 'UNDERSTAND'; // Default

    if (
      lowerLearn.includes('create') ||
      lowerLearn.includes('design') ||
      lowerLearn.includes('build')
    ) {
      level = 'CREATE';
    } else if (
      lowerLearn.includes('evaluate') ||
      lowerLearn.includes('judge') ||
      lowerLearn.includes('assess')
    ) {
      level = 'EVALUATE';
    } else if (
      lowerLearn.includes('analyze') ||
      lowerLearn.includes('compare') ||
      lowerLearn.includes('differentiate')
    ) {
      level = 'ANALYZE';
    } else if (
      lowerLearn.includes('apply') ||
      lowerLearn.includes('implement') ||
      lowerLearn.includes('use')
    ) {
      level = 'APPLY';
    } else if (
      lowerLearn.includes('explain') ||
      lowerLearn.includes('describe') ||
      lowerLearn.includes('understand')
    ) {
      level = 'UNDERSTAND';
    }

    outcomes.push({
      category: mapLevelToCategory(level),
      title: learn,
      description: `Upon completion, learners will be able to: ${learn}`,
      bloomsLevel: level,
      confidence: 80,
    });
  }

  // Extract from section objectives
  for (const chapter of course.chapters) {
    for (const section of chapter.sections) {
      if (section.objectives && section.objectives.length > 0) {
        // Get Bloom's level for this section from analysis
        const sectionBlooms = bloomsResult.chapters
          .find((c) => c.chapterId === chapter.id)
          ?.sectionResults.find((s) => s.sectionId === section.id);

        const level = sectionBlooms?.primaryLevel || 'UNDERSTAND';

        for (const objective of section.objectives) {
          // Only add unique objectives
          const isDuplicate = outcomes.some(
            (o) =>
              o.title.toLowerCase() === objective.toLowerCase() ||
              calculateSimilarity(o.title, objective) > 70
          );

          if (!isDuplicate) {
            outcomes.push({
              category: mapLevelToCategory(level),
              title: objective,
              description: `Section "${section.title}": ${objective}`,
              bloomsLevel: level,
              confidence: sectionBlooms?.confidence || 60,
            });
          }
        }
      }
    }
  }

  return outcomes;
}

/**
 * Simple similarity calculation for deduplication
 */
function calculateSimilarity(textA: string, textB: string): number {
  const wordsA = new Set(textA.toLowerCase().split(/\s+/));
  const wordsB = new Set(textB.toLowerCase().split(/\s+/));

  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }

  return Math.round(
    (overlap / Math.max(wordsA.size, wordsB.size)) * 100
  );
}

/**
 * Extract skills from content
 */
function extractSkills(
  course: CourseInput,
  bloomsResult: BloomsAnalysisResult
): OutcomesAnalysisResult['skillsGained'] {
  const skillsMap = new Map<
    string,
    {
      proficiencyLevel: OutcomesAnalysisResult['skillsGained'][0]['proficiencyLevel'];
      developedIn: string[];
    }
  >();

  // Skill-related keywords
  const skillPatterns = [
    /\b(program(?:ming)?)\b/i,
    /\b(develop(?:ment)?)\b/i,
    /\b(design(?:ing)?)\b/i,
    /\b(analyz(?:e|ing|sis))\b/i,
    /\b(implement(?:ation)?)\b/i,
    /\b(test(?:ing)?)\b/i,
    /\b(debug(?:ging)?)\b/i,
    /\b(problem[- ]solving)\b/i,
    /\b(critical[- ]thinking)\b/i,
    /\b(communication)\b/i,
    /\b(collaboration)\b/i,
    /\b(project[- ]management)\b/i,
  ];

  for (const chapter of course.chapters) {
    const chapterBlooms = bloomsResult.chapters.find(
      (c) => c.chapterId === chapter.id
    );

    for (const section of chapter.sections) {
      const text = [
        section.title,
        section.description || '',
        section.content || '',
        ...(section.objectives || []),
      ].join(' ');

      const sectionBlooms = chapterBlooms?.sectionResults.find(
        (s) => s.sectionId === section.id
      );
      const level = sectionBlooms?.primaryLevel || 'UNDERSTAND';
      const proficiency = mapLevelToProficiency(level);

      for (const pattern of skillPatterns) {
        const match = text.match(pattern);
        if (match) {
          const skill = match[1].toLowerCase();
          const existing = skillsMap.get(skill);

          if (existing) {
            existing.developedIn.push(section.title);
            // Upgrade proficiency if higher level found
            const proficiencyOrder = [
              'awareness',
              'foundational',
              'intermediate',
              'advanced',
            ];
            if (
              proficiencyOrder.indexOf(proficiency) >
              proficiencyOrder.indexOf(existing.proficiencyLevel)
            ) {
              existing.proficiencyLevel = proficiency;
            }
          } else {
            skillsMap.set(skill, {
              proficiencyLevel: proficiency,
              developedIn: [section.title],
            });
          }
        }
      }
    }
  }

  return Array.from(skillsMap.entries()).map(([skill, data]) => ({
    skill,
    proficiencyLevel: data.proficiencyLevel,
    developedIn: [...new Set(data.developedIn)].slice(0, 5),
  }));
}

/**
 * Identify knowledge gaps
 */
function identifyKnowledgeGaps(
  course: CourseInput,
  bloomsResult: BloomsAnalysisResult,
  outcomes: LearningOutcome[]
): OutcomesAnalysisResult['knowledgeGaps'] {
  const gaps: OutcomesAnalysisResult['knowledgeGaps'] = [];

  // Check for missing higher-order outcomes
  const hasCreate = outcomes.some((o) => o.bloomsLevel === 'CREATE');
  const hasEvaluate = outcomes.some((o) => o.bloomsLevel === 'EVALUATE');
  const hasAnalyze = outcomes.some((o) => o.bloomsLevel === 'ANALYZE');

  if (!hasCreate) {
    gaps.push({
      gap: 'No creative/synthesis outcomes',
      impact:
        'Learners may not develop ability to create new solutions or products.',
      suggestion:
        'Add project-based learning or capstone assignments that require creation of original work.',
    });
  }

  if (!hasEvaluate) {
    gaps.push({
      gap: 'Limited evaluation skills development',
      impact:
        'Learners may struggle to critically assess quality or make informed decisions.',
      suggestion:
        'Include peer review activities, case study analyses, or comparison exercises.',
    });
  }

  // Check for balance issues
  const courseBalance = bloomsResult.courseBalance;
  if (courseBalance === 'bottom-heavy') {
    gaps.push({
      gap: 'Course is heavy on lower-order thinking',
      impact:
        'Learners may memorize facts but struggle to apply or analyze them.',
      suggestion:
        'Add more application exercises, case studies, and problem-solving activities.',
    });
  }

  // Check for missing practical application
  const hasApplyOutcomes = outcomes.some((o) => o.bloomsLevel === 'APPLY');
  if (!hasApplyOutcomes && outcomes.length > 3) {
    gaps.push({
      gap: 'Limited practical application',
      impact: 'Learners may understand concepts but cannot apply them.',
      suggestion:
        'Add hands-on exercises, labs, or real-world scenarios for practice.',
    });
  }

  return gaps;
}

/**
 * Determine career alignment based on course content
 */
function determineCareerAlignment(
  course: CourseInput,
  skills: OutcomesAnalysisResult['skillsGained']
): string[] {
  const careers: Set<string> = new Set();

  // Career keyword mapping
  const careerPatterns: Record<string, RegExp[]> = {
    'Software Developer': [/programming/i, /coding/i, /software/i, /development/i],
    'Data Analyst': [/data analysis/i, /analytics/i, /statistics/i, /visualization/i],
    'Web Developer': [/web/i, /frontend/i, /backend/i, /html/i, /css/i, /javascript/i],
    'Project Manager': [/project management/i, /agile/i, /scrum/i, /planning/i],
    'UX Designer': [/ux/i, /user experience/i, /design thinking/i, /usability/i],
    'Business Analyst': [/business analysis/i, /requirements/i, /stakeholder/i],
    'Machine Learning Engineer': [/machine learning/i, /ai/i, /neural/i, /deep learning/i],
    'DevOps Engineer': [/devops/i, /ci\/cd/i, /docker/i, /kubernetes/i, /cloud/i],
    'Cybersecurity Analyst': [/security/i, /cybersecurity/i, /penetration/i, /vulnerability/i],
    'Database Administrator': [/database/i, /sql/i, /mongodb/i, /data management/i],
  };

  // Check course content against career patterns
  const courseText = [
    course.title,
    course.description || '',
    course.courseGoals || '',
    ...course.whatYouWillLearn,
    ...course.chapters.flatMap((ch) => [
      ch.title,
      ch.description || '',
      ...ch.sections.flatMap((s) => [
        s.title,
        s.description || '',
        ...(s.objectives || []),
      ]),
    ]),
  ].join(' ');

  for (const [career, patterns] of Object.entries(careerPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(courseText)) {
        careers.add(career);
        break;
      }
    }
  }

  // Add careers based on extracted skills
  for (const skill of skills) {
    if (skill.skill.includes('programming') || skill.skill.includes('development')) {
      careers.add('Software Developer');
    }
    if (skill.skill.includes('analysis') || skill.skill.includes('analyzing')) {
      careers.add('Data Analyst');
      careers.add('Business Analyst');
    }
    if (skill.skill.includes('design')) {
      careers.add('UX Designer');
    }
    if (skill.skill.includes('project') || skill.skill.includes('management')) {
      careers.add('Project Manager');
    }
  }

  return Array.from(careers).slice(0, 5);
}

/**
 * Analyze learning outcomes from course content
 */
export async function analyzeOutcomes(
  course: CourseInput,
  bloomsResult: BloomsAnalysisResult,
  aiEnabled: boolean = true
): Promise<OutcomesAnalysisResult> {
  // Extract learning outcomes
  const learningOutcomes = extractLearningOutcomes(course, bloomsResult);

  // Extract skills gained
  const skillsGained = extractSkills(course, bloomsResult);

  // Identify knowledge gaps
  const knowledgeGaps = identifyKnowledgeGaps(
    course,
    bloomsResult,
    learningOutcomes
  );

  // Determine career alignment
  const careerAlignment = determineCareerAlignment(course, skillsGained);

  return {
    learningOutcomes,
    skillsGained,
    knowledgeGaps,
    careerAlignment,
  };
}
