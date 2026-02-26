/**
 * Tests for Generate Blueprint Route - app/api/courses/generate-blueprint/route.ts
 */

jest.mock('@/lib/sam/ai-provider', () => ({
  generateCourseBlueprint: jest.fn(),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn(async (fn: () => Promise<unknown>) => fn()),
  TIMEOUT_DEFAULTS: { AI_GENERATION: 120000 },
}));

jest.mock('@/lib/error-handler', () => ({
  AIErrorHandler: {
    handleBlueprintGeneration: jest.fn(async (operation: () => Promise<unknown>) => ({
      success: true,
      data: await operation(),
    })),
    getUserFriendlyMessage: jest.fn(() => 'An error occurred while generating the blueprint.'),
  },
}));

import { POST } from '@/app/api/courses/generate-blueprint/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateCourseBlueprint } from '@/lib/sam/ai-provider';

const mockCurrentUser = currentUser as jest.Mock;
const mockGenerateCourseBlueprint = generateCourseBlueprint as jest.Mock;

function postRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/courses/generate-blueprint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function validPayload() {
  return {
    courseTitle: 'Advanced TypeScript',
    courseShortOverview: 'A practical deep dive into TypeScript.',
    targetAudience: 'Intermediate developers',
    chapterCount: 2,
    sectionsPerChapter: 2,
    includeAssessments: true,
    difficulty: 'INTERMEDIATE',
    duration: '6 weeks',
    courseGoals: ['Master advanced typing'],
    bloomsFocus: ['UNDERSTAND', 'APPLY'],
    preferredContentTypes: ['video', 'interactive'],
  };
}

describe('POST /api/courses/generate-blueprint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'admin-1' });
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    (db.userAIPreferences.findUnique as jest.Mock).mockResolvedValue({ id: 'pref-1' });

    mockGenerateCourseBlueprint.mockResolvedValue({
      course: {
        title: 'Advanced TypeScript',
        description: 'A practical deep dive into TypeScript.',
        subtitle: 'Intermediate track',
        difficulty: 'INTERMEDIATE',
        estimatedDuration: '6 weeks',
        targetAudience: 'Intermediate developers',
        learningOutcomes: ['Master advanced typing'],
      },
      chapters: [
        {
          title: 'Type System Fundamentals',
          description: 'Core concepts',
          bloomsLevel: 'UNDERSTAND',
          sections: [
            {
              title: 'Mapped types',
              description: 'Learn mapped types',
              contentType: 'Video Lecture',
              estimatedDuration: '20 minutes',
              bloomsLevel: 'UNDERSTAND',
            },
          ],
        },
      ],
      metadata: {
        totalEstimatedHours: 12,
        bloomsDistribution: { UNDERSTAND: 60, APPLY: 40 },
        contentTypeDistribution: { video: 70, interactive: 30 },
      },
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(postRequest(validPayload()) as never);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(postRequest(validPayload()) as never);
    expect(res.status).toBe(403);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(postRequest({ courseTitle: 'Only title' }) as never);
    expect(res.status).toBe(400);
  });

  it('returns generated blueprint successfully', async () => {
    const res = await POST(postRequest(validPayload()) as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.course.title).toBe('Advanced TypeScript');
    expect(Array.isArray(body.chapters)).toBe(true);
    expect(body.metadata.aiGenerated).toBe(true);
    expect(mockGenerateCourseBlueprint).toHaveBeenCalled();
  });
});
