import {
  COMMON_TIMEZONES,
  getBrowserTimezone,
  getDateInTimezone,
  getDaysDifference,
  getMonthStartInTimezone,
  getStartOfDayInTimezone,
  getTodayInTimezone,
  getWeekStartInTimezone,
  isConsecutiveDay,
  isSameDay,
  isToday,
  isValidTimezone,
  isYesterday,
} from '@/lib/utils/timezone';

describe('lib/utils/timezone', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('gets date string in timezone and falls back for invalid timezone', () => {
    const date = new Date('2024-06-15T12:34:56.000Z');

    expect(getDateInTimezone(date, 'UTC')).toBe('2024-06-15');
    expect(getDateInTimezone(date, 'Invalid/Timezone')).toBe('2024-06-15');
  });

  it('gets start of day in timezone and falls back for invalid timezone', () => {
    const date = new Date('2024-06-15T12:34:56.000Z');
    const utcStart = getStartOfDayInTimezone(date, 'UTC');
    const fallbackStart = getStartOfDayInTimezone(date, 'Invalid/Timezone');

    expect(utcStart).toBeInstanceOf(Date);
    expect(Number.isNaN(utcStart.getTime())).toBe(false);
    expect(fallbackStart.toISOString()).toBe('2024-06-15T00:00:00.000Z');
  });

  it('gets week and month starts in timezone', () => {
    const date = new Date('2024-06-19T12:00:00.000Z'); // Wednesday

    const weekStart = getWeekStartInTimezone(date, 'UTC');
    const monthStart = getMonthStartInTimezone(date, 'UTC');

    expect(['2024-06-15', '2024-06-16']).toContain(getDateInTimezone(weekStart, 'UTC'));
    expect(['2024-05-31', '2024-06-01']).toContain(getDateInTimezone(monthStart, 'UTC'));
  });

  it('computes day differences and day relationship checks', () => {
    const d1 = new Date('2024-06-10T10:00:00.000Z');
    const d2 = new Date('2024-06-13T10:00:00.000Z');

    expect(getDaysDifference(d1, d2, 'UTC')).toBe(3);
    expect(isSameDay(d1, new Date('2024-06-10T23:59:00.000Z'), 'UTC')).toBe(true);
    expect(isConsecutiveDay(new Date('2024-06-10T10:00:00.000Z'), new Date('2024-06-11T01:00:00.000Z'), 'UTC')).toBe(true);
  });

  it('checks today/yesterday and returns today start in timezone', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-06-20T12:00:00.000Z'));

    expect(isToday(new Date('2024-06-20T00:01:00.000Z'), 'UTC')).toBe(true);
    expect(isYesterday(new Date('2024-06-19T23:59:00.000Z'), 'UTC')).toBe(true);
    expect(getTodayInTimezone('UTC')).toBeInstanceOf(Date);
  });

  it('validates timezone strings and browser timezone fallback', () => {
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Invalid/Timezone')).toBe(false);
    expect(getBrowserTimezone()).toBeTruthy();

    const dateTimeFormatSpy = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('no timezone');
    });

    expect(getBrowserTimezone()).toBe('UTC');
    dateTimeFormatSpy.mockRestore();
  });

  it('exports common timezone presets', () => {
    expect(Array.isArray(COMMON_TIMEZONES)).toBe(true);
    expect(COMMON_TIMEZONES.some((tz) => tz.value === 'UTC')).toBe(true);
  });
});
