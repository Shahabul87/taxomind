jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@sam-ai/agentic', () => ({
  EntityType: {
    COURSE: 'COURSE',
    CHAPTER: 'CHAPTER',
    SECTION: 'SECTION',
    CONCEPT: 'CONCEPT',
    TOPIC: 'TOPIC',
    SKILL: 'SKILL',
    USER: 'USER',
    QUESTION: 'QUESTION',
    RESOURCE: 'RESOURCE',
    PREREQUISITE: 'PREREQUISITE',
    LEARNING_OBJECTIVE: 'LEARNING_OBJECTIVE',
  },
  RelationshipType: {
    PREREQUISITE_OF: 'PREREQUISITE_OF',
    PART_OF: 'PART_OF',
    RELATED_TO: 'RELATED_TO',
    TEACHES: 'TEACHES',
    REQUIRES: 'REQUIRES',
    FOLLOWS: 'FOLLOWS',
    SIMILAR_TO: 'SIMILAR_TO',
    MASTERED_BY: 'MASTERED_BY',
    STRUGGLED_WITH: 'STRUGGLED_WITH',
    COMPLETED: 'COMPLETED',
    REFERENCES: 'REFERENCES',
  },
}));

jest.mock('@/lib/sam/agentic-knowledge-graph', () => ({
  getKnowledgeGraphManager: jest.fn(),
  getKGCourseGraph: jest.fn(),
  getKGRelatedContent: jest.fn(),
  getKGUserProfile: jest.fn(),
  searchKGEntities: jest.fn(),
}));

import { GET } from '@/app/api/sam/knowledge-graph/route';
import { auth } from '@/auth';
import {
  getKnowledgeGraphManager,
  getKGCourseGraph,
  getKGRelatedContent,
  getKGUserProfile,
  searchKGEntities,
} from '@/lib/sam/agentic-knowledge-graph';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGetKnowledgeGraphManager = getKnowledgeGraphManager as jest.Mock;
const mockGetKGCourseGraph = getKGCourseGraph as jest.Mock;
const mockGetKGRelatedContent = getKGRelatedContent as jest.Mock;
const mockGetKGUserProfile = getKGUserProfile as jest.Mock;
const mockSearchKGEntities = searchKGEntities as jest.Mock;

describe('/api/sam/knowledge-graph route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

    mockGetKnowledgeGraphManager.mockResolvedValue({
      getEntity: jest.fn(),
      getNeighbors: jest.fn().mockResolvedValue([]),
      getRelationships: jest.fn().mockResolvedValue([]),
      traverse: jest.fn().mockResolvedValue({ entities: [], relationships: [], depth: 1, paths: [] }),
    });

    mockGetKGCourseGraph.mockResolvedValue(null);
    mockGetKGRelatedContent.mockResolvedValue({ content: [] });
    mockGetKGUserProfile.mockResolvedValue({
      userId: 'user-1',
      skills: [],
      masteredConcepts: [],
      inProgressConcepts: [],
      strugglingConcepts: [],
      totalLearningTime: 0,
      lastActivityAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    mockSearchKGEntities.mockResolvedValue([]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/knowledge-graph');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid query parameters', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/sam/knowledge-graph?action=traverse&conceptId=c1&maxDepth=0'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid query parameters');
  });

  it('returns 400 when action=course is missing courseId', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/knowledge-graph?action=course');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when action=search is missing query', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/knowledge-graph?action=search');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('returns search results with user progress status', async () => {
    mockSearchKGEntities.mockResolvedValueOnce([
      {
        id: 'concept-1',
        name: 'Loops',
        type: 'CONCEPT',
        description: 'Looping fundamentals',
        properties: { difficulty: 'basic' },
      },
    ]);

    mockGetKGUserProfile.mockResolvedValueOnce({
      userId: 'user-1',
      skills: [],
      masteredConcepts: ['concept-1'],
      inProgressConcepts: [],
      strugglingConcepts: [],
      totalLearningTime: 0,
      lastActivityAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const req = new NextRequest(
      'http://localhost:3000/api/sam/knowledge-graph?action=search&query=loop'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.count).toBe(1);
    expect(body.data.results[0].status).toBe('mastered');
    expect(body.data.results[0].type).toBe('CONCEPT');
  });

  it('returns 503 when concept action needs unavailable KG manager', async () => {
    mockGetKnowledgeGraphManager.mockRejectedValueOnce(new Error('OPENAI_API_KEY missing'));

    const req = new NextRequest(
      'http://localhost:3000/api/sam/knowledge-graph?action=concept&conceptId=concept-1'
    );
    const res = await GET(req);

    expect(res.status).toBe(503);
  });

  it('returns user-profile data with skill status mapping', async () => {
    mockGetKGUserProfile.mockResolvedValueOnce({
      userId: 'user-1',
      skills: [
        {
          conceptId: 'c1',
          conceptName: 'Arrays',
          masteryLevel: 85,
          practiceCount: 12,
          strengthTrend: 'up',
        },
        {
          conceptId: 'c2',
          conceptName: 'Graphs',
          masteryLevel: 20,
          practiceCount: 3,
          strengthTrend: 'down',
        },
      ],
      masteredConcepts: ['c1'],
      inProgressConcepts: [],
      strugglingConcepts: ['c2'],
      totalLearningTime: 3600,
      lastActivityAt: new Date('2026-01-10T00:00:00.000Z'),
    });

    const req = new NextRequest(
      'http://localhost:3000/api/sam/knowledge-graph?action=user-profile'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.summary.totalSkills).toBe(2);
    expect(body.data.skills[0].status).toBe('mastered');
    expect(body.data.skills[1].status).toBe('not_started');
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockSearchKGEntities.mockRejectedValueOnce(new Error('search backend crashed'));

    const req = new NextRequest(
      'http://localhost:3000/api/sam/knowledge-graph?action=search&query=graphs'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch knowledge graph data');
  });
});
