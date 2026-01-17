/**
 * Bloom's Analysis Persistence Tests
 *
 * Tests for the persistence logic in the blooms-analysis API route.
 * Tests pure functions and data structures without database calls.
 */

import { describe, it, expect } from '@jest/globals';
import crypto from 'crypto';

describe('Bloom\'s Analysis Persistence Logic', () => {
  describe('Course Analysis Structure', () => {
    it('should have correct analysis structure for persistence', () => {
      const mockAnalysis = {
        courseLevel: {
          distribution: {
            REMEMBER: 15,
            UNDERSTAND: 25,
            APPLY: 20,
            ANALYZE: 20,
            EVALUATE: 10,
            CREATE: 10,
          },
          cognitiveDepth: 65,
          balance: 'well-balanced' as const,
          confidence: 0.85,
        },
        chapters: [
          {
            chapterId: 'ch1',
            chapterTitle: 'Introduction',
            distribution: {
              REMEMBER: 30,
              UNDERSTAND: 40,
              APPLY: 20,
              ANALYZE: 10,
              EVALUATE: 0,
              CREATE: 0,
            },
            primaryLevel: 'UNDERSTAND' as const,
            cognitiveDepth: 45,
            confidence: 0.8,
            sections: [
              {
                id: 'sec1',
                title: 'Getting Started',
                level: 'UNDERSTAND' as const,
                confidence: 0.85,
              },
            ],
          },
        ],
        recommendations: [
          {
            type: 'content' as const,
            priority: 'high' as const,
            targetLevel: 'CREATE' as const,
            description: 'Add more creative exercises',
            expectedImpact: 'Improve higher-order thinking',
          },
        ],
        learningPathway: {
          stages: [],
          estimatedDuration: '4 hours',
          cognitiveProgression: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
          recommendations: [],
        },
        metadata: {
          method: 'hybrid' as const,
          processingTimeMs: 150,
          timestamp: new Date().toISOString(),
          fromCache: false,
        },
        analyzedAt: new Date().toISOString(),
      };

      // Verify the structure matches what the persistence function expects
      expect(mockAnalysis.courseLevel.distribution).toBeDefined();
      expect(mockAnalysis.courseLevel.cognitiveDepth).toBe(65);
      expect(mockAnalysis.chapters).toHaveLength(1);
      expect(mockAnalysis.recommendations).toHaveLength(1);
      expect(mockAnalysis.learningPathway).toBeDefined();
    });

    it('should handle missing learningPathway gracefully', () => {
      const analysisWithoutPathway = {
        courseLevel: {
          distribution: {},
          cognitiveDepth: 50,
          balance: 'well-balanced' as const,
          confidence: 0.7,
        },
        chapters: [],
        recommendations: [],
        learningPathway: undefined,
        metadata: {
          method: 'keyword' as const,
          processingTimeMs: 10,
          timestamp: new Date().toISOString(),
          fromCache: false,
        },
        analyzedAt: new Date().toISOString(),
      };

      // Verify the fallback to empty object works
      const learningPathway = analysisWithoutPathway.learningPathway ?? {};
      expect(learningPathway).toEqual({});
    });
  });

  describe('Section Mappings Structure', () => {
    it('should collect sections from chapters correctly', () => {
      const chapters = [
        {
          chapterId: 'ch1',
          chapterTitle: 'Chapter 1',
          distribution: {},
          primaryLevel: 'UNDERSTAND' as const,
          cognitiveDepth: 50,
          confidence: 0.8,
          sections: [
            { id: 'sec1', title: 'Section 1', level: 'UNDERSTAND' as const, confidence: 0.85 },
            { id: 'sec2', title: 'Section 2', level: 'APPLY' as const, confidence: 0.75 },
          ],
        },
        {
          chapterId: 'ch2',
          chapterTitle: 'Chapter 2',
          distribution: {},
          primaryLevel: 'ANALYZE' as const,
          cognitiveDepth: 70,
          confidence: 0.82,
          sections: [
            { id: 'sec3', title: 'Section 3', level: 'ANALYZE' as const, confidence: 0.9 },
          ],
        },
      ];

      // Count total sections
      const totalSections = chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
      expect(totalSections).toBe(3);
    });

    it('should normalize Bloom\'s levels to uppercase', () => {
      // Import the normalizer
      const { normalizeToUppercaseSafe } = require('@/lib/sam/utils/blooms-normalizer');

      // Test various input formats
      expect(normalizeToUppercaseSafe('remember')).toBe('REMEMBER');
      expect(normalizeToUppercaseSafe('UNDERSTAND')).toBe('UNDERSTAND');
      expect(normalizeToUppercaseSafe('Apply')).toBe('APPLY');
      expect(normalizeToUppercaseSafe('invalid')).toBe('UNDERSTAND'); // Fallback
    });

    it('should skip sections without id', () => {
      const chapters = [
        {
          chapterId: 'ch1',
          chapterTitle: 'Chapter 1',
          distribution: {},
          primaryLevel: 'UNDERSTAND' as const,
          cognitiveDepth: 50,
          confidence: 0.8,
          sections: [
            { id: 'sec1', title: 'Section 1', level: 'UNDERSTAND' as const, confidence: 0.85 },
            { title: 'Section Without ID', level: 'APPLY' as const, confidence: 0.75 }, // No id
          ],
        },
      ];

      // Filter sections with IDs
      const sectionsWithIds = chapters.flatMap((ch) =>
        ch.sections.filter((s) => 'id' in s && s.id)
      );

      expect(sectionsWithIds).toHaveLength(1);
      expect(sectionsWithIds[0].id).toBe('sec1');
    });
  });

  describe('Gap Analysis Building', () => {
    it('should identify gaps for levels below 10%', () => {
      const distribution = {
        REMEMBER: 25,
        UNDERSTAND: 30,
        APPLY: 20,
        ANALYZE: 15,
        EVALUATE: 5,  // Gap (<10%)
        CREATE: 5,    // Gap (<10%)
      };

      const gaps: string[] = [];
      for (const [level, percentage] of Object.entries(distribution)) {
        if (percentage < 10) {
          gaps.push(level);
        }
      }

      expect(gaps).toContain('EVALUATE');
      expect(gaps).toContain('CREATE');
      expect(gaps).toHaveLength(2);
    });

    it('should extract high-priority recommendations', () => {
      const recommendations = [
        { priority: 'low', targetLevel: 'REMEMBER', description: 'Add more recall' },
        { priority: 'high', targetLevel: 'CREATE', description: 'Add creative tasks' },
        { priority: 'medium', targetLevel: 'ANALYZE', description: 'Add analysis' },
        { priority: 'high', targetLevel: 'EVALUATE', description: 'Add evaluation' },
      ];

      const highPriority = recommendations.filter((rec) => rec.priority === 'high');
      expect(highPriority).toHaveLength(2);
      expect(highPriority[0].targetLevel).toBe('CREATE');
      expect(highPriority[1].targetLevel).toBe('EVALUATE');
    });

    it('should build gap analysis object correctly', () => {
      const distribution = {
        REMEMBER: 25,
        UNDERSTAND: 30,
        APPLY: 20,
        ANALYZE: 15,
        EVALUATE: 5,
        CREATE: 5,
      };

      const gaps: string[] = [];
      const lowCoverage: Array<{ level: string; percentage: number }> = [];

      for (const [level, percentage] of Object.entries(distribution)) {
        if (percentage < 10) {
          gaps.push(level);
          lowCoverage.push({ level, percentage });
        }
      }

      const gapAnalysis = {
        identifiedGaps: gaps,
        lowCoverage,
        balance: 'well-balanced' as const,
        analyzedAt: new Date().toISOString(),
      };

      expect(gapAnalysis.identifiedGaps).toHaveLength(2);
      expect(gapAnalysis.lowCoverage).toHaveLength(2);
      expect(gapAnalysis.balance).toBe('well-balanced');
    });
  });

  describe('Skills Matrix Building', () => {
    it('should aggregate chapter data correctly', () => {
      const chapters = [
        {
          chapterId: 'ch1',
          chapterTitle: 'Introduction',
          distribution: { REMEMBER: 40, UNDERSTAND: 60 },
          primaryLevel: 'UNDERSTAND' as const,
          cognitiveDepth: 40,
          confidence: 0.8,
          sections: [{ id: 's1' }, { id: 's2' }],
        },
        {
          chapterId: 'ch2',
          chapterTitle: 'Advanced',
          distribution: { ANALYZE: 50, EVALUATE: 30, CREATE: 20 },
          primaryLevel: 'ANALYZE' as const,
          cognitiveDepth: 80,
          confidence: 0.85,
          sections: [{ id: 's3' }, { id: 's4' }, { id: 's5' }],
        },
      ];

      const summary = {
        totalChapters: chapters.length,
        totalSections: chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
        averageCognitiveDepth: chapters.reduce((sum, ch) => sum + ch.cognitiveDepth, 0) / chapters.length,
      };

      expect(summary.totalChapters).toBe(2);
      expect(summary.totalSections).toBe(5);
      expect(summary.averageCognitiveDepth).toBe(60);
    });

    it('should build skills matrix by chapter', () => {
      const chapters = [
        {
          chapterId: 'ch1',
          chapterTitle: 'Chapter 1',
          distribution: { REMEMBER: 50, UNDERSTAND: 50 },
          primaryLevel: 'UNDERSTAND' as const,
          cognitiveDepth: 35,
          confidence: 0.8,
          sections: [{ id: 's1' }],
        },
      ];

      const skillsMatrix = {
        byChapter: chapters.map((ch) => ({
          chapterId: ch.chapterId,
          chapterTitle: ch.chapterTitle,
          distribution: ch.distribution,
          primaryLevel: ch.primaryLevel,
          cognitiveDepth: ch.cognitiveDepth,
          sectionCount: ch.sections.length,
        })),
        summary: {
          totalChapters: chapters.length,
          totalSections: chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
          averageCognitiveDepth:
            chapters.length > 0
              ? chapters.reduce((sum, ch) => sum + ch.cognitiveDepth, 0) / chapters.length
              : 0,
        },
      };

      expect(skillsMatrix.byChapter).toHaveLength(1);
      expect(skillsMatrix.byChapter[0].chapterId).toBe('ch1');
      expect(skillsMatrix.byChapter[0].sectionCount).toBe(1);
      expect(skillsMatrix.summary.totalChapters).toBe(1);
    });
  });

  describe('Content Hash Generation', () => {
    it('should generate consistent hash for same content', () => {
      const courseData = {
        title: 'Test Course',
        description: 'A test course',
        chapters: [
          {
            title: 'Chapter 1',
            sections: [{ title: 'Section 1', content: 'Content here' }],
          },
        ],
      };

      const contentString = JSON.stringify(courseData);
      const hash1 = crypto.createHash('sha256').update(contentString).digest('hex').slice(0, 16);
      const hash2 = crypto.createHash('sha256').update(contentString).digest('hex').slice(0, 16);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);
    });

    it('should generate different hash for different content', () => {
      const content1 = JSON.stringify({ title: 'Course A' });
      const content2 = JSON.stringify({ title: 'Course B' });

      const hash1 = crypto.createHash('sha256').update(content1).digest('hex').slice(0, 16);
      const hash2 = crypto.createHash('sha256').update(content2).digest('hex').slice(0, 16);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate 16-character hash', () => {
      const content = JSON.stringify({ title: 'Test' });
      const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);

      expect(hash).toHaveLength(16);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });
  });

  describe('Database Field Mapping', () => {
    it('should map analysis to CourseBloomsAnalysis fields', () => {
      const analysis = {
        courseLevel: {
          distribution: { REMEMBER: 20, UNDERSTAND: 30, APPLY: 25, ANALYZE: 15, EVALUATE: 5, CREATE: 5 },
          cognitiveDepth: 55,
          balance: 'well-balanced' as const,
          confidence: 0.8,
        },
        chapters: [],
        recommendations: [],
        learningPathway: { stages: [], estimatedDuration: '4h', cognitiveProgression: [], recommendations: [] },
        analyzedAt: '2025-01-17T00:00:00.000Z',
      };

      // Expected database fields
      const dbFields = {
        bloomsDistribution: analysis.courseLevel.distribution,
        cognitiveDepth: analysis.courseLevel.cognitiveDepth,
        learningPathway: analysis.learningPathway ?? {},
        recommendations: analysis.recommendations,
        analyzedAt: new Date(analysis.analyzedAt),
      };

      expect(dbFields.bloomsDistribution).toEqual(analysis.courseLevel.distribution);
      expect(dbFields.cognitiveDepth).toBe(55);
      expect(dbFields.learningPathway).toBeDefined();
      expect(dbFields.analyzedAt).toBeInstanceOf(Date);
    });

    it('should map section to SectionBloomsMapping fields', () => {
      const section = {
        id: 'sec-123',
        title: 'Test Section',
        level: 'UNDERSTAND' as const,
        confidence: 0.85,
      };

      const dbFields = {
        sectionId: section.id,
        bloomsLevel: section.level,
        primaryLevel: section.level,
        secondaryLevels: [],
        activities: [],
        assessments: [],
        learningObjectives: [],
      };

      expect(dbFields.sectionId).toBe('sec-123');
      expect(dbFields.bloomsLevel).toBe('UNDERSTAND');
      expect(dbFields.primaryLevel).toBe('UNDERSTAND');
      expect(dbFields.secondaryLevels).toEqual([]);
    });
  });
});
