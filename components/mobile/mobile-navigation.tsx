"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  IconHome,
  IconBook,
  IconUser,
  IconSettings,
  IconChartBar,
  IconMenu2,
  IconX,
  IconSearch,
  IconBell,
  IconMessage,
  IconHeart,
  IconBookmark,
  IconLogout,
  IconChevronRight,
  IconChevronDown,
  IconDashboard,
  IconUsers,
  IconNews,
  IconBrain,
  IconLibrary,
  IconHelpCircle,
  IconMessageCircle,
  IconCalendar
} from '@tabler/icons-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  badge?: number;
  submenu?: NavItem[];
  roles?: string[];
}

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className = '' }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(3);
  
  const user = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  // Navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <IconDashboard className="w-5 h-5" />,
        href: user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/user'
      },
      {
        id: 'courses',
        label: 'Courses',
        icon: <IconBook className="w-5 h-5" />,
        submenu: [
          { id: 'my-courses', label: 'My Courses', icon: <IconBook className="w-4 h-4" />, href: '/my-courses' },
          { id: 'all-courses', label: 'All Courses', icon: <IconSearch className="w-4 h-4" />, href: '/teacher/courses' },
          { id: 'create-course', label: 'Create Course', icon: <IconPlus className="w-4 h-4" />, href: '/teacher/create', roles: ['TEACHER', 'ADMIN'] }
        ]
      },
      {
        id: 'posts',
        label: 'Posts',
        icon: <IconNews className="w-5 h-5" />,
        submenu: [
          { id: 'my-posts', label: 'My Posts', icon: <IconNews className="w-4 h-4" />, href: '/post/all-posts' },
          { id: 'browse-posts', label: 'Browse Posts', icon: <IconSearch className="w-4 h-4" />, href: '/post' },
          { id: 'create-post', label: 'Create Post', icon: <IconPlus className="w-4 h-4" />, href: '/post/create-post' }
        ]
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: <IconChartBar className="w-5 h-5" />,
        href: user?.role === 'ADMIN' ? '/analytics/admin' : '/analytics/student'
      },
      {
        id: 'groups',
        label: 'Groups',
        icon: <IconUsers className="w-5 h-5" />,
        submenu: [
          { id: 'my-groups', label: 'My Groups', icon: <IconUsers className="w-4 h-4" />, href: '/groups/my-groups' },
          { id: 'browse-groups', label: 'Browse Groups', icon: <IconSearch className="w-4 h-4" />, href: '/groups' },
          { id: 'create-group', label: 'Create Group', icon: <IconPlus className="w-4 h-4" />, href: '/groups/create' }
        ]
      },
      {
        id: 'ai-tutor',
        label: 'AI Tutor',
        icon: <IconBrain className="w-5 h-5" />,
        href: '/ai-tutor'
      },
      {
        id: 'resources',
        label: 'Resources',
        icon: <IconLibrary className="w-5 h-5" />,
        href: '/resources'
      },
      {
        id: 'messages',
        label: 'Messages',
        icon: <IconMessageCircle className="w-5 h-5" />,
        href: '/messages',
        badge: 2
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: <IconUser className="w-5 h-5" />,
        href: '/profile'
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: <IconSettings className="w-5 h-5" />,
        href: '/settings'
      },
      {
        id: 'support',
        label: 'Support',
        icon: <IconHelpCircle className="w-5 h-5" />,
        href: '/support'
      }
    ];

    // Filter items based on user roles
    return baseItems.map(item => ({
      ...item,
      submenu: item.submenu?.filter(subItem => 
        !subItem.roles || subItem.roles.includes(user?.role || 'USER')
      )
    }));
  };

  const navItems = getNavItems();

  // Handle menu item click
  const handleItemClick = useCallback((item: NavItem) => {
    if (item.submenu) {
      setExpandedItems(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else if (item.href) {
      router.push(item.href);
      setIsOpen(false);
    } else if (item.action) {
      item.action();
      setIsOpen(false);
    }
  }, [router]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Implement search logic here
    console.log('Searching for:', query);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle swipe gestures
  const handleSwipeRight = useCallback(() => {
    if (!isOpen) setIsOpen(true);
  }, [isOpen]);

  const handleSwipeLeft = useCallback(() => {
    if (isOpen) setIsOpen(false);
  }, [isOpen]);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            aria-label="Open menu"
          >
            <IconMenu2 className="w-6 h-6 text-slate-300" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-slate-100 font-semibold">bdGenAI</span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            <button
              className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors relative"
              aria-label="Notifications"
            >
              <IconBell className="w-5 h-5 text-slate-300" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            <button
              className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              aria-label="Search"
            >
              <IconSearch className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Navigation Drawer */}
            <motion.nav
              ref={navRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={`
                fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw]
                bg-slate-900/95 backdrop-blur-md border-r border-slate-800
                overflow-y-auto lg:hidden ${className}
              `}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">B</span>
                  </div>
                  <div>
                    <h2 className="text-slate-100 font-semibold">bdGenAI</h2>
                    <p className="text-slate-400 text-sm">Learning Platform</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                  aria-label="Close menu"
                >
                  <IconX className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              {/* User Info */}
              {user && (
                <div className="p-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-100 font-medium">{user.name}</p>
                      <p className="text-slate-400 text-sm">{user.email}</p>
                      <p className="text-purple-400 text-xs uppercase font-medium">{user.role}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="p-4 border-b border-slate-800">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Navigation Items */}
              <div className="py-4">
                {navItems.map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={() => handleItemClick(item)}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 text-left
                        hover:bg-slate-800/50 transition-colors
                        ${pathname === item.href ? 'bg-purple-500/10 text-purple-400 border-r-2 border-purple-500' : 'text-slate-300'}
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.submenu && (
                        <motion.div
                          animate={{ rotate: expandedItems.includes(item.id) ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <IconChevronDown className="w-4 h-4" />
                        </motion.div>
                      )}
                    </button>

                    {/* Submenu */}
                    <AnimatePresence>
                      {item.submenu && expandedItems.includes(item.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.id}
                              href={subItem.href || '#'}
                              onClick={() => setIsOpen(false)}
                              className={`
                                flex items-center space-x-3 px-8 py-2 text-sm
                                hover:bg-slate-800/30 transition-colors
                                ${pathname === subItem.href ? 'text-purple-400 bg-purple-500/5' : 'text-slate-400'}
                              `}
                            >
                              {subItem.icon}
                              <span>{subItem.label}</span>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-auto p-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    // Handle logout
                    console.log('Logout clicked');
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <IconLogout className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
        <div className="flex items-center justify-around py-2">
          {[
            { icon: <IconHome className="w-5 h-5" />, label: 'Home', href: '/' },
            { icon: <IconBook className="w-5 h-5" />, label: 'Courses', href: '/my-courses' },
            { icon: <IconSearch className="w-5 h-5" />, label: 'Search', href: '/search' },
            { icon: <IconMessage className="w-5 h-5" />, label: 'Messages', href: '/messages', badge: 2 },
            { icon: <IconUser className="w-5 h-5" />, label: 'Profile', href: '/profile' }
          ].map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`
                flex flex-col items-center space-y-1 px-3 py-2 rounded-lg
                transition-colors relative
                ${pathname === item.href ? 'text-purple-400' : 'text-slate-400 hover:text-slate-300'}
              `}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

// Quick Action Button Component
export function QuickActionButton({ 
  icon, 
  label, 
  onClick, 
  color = 'purple',
  className = '' 
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: 'purple' | 'blue' | 'green' | 'orange' | 'red';
  className?: string;
}) {
  const colorClasses = {
    purple: 'bg-purple-500 hover:bg-purple-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    red: 'bg-red-500 hover:bg-red-600'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        fixed bottom-24 right-4 lg:hidden z-30
        w-14 h-14 rounded-full shadow-lg
        flex items-center justify-center
        text-white font-medium
        ${colorClasses[color]}
        ${className}
      `}
      aria-label={label}
    >
      {icon}
    </motion.button>
  );
}

// Floating Action Menu Component
export function FloatingActionMenu({
  isOpen,
  onToggle,
  actions,
  className = ''
}: {
  isOpen: boolean;
  onToggle: () => void;
  actions: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color?: 'purple' | 'blue' | 'green' | 'orange' | 'red';
  }>;
  className?: string;
}) {
  return (
    <div className={`lg:hidden fixed bottom-20 right-4 z-30 ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="space-y-3 mb-4"
          >
            {actions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.onClick}
                className={`
                  w-12 h-12 rounded-full shadow-lg
                  flex items-center justify-center
                  text-white
                  ${action.color === 'blue' ? 'bg-blue-500' : 
                    action.color === 'green' ? 'bg-green-500' : 
                    action.color === 'orange' ? 'bg-orange-500' : 
                    action.color === 'red' ? 'bg-red-500' : 'bg-purple-500'}
                `}
                aria-label={action.label}
              >
                {action.icon}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="w-14 h-14 bg-purple-500 hover:bg-purple-600 rounded-full shadow-lg flex items-center justify-center text-white"
        aria-label="Toggle actions"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <IconPlus className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </div>
  );
}

// Plus icon component (since it's not imported)
function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
}