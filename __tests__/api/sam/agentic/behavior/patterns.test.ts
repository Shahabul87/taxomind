/**
 * Tests for SAM Behavior Patterns API
 *
 * Uses dependency injection via resetBehaviorMonitor to inject mock behavior.
 * This bypasses the pnpm workspace + next/jest module resolution issues.
 */

// Mock dependencies BEFORE importing the route
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/taxomind-context', () => ({
  getProactiveStores: jest.fn(() => ({
    behaviorEvent: {},
    pattern: {},
    intervention: {},
  })),
}));

// Mock @sam-ai/agentic to prevent real module from loading during route import
jest.mock('@sam-ai/agentic', () => ({
  createBehaviorMonitor: jest.fn(() => ({
    getPatterns: jest.fn(),
    detectPatterns: jest.fn(),
  })),
}));

// Now import route and auth mock
import {
  GET,
  POST,
  resetBehaviorMonitor,
} from '@/app/api/sam/agentic/behavior/patterns/route';
import { auth } from '@/auth';

// Type the mocked auth
const mockedAuth = auth as jest.MockedFunction<typeof auth>;

// Mock behavior monitor functions
const mockGetPatterns = jest.fn();
const mockDetectPatterns = jest.fn();

// Sample pattern data for comprehensive tests
const mockPatterns = [
  {
    id: 'pattern-1',
    userId: 'user-123',
    type: 'time_preference',
    name: 'Morning Learner',
    description: 'Prefers to study during morning hours (around 9:00)',
    frequency: 15,
    duration: 0,
    confidence: 0.75,
    contexts: [{ timeOfDay: 'morning' }],
    firstObservedAt: new Date('2024-01-01'),
    lastObservedAt: new Date('2024-01-15'),
    occurrences: 15,
  },
  {
    id: 'pattern-2',
    userId: 'user-123',
    type: 'learning_habit',
    name: 'Consistent Learner',
    description: 'Studies 45 minutes on average, active 12 out of 14 days',
    frequency: 12,
    duration: 45,
    confidence: 0.86,
    contexts: [],
    firstObservedAt: new Date('2024-01-01'),
    lastObservedAt: new Date('2024-01-14'),
    occurrences: 20,
  },
];

describe('Behavior Patterns Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Inject mock behavior monitor via dependency injection
    resetBehaviorMonitor({
      getPatterns: mockGetPatterns,
      detectPatterns: mockDetectPatterns,
    });
  });

  afterEach(() => {
    // Reset the behavior monitor to null after each test
    resetBehaviorMonitor(null);
  });

  describe('GET /api/sam/agentic/behavior/patterns', () => {
    it('should return 401 if not authenticated', async () => {
      mockedAuth.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if user id is missing', async () => {
      mockedAuth.mockResolvedValue({ user: {} } as never);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return patterns for authenticated user', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as never);

      mockGetPatterns.mockResolvedValue(mockPatterns);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.patterns).toHaveLength(2);
      expect(data.data.patterns[0].type).toBe('time_preference');
      expect(data.data.patterns[1].type).toBe('learning_habit');
      expect(mockGetPatterns).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array when no patterns exist', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-456' },
      } as never);

      mockGetPatterns.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.patterns).toEqual([]);
    });

    it('should return 500 on internal error', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-123' },
      } as never);

      mockGetPatterns.mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch behavior patterns');
    });
  });

  describe('POST /api/sam/agentic/behavior/patterns', () => {
    it('should return 401 if not authenticated', async () => {
      mockedAuth.mockResolvedValue(null);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should detect patterns for authenticated user', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as never);

      mockDetectPatterns.mockResolvedValue(mockPatterns);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.patterns).toHaveLength(2);
      expect(data.data.detected).toBe(2);
      expect(mockDetectPatterns).toHaveBeenCalledWith('user-123');
    });

    it('should return empty when no patterns detected', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-789' },
      } as never);

      mockDetectPatterns.mockResolvedValue([]);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.patterns).toEqual([]);
      expect(data.data.detected).toBe(0);
    });

    it('should return 500 on detection error', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-123' },
      } as never);

      mockDetectPatterns.mockRejectedValue(new Error('Pattern detection failed'));

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to detect behavior patterns');
    });

    it('should detect patterns with various types', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-123' },
      } as never);

      const diversePatterns = [
        {
          id: 'pattern-struggle',
          userId: 'user-123',
          type: 'struggle_pattern',
          name: 'Assessment Challenges',
          description: 'Experiencing difficulty with assessments',
          frequency: 5,
          duration: 0,
          confidence: 0.8,
          contexts: [],
          occurrences: 5,
        },
        {
          id: 'pattern-success',
          userId: 'user-123',
          type: 'success_pattern',
          name: 'Achievement Oriented',
          description: 'Regular success signals (8 achievements)',
          frequency: 8,
          duration: 0,
          confidence: 0.9,
          contexts: [],
          occurrences: 8,
        },
        {
          id: 'pattern-help',
          userId: 'user-123',
          type: 'help_seeking',
          name: 'Hint Seeker',
          description: 'Frequently requests hints',
          frequency: 10,
          duration: 0,
          confidence: 0.7,
          contexts: [{ chapterId: 'chapter-1' }],
          occurrences: 10,
        },
      ];

      mockDetectPatterns.mockResolvedValue(diversePatterns);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.patterns).toHaveLength(3);
      expect(data.data.detected).toBe(3);

      // Verify pattern types
      const patternTypes = data.data.patterns.map((p: { type: string }) => p.type);
      expect(patternTypes).toContain('struggle_pattern');
      expect(patternTypes).toContain('success_pattern');
      expect(patternTypes).toContain('help_seeking');
    });
  });
});
