/**
 * Tests for SAM Intervention Dismiss API
 */

import { NextRequest } from 'next/server';

// Mock dependencies
const mockAuth = jest.fn();
const mockGet = jest.fn();
const mockRecordResult = jest.fn();

jest.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/taxomind-context', () => ({
  getProactiveStores: () => ({
    intervention: {
      get: mockGet,
      recordResult: mockRecordResult,
    },
  }),
}));

// Import after mocking
import { POST } from '@/app/api/sam/agentic/behavior/interventions/[interventionId]/dismiss/route';

describe('POST /api/sam/agentic/behavior/interventions/[interventionId]/dismiss', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/sam/agentic/behavior/interventions/test-id/dismiss', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ interventionId: 'test-id' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if intervention is not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockGet.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/sam/agentic/behavior/interventions/non-existent/dismiss', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ interventionId: 'non-existent' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Intervention not found');
  });

  it('should successfully dismiss an intervention', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockGet.mockResolvedValue({
      id: 'intervention-123',
      type: 'encouragement',
      priority: 'medium',
      message: 'Keep up the good work!',
    });
    mockRecordResult.mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/sam/agentic/behavior/interventions/intervention-123/dismiss', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ interventionId: 'intervention-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.interventionId).toBe('intervention-123');
    expect(data.data.dismissed).toBe(true);
    expect(data.data.dismissedAt).toBeDefined();

    // Verify recordResult was called with correct arguments
    expect(mockRecordResult).toHaveBeenCalledWith('intervention-123', {
      success: false,
      userResponse: 'dismissed',
      feedback: undefined,
    });
  });

  it('should accept optional feedback when dismissing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockGet.mockResolvedValue({
      id: 'intervention-123',
      type: 'encouragement',
      priority: 'medium',
      message: 'Keep up the good work!',
    });
    mockRecordResult.mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/sam/agentic/behavior/interventions/intervention-123/dismiss', {
      method: 'POST',
      body: JSON.stringify({ feedback: 'Not relevant to me right now' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request, { params: Promise.resolve({ interventionId: 'intervention-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify recordResult was called with feedback
    expect(mockRecordResult).toHaveBeenCalledWith('intervention-123', {
      success: false,
      userResponse: 'dismissed',
      feedback: 'Not relevant to me right now',
    });
  });

  it('should handle empty request body gracefully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockGet.mockResolvedValue({
      id: 'intervention-123',
      type: 'encouragement',
      priority: 'medium',
      message: 'Keep up the good work!',
    });
    mockRecordResult.mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/sam/agentic/behavior/interventions/intervention-123/dismiss', {
      method: 'POST',
      // No body
    });

    const response = await POST(request, { params: Promise.resolve({ interventionId: 'intervention-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return 500 if recordResult throws an error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockGet.mockResolvedValue({
      id: 'intervention-123',
      type: 'encouragement',
      priority: 'medium',
      message: 'Keep up the good work!',
    });
    mockRecordResult.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/sam/agentic/behavior/interventions/intervention-123/dismiss', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ interventionId: 'intervention-123' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to dismiss intervention');
  });
});
