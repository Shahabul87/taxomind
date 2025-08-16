/**
 * Utility functions for handling URL search parameters
 * Converts null values from searchParams.get() to undefined for TypeScript compatibility
 */

/**
 * Get a string value from URLSearchParams, converting null to undefined
 */
export function getSearchParam(searchParams: URLSearchParams, key: string): string | undefined {
  return searchParams.get(key) ?? undefined;
}

/**
 * Get a number value from URLSearchParams
 */
export function getNumberParam(searchParams: URLSearchParams, key: string): number | undefined {
  const value = searchParams.get(key);
  if (!value) return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
}

/**
 * Get a boolean value from URLSearchParams
 */
export function getBooleanParam(searchParams: URLSearchParams, key: string): boolean | undefined {
  const value = searchParams.get(key);
  if (!value) return undefined;
  return value === 'true';
}

/**
 * Get an array value from URLSearchParams (comma-separated)
 */
export function getArrayParam(searchParams: URLSearchParams, key: string): string[] | undefined {
  const value = searchParams.get(key);
  if (!value) return undefined;
  return value.split(',').filter(Boolean);
}

/**
 * Get a date value from URLSearchParams
 */
export function getDateParam(searchParams: URLSearchParams, key: string): Date | undefined {
  const value = searchParams.get(key);
  if (!value) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Convert all null values to undefined in an object
 */
export function nullToUndefined<T extends Record<string, any>>(obj: T): T {
  const result = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    result[key as keyof T] = value === null ? undefined : value;
  }
  return result;
}