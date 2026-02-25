/**
 * Tests for SAM Study Plans Generate Route - app/api/sam/study-plans/generate/route.ts
 *
 * Covers: POST (generate a study plan)
 * Auth: Uses auth() from @/auth (session-based)
 */

jest.mock('@/lib/sam/study-plan-generator', () => ({
  generateStudyPlan: jest.fn().mockResolvedValue({
    title: 'TypeScript Mastery Plan',
    totalWeeks: 4,
    totalTasks: 20,
    weeks: [],
    milestones: [],
  }),
}));

import { POST } from '@/app/api/sam/study-plans/generate/route';
import { auth } from '@/auth';
import { generateStudyPlan } from '@/lib/sam/study-plan-generator';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGenerate = generateStudyPlan as jest.Mock;

const validBody = {
  courseType: 'new' as const,
  newCourse: { title: 'TypeScript Fundamentals' },
  skillLevel: 'intermediate' as const,
  learningStyles: ['visual', 'reading'],
  primaryGoal: 'master' as const,
  targetMastery: 'proficient' as const,
  motivation: 'Career advancement',
  startDate: new Date().toISOString(),
  targetEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  preferredTimeSlot: 'evening' as const,
  dailyStudyHours: 2,
  studyDays: ['Monday', 'Wednesday', 'Friday'],
  includePractice: true,
  includeAssessments: true,
  includeProjects: false,
};

describe('POST /api/sam/study-plans/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/sam/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('generates a study plan with valid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.totalWeeks).toBe(4);
    expect(data.data.totalTasks).toBe(20);
  });

  it('returns 400 for invalid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify({ courseType: 'invalid' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('validates minimum learning styles', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, learningStyles: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('validates daily study hours range', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, dailyStudyHours: 0.1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('validates minimum study days', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, studyDays: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('supports enrolled course type', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const enrolledBody = {
      ...validBody,
      courseType: 'enrolled' as const,
      courseId: 'course-1',
      courseTitle: 'Existing Course',
      newCourse: undefined,
    };
    const req = new NextRequest('http://localhost:3000/api/sam/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify(enrolledBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('passes correct input to generator', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    await POST(req);

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    const callArg = mockGenerate.mock.calls[0][0];
    expect(callArg.skillLevel).toBe('intermediate');
    expect(callArg.dailyStudyHours).toBe(2);
  });

  it('includes practice and assessments when requested', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    await POST(req);

    const callArg = mockGenerate.mock.calls[0][0];
    expect(callArg.includePractice).toBe(true);
    expect(callArg.includeAssessments).toBe(true);
    expect(callArg.includeProjects).toBe(false);
  });

  it('returns 500 on generator failure', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockGenerate.mockRejectedValueOnce(new Error('Generator crashed'));

    const req = new NextRequest('http://localhost:3000/api/sam/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.code).toBe('GENERATION_FAILED');
  });
});
