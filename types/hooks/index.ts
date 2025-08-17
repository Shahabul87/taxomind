/**
 * Hook Types
 * Type definitions for custom React hooks
 */

import { Dispatch, SetStateAction } from 'react';
import { CourseWithRelations, UserProgress } from '../models';
import { APIResponse } from '../api';

/**
 * Generic Hook State
 */
export interface HookState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Async Hook State
 */
export interface AsyncHookState<T> extends HookState<T> {
  refetch: () => Promise<void>;
  mutate: (data: T) => void;
}

/**
 * Pagination Hook State
 */
export interface PaginationHookState<T> extends HookState<T[]> {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
}

/**
 * Form Hook State
 */
export interface FormHookState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (name: keyof T, value: unknown) => void;
  handleBlur: (name: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  setFieldValue: (name: keyof T, value: unknown) => void;
  setFieldError: (name: keyof T, error: string) => void;
  validateField: (name: keyof T) => void;
  validateForm: () => boolean;
}

/**
 * Modal Hook State
 */
export interface ModalHookState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Auth Hook State
 */
export interface AuthHookState {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    image?: string | null;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  updateProfile: (data: Partial<{ name: string; image: string }>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

/**
 * Course Creator Hook State
 */
export interface CourseCreatorHookState {
  formData: {
    courseTitle: string;
    courseOverview: string;
    courseCategory: string;
    targetAudience: string;
    prerequisites: string;
    learningOutcomes: string;
    courseDuration: string;
    difficultyLevel: string;
    language: string;
  };
  generatedPlan: {
    title: string;
    description: string;
    chapters: Array<{
      title: string;
      description: string;
      sections: Array<{
        title: string;
        content: string;
      }>;
    }>;
  } | null;
  isGenerating: boolean;
  isSaving: boolean;
  error: string | null;
  updateFormData: (field: string, value: string) => void;
  generateCoursePlan: () => Promise<void>;
  saveCourse: () => Promise<void>;
  reset: () => void;
}

/**
 * Progress Tracking Hook State
 */
export interface ProgressTrackingHookState {
  progress: UserProgress[];
  overallProgress: number;
  currentChapter: string | null;
  currentSection: string | null;
  isTracking: boolean;
  markAsCompleted: (sectionId: string) => Promise<void>;
  updateProgress: (sectionId: string, progress: number) => Promise<void>;
  getChapterProgress: (chapterId: string) => number;
  getCourseProgress: (courseId: string) => number;
}

/**
 * Search Hook State
 */
export interface SearchHookState<T> {
  query: string;
  results: T[];
  isSearching: boolean;
  error: string | null;
  setQuery: (query: string) => void;
  search: (query?: string) => Promise<void>;
  clearResults: () => void;
  filters: Record<string, unknown>;
  setFilter: (key: string, value: unknown) => void;
  clearFilters: () => void;
}

/**
 * Toast Hook State
 */
export interface ToastHookState {
  toasts: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    title?: string;
  }>;
  showToast: (type: 'info' | 'success' | 'warning' | 'error', message: string, title?: string) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

/**
 * Websocket Hook State
 */
export interface WebsocketHookState {
  isConnected: boolean;
  lastMessage: unknown | null;
  sendMessage: (message: unknown) => void;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * Permissions Hook State
 */
export interface PermissionsHookState {
  permissions: string[];
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccess: (resource: string, action: string) => boolean;
}

/**
 * Theme Hook State
 */
export interface ThemeHookState {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

/**
 * Local Storage Hook State
 */
export interface LocalStorageHookState<T> {
  value: T | null;
  setValue: (value: T) => void;
  removeValue: () => void;
  error: Error | null;
}

/**
 * Debounce Hook State
 */
export interface DebounceHookState<T> {
  value: T;
  debouncedValue: T;
  isPending: boolean;
}

/**
 * Intersection Observer Hook State
 */
export interface IntersectionObserverHookState {
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Media Query Hook State
 */
export interface MediaQueryHookState {
  matches: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Clipboard Hook State
 */
export interface ClipboardHookState {
  copied: boolean;
  copy: (text: string) => Promise<void>;
  error: Error | null;
}

/**
 * Event Listener Hook Options
 */
export interface EventListenerOptions {
  element?: HTMLElement | Window | Document | null;
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
}

/**
 * Fetch Hook Options
 */
export interface FetchHookOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
}