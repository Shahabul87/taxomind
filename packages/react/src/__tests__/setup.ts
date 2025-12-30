/**
 * Vitest Setup
 * Global test setup for @sam-ai/react
 */

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock window.location
const originalLocation = window.location;

Object.defineProperty(window, 'location', {
  configurable: true,
  value: {
    ...originalLocation,
    pathname: '/',
    search: '',
    hash: '',
    href: 'http://localhost/',
  },
});

// Mock fetch
global.fetch = async () => {
  return {
    ok: true,
    json: async () => ({
      success: true,
      data: { message: 'Mock response' },
    }),
    text: async () => 'Mock response',
    body: null,
  } as Response;
};
