/**
 * Mega Menu Type Definitions
 * Enterprise-grade TypeScript types for dropdown mega menus
 */

import { ReactNode, ComponentType } from 'react';

// ============================================================================
// Core Topic & Content Types
// ============================================================================

export interface Topic {
  id: string;
  slug: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  accentHex: string;
  description?: string;
  badge?: TopicBadge;
}

export interface TopicBadge {
  text: string;
  variant: 'new' | 'beta' | 'pro' | 'ai';
  className?: string;
}

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  href: string;
  image?: string;
  readingTime?: string;
  tag?: string;
  date?: string;
  isFeatured?: boolean;
  description?: string;
}

export interface ConceptChip {
  id: string;
  label: string;
  href: string;
  accentColor?: string;
}

// ============================================================================
// Intelligent LMS Mega Menu Props
// ============================================================================

export interface IntelligentLMSMegaMenuProps {
  /** Topics to display in the left rail */
  topics: Topic[];

  /** Function to fetch content for a specific topic */
  getContentByTopic: (topicSlug: string) => Promise<ContentItem[]>;

  /** Concept chips to display under content grid */
  conceptChips?: Record<string, ConceptChip[]>;

  /** Visual variant */
  variant?: 'minimal' | 'rich';

  /** Topic changed callback */
  onTopicChange?: (topicSlug: string) => void;

  /** Content item clicked callback */
  onItemClick?: (item: ContentItem, topicSlug: string) => void;

  /** "See all" link clicked callback */
  onSeeAllClick?: (topicSlug: string) => void;

  /** Accessibility label for trigger button */
  triggerLabel?: string;

  /** ID for the panel (for aria-controls) */
  panelId?: string;

  /** Hover intent delay in milliseconds */
  hoverDelay?: number;

  /** Close delay in milliseconds */
  closeDelay?: number;

  /** Maximum items to show in content grid */
  maxItems?: number;

  /** Current pathname (for active state) */
  currentPathname?: string;

  /** Center the panel in the viewport with overlay */
  centerOnHover?: boolean;
}

// ============================================================================
// More/Compact Menu Types
// ============================================================================

export interface MenuCategory {
  id: string;
  label: string;
  items: MenuItem[];
  icon?: ComponentType<{ className?: string }>;
}

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  description?: string;
  badge?: MenuItemBadge;
  preview?: MenuItemPreview;
  accentColor?: string;
}

export interface MenuItemBadge {
  text: string;
  variant: 'new' | 'beta' | 'pro' | 'ai';
  className?: string;
}

export interface MenuItemPreview {
  title: string;
  description: string;
  features?: string[];
}

export interface MoreMegaMenuProps {
  /** Categories and items to display */
  categories: MenuCategory[];

  /** Visual variant */
  variant?: 'minimal' | 'rich';

  /** Menu item clicked callback */
  onItemClick?: (item: MenuItem) => void;

  /** Accessibility label for trigger button */
  triggerLabel?: string;

  /** ID for the panel */
  panelId?: string;

  /** Hover intent delay in milliseconds */
  hoverDelay?: number;

  /** Close delay in milliseconds */
  closeDelay?: number;

  /** Show hover preview popovers */
  showHoverPreview?: boolean;

  /** Hover preview delay in milliseconds */
  hoverPreviewDelay?: number;

  /** Current pathname (for active state) */
  currentPathname?: string;

  /** Center the panel in the viewport with overlay */
  centerOnHover?: boolean;
}

// ============================================================================
// Content Grid Props
// ============================================================================

export interface ContentGridProps {
  /** Content items to display */
  items: ContentItem[];

  /** Topic metadata */
  topic: Topic;

  /** "See all" link href */
  seeAllHref: string;

  /** Concept chips for this topic */
  conceptChips?: ConceptChip[];

  /** Content item clicked callback */
  onItemClick?: (item: ContentItem) => void;

  /** "See all" clicked callback */
  onSeeAllClick?: () => void;

  /** Visual variant */
  variant?: 'minimal' | 'rich';

  /** Loading state */
  isLoading?: boolean;

  /** Error state */
  error?: Error | null;
}

// ============================================================================
// Topic Rail Props
// ============================================================================

export interface TopicRailProps {
  /** Topics to display */
  topics: Topic[];

  /** Currently active topic slug */
  activeTopic: string | null;

  /** Topic selection callback */
  onTopicSelect: (topicSlug: string) => void;

  /** Topic hover callback */
  onTopicHover?: (topicSlug: string) => void;

  /** Visual variant */
  variant?: 'minimal' | 'rich';

  /** Current pathname (for active state) */
  currentPathname?: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseHoverIntentReturn {
  /** Is the element currently being hovered? */
  isHovering: boolean;

  /** Handlers to spread on target element */
  hoverHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };

  /** Manually trigger hover state */
  setIsHovering: (value: boolean) => void;
}

export interface UseFocusTrapReturn {
  /** Ref to attach to container element */
  containerRef: React.RefObject<HTMLElement>;

  /** Is focus trap active? */
  isActive: boolean;

  /** Activate the focus trap */
  activate: () => void;

  /** Deactivate the focus trap */
  deactivate: () => void;
}

export interface UseKeyboardNavReturn {
  /** Current focus index */
  focusIndex: number;

  /** Set focus index */
  setFocusIndex: (index: number) => void;

  /** Move focus to next item */
  focusNext: () => void;

  /** Move focus to previous item */
  focusPrevious: () => void;

  /** Reset focus to first item */
  resetFocus: () => void;

  /** Keyboard event handler */
  handleKeyDown: (event: React.KeyboardEvent) => void;
}

// ============================================================================
// Event Tracking Types
// ============================================================================

export interface MegaMenuEvent {
  eventType: 'topics_opened' | 'topic_hovered' | 'topic_selected' | 'item_click' | 'see_all_click';
  topic?: string;
  itemId?: string;
  position?: number;
  timestamp: number;
}

export interface TrackingOptions {
  /** Enable event tracking */
  enabled: boolean;

  /** Callback to handle tracked events */
  onEvent?: (event: MegaMenuEvent) => void;

  /** Debug mode */
  debug?: boolean;
}

// ============================================================================
// State Management Types
// ============================================================================

export interface MegaMenuState {
  isOpen: boolean;
  activeTopic: string | null;
  contentCache: Record<string, ContentItem[]>;
  loadingTopics: Set<string>;
  errors: Record<string, Error>;
}

export interface MegaMenuAction {
  type: 'OPEN' | 'CLOSE' | 'SELECT_TOPIC' | 'LOAD_CONTENT' | 'CONTENT_LOADED' | 'CONTENT_ERROR';
  payload?: {
    topicSlug?: string;
    content?: ContentItem[];
    error?: Error;
  };
}

// ============================================================================
// Animation Types
// ============================================================================

export interface AnimationConfig {
  /** Duration in seconds */
  duration: number;

  /** Easing function */
  ease: number[] | string;

  /** Initial state */
  initial?: Record<string, unknown>;

  /** Animate state */
  animate?: Record<string, unknown>;

  /** Exit state */
  exit?: Record<string, unknown>;
}

// ============================================================================
// Accessibility Types
// ============================================================================

export interface A11yConfig {
  /** Announce topic changes via aria-live */
  announceTopicChange: boolean;

  /** Enable focus trap when menu is open */
  enableFocusTrap: boolean;

  /** Respect prefers-reduced-motion */
  respectReducedMotion: boolean;

  /** Keyboard shortcuts config */
  keyboardShortcuts: KeyboardShortcutsConfig;
}

export interface KeyboardShortcutsConfig {
  /** Key to open menu */
  openKey?: string;

  /** Key to close menu */
  closeKey: string;

  /** Keys to navigate topics */
  navigateKeys: {
    next: string[];
    previous: string[];
  };

  /** Keys to navigate content grid */
  gridNavigateKeys: {
    enter: string;
    exit: string;
  };
}

// ============================================================================
// Error & Empty State Types
// ============================================================================

export interface EmptyStateProps {
  /** Icon to display */
  icon?: ReactNode;

  /** Title text */
  title: string;

  /** Description text */
  description?: string;

  /** Action button */
  action?: ReactNode;
}

export interface ErrorStateProps {
  /** Error object */
  error?: Error;

  /** Title text */
  title: string;

  /** Description text */
  description?: string;

  /** Retry callback */
  onRetry?: () => void;
}

export interface LoadingStateProps {
  /** Number of skeleton items to show */
  count?: number;

  /** Variant */
  variant?: 'hero' | 'grid' | 'list';
}
