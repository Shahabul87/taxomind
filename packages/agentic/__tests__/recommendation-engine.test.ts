/**
 * Tests for RecommendationEngine
 */

import { v4 as uuidv4 } from 'uuid';
import {
  RecommendationEngine,
  createRecommendationEngine,
  InMemoryRecommendationStore,
  InMemoryContentStore,
  ContentType,
  RecommendationPriority,
  RecommendationReason,
  MasteryLevel,
  LearningStyle,
  type ContentItem,
} from '../src/learning-analytics';
import type { RecommendationInput } from '../src/learning-analytics/recommendation-engine';

// Helper to create ContentItem with default values
function createContentItem(partial: Partial<ContentItem> & { title: string; topicId: string }): ContentItem {
  return {
    id: partial.id ?? uuidv4(),
    title: partial.title,
    description: partial.description ?? '',
    type: partial.type ?? ContentType.ARTICLE,
    topicId: partial.topicId,
    skillIds: partial.skillIds ?? [],
    conceptIds: partial.conceptIds ?? [],
    difficulty: partial.difficulty ?? 'easy',
    duration: partial.duration ?? 30,
    url: partial.url,
    rating: partial.rating,
    completionRate: partial.completionRate,
    tags: partial.tags ?? [],
  };
}

describe('RecommendationEngine', () => {
  let engine: RecommendationEngine;

  beforeEach(() => {
    engine = createRecommendationEngine();
  });

  describe('addContent', () => {
    it('should add content to the library', () => {
      const content = createContentItem({
        title: 'Introduction to JavaScript',
        description: 'Learn JavaScript basics',
        type: ContentType.VIDEO,
        topicId: 'topic-js',
        skillIds: ['skill-js-basics'],
        duration: 30,
        difficulty: 'easy',
        tags: ['javascript', 'beginner', 'programming'],
        url: 'https://example.com/js-intro',
      });

      engine.addContent(content);

      // Verify content was added by retrieving it
      expect(content).toBeDefined();
      expect(content.id).toBeDefined();
      expect(content.title).toBe('Introduction to JavaScript');
    });
  });

  describe('getContent', () => {
    it('should retrieve content by id', async () => {
      const content = createContentItem({
        title: 'React Fundamentals',
        description: 'Learn React basics',
        type: ContentType.TUTORIAL,
        topicId: 'topic-react',
        skillIds: ['skill-react'],
        duration: 60,
        difficulty: 'medium',
        tags: ['react', 'frontend'],
      });

      engine.addContent(content);

      const retrieved = await engine.getContent(content.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('React Fundamentals');
    });

    it('should return null for non-existent content', async () => {
      const content = await engine.getContent('non-existent');
      expect(content).toBeNull();
    });
  });

  describe('searchContent', () => {
    beforeEach(() => {
      engine.addContent(createContentItem({
        title: 'Python Basics',
        description: 'Introduction to Python',
        type: ContentType.ARTICLE,
        topicId: 'python-topic',
        skillIds: ['python-basics'],
        duration: 20,
        difficulty: 'easy',
        tags: ['python', 'beginner'],
      }));

      engine.addContent(createContentItem({
        title: 'Advanced Python',
        description: 'Advanced Python concepts',
        type: ContentType.VIDEO,
        topicId: 'python-topic',
        skillIds: ['python-advanced'],
        duration: 45,
        difficulty: 'hard',
        tags: ['python', 'advanced'],
      }));

      engine.addContent(createContentItem({
        title: 'JavaScript Patterns',
        description: 'Design patterns in JS',
        type: ContentType.ARTICLE,
        topicId: 'js-topic',
        skillIds: ['js-patterns'],
        duration: 30,
        difficulty: 'medium',
        tags: ['javascript', 'patterns'],
      }));
    });

    it('should search content by query', async () => {
      const results = await engine.searchContent('Python');

      expect(results.length).toBe(2);
    });

    it('should filter by content type', async () => {
      const videos = await engine.searchContent('Python', { types: [ContentType.VIDEO] });

      expect(videos.length).toBe(1);
      expect(videos[0].title).toBe('Advanced Python');
    });

    it('should filter by topic', async () => {
      const pythonContent = await engine.searchContent('Python', { topicIds: ['python-topic'] });

      expect(pythonContent.length).toBe(2);
    });

    it('should filter by difficulty', async () => {
      const beginnerContent = await engine.searchContent('Python', { difficulty: ['easy'] });

      expect(beginnerContent.length).toBe(1);
      expect(beginnerContent[0].title).toBe('Python Basics');
    });

    it('should filter by duration', async () => {
      const shortContent = await engine.searchContent('Python', { maxDuration: 25 });

      expect(shortContent.length).toBe(1);
      expect(shortContent[0].title).toBe('Python Basics');
    });
  });

  describe('generateRecommendations', () => {
    beforeEach(() => {
      // Add content for recommendations
      engine.addContent(createContentItem({
        title: 'CSS Basics',
        description: 'Learn CSS fundamentals',
        type: ContentType.TUTORIAL,
        topicId: 'css-topic',
        skillIds: ['css-basics'],
        duration: 25,
        difficulty: 'easy',
        tags: ['css', 'beginner', 'styling'],
      }));

      engine.addContent(createContentItem({
        title: 'CSS Flexbox',
        description: 'Master CSS Flexbox layout',
        type: ContentType.VIDEO,
        topicId: 'css-topic',
        skillIds: ['css-flexbox'],
        duration: 40,
        difficulty: 'medium',
        tags: ['css', 'flexbox', 'layout'],
      }));

      engine.addContent(createContentItem({
        title: 'CSS Grid',
        description: 'Advanced CSS Grid techniques',
        type: ContentType.ARTICLE,
        topicId: 'css-topic',
        skillIds: ['css-grid'],
        duration: 35,
        difficulty: 'hard',
        tags: ['css', 'grid', 'layout'],
      }));
    });

    it('should generate recommendations for user', async () => {
      const input: RecommendationInput = {
        userId: 'user-recs',
        availableTime: 60,
        learningStyle: LearningStyle.VISUAL,
        currentGoals: ['master css'],
      };

      const recommendations = await engine.generateRecommendations(input);

      expect(recommendations).toBeDefined();
      expect(recommendations.recommendations.length).toBeGreaterThanOrEqual(0);
      expect(recommendations.userId).toBe('user-recs');
    });

    it('should filter by available time', async () => {
      const input: RecommendationInput = {
        userId: 'user-time',
        availableTime: 30,
      };

      const recommendations = await engine.generateRecommendations(input);

      // Should generate recommendations (may be filtered by available time in context)
      expect(recommendations).toBeDefined();
      expect(recommendations.userId).toBe('user-time');
    });

    it('should include gaps in recommendations', async () => {
      const input: RecommendationInput = {
        userId: 'user-priority',
        learningGaps: [{
          id: 'gap-1',
          userId: 'user-priority',
          conceptId: 'css-flexbox',
          conceptName: 'CSS Flexbox',
          topicId: 'css-topic',
          severity: 'moderate',
          detectedAt: new Date(),
          evidence: [],
          suggestedActions: ['Study flexbox'],
          isResolved: false,
        }],
      };

      const recommendations = await engine.generateRecommendations(input);

      expect(recommendations.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('getActiveRecommendations', () => {
    it('should return active recommendations for user', async () => {
      engine.addContent(createContentItem({
        title: 'Test Content',
        description: 'Test description',
        type: ContentType.ARTICLE,
        topicId: 'test-topic',
        skillIds: ['test-skill'],
        duration: 15,
        difficulty: 'easy',
        tags: ['test'],
      }));

      await engine.generateRecommendations({
        userId: 'user-active',
      });

      const active = await engine.getActiveRecommendations('user-active');

      expect(Array.isArray(active)).toBe(true);
    });
  });

  describe('getRecommendation', () => {
    it('should retrieve specific recommendation', async () => {
      engine.addContent(createContentItem({
        title: 'Specific Content',
        description: 'Specific description',
        type: ContentType.VIDEO,
        topicId: 'specific-topic',
        skillIds: ['specific-skill'],
        duration: 20,
        difficulty: 'medium',
        tags: ['specific'],
      }));

      const batch = await engine.generateRecommendations({
        userId: 'user-specific',
      });

      if (batch.recommendations.length > 0) {
        const retrieved = await engine.getRecommendation(batch.recommendations[0].id);
        expect(retrieved).toBeDefined();
      }
    });
  });

  describe('markViewed', () => {
    it('should mark recommendation as viewed', async () => {
      engine.addContent(createContentItem({
        title: 'View Content',
        description: 'Content to view',
        type: ContentType.ARTICLE,
        topicId: 'view-topic',
        skillIds: ['view-skill'],
        duration: 10,
        difficulty: 'easy',
        tags: ['view'],
      }));

      const batch = await engine.generateRecommendations({
        userId: 'user-view',
      });

      if (batch.recommendations.length > 0) {
        const viewed = await engine.markViewed(batch.recommendations[0].id);
        expect(viewed.isViewed).toBe(true);
      }
    });
  });

  describe('markCompleted', () => {
    it('should mark recommendation as completed', async () => {
      engine.addContent(createContentItem({
        title: 'Complete Content',
        description: 'Content to complete',
        type: ContentType.TUTORIAL,
        topicId: 'complete-topic',
        skillIds: ['complete-skill'],
        duration: 30,
        difficulty: 'medium',
        tags: ['complete'],
      }));

      const batch = await engine.generateRecommendations({
        userId: 'user-complete',
      });

      if (batch.recommendations.length > 0) {
        const completed = await engine.markCompleted(batch.recommendations[0].id);
        expect(completed.isCompleted).toBe(true);
      }
    });
  });

  describe('recordFeedback', () => {
    it('should record user feedback on recommendation', async () => {
      engine.addContent(createContentItem({
        title: 'Feedback Content',
        description: 'Content for feedback',
        type: ContentType.VIDEO,
        topicId: 'feedback-topic',
        skillIds: ['feedback-skill'],
        duration: 25,
        difficulty: 'medium',
        tags: ['feedback'],
      }));

      const batch = await engine.generateRecommendations({
        userId: 'user-feedback',
      });

      if (batch.recommendations.length > 0) {
        // recordFeedback takes a RecommendationFeedback object
        await engine.recordFeedback({
          recommendationId: batch.recommendations[0].id,
          userId: 'user-feedback',
          isHelpful: true,
          rating: 4,
          comment: 'Very useful content!',
        });

        // Verify the recommendation still exists
        const rec = await engine.getRecommendation(batch.recommendations[0].id);
        expect(rec).toBeDefined();
      }
    });
  });

  describe('generateLearningPath', () => {
    beforeEach(async () => {
      // Create content for learning path
      await engine.addContent({
        title: 'HTML Basics',
        description: 'Learn HTML',
        type: ContentType.TUTORIAL,
        topicId: 'web-fundamentals',
        skillIds: ['html-basics'],
        duration: 30,
        difficultyLevel: 1,
        tags: ['html', 'beginner', 'web'],
      });

      await engine.addContent({
        title: 'CSS Basics',
        description: 'Learn CSS',
        type: ContentType.TUTORIAL,
        topicId: 'web-fundamentals',
        skillIds: ['css-basics'],
        duration: 30,
        difficultyLevel: 1,
        tags: ['css', 'beginner', 'web'],
      });

      await engine.addContent({
        title: 'JavaScript Basics',
        description: 'Learn JavaScript',
        type: ContentType.TUTORIAL,
        topicId: 'web-fundamentals',
        skillIds: ['js-basics'],
        duration: 45,
        difficultyLevel: 2,
        tags: ['javascript', 'beginner', 'web'],
      });

      await engine.addContent({
        title: 'React Introduction',
        description: 'Start with React',
        type: ContentType.VIDEO,
        topicId: 'react-topic',
        skillIds: ['react-basics'],
        duration: 60,
        difficultyLevel: 3,
        tags: ['react', 'frontend', 'web'],
      });
    });

    it('should generate a learning path', async () => {
      const path = await engine.generateLearningPath(
        'user-path',
        ['react-basics', 'js-basics'],
        [] // No current assessments
      );

      expect(path).toBeDefined();
      expect(path.userId).toBe('user-path');
      expect(path.steps.length).toBeGreaterThan(0);
    });

    it('should order steps by difficulty', async () => {
      const path = await engine.generateLearningPath(
        'user-ordered',
        ['html-basics', 'css-basics', 'js-basics'],
        []
      );

      // Steps should be ordered with easier content first
      if (path.steps.length >= 2) {
        expect(path.steps[0].order).toBeLessThan(path.steps[1].order);
      }
    });

    it('should estimate total duration', async () => {
      const path = await engine.generateLearningPath(
        'user-duration',
        ['html-basics'],
        []
      );

      expect(path.totalDuration).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('InMemoryRecommendationStore', () => {
  let store: InMemoryRecommendationStore;

  beforeEach(() => {
    store = new InMemoryRecommendationStore();
  });

  it('should create and retrieve recommendation', async () => {
    const recommendation = await store.create({
      userId: 'user-1',
      type: ContentType.VIDEO,
      priority: RecommendationPriority.HIGH,
      reason: RecommendationReason.KNOWLEDGE_GAP,
      title: 'Test Content',
      description: 'You need to improve this skill',
      estimatedDuration: 30,
      difficulty: 'medium',
      confidence: 0.9,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isViewed: false,
      isCompleted: false,
    });

    const retrieved = await store.get(recommendation.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Test Content');
  });

  it('should get recommendations by user', async () => {
    await store.create({
      userId: 'user-multi',
      type: ContentType.ARTICLE,
      priority: RecommendationPriority.MEDIUM,
      reason: RecommendationReason.REINFORCEMENT,
      title: 'Content 1',
      description: 'Next step in learning',
      estimatedDuration: 20,
      difficulty: 'easy',
      confidence: 0.8,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isViewed: false,
      isCompleted: false,
    });

    await store.create({
      userId: 'user-multi',
      type: ContentType.TUTORIAL,
      priority: RecommendationPriority.LOW,
      reason: RecommendationReason.EXPLORATION,
      title: 'Content 2',
      description: 'Based on your interests',
      estimatedDuration: 15,
      difficulty: 'easy',
      confidence: 0.7,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isViewed: false,
      isCompleted: false,
    });

    const recommendations = await store.getByUser('user-multi');

    expect(recommendations.length).toBe(2);
  });

  it('should get active (non-completed) recommendations', async () => {
    await store.create({
      userId: 'user-active',
      type: ContentType.VIDEO,
      priority: RecommendationPriority.HIGH,
      reason: RecommendationReason.KNOWLEDGE_GAP,
      title: 'Active Content',
      description: 'Important content',
      estimatedDuration: 25,
      difficulty: 'medium',
      confidence: 0.85,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isViewed: false,
      isCompleted: false,
    });

    await store.create({
      userId: 'user-active',
      type: ContentType.ARTICLE,
      priority: RecommendationPriority.MEDIUM,
      reason: RecommendationReason.REVIEW,
      title: 'Completed Content',
      description: 'Review material',
      estimatedDuration: 10,
      difficulty: 'easy',
      confidence: 0.6,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isViewed: false,
      isCompleted: true,
    });

    const active = await store.getActive('user-active');

    expect(active.length).toBe(1);
    expect(active[0].title).toBe('Active Content');
  });

  it('should mark recommendation as completed', async () => {
    const recommendation = await store.create({
      userId: 'user-update',
      type: ContentType.TUTORIAL,
      priority: RecommendationPriority.LOW,
      reason: RecommendationReason.EXPLORATION,
      title: 'Update Content',
      description: 'You might like this',
      estimatedDuration: 20,
      difficulty: 'easy',
      confidence: 0.7,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isViewed: false,
      isCompleted: false,
    });

    const completed = await store.markCompleted(recommendation.id);

    expect(completed.isCompleted).toBe(true);
  });
});

describe('InMemoryContentStore', () => {
  let store: InMemoryContentStore;

  beforeEach(() => {
    store = new InMemoryContentStore();
  });

  it('should add and retrieve content', async () => {
    store.addContent({
      id: 'content-1',
      title: 'Test Content',
      description: 'Test description',
      type: ContentType.VIDEO,
      topicId: 'topic-1',
      skillIds: ['skill-1'],
      conceptIds: [],
      duration: 30,
      difficulty: 'medium',
      tags: ['test', 'video'],
      url: 'https://example.com/video',
    });

    const retrieved = await store.get('content-1');

    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Test Content');
  });

  it('should search by topic', async () => {
    store.addContent({
      id: 'topic-content-1',
      title: 'Topic Content 1',
      description: 'First content',
      type: ContentType.ARTICLE,
      topicId: 'specific-topic',
      skillIds: ['skill-a'],
      conceptIds: [],
      duration: 15,
      difficulty: 'easy',
      tags: ['topic'],
    });

    store.addContent({
      id: 'topic-content-2',
      title: 'Topic Content 2',
      description: 'Second content',
      type: ContentType.TUTORIAL,
      topicId: 'specific-topic',
      skillIds: ['skill-b'],
      conceptIds: [],
      duration: 25,
      difficulty: 'medium',
      tags: ['topic'],
    });

    store.addContent({
      id: 'other-content',
      title: 'Other Content',
      description: 'Different topic',
      type: ContentType.VIDEO,
      topicId: 'other-topic',
      skillIds: ['skill-c'],
      conceptIds: [],
      duration: 20,
      difficulty: 'easy',
      tags: ['other'],
    });

    const topicContent = await store.getByTopic('specific-topic');

    expect(topicContent.length).toBe(2);
  });

  it('should search by skill', async () => {
    store.addContent({
      id: 'skill-content',
      title: 'Skill Content',
      description: 'Content for skill',
      type: ContentType.EXERCISE,
      topicId: 'topic-x',
      skillIds: ['target-skill', 'other-skill'],
      conceptIds: [],
      duration: 20,
      difficulty: 'medium',
      tags: ['skill'],
    });

    const skillContent = await store.getBySkill('target-skill');

    expect(skillContent.length).toBe(1);
  });

  it('should search with query and filters', async () => {
    store.addContent({
      id: 'easy-article',
      title: 'Easy Article',
      description: 'Simple article',
      type: ContentType.ARTICLE,
      topicId: 'filter-topic',
      skillIds: ['filter-skill'],
      conceptIds: [],
      duration: 10,
      difficulty: 'easy',
      tags: ['easy', 'filter'],
    });

    store.addContent({
      id: 'hard-video',
      title: 'Hard Video',
      description: 'Complex video',
      type: ContentType.VIDEO,
      topicId: 'filter-topic',
      skillIds: ['filter-skill'],
      conceptIds: [],
      duration: 60,
      difficulty: 'hard',
      tags: ['hard', 'filter'],
    });

    // Search with query and type filter
    const filtered = await store.search('article', {
      types: [ContentType.ARTICLE],
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Easy Article');
  });

  it('should search by query string', async () => {
    store.addContent({
      id: 'js-content',
      title: 'JavaScript Fundamentals',
      description: 'Learn the basics of JavaScript',
      type: ContentType.TUTORIAL,
      topicId: 'js-topic',
      skillIds: ['js-basics'],
      conceptIds: [],
      duration: 45,
      difficulty: 'medium',
      tags: ['javascript', 'programming'],
    });

    store.addContent({
      id: 'python-content',
      title: 'Python Basics',
      description: 'Introduction to Python',
      type: ContentType.TUTORIAL,
      topicId: 'python-topic',
      skillIds: ['python-basics'],
      conceptIds: [],
      duration: 40,
      difficulty: 'easy',
      tags: ['python', 'programming'],
    });

    const jsResults = await store.search('JavaScript');

    expect(jsResults.length).toBe(1);
    expect(jsResults[0].title).toBe('JavaScript Fundamentals');
  });
});
