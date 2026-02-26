import {
  OperationTimeoutError,
  TIMEOUT_DEFAULTS,
  withRetryableTimeout,
  withTimeout,
} from '@/lib/sam/utils/timeout';

describe('lib/sam/utils/timeout', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns result when operation finishes before timeout', async () => {
    const result = await withTimeout(async () => 'ok', 100, 'quick-op');
    expect(result).toBe('ok');
  });

  it('throws OperationTimeoutError when operation exceeds timeout', async () => {
    jest.useFakeTimers();
    const neverResolves = () => new Promise<string>(() => undefined);

    const promise = withTimeout(neverResolves, 10, 'slow-op');
    jest.advanceTimersByTime(11);

    await expect(promise).rejects.toMatchObject({
      name: 'OperationTimeoutError',
      operationName: 'slow-op',
      timeoutMs: 10,
    });
  });

  it('retries transient errors and succeeds', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce('recovered');

    await expect(withRetryableTimeout(fn, 1000, 'retry-op', 1)).resolves.toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not retry timeout errors', async () => {
    jest.useFakeTimers();
    const fn = jest.fn(() => new Promise<string>(() => undefined));

    const promise = withRetryableTimeout(fn, 10, 'timeout-op', 2);
    jest.advanceTimersByTime(11);

    await expect(promise).rejects.toBeInstanceOf(OperationTimeoutError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry non-transient errors', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('validation failed'));

    await expect(withRetryableTimeout(fn, 100, 'non-retry-op', 2)).rejects.toThrow('validation failed');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('exports sensible timeout defaults', () => {
    expect(TIMEOUT_DEFAULTS.AI_ANALYSIS).toBeGreaterThan(0);
    expect(TIMEOUT_DEFAULTS.AI_GENERATION_REASONING).toBeGreaterThan(TIMEOUT_DEFAULTS.AI_ANALYSIS);
    expect(TIMEOUT_DEFAULTS.DB_QUERY).toBeGreaterThan(0);
    expect(TIMEOUT_DEFAULTS.STREAM_TOTAL).toBeGreaterThan(TIMEOUT_DEFAULTS.STREAM_FIRST_TOKEN);
  });
});
