/**
 * Timezone Utilities for Practice Tracking
 *
 * Provides timezone-aware date operations for accurate daily logs,
 * streaks, and heatmaps based on user's local timezone.
 */

/**
 * Get the current date string (YYYY-MM-DD) in a specific timezone
 */
export function getDateInTimezone(date: Date, timezone: string): string {
  try {
    // Use en-CA locale which gives YYYY-MM-DD format
    return date.toLocaleDateString('en-CA', { timeZone: timezone });
  } catch {
    // Fallback to UTC if timezone is invalid
    return date.toISOString().split('T')[0];
  }
}

/**
 * Get the start of day (midnight) for a date in a specific timezone,
 * returned as a UTC Date object.
 *
 * @param date - The date to get start of day for
 * @param timezone - IANA timezone string (e.g., 'America/New_York', 'Asia/Tokyo')
 * @returns Date object representing midnight in the user's timezone
 */
export function getStartOfDayInTimezone(date: Date, timezone: string): Date {
  try {
    // Get the date string in user's timezone
    const dateStr = getDateInTimezone(date, timezone);

    // Create a date at midnight in the user's timezone
    // We use the timezone offset to convert back to UTC
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Parse the date string to get components
    const [year, month, day] = dateStr.split('-').map(Number);

    // Create a date object for midnight in the specified timezone
    // This is a bit tricky - we need to find the UTC time that corresponds
    // to midnight in the user's timezone
    const tempDate = new Date(`${dateStr}T00:00:00`);

    // Get the offset for this specific date/time in the timezone
    const parts = formatter.formatToParts(tempDate);
    const tzHour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0');
    const tzMinute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0');

    // Calculate offset from the formatted time vs midnight
    const offsetMinutes = tzHour * 60 + tzMinute;

    // Create the UTC date that represents midnight in user's timezone
    const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // Adjust for timezone offset
    // If formatted shows 05:00, that means UTC midnight is 5 hours behind user's midnight
    // So user's midnight is UTC - 5 hours (or UTC + offset)
    utcDate.setUTCMinutes(utcDate.getUTCMinutes() - offsetMinutes);

    return utcDate;
  } catch {
    // Fallback: return UTC midnight
    const dateStr = date.toISOString().split('T')[0];
    return new Date(`${dateStr}T00:00:00.000Z`);
  }
}

/**
 * Get the start of the current week (Sunday) in a specific timezone
 */
export function getWeekStartInTimezone(date: Date, timezone: string): Date {
  const dateStr = getDateInTimezone(date, timezone);
  const [year, month, day] = dateStr.split('-').map(Number);

  // Create date in user's timezone context
  const localDate = new Date(year, month - 1, day);
  const dayOfWeek = localDate.getDay(); // 0 = Sunday

  // Go back to Sunday
  localDate.setDate(localDate.getDate() - dayOfWeek);

  // Convert back to start of day in timezone
  return getStartOfDayInTimezone(localDate, timezone);
}

/**
 * Get the start of the current month in a specific timezone
 */
export function getMonthStartInTimezone(date: Date, timezone: string): Date {
  const dateStr = getDateInTimezone(date, timezone);
  const [year, month] = dateStr.split('-').map(Number);

  // First day of month
  const firstOfMonth = new Date(year, month - 1, 1);

  return getStartOfDayInTimezone(firstOfMonth, timezone);
}

/**
 * Calculate the number of days between two dates in a specific timezone
 */
export function getDaysDifference(
  date1: Date,
  date2: Date,
  timezone: string
): number {
  const dateStr1 = getDateInTimezone(date1, timezone);
  const dateStr2 = getDateInTimezone(date2, timezone);

  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);

  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if two dates are the same day in a specific timezone
 */
export function isSameDay(date1: Date, date2: Date, timezone: string): boolean {
  return getDateInTimezone(date1, timezone) === getDateInTimezone(date2, timezone);
}

/**
 * Check if two dates are consecutive days in a specific timezone
 */
export function isConsecutiveDay(
  earlierDate: Date,
  laterDate: Date,
  timezone: string
): boolean {
  return getDaysDifference(earlierDate, laterDate, timezone) === 1;
}

/**
 * Check if a date is today in a specific timezone
 */
export function isToday(date: Date, timezone: string): boolean {
  return isSameDay(date, new Date(), timezone);
}

/**
 * Check if a date is yesterday in a specific timezone
 */
export function isYesterday(date: Date, timezone: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday, timezone);
}

/**
 * Get a Date object for today at midnight in a specific timezone
 */
export function getTodayInTimezone(timezone: string): Date {
  return getStartOfDayInTimezone(new Date(), timezone);
}

/**
 * Validate if a timezone string is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the user's browser timezone (for client-side use)
 * Falls back to UTC if unable to detect
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Common timezone presets for quick selection
 */
export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
] as const;

export type CommonTimezone = (typeof COMMON_TIMEZONES)[number]['value'];
