/**
 * Navigation Data Structure for Slim Rail Sidebar
 *
 * This file defines the navigation tree with typed structure for:
 * - Top-level menu items with icons
 * - Nested submenus with optional badges
 * - Role-based menu filtering
 * - Active state management
 */

import {
  LayoutDashboard,
  BookOpen,
  Newspaper,
  BarChart3,
  Users,
  Calendar,
  Brain,
  MessageCircle,
  Library,
  HelpCircle,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavSubmenuItem {
  key: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: string | number;
  description?: string;
}

export interface NavNode {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: NavSubmenuItem[];
  badge?: string | number;
  roles?: Array<'ADMIN' | 'USER'>;
  section?: 'main' | 'secondary' | 'bottom';
}

/**
 * Main navigation structure
 * Organized by sections: main, secondary, bottom
 * Preserves all existing menu items from current sidebar
 */
export const NAV_ITEMS: NavNode[] = [
  // Main navigation
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard', // Dynamic: /dashboard/admin for ADMIN role
    section: 'main',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    section: 'main',
  },
  {
    key: 'courses',
    label: 'Courses',
    icon: BookOpen,
    section: 'main',
    children: [
      {
        key: 'my-courses',
        label: 'My Courses',
        href: '/my-courses',
        description: 'Courses you&apos;re enrolled in',
      },
      {
        key: 'all-courses',
        label: 'All Courses',
        href: '/teacher/courses',
        description: 'Browse all available courses',
      },
      {
        key: 'create-course',
        label: 'Create Course',
        href: '/teacher/create',
        description: 'Create a new course',
      },
    ],
  },
  {
    key: 'posts',
    label: 'Posts & Blog',
    icon: Newspaper,
    section: 'main',
    children: [
      {
        key: 'my-posts',
        label: 'My Posts',
        href: '/post/all-posts',
        description: 'Manage your posts',
      },
      {
        key: 'browse-posts',
        label: 'Browse Posts',
        href: '/post',
        description: 'Read community posts',
      },
      {
        key: 'create-post',
        label: 'Create Post',
        href: '/post/create-post',
        description: 'Write a new post',
      },
    ],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    section: 'main',
  },

  // Secondary navigation
  {
    key: 'groups',
    label: 'Study Groups',
    icon: Users,
    section: 'secondary',
    children: [
      {
        key: 'my-groups',
        label: 'My Groups',
        href: '/groups/my-groups',
        description: 'Groups you&apos;ve joined',
      },
      {
        key: 'browse-groups',
        label: 'Browse Groups',
        href: '/groups',
        description: 'Find study groups',
      },
      {
        key: 'create-group',
        label: 'Create Group',
        href: '/groups/create',
        description: 'Start a new group',
      },
    ],
  },
  {
    key: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    href: '/calendar',
    section: 'secondary',
  },
  {
    key: 'ai-tutor',
    label: 'AI Tutor',
    icon: Brain,
    href: '/ai-tutor',
    section: 'secondary',
  },
  {
    key: 'messages',
    label: 'Messages',
    icon: MessageCircle,
    href: '/messages',
    section: 'secondary',
  },
  {
    key: 'resources',
    label: 'Resources',
    icon: Library,
    href: '/resources',
    section: 'secondary',
  },

  // Bottom navigation
  {
    key: 'support',
    label: 'Support',
    icon: HelpCircle,
    href: '/support',
    section: 'bottom',
  },
];

/**
 * Filter navigation items by user role
 */
export function getNavItemsForRole(role?: 'ADMIN' | 'USER'): NavNode[] {
  return NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return role && item.roles.includes(role);
  });
}

/**
 * Get navigation sections
 */
export function getNavSections() {
  return {
    main: NAV_ITEMS.filter((item) => item.section === 'main'),
    secondary: NAV_ITEMS.filter((item) => item.section === 'secondary'),
    bottom: NAV_ITEMS.filter((item) => item.section === 'bottom'),
  };
}

/**
 * Find active navigation item by pathname
 */
export function findActiveNavItem(pathname: string): NavNode | null {
  for (const item of NAV_ITEMS) {
    // Check direct href match
    if (item.href && pathname === item.href) {
      return item;
    }

    // Check submenu items
    if (item.children) {
      const activeChild = item.children.find((child) => child.href === pathname);
      if (activeChild) {
        return item;
      }
    }
  }

  return null;
}

/**
 * Find active submenu item by pathname
 */
export function findActiveSubmenuItem(pathname: string): NavSubmenuItem | null {
  for (const item of NAV_ITEMS) {
    if (item.children) {
      const activeChild = item.children.find((child) => child.href === pathname);
      if (activeChild) {
        return activeChild;
      }
    }
  }

  return null;
}
