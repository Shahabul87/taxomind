/**
 * Course Catalog Store - Zustand State Management
 *
 * This store manages the complete state for the enterprise course catalog,
 * including filters, search, view preferences, and user interactions.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  FilterState,
  ViewMode,
  SortBy,
  CourseLevel,
  DurationRange,
  UpdateRecency,
  PriceRange,
  FeatureFilters,
} from '@/types/enterprise-course-catalog';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialFilterState: FilterState = {
  searchQuery: '',
  searchHistory: [],
  selectedCategories: [],
  priceRange: { min: 0, max: 1000 },
  freeOnly: false,
  skillLevels: [],
  durationRanges: [],
  minRating: 0,
  languages: [],
  features: {
    certificate: false,
    quizzes: false,
    codingExercises: false,
    downloadableResources: false,
    closedCaptions: false,
    mobileAccess: false,
  },
  instructorRating: null,
  recentlyUpdated: null,
  sortBy: 'relevance',
  viewMode: 'grid',
  page: 1,
  pageSize: 20,
};

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface CourseCatalogStore extends FilterState {
  // Search Actions
  setSearchQuery: (query: string) => void;
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;

  // Category Actions
  toggleCategory: (categoryId: string) => void;
  setCategories: (categoryIds: string[]) => void;
  clearCategories: () => void;

  // Price Actions
  setPriceRange: (min: number, max: number) => void;
  setFreeOnly: (freeOnly: boolean) => void;

  // Skill Level Actions
  toggleSkillLevel: (level: CourseLevel) => void;
  setSkillLevels: (levels: CourseLevel[]) => void;
  clearSkillLevels: () => void;

  // Duration Actions
  toggleDurationRange: (range: DurationRange) => void;
  setDurationRanges: (ranges: DurationRange[]) => void;
  clearDurationRanges: () => void;

  // Rating Actions
  setMinRating: (rating: 0 | 3 | 4 | 4.5) => void;

  // Language Actions
  toggleLanguage: (language: string) => void;
  setLanguages: (languages: string[]) => void;
  clearLanguages: () => void;

  // Feature Actions
  toggleFeature: (feature: keyof FeatureFilters) => void;
  setFeatures: (features: Partial<FeatureFilters>) => void;
  clearFeatures: () => void;

  // Instructor Actions
  setInstructorRating: (rating: number | null) => void;

  // Recency Actions
  setRecentlyUpdated: (recency: UpdateRecency | null) => void;

  // Sort Actions
  setSortBy: (sortBy: SortBy) => void;

  // View Actions
  setViewMode: (viewMode: ViewMode) => void;

  // Pagination Actions
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPagination: () => void;

  // Bulk Actions
  resetFilters: () => void;
  resetAllExceptView: () => void;
  applyPreset: (preset: Partial<FilterState>) => void;

  // Utility Actions
  getActiveFiltersCount: () => number;
  hasActiveFilters: () => boolean;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useCourseCatalogStore = create<CourseCatalogStore>()(
  persist(
    (set, get) => ({
      // Initial State
      ...initialFilterState,

      // ========================================================================
      // SEARCH ACTIONS
      // ========================================================================

      setSearchQuery: (query: string) => {
        set({ searchQuery: query, page: 1 });
      },

      addToSearchHistory: (query: string) => {
        const history = get().searchHistory;
        const trimmedQuery = query.trim().toLowerCase();

        if (trimmedQuery && !history.includes(trimmedQuery)) {
          set({
            searchHistory: [trimmedQuery, ...history].slice(0, 10), // Keep last 10
          });
        }
      },

      clearSearchHistory: () => {
        set({ searchHistory: [] });
      },

      // ========================================================================
      // CATEGORY ACTIONS
      // ========================================================================

      toggleCategory: (categoryId: string) => {
        const categories = get().selectedCategories;
        const newCategories = categories.includes(categoryId)
          ? categories.filter((id) => id !== categoryId)
          : [...categories, categoryId];

        set({ selectedCategories: newCategories, page: 1 });
      },

      setCategories: (categoryIds: string[]) => {
        set({ selectedCategories: categoryIds, page: 1 });
      },

      clearCategories: () => {
        set({ selectedCategories: [], page: 1 });
      },

      // ========================================================================
      // PRICE ACTIONS
      // ========================================================================

      setPriceRange: (min: number, max: number) => {
        set({ priceRange: { min, max }, page: 1 });
      },

      setFreeOnly: (freeOnly: boolean) => {
        set({ freeOnly, page: 1 });
      },

      // ========================================================================
      // SKILL LEVEL ACTIONS
      // ========================================================================

      toggleSkillLevel: (level: CourseLevel) => {
        const levels = get().skillLevels;
        const newLevels = levels.includes(level)
          ? levels.filter((l) => l !== level)
          : [...levels, level];

        set({ skillLevels: newLevels, page: 1 });
      },

      setSkillLevels: (levels: CourseLevel[]) => {
        set({ skillLevels: levels, page: 1 });
      },

      clearSkillLevels: () => {
        set({ skillLevels: [], page: 1 });
      },

      // ========================================================================
      // DURATION ACTIONS
      // ========================================================================

      toggleDurationRange: (range: DurationRange) => {
        const ranges = get().durationRanges;
        const newRanges = ranges.includes(range)
          ? ranges.filter((r) => r !== range)
          : [...ranges, range];

        set({ durationRanges: newRanges, page: 1 });
      },

      setDurationRanges: (ranges: DurationRange[]) => {
        set({ durationRanges: ranges, page: 1 });
      },

      clearDurationRanges: () => {
        set({ durationRanges: [], page: 1 });
      },

      // ========================================================================
      // RATING ACTIONS
      // ========================================================================

      setMinRating: (rating: 0 | 3 | 4 | 4.5) => {
        set({ minRating: rating, page: 1 });
      },

      // ========================================================================
      // LANGUAGE ACTIONS
      // ========================================================================

      toggleLanguage: (language: string) => {
        const languages = get().languages;
        const newLanguages = languages.includes(language)
          ? languages.filter((l) => l !== language)
          : [...languages, language];

        set({ languages: newLanguages, page: 1 });
      },

      setLanguages: (languages: string[]) => {
        set({ languages, page: 1 });
      },

      clearLanguages: () => {
        set({ languages: [], page: 1 });
      },

      // ========================================================================
      // FEATURE ACTIONS
      // ========================================================================

      toggleFeature: (feature: keyof FeatureFilters) => {
        const features = get().features;
        set({
          features: {
            ...features,
            [feature]: !features[feature],
          },
          page: 1,
        });
      },

      setFeatures: (newFeatures: Partial<FeatureFilters>) => {
        const features = get().features;
        set({
          features: {
            ...features,
            ...newFeatures,
          },
          page: 1,
        });
      },

      clearFeatures: () => {
        set({
          features: {
            certificate: false,
            quizzes: false,
            codingExercises: false,
            downloadableResources: false,
            closedCaptions: false,
            mobileAccess: false,
          },
          page: 1,
        });
      },

      // ========================================================================
      // INSTRUCTOR ACTIONS
      // ========================================================================

      setInstructorRating: (rating: number | null) => {
        set({ instructorRating: rating, page: 1 });
      },

      // ========================================================================
      // RECENCY ACTIONS
      // ========================================================================

      setRecentlyUpdated: (recency: UpdateRecency | null) => {
        set({ recentlyUpdated: recency, page: 1 });
      },

      // ========================================================================
      // SORT ACTIONS
      // ========================================================================

      setSortBy: (sortBy: SortBy) => {
        set({ sortBy, page: 1 });
      },

      // ========================================================================
      // VIEW ACTIONS
      // ========================================================================

      setViewMode: (viewMode: ViewMode) => {
        set({ viewMode });
      },

      // ========================================================================
      // PAGINATION ACTIONS
      // ========================================================================

      setPage: (page: number) => {
        set({ page: Math.max(1, page) });
      },

      nextPage: () => {
        const currentPage = get().page;
        set({ page: currentPage + 1 });
      },

      prevPage: () => {
        const currentPage = get().page;
        set({ page: Math.max(1, currentPage - 1) });
      },

      resetPagination: () => {
        set({ page: 1 });
      },

      // ========================================================================
      // BULK ACTIONS
      // ========================================================================

      resetFilters: () => {
        set({
          ...initialFilterState,
          // Preserve these user preferences
          searchHistory: get().searchHistory,
          viewMode: get().viewMode,
        });
      },

      resetAllExceptView: () => {
        set({
          ...initialFilterState,
          viewMode: get().viewMode,
          searchHistory: get().searchHistory,
        });
      },

      applyPreset: (preset: Partial<FilterState>) => {
        set({
          ...get(),
          ...preset,
          page: 1,
        });
      },

      // ========================================================================
      // UTILITY ACTIONS
      // ========================================================================

      getActiveFiltersCount: () => {
        const state = get();
        let count = 0;

        // Search query
        if (state.searchQuery.trim()) count++;

        // Categories
        count += state.selectedCategories.length;

        // Price range (if not default)
        if (state.priceRange.min !== 0 || state.priceRange.max !== 1000) count++;

        // Free only
        if (state.freeOnly) count++;

        // Skill levels
        count += state.skillLevels.length;

        // Duration ranges
        count += state.durationRanges.length;

        // Rating
        if (state.minRating > 0) count++;

        // Languages
        count += state.languages.length;

        // Features
        const activeFeatures = Object.values(state.features).filter(Boolean).length;
        count += activeFeatures;

        // Instructor rating
        if (state.instructorRating !== null) count++;

        // Recently updated
        if (state.recentlyUpdated !== null) count++;

        return count;
      },

      hasActiveFilters: () => {
        return get().getActiveFiltersCount() > 0;
      },
    }),
    {
      name: 'course-catalog-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist user preferences
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        pageSize: state.pageSize,
      }),
    }
  )
);

// ============================================================================
// SELECTORS (for optimized component subscriptions)
// ============================================================================

export const selectSearchQuery = (state: CourseCatalogStore) => state.searchQuery;
export const selectViewMode = (state: CourseCatalogStore) => state.viewMode;
export const selectSortBy = (state: CourseCatalogStore) => state.sortBy;
export const selectFilters = (state: CourseCatalogStore): FilterState => ({
  searchQuery: state.searchQuery,
  searchHistory: state.searchHistory,
  selectedCategories: state.selectedCategories,
  priceRange: state.priceRange,
  freeOnly: state.freeOnly,
  skillLevels: state.skillLevels,
  durationRanges: state.durationRanges,
  minRating: state.minRating,
  languages: state.languages,
  features: state.features,
  instructorRating: state.instructorRating,
  recentlyUpdated: state.recentlyUpdated,
  sortBy: state.sortBy,
  viewMode: state.viewMode,
  page: state.page,
  pageSize: state.pageSize,
});

// ============================================================================
// FILTER PRESETS
// ============================================================================

export const FILTER_PRESETS = {
  beginner: {
    skillLevels: ['Beginner' as CourseLevel],
    sortBy: 'rating' as SortBy,
  },
  free: {
    freeOnly: true,
    sortBy: 'rating' as SortBy,
  },
  popular: {
    sortBy: 'popular' as SortBy,
    minRating: 4,
  },
  newest: {
    sortBy: 'newest' as SortBy,
    recentlyUpdated: '30d' as UpdateRecency,
  },
  shortCourses: {
    durationRanges: ['< 2h' as DurationRange, '2-5h' as DurationRange],
    sortBy: 'rating' as SortBy,
  },
  withCertificate: {
    features: {
      certificate: true,
      quizzes: false,
      codingExercises: false,
      downloadableResources: false,
      closedCaptions: false,
      mobileAccess: false,
    },
    sortBy: 'rating' as SortBy,
  },
};
