/**
 * Course Marketplace Components
 *
 * A comprehensive course discovery and browsing interface with advanced
 * filtering, search, and multiple view modes.
 *
 * Features:
 * - Grid and list view modes
 * - Advanced filtering (category, price, difficulty, rating)
 * - Tabbed browsing (All, Featured, Trending, New)
 * - Course preview modal with detailed information
 * - Wishlist and sharing functionality
 * - Pagination with infinite scroll
 *
 * @module components/sam/course-marketplace
 */

export { CourseMarketplace } from "./CourseMarketplace";
export type { CourseMarketplaceProps } from "./CourseMarketplace";

export { CoursePreviewModal } from "./CoursePreviewModal";
export type {
  CoursePreviewModalProps,
  MarketplaceCourse,
} from "./CoursePreviewModal";

// Default export for convenience
export { CourseMarketplace as default } from "./CourseMarketplace";
