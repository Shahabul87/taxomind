// Minimal Jest Setup - Only Essential Global Mocks
import '@testing-library/jest-dom'

// ===========================
// MINIMAL BROWSER API MOCKS
// ===========================

// Performance mock (minimal)
global.performance = {
  now: () => Date.now(),
};

// Crypto mock (minimal)
global.crypto = {
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
};

// Window matchMedia (minimal) - only if window exists
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// ResizeObserver (minimal)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// IntersectionObserver (minimal)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Fetch mock (minimal)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// ===========================
// ESSENTIAL ENV VARIABLES
// ===========================

process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// ===========================
// CLEANUP
// ===========================

afterEach(() => {
  jest.clearAllMocks();
});