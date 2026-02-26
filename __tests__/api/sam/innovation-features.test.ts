jest.mock('@sam-ai/educational', () => ({
  createInnovationEngine: jest.fn(() => ({
    assessCognitiveFitness: jest.fn().mockResolvedValue({ dimensions: [] }),
    generateLearningDNA: jest.fn().mockResolvedValue({
      dnaSequence: { segments: [], uniqueMarkers: [], cognitiveCode: 'CODE' },
      traits: [],
      phenotype: { capabilities: [] },
    }),
    createStudyBuddy: jest.fn().mockResolvedValue({
      buddyId: 'buddy-1',
      personality: { type: 'friendly' },
      avatar: {},
      relationship: {},
      capabilities: {},
    }),
    interactWithBuddy: jest.fn().mockResolvedValue({ type: 'conversation', content: 'hello' }),
    createQuantumPath: jest.fn().mockResolvedValue({ pathId: 'path-1', superposition: [], probability: {} }),
    observeQuantumPath: jest.fn().mockResolvedValue({ stateId: 'state-1', probabilities: [] }),
  })),
}));

jest.mock('@/lib/adapters', () => ({
  createInnovationAdapter: jest.fn(() => ({})),
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

import { GET, POST } from '@/app/api/sam/innovation-features/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const typedDb = db as any;
typedDb.cognitiveFitnessAssessment = typedDb.cognitiveFitnessAssessment || { findFirst: jest.fn() };
typedDb.learningDNA = typedDb.learningDNA || { findFirst: jest.fn() };
typedDb.studyBuddy = typedDb.studyBuddy || { findFirst: jest.fn() };
typedDb.quantumLearningPath = typedDb.quantumLearningPath || { count: jest.fn() };

const mockFitnessFindFirst = typedDb.cognitiveFitnessAssessment.findFirst as jest.Mock;
const mockLearningDNAFindFirst = typedDb.learningDNA.findFirst as jest.Mock;
const mockStudyBuddyFindFirst = typedDb.studyBuddy.findFirst as jest.Mock;
const mockQuantumCount = typedDb.quantumLearningPath.count as jest.Mock;

describe('api/sam/innovation-features route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockFitnessFindFirst.mockResolvedValue(null);
    mockLearningDNAFindFirst.mockResolvedValue(null);
    mockStudyBuddyFindFirst.mockResolvedValue(null);
    mockQuantumCount.mockResolvedValue(0);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/innovation-features', {
      method: 'POST',
      body: JSON.stringify({ action: 'assess-cognitive-fitness', data: {} }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST returns 400 for missing action/data', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/innovation-features', {
      method: 'POST',
      body: JSON.stringify({ action: 'assess-cognitive-fitness' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Missing required fields');
  });

  it('POST returns 400 for invalid action', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/innovation-features', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid-action', data: {} }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/innovation-features');

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns overview payload by default', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/innovation-features');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.feature).toBeNull();
    expect(body.data.activeQuantumPaths).toBe(0);
  });
});
