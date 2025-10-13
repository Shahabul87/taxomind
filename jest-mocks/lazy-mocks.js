/**
 * Lazy-loaded mocks - Only load when actually needed by tests
 * Import this in individual test files that need specific mocks
 */

// Lazy mock loader function
export const loadMocks = (mockTypes = []) => {
  if (mockTypes.includes('navigation')) {
    jest.mock('next/navigation', () => ({
      useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        refresh: jest.fn(),
      })),
      useSearchParams: jest.fn(() => new URLSearchParams()),
      usePathname: jest.fn(() => '/'),
    }));
  }

  if (mockTypes.includes('auth')) {
    jest.mock('next-auth', () => ({
      default: jest.fn(() => ({
        auth: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
      })),
    }));
  }

  if (mockTypes.includes('prisma')) {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(() => Promise.resolve([])),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      course: {
        findUnique: jest.fn(),
        findMany: jest.fn(() => Promise.resolve([])),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((fn) => Promise.resolve(fn(mockPrisma))),
      $connect: jest.fn(() => Promise.resolve()),
      $disconnect: jest.fn(() => Promise.resolve()),
    };
    
    jest.mock('@/lib/db', () => ({
      db: mockPrisma,
    }));
  }

  if (mockTypes.includes('redis')) {
    jest.mock('ioredis', () => {
      return jest.fn().mockImplementation(() => ({
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        ping: jest.fn(() => Promise.resolve('PONG')),
      }));
    });
  }
};