/**
 * Tests for useSAMFormDataSync hook
 * @sam-ai/react
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock React hooks
// ---------------------------------------------------------------------------

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useCallback: vi.fn((fn) => fn),
    useEffect: vi.fn((fn) => { fn(); }),
    useRef: vi.fn((val) => ({ current: val })),
    useMemo: vi.fn((fn) => fn()),
  };
});

// ---------------------------------------------------------------------------
// Mock SAMContext
// ---------------------------------------------------------------------------

const mockUpdateContext = vi.fn();
const mockContext = {
  page: null,
  form: null,
  course: null,
  chapter: null,
  user: null,
  state: 'idle',
};

vi.mock('../../context/SAMContext', () => ({
  useSAMContext: vi.fn(() => ({
    context: mockContext,
    updateContext: mockUpdateContext,
  })),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { useSAMFormDataSync } from '../../hooks/useSAMFormDataSync';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSAMFormDataSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.form = null;
  });

  it('should return a sync function', () => {
    const result = useSAMFormDataSync('test-form', { name: 'John' });

    expect(typeof result.sync).toBe('function');
  });

  it('should sync form data into SAM context on call', () => {
    const formData = { firstName: 'Jane', lastName: 'Doe' };

    const result = useSAMFormDataSync('profile-form', formData, {
      formName: 'Profile Form',
      enabled: true,
    });

    result.sync();

    expect(mockUpdateContext).toHaveBeenCalled();
    const updateArg = mockUpdateContext.mock.calls[0][0];
    expect(updateArg.form).toBeDefined();
    expect(updateArg.form.formId).toBe('profile-form');
    expect(updateArg.form.formName).toBe('Profile Form');
  });

  it('should handle debounceMs option without errors', () => {
    const result = useSAMFormDataSync(
      'debounced-form',
      { email: 'test@test.com' },
      { debounceMs: 300, enabled: true },
    );

    expect(typeof result.sync).toBe('function');
  });

  it('should extract fields for nested objects', () => {
    const formData = {
      user: {
        name: 'Alice',
        address: { city: 'NYC', zip: '10001' },
      },
    };

    const result = useSAMFormDataSync('nested-form', formData, {
      enabled: true,
    });

    result.sync();

    expect(mockUpdateContext).toHaveBeenCalled();
    const form = mockUpdateContext.mock.calls[0][0].form;
    expect(form.fields).toBeDefined();
    const fieldNames = Object.keys(form.fields);
    expect(fieldNames.length).toBeGreaterThan(0);
  });

  it('should handle null form data without crashing', () => {
    const result = useSAMFormDataSync('empty-form', null as never, {
      enabled: true,
    });

    expect(() => result.sync()).not.toThrow();
  });

  it('should support calling sync multiple times', () => {
    const formData = { field1: 'value1' };

    const result = useSAMFormDataSync('manual-form', formData, {
      enabled: true,
    });

    // useEffect may have already called sync once; clear and call explicitly
    mockUpdateContext.mockClear();

    result.sync();
    result.sync();

    expect(mockUpdateContext).toHaveBeenCalledTimes(2);
  });

  it('should not sync when enabled is explicitly false', () => {
    const result = useSAMFormDataSync(
      'disabled-form',
      { name: 'test' },
      { enabled: false },
    );

    result.sync();

    expect(mockUpdateContext).not.toHaveBeenCalled();
  });

  it('should use formId as formName when formName is not provided', () => {
    const result = useSAMFormDataSync('my-form-id', { x: 1 }, { enabled: true });

    result.sync();

    expect(mockUpdateContext).toHaveBeenCalled();
    const form = mockUpdateContext.mock.calls[0][0].form;
    expect(form.formName).toBe('my-form-id');
  });
});
