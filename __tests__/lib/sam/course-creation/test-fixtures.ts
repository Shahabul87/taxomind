/**
 * Test fixtures for course creation tests
 */

import type {
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  SectionDetails,
  ConceptTracker,
} from '@/lib/sam/course-creation/types';

// =============================================================================
// Course Context Fixtures
// =============================================================================

export function createMockCourseContext(overrides?: Partial<CourseContext>): CourseContext {
  return {
    courseTitle: 'Introduction to Machine Learning',
    courseDescription: 'A comprehensive course covering the fundamentals of machine learning, including supervised and unsupervised learning, neural networks, and practical applications.',
    courseCategory: 'Artificial Intelligence',
    courseSubcategory: 'Machine Learning',
    targetAudience: 'Software engineers with basic Python knowledge',
    difficulty: 'intermediate',
    courseLearningObjectives: [
      'Explain the core principles of machine learning algorithms',
      'Implement supervised learning models using Python',
      'Evaluate model performance using appropriate metrics',
    ],
    totalChapters: 3,
    sectionsPerChapter: 2,
    bloomsFocus: ['UNDERSTAND', 'APPLY', 'ANALYZE'],
    learningObjectivesPerChapter: 3,
    learningObjectivesPerSection: 2,
    preferredContentTypes: ['video', 'reading', 'quiz'],
    ...overrides,
  };
}

// =============================================================================
// Chapter Fixtures
// =============================================================================

export function createMockChapter(overrides?: Partial<GeneratedChapter>): GeneratedChapter {
  return {
    position: 1,
    title: 'Foundations of Machine Learning and Data Preprocessing',
    description: 'This chapter introduces the fundamental concepts of machine learning, including the types of learning (supervised, unsupervised, reinforcement), the machine learning workflow, and essential data preprocessing techniques. Students will understand how to prepare data for model training, including handling missing values, feature scaling, and encoding categorical variables. The chapter also covers evaluation metrics and the bias-variance tradeoff.',
    bloomsLevel: 'UNDERSTAND',
    learningObjectives: [
      'Explain the difference between supervised and unsupervised learning paradigms',
      'Describe the complete machine learning pipeline from data collection to deployment',
      'Identify appropriate preprocessing techniques for different data types',
    ],
    keyTopics: ['supervised learning', 'data preprocessing', 'feature engineering'],
    prerequisites: 'Basic understanding of the subject',
    estimatedTime: '2-3 hours',
    topicsToExpand: ['supervised learning', 'data preprocessing', 'feature engineering'],
    conceptsIntroduced: ['training data', 'test data', 'features', 'labels', 'overfitting'],
    ...overrides,
  };
}

export function createMockChapterWithId(overrides?: Partial<GeneratedChapter & { id: string }>): GeneratedChapter & { id: string } {
  return {
    ...createMockChapter(overrides),
    id: overrides?.id ?? 'chapter-1',
  } as GeneratedChapter & { id: string };
}

// =============================================================================
// Section Fixtures
// =============================================================================

export function createMockSection(overrides?: Partial<GeneratedSection>): GeneratedSection {
  return {
    position: 1,
    title: 'Understanding Supervised Learning Algorithms',
    contentType: 'video',
    estimatedDuration: '20-25 minutes',
    topicFocus: 'supervised learning algorithms',
    parentChapterContext: {
      title: 'Foundations of Machine Learning',
      bloomsLevel: 'UNDERSTAND',
      relevantObjectives: [
        'Explain the difference between supervised and unsupervised learning',
        'Describe the machine learning pipeline',
      ],
    },
    conceptsIntroduced: ['linear regression', 'classification'],
    conceptsReferenced: ['training data', 'features'],
    ...overrides,
  };
}

export function createMockSectionWithId(overrides?: Partial<GeneratedSection & { id: string }>): GeneratedSection & { id: string } {
  return {
    ...createMockSection(overrides),
    id: overrides?.id ?? 'section-1',
  } as GeneratedSection & { id: string };
}

// =============================================================================
// Section Details Fixtures
// =============================================================================

export function createMockSectionDetails(overrides?: Partial<SectionDetails>): SectionDetails {
  return {
    description: [
      '<h2>Why This Matters</h2>',
      '<p>Imagine you are a real estate company trying to predict house prices. You have thousands of past sales with features like square footage, location, and number of bedrooms. <strong>Supervised learning algorithms</strong> are exactly the tools that let you turn this historical data into accurate predictions. Without supervised learning algorithms, you would be guessing — and in a market where a 5% error means millions of dollars, guessing is not an option.</p>',
      '<p>Think of supervised learning algorithms like a student studying with an answer key. The algorithm sees both the question (input features) and the correct answer (label), and it learns the pattern that connects them. This is fundamentally different from unsupervised learning, where there is no answer key at all.</p>',
      '<h2>The Big Picture</h2>',
      '<p>Supervised learning algorithms sit at the heart of the machine learning pipeline. Before you can use them, you need clean, preprocessed data (which you learned in the previous section). After you train a model, you need evaluation metrics to know if it actually works. This section bridges the gap — it gives you the core engine that drives prediction.</p>',
      '<p>If you skip this section, everything that follows — model tuning, ensemble methods, deep learning — will feel like magic tricks without understanding. <strong>Supervised learning algorithms</strong> are the foundation.</p>',
      '<h2>What You Will Learn</h2>',
      '<ul>',
      '<li><strong>Linear regression</strong> — the simplest and most interpretable supervised learning algorithm. Think of it as drawing the best-fit line through a scatter plot of data points.</li>',
      '<li><strong>Logistic regression</strong> — despite its name, this is a classification algorithm. It predicts probabilities, like "80% chance this email is spam."</li>',
      '<li><strong>Decision boundaries</strong> — the invisible lines that separate different classes in your data. Understanding these helps you visualize what your model is actually learning.</li>',
      '<li><strong>Overfitting vs underfitting</strong> — the fundamental tradeoff. A model that memorizes training data is useless; a model that is too simple misses real patterns.</li>',
      '<li><strong>Training and evaluation workflow</strong> — how to split data, train a model, and measure its performance using metrics like accuracy and mean squared error.</li>',
      '</ul>',
      '<h2>Problems You Can Solve</h2>',
      '<ol>',
      '<li>Predict continuous values (house prices, stock returns, temperature) using linear regression on structured datasets</li>',
      '<li>Classify binary outcomes (spam vs not-spam, fraud vs legitimate, positive vs negative sentiment) using logistic regression</li>',
      '<li>Diagnose model performance issues by analyzing decision boundaries and identifying overfitting from training vs validation curves</li>',
      '<li>Choose between regression and classification approaches for a given business problem based on the target variable type</li>',
      '</ol>',
      '<h2>Real-World Applications</h2>',
      '<p>Companies like <strong>Zillow</strong> use supervised learning algorithms (specifically regression models) to power their Zestimate home valuations. <strong>Gmail</strong> uses classification models to filter spam from billions of emails daily. Netflix uses these same foundations to predict which shows you will enjoy. In healthcare, supervised learning algorithms help radiologists detect tumors in medical images with accuracy that rivals experienced doctors.</p>',
      '<p>Mastering <strong>supervised learning algorithms</strong> gives you the toolkit to solve real prediction and classification problems across every industry — from finance to healthcare to e-commerce.</p>',
    ].join('\n'),
    learningObjectives: [
      'Explain how linear regression models work for continuous prediction tasks',
      'Compare classification and regression approaches for different problem types',
    ],
    keyConceptsCovered: ['linear regression', 'logistic regression', 'decision boundaries'],
    practicalActivity: 'Complete a hands-on exercise implementing a linear regression model using scikit-learn to predict housing prices from a sample dataset.',
    resources: ['https://scikit-learn.org/stable/tutorial/'],
    ...overrides,
  };
}

// =============================================================================
// Concept Tracker Fixtures
// =============================================================================

export function createMockConceptTracker(): ConceptTracker {
  return {
    concepts: new Map([
      ['machine learning', { concept: 'machine learning', introducedInChapter: 1, bloomsLevel: 'UNDERSTAND' }],
      ['neural networks', { concept: 'neural networks', introducedInChapter: 2, bloomsLevel: 'APPLY' }],
    ]),
    vocabulary: ['machine learning', 'neural networks'],
    skillsBuilt: ['data preprocessing'],
  };
}

// =============================================================================
// AI Response Fixtures
// =============================================================================

export function createMockChapterAIResponse(chapterNumber = 1): string {
  return JSON.stringify({
    thinking: 'I designed this chapter to build foundational understanding of ML concepts.',
    chapter: {
      position: chapterNumber,
      title: 'Foundations of Machine Learning and Data Preprocessing',
      description: 'This chapter introduces the fundamental concepts of machine learning, including the types of learning, the machine learning workflow, and essential data preprocessing techniques. Students will understand how to prepare data for model training and evaluation.',
      bloomsLevel: 'UNDERSTAND',
      learningObjectives: [
        'Explain the difference between supervised and unsupervised learning paradigms',
        'Describe the complete machine learning pipeline from data collection to deployment',
        'Identify appropriate preprocessing techniques for different data types',
      ],
      keyTopics: ['supervised learning', 'data preprocessing', 'feature engineering'],
      prerequisites: 'Basic Python programming knowledge',
      estimatedTime: '2-3 hours',
      topicsToExpand: ['supervised learning', 'data preprocessing', 'feature engineering'],
      conceptsIntroduced: ['training data', 'test data', 'features', 'labels', 'overfitting'],
    },
  });
}

export function createMockSectionAIResponse(sectionNumber = 1): string {
  return JSON.stringify({
    thinking: 'This section focuses on the practical aspects of supervised learning.',
    section: {
      position: sectionNumber,
      title: 'Understanding Supervised Learning Algorithms',
      contentType: 'video',
      estimatedDuration: '20-25 minutes',
      topicFocus: 'supervised learning algorithms',
      parentChapterContext: {
        title: 'Foundations of Machine Learning',
        bloomsLevel: 'UNDERSTAND',
        relevantObjectives: ['Explain supervised vs unsupervised learning'],
      },
      conceptsIntroduced: ['linear regression', 'classification'],
      conceptsReferenced: ['training data'],
    },
  });
}

export function createMockDetailsAIResponse(): string {
  const description = [
    '<h2>Why This Matters</h2>',
    '<p>Imagine you are a real estate company trying to predict house prices. <strong>Supervised learning algorithms</strong> are exactly the tools that let you turn historical data into accurate predictions. Without them, you would be guessing — and in a market where errors mean millions, guessing is not an option.</p>',
    '<h2>The Big Picture</h2>',
    '<p>Supervised learning algorithms sit at the heart of the machine learning pipeline. This section gives you the core engine that drives prediction. If you skip this, everything that follows will feel like magic tricks without understanding.</p>',
    '<h2>What You Will Learn</h2>',
    '<ul>',
    '<li><strong>Linear regression</strong> — drawing the best-fit line through data points</li>',
    '<li><strong>Logistic regression</strong> — predicting probabilities for classification</li>',
    '<li><strong>Decision boundaries</strong> — the invisible lines separating classes</li>',
    '</ul>',
    '<h2>Problems You Can Solve</h2>',
    '<ol>',
    '<li>Predict continuous values using linear regression</li>',
    '<li>Classify binary outcomes using logistic regression</li>',
    '<li>Diagnose model performance by analyzing decision boundaries</li>',
    '</ol>',
    '<h2>Real-World Applications</h2>',
    '<p>Companies like <strong>Zillow</strong> use supervised learning algorithms for home valuations. Gmail uses classification to filter spam. Mastering these foundations gives you the toolkit to solve prediction problems across every industry.</p>',
  ].join('\n');

  return JSON.stringify({
    thinking: 'These details provide comprehensive coverage of the section topic with rich HTML lesson content.',
    details: {
      description,
      learningObjectives: [
        'Explain how linear regression models work for continuous prediction tasks',
        'Compare classification and regression approaches for different problem types',
      ],
      keyConceptsCovered: ['linear regression', 'logistic regression', 'decision boundaries'],
      practicalActivity: 'Complete a hands-on exercise implementing a linear regression model using scikit-learn to predict housing prices.',
      resources: ['https://scikit-learn.org/stable/tutorial/'],
    },
  });
}
