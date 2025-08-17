/**
 * Common Types
 * Shared type definitions used across the application
 */

/**
 * Nullable Type
 */
export type Nullable<T> = T | null;

/**
 * Optional Type
 */
export type Optional<T> = T | undefined;

/**
 * Maybe Type
 */
export type Maybe<T> = T | null | undefined;

/**
 * DeepPartial Type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * DeepReadonly Type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Omit Type (for older TypeScript versions)
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * RequireAtLeastOne Type
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * RequireOnlyOne Type
 */
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

/**
 * ValueOf Type
 */
export type ValueOf<T> = T[keyof T];

/**
 * Entries Type
 */
export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

/**
 * Status Type
 */
export type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * Sort Order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Date Range
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Time Range
 */
export interface TimeRange {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

/**
 * Coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Dimensions
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * File Info
 */
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  url?: string;
}

/**
 * Key-Value Pair
 */
export interface KeyValuePair<K = string, V = unknown> {
  key: K;
  value: V;
}

/**
 * Select Option
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
}

/**
 * Tree Node
 */
export interface TreeNode<T = unknown> {
  id: string;
  label: string;
  data?: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

/**
 * Breadcrumb Item
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

/**
 * Menu Item
 */
export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  children?: MenuItem[];
  disabled?: boolean;
  divider?: boolean;
  badge?: string | number;
}

/**
 * Filter Item
 */
export interface FilterItem {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  value: unknown;
}

/**
 * Sort Item
 */
export interface SortItem {
  field: string;
  order: SortOrder;
}

/**
 * Page Info
 */
export interface PageInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * HTTP Methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Environment
 */
export type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * Log Level
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Language Code
 */
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko';

/**
 * Currency Code
 */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'INR' | 'CAD' | 'AUD';

/**
 * Country Code
 */
export type CountryCode = 'US' | 'GB' | 'CA' | 'AU' | 'DE' | 'FR' | 'ES' | 'IT' | 'JP' | 'CN' | 'IN';

/**
 * Time Zone
 */
export type TimeZone = string; // IANA time zone identifier

/**
 * MIME Type
 */
export type MimeType = 
  | 'application/json'
  | 'application/xml'
  | 'application/pdf'
  | 'text/plain'
  | 'text/html'
  | 'text/csv'
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/svg+xml'
  | 'video/mp4'
  | 'audio/mpeg'
  | string;

/**
 * Color
 */
export interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
}

/**
 * Address
 */
export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: CountryCode;
}

/**
 * Contact Information
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  address?: Address;
}

/**
 * Social Media Links
 */
export interface SocialMediaLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
}

/**
 * Metadata
 */
export interface Metadata {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Error with Code
 */
export interface ErrorWithCode extends Error {
  code: string;
  statusCode?: number;
  details?: unknown;
}