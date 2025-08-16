import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextRequest, NextResponse } from 'next/server';
import { Session } from 'next-auth';
import { ReactElement } from 'react';
import { TestDataFactory } from './test-factory';

/**
 * Common test utilities and helper functions
 * Simplifies test setup and common testing patterns
 */

export interface MockSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: 'ADMIN' | 'USER';
  };
  expires: string;
}

/**
 * Authentication test helpers
 */
export const AuthTestHelpers = {
  /**
   * Create mock session for authenticated user
   */
  createMockSession(options: {
    userId?: string;
    role?: 'ADMIN' | 'USER';
    email?: string;
    name?: string;
  } = {}): MockSession {
    return {
      user: {
        id: options.userId || TestDataFactory.generateId('user'),
        name: options.name || 'Test User',
        email: options.email || 'test@example.com',
        role: options.role || 'USER',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  },

  /**
   * Mock useSession hook for tests
   */
  mockUseSession(session: MockSession | null = null, status: 'loading' | 'authenticated' | 'unauthenticated' = 'authenticated') {
    const useSession = jest.requireMock('next-auth/react').useSession;
    useSession.mockReturnValue({
      data: session,
      status,
      update: jest.fn(),
    });
  },

  /**
   * Create authenticated test context
   */
  createAuthContext(role: 'ADMIN' | 'USER' = 'USER') {
    const session = this.createMockSession({ role });
    this.mockUseSession(session);
    return session;
  },
};

/**
 * API testing helpers
 */
export const ApiTestHelpers = {
  /**
   * Create mock Next.js request
   */
  createMockRequest(options: {
    method?: string;
    url?: string;
    body?: any;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}): NextRequest {
    const {
      method = 'GET',
      url = 'http://localhost:3000/api/test',
      body,
      headers = {},
      searchParams = {},
    } = options;

    const request = new NextRequest(url, {
      method,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Add search params
    Object.entries(searchParams).forEach(([key, value]) => {
      request.nextUrl.searchParams.set(key, value);
    });

    return request;
  },

  /**
   * Create mock API response
   */
  createMockResponse(data: any, status = 200): NextResponse {
    return NextResponse.json(data, { status });
  },

  /**
   * Test API endpoint with different HTTP methods
   */
  async testEndpoint(
    handler: (req: NextRequest) => Promise<NextResponse>,
    testCases: Array<{
      method: string;
      body?: any;
      expectedStatus: number;
      expectedData?: any;
      session?: MockSession | null;
    }>
  ) {
    const results = [];

    for (const testCase of testCases) {
      const { method, body, expectedStatus, expectedData, session } = testCase;
      
      // Mock session if provided
      if (session !== undefined) {
        AuthTestHelpers.mockUseSession(session);
      }

      const request = this.createMockRequest({ method, body });
      const response = await handler(request);
      const responseData = await response.json();

      results.push({
        method,
        status: response.status,
        data: responseData,
        passed: response.status === expectedStatus && 
                (expectedData ? JSON.stringify(responseData).includes(JSON.stringify(expectedData)) : true),
      });
    }

    return results;
  },
};

/**
 * Database testing helpers
 */
export const DatabaseTestHelpers = {
  /**
   * Mock database operations with realistic delays
   */
  mockDatabaseOperation: <T>(result: T, delay = 50): Promise<T> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(result), delay);
    });
  },

  /**
   * Simulate database errors
   */
  mockDatabaseError: (message = 'Database error', code = 'P2002'): Promise<never> => {
    return Promise.reject({
      message,
      code,
      meta: { target: ['email'] },
    });
  },

  /**
   * Create mock Prisma client with common operations
   */
  createMockPrismaClient: () => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    chapter: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    section: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    purchase: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({} as any)),
    $disconnect: jest.fn(),
    $connect: jest.fn(),
  }),
};

/**
 * Component testing helpers
 */
export const ComponentTestHelpers = {
  /**
   * Render component with providers
   */
  renderWithProviders: (
    ui: ReactElement,
    options: {
      session?: MockSession | null;
      route?: string;
    } = {}
  ) => {
    const { session } = options;
    
    if (session !== undefined) {
      AuthTestHelpers.mockUseSession(session);
    }

    return render(ui);
  },

  /**
   * Wait for loading states to complete
   */
  waitForLoading: async (timeout = 3000) => {
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout }
    );
  },

  /**
   * Fill and submit form with validation
   */
  fillAndSubmitForm: async (
    formData: Record<string, string>,
    submitButtonText = 'Submit'
  ) => {
    const user = userEvent.setup();

    // Fill form fields
    for (const [fieldName, value] of Object.entries(formData)) {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
      await user.clear(field);
      await user.type(field, value);
    }

    // Submit form
    const submitButton = screen.getByRole('button', { name: new RegExp(submitButtonText, 'i') });
    await user.click(submitButton);
  },

  /**
   * Test form validation errors
   */
  testFormValidation: async (
    invalidData: Record<string, string>,
    expectedErrors: string[]
  ) => {
    await ComponentTestHelpers.fillAndSubmitForm(invalidData);
    
    for (const errorText of expectedErrors) {
      await waitFor(() => {
        expect(screen.getByText(new RegExp(errorText, 'i'))).toBeInTheDocument();
      });
    }
  },
};

/**
 * Performance testing helpers
 */
export const PerformanceTestHelpers = {
  /**
   * Measure function execution time
   */
  measureExecutionTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, timeMs: end - start };
  },

  /**
   * Test memory usage
   */
  measureMemoryUsage: (testName: string) => {
    const memBefore = process.memoryUsage();
    
    return {
      finish: () => {
        const memAfter = process.memoryUsage();
        const diff = {
          rss: memAfter.rss - memBefore.rss,
          heapTotal: memAfter.heapTotal - memBefore.heapTotal,
          heapUsed: memAfter.heapUsed - memBefore.heapUsed,
          external: memAfter.external - memBefore.external,
        };
        
        console.log(`${testName} memory usage:`, {
          'RSS': `${(diff.rss / 1024 / 1024).toFixed(2)} MB`,
          'Heap Total': `${(diff.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          'Heap Used': `${(diff.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          'External': `${(diff.external / 1024 / 1024).toFixed(2)} MB`,
        });
        
        return diff;
      },
    };
  },

  /**
   * Create performance benchmarks
   */
  benchmark: async (
    tests: Array<{ name: string; fn: () => Promise<any> }>,
    iterations = 10
  ) => {
    const results: Array<{ name: string; avgTime: number; minTime: number; maxTime: number }> = [];

    for (const test of tests) {
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const { timeMs } = await PerformanceTestHelpers.measureExecutionTime(test.fn);
        times.push(timeMs);
      }
      
      results.push({
        name: test.name,
        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
      });
    }

    return results;
  },
};

/**
 * Error testing helpers
 */
export const ErrorTestHelpers = {
  /**
   * Test error boundaries
   */
  testErrorBoundary: (ThrowError: () => ReactElement) => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(ThrowError());
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  },

  /**
   * Mock console methods for error testing
   */
  mockConsole: () => {
    const originalConsole = { ...console };
    
    const mockConsole = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };

    Object.assign(console, mockConsole);

    return {
      mockConsole,
      restore: () => Object.assign(console, originalConsole),
    };
  },

  /**
   * Test async error handling
   */
  testAsyncError: async (asyncFn: () => Promise<any>, expectedError: string | RegExp) => {
    await expect(asyncFn()).rejects.toThrow(expectedError);
  },
};

/**
 * Accessibility testing helpers
 */
export const AccessibilityTestHelpers = {
  /**
   * Test keyboard navigation
   */
  testKeyboardNavigation: async (elements: HTMLElement[]) => {
    const user = userEvent.setup();
    
    for (let i = 0; i < elements.length; i++) {
      await user.tab();
      expect(elements[i]).toHaveFocus();
    }
  },

  /**
   * Test ARIA attributes
   */
  testAriaAttributes: (element: HTMLElement, expectedAttributes: Record<string, string>) => {
    Object.entries(expectedAttributes).forEach(([attr, value]) => {
      expect(element).toHaveAttribute(attr, value);
    });
  },

  /**
   * Test screen reader content
   */
  testScreenReaderContent: (text: string) => {
    expect(screen.getByRole('region', { name: text })).toBeInTheDocument();
  },
};

/**
 * Wait utilities
 */
export const WaitUtils = {
  /**
   * Wait for element to appear
   */
  waitForElement: async (selector: string, timeout = 5000) => {
    return waitFor(() => document.querySelector(selector), { timeout });
  },

  /**
   * Wait for condition to be true
   */
  waitForCondition: async (condition: () => boolean, timeout = 5000) => {
    return waitFor(() => expect(condition()).toBe(true), { timeout });
  },

  /**
   * Wait for network requests to complete
   */
  waitForNetwork: async (timeout = 3000) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  },
};

/**
 * Test environment helpers
 */
export const TestEnvironmentHelpers = {
  /**
   * Setup test environment variables
   */
  setupTestEnv: () => {
    (process.env as any).NODE_ENV = 'test';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  },

  /**
   * Clean up test environment
   */
  cleanupTestEnv: () => {
    delete process.env.NODE_ENV;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_URL;
    delete process.env.DATABASE_URL;
  },

  /**
   * Mock external services
   */
  mockExternalServices: () => {
    // Mock Anthropic API
    jest.mock('@anthropic-ai/sdk');
    
    // Mock Cloudinary
    jest.mock('cloudinary', () => ({
      v2: {
        uploader: {
          upload: jest.fn().mockResolvedValue({
            secure_url: 'https://example.com/image.jpg',
            public_id: 'test-image',
          }),
        },
      },
    }));

    // Mock Stripe
    jest.mock('stripe', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({
        checkout: {
          sessions: {
            create: jest.fn(),
          },
        },
      })),
    }));
  },
};

const testHelpers = {
  AuthTestHelpers,
  ApiTestHelpers,
  DatabaseTestHelpers,
  ComponentTestHelpers,
  PerformanceTestHelpers,
  ErrorTestHelpers,
  AccessibilityTestHelpers,
  WaitUtils,
  TestEnvironmentHelpers,
};

export default testHelpers;