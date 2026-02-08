/**
 * Fix Generator (Step 8)
 *
 * Enhances issues with detailed fix instructions and examples.
 * Can use AI for more contextual suggestions.
 */

import type { CourseInput, AnalysisIssue } from '../types';

/**
 * Templates for fix suggestions based on issue type
 */
const FIX_TEMPLATES = {
  STRUCTURE: {
    add: {
      chapter: {
        how: 'Go to course editor → Add Chapter → Create chapter with a descriptive title → Add 2-4 sections',
        examples: [
          'For a programming course, add chapters for: "Introduction", "Core Concepts", "Advanced Topics", "Practical Projects"',
          'Each chapter should focus on one major topic',
        ],
      },
      section: {
        how: 'Go to chapter → Add Section → Write title and description → Add content (text/video) → Add objectives',
        examples: [
          'A good section has: 1 main concept, 2-4 learning objectives, 200-500 words of content, 1 practice exercise',
          'Break down complex topics into multiple focused sections',
        ],
      },
    },
    modify: {
      publish: {
        how: 'Go to course/chapter settings → Toggle "Published" to ON → Verify content is complete first',
        examples: [
          'Before publishing, ensure all content is reviewed and error-free',
          'Published content is immediately visible to enrolled learners',
        ],
      },
    },
    remove: {
      empty: {
        how: 'If the chapter/section is truly unnecessary, delete it from the course editor',
        examples: [
          'Consider if the content could be merged with another section',
          'If removing, update any references to this content',
        ],
      },
    },
  },
  CONTENT: {
    add: {
      content: {
        how: 'Go to section editor → Add text content in the editor → Use formatting (headers, bullets, code blocks) → Add images/diagrams if helpful',
        examples: [
          'Start with a brief introduction explaining what the section covers',
          'Include examples and use cases to illustrate concepts',
          'End with a summary or key takeaways',
        ],
      },
      objectives: {
        how: 'Go to section settings → Add Learning Objectives → Use action verbs (Explain, Implement, Design, Analyze)',
        examples: [
          '"By the end of this section, you will be able to implement authentication using JWT tokens"',
          '"Analyze the trade-offs between SQL and NoSQL databases"',
          '"Design a responsive layout using CSS Grid"',
        ],
      },
    },
    modify: {
      expand: {
        how: 'Review current content → Identify gaps → Add explanations, examples, diagrams → Ensure flow and clarity',
        examples: [
          'Add a real-world example after each new concept',
          'Include code snippets with explanations for technical topics',
          'Add diagrams to visualize complex relationships',
        ],
      },
    },
  },
  DEPTH: {
    add: {
      higher_order: {
        how: 'Add activities that require analysis, evaluation, or creation rather than just memorization',
        examples: [
          'ANALYZE: Add a case study where learners compare different approaches',
          'EVALUATE: Add peer review activities or pro/con analysis exercises',
          'CREATE: Add a project where learners build something original',
        ],
      },
    },
    modify: {
      balance: {
        how: 'Review chapter objectives → Identify which Bloom\'s levels are underrepresented → Add activities for missing levels',
        examples: [
          'If heavy on "Define" and "List", add "Apply" exercises',
          'Replace some "Describe" activities with "Compare and contrast"',
          'Add a mini-project for each major topic',
        ],
      },
    },
  },
  FLOW: {
    reorder: {
      chapters: {
        how: 'Go to course structure → Drag chapters to reorder → Ensure prerequisites come before dependent topics',
        examples: [
          'Basic concepts should precede advanced applications',
          'Follow the typical learning progression: Remember → Understand → Apply → Analyze',
          'Check that each chapter builds on previous ones',
        ],
      },
      sections: {
        how: 'Within chapter, reorder sections from simple to complex → Ensure smooth transitions',
        examples: [
          'Start with "What is X?" before "How to implement X"',
          'Put theory before practice',
          'End with synthesis or application activities',
        ],
      },
    },
    add: {
      bridge: {
        how: 'Identify the gap → Create transitional content that connects the two levels → Add preview/review elements',
        examples: [
          'Add a recap of prerequisites at the start of advanced sections',
          'Create "bridge" sections that explicitly connect concepts',
          'Add scaffolding exercises that gradually increase complexity',
        ],
      },
    },
  },
  DUPLICATE: {
    merge: {
      sections: {
        how: 'Compare both sections → Extract unique value from each → Create one comprehensive section → Delete the redundant one',
        examples: [
          'Keep the clearer explanations from section A',
          'Keep the better examples from section B',
          'Combine into one authoritative section',
        ],
      },
    },
    remove: {
      redundant: {
        how: 'Identify which version is more complete/accurate → Remove the weaker version → Update any references',
        examples: [
          'Keep the version with more examples',
          'Keep the version that fits better in the course flow',
          'Before deleting, check if any unique content should be preserved',
        ],
      },
    },
  },
  CONSISTENCY: {
    modify: {
      standardize: {
        how: 'Create a template for sections → Apply consistently across all chapters → Review and adjust for topic-specific needs',
        examples: [
          'Standard section structure: Introduction → Main content → Examples → Practice → Summary',
          'Consistent formatting: same header levels, bullet styles, code formatting',
          'Similar length for similar complexity topics',
        ],
      },
      align: {
        how: 'Review course goals → Check each chapter\'s contribution to goals → Revise content to strengthen alignment',
        examples: [
          'Add explicit connections to course goals in chapter introductions',
          'Remove content that doesn\'t support stated goals',
          'Adjust chapter titles to reflect their role in achieving goals',
        ],
      },
    },
  },
  OBJECTIVE: {
    add: {
      objectives: {
        how: 'Go to section editor → Add clear, measurable learning objectives using action verbs',
        examples: [
          'Use Bloom\'s taxonomy verbs: Define, Explain, Apply, Analyze, Evaluate, Create',
          '"Define the key components of a REST API"',
          '"Apply SOLID principles to refactor existing code"',
          '"Evaluate the security implications of different authentication methods"',
        ],
      },
    },
    modify: {
      strengthen: {
        how: 'Review existing objectives → Make them specific and measurable → Align with assessments',
        examples: [
          'Change "Understand databases" to "Explain the differences between SQL and NoSQL databases"',
          'Change "Learn React" to "Build a functional React component with state management"',
        ],
      },
    },
  },
  ASSESSMENT: {
    add: {
      quiz: {
        how: 'Go to section → Add Assessment → Create 3-5 questions → Vary question types → Align with objectives',
        examples: [
          'Multiple choice for knowledge verification',
          'Code completion for practical skills',
          'Short answer for deeper understanding',
          'Scenario-based for application',
        ],
      },
    },
  },
};

/**
 * Get contextual examples based on course content
 */
function getContextualExamples(
  issue: AnalysisIssue,
  course: CourseInput
): string[] {
  const examples: string[] = [];
  const courseTitle = course.title.toLowerCase();

  // Add course-specific examples based on common topics
  if (
    courseTitle.includes('programming') ||
    courseTitle.includes('coding') ||
    courseTitle.includes('development')
  ) {
    if (issue.type === 'DEPTH') {
      examples.push(
        'Add a coding challenge where learners must debug existing code (ANALYZE)'
      );
      examples.push('Include a code review exercise (EVALUATE)');
      examples.push('Assign a small project to build from scratch (CREATE)');
    }
    if (issue.type === 'CONTENT') {
      examples.push('Include executable code examples');
      examples.push('Add common error scenarios and solutions');
    }
  }

  if (
    courseTitle.includes('data') ||
    courseTitle.includes('analytics') ||
    courseTitle.includes('machine learning')
  ) {
    if (issue.type === 'DEPTH') {
      examples.push(
        'Add a data analysis exercise with a real dataset (ANALYZE)'
      );
      examples.push('Include model comparison activities (EVALUATE)');
      examples.push('Assign an end-to-end project (CREATE)');
    }
  }

  if (
    courseTitle.includes('business') ||
    courseTitle.includes('management') ||
    courseTitle.includes('marketing')
  ) {
    if (issue.type === 'DEPTH') {
      examples.push('Add case studies from real companies (ANALYZE)');
      examples.push('Include decision-making simulations (EVALUATE)');
      examples.push('Assign a business plan or strategy project (CREATE)');
    }
  }

  return examples;
}

/**
 * Enhance fix instructions based on issue type and context
 */
function enhanceFixInstructions(
  issue: AnalysisIssue,
  course: CourseInput
): AnalysisIssue {
  const enhanced = { ...issue };
  const templates =
    FIX_TEMPLATES[issue.type as keyof typeof FIX_TEMPLATES];

  if (!templates) return enhanced;

  // Get template based on action
  const actionTemplates =
    templates[issue.fix.action as keyof typeof templates];
  if (!actionTemplates) return enhanced;

  // Find the most relevant template
  const templateKeys = Object.keys(actionTemplates);
  let selectedTemplate: { how: string; examples: string[] } | undefined;

  for (const key of templateKeys) {
    // Simple matching based on issue title/description
    if (
      issue.title.toLowerCase().includes(key) ||
      issue.description.toLowerCase().includes(key)
    ) {
      selectedTemplate = actionTemplates[key as keyof typeof actionTemplates];
      break;
    }
  }

  // Use first template if no specific match
  if (!selectedTemplate && templateKeys.length > 0) {
    selectedTemplate =
      actionTemplates[templateKeys[0] as keyof typeof actionTemplates];
  }

  if (selectedTemplate) {
    // Enhance the "how" if template has more detail
    if (
      selectedTemplate.how &&
      selectedTemplate.how.length > (enhanced.fix.how?.length || 0)
    ) {
      enhanced.fix = {
        ...enhanced.fix,
        how: selectedTemplate.how,
      };
    }

    // Add examples
    const contextualExamples = getContextualExamples(issue, course);
    const allExamples = [...(selectedTemplate.examples || []), ...contextualExamples];

    if (allExamples.length > 0) {
      enhanced.fix = {
        ...enhanced.fix,
        examples: allExamples.slice(0, 5), // Limit to 5 examples
      };
    }
  }

  return enhanced;
}

/**
 * Add suggested content for specific issue types
 */
function addSuggestedContent(
  issue: AnalysisIssue,
  course: CourseInput
): AnalysisIssue {
  const enhanced = { ...issue };

  // For empty sections, suggest content structure
  if (
    issue.type === 'CONTENT' &&
    issue.title.toLowerCase().includes('lacks')
  ) {
    const sectionTitle = issue.location.sectionTitle || 'the topic';
    enhanced.fix.suggestedContent = `
## ${sectionTitle}

### Introduction
[Brief overview of what this section covers and why it matters]

### Core Concepts
[Main content explaining the key ideas]

### Examples
[2-3 practical examples demonstrating the concepts]

### Practice
[An exercise or scenario for learners to apply what they learned]

### Summary
- Key point 1
- Key point 2
- Key point 3
    `.trim();
  }

  // For thin sections, suggest expansion points
  if (issue.type === 'CONTENT' && issue.title.toLowerCase().includes('thin')) {
    const missingElements = issue.evidence
      .find((e) => e.includes('Missing:'))
      ?.replace('Missing: ', '')
      .split(', ');

    if (missingElements) {
      enhanced.fix.suggestedContent = `Consider adding:\n${missingElements.map((e) => `- ${e}`).join('\n')}`;
    }
  }

  return enhanced;
}

/**
 * Generate enhanced fix instructions for all issues
 */
export async function generateFixes(
  issues: AnalysisIssue[],
  course: CourseInput,
  aiEnabled: boolean = true
): Promise<AnalysisIssue[]> {
  return issues.map((issue) => {
    // Enhance fix instructions with templates
    let enhanced = enhanceFixInstructions(issue, course);

    // Add suggested content where appropriate
    enhanced = addSuggestedContent(enhanced, course);

    return enhanced;
  });
}
