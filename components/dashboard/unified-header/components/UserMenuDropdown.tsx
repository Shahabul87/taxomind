'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  MessageSquare,
  HelpCircle,
  LogOut,
  X,
  Sparkles,
  GraduationCap,
  Award,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import type { User as NextAuthUser } from 'next-auth';
import { cn } from '@/lib/utils';

interface UserMenuDropdownProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
  className?: string;
}

export function UserMenuDropdown({ user, className }: UserMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: '/profile', icon: User, label: 'My Profile', description: 'View and edit profile' },
    { href: '/settings', icon: Settings, label: 'Settings', description: 'Preferences & privacy' },
    { href: '/messages', icon: MessageSquare, label: 'Messages', description: 'Inbox and chats' },
    { href: '/help', icon: HelpCircle, label: 'Help Center', description: 'Get support' },
  ];

  return (
    <div className={cn('relative', className)}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        aria-label="User Menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User'}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-auto mt-0 sm:mt-2 w-auto sm:w-80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 shadow-xl z-50 overflow-hidden"
              role="menu"
            >
              {/* Header with User Info */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-700"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg ring-2 ring-white dark:ring-slate-700">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>

                  {/* User Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                      {user.email}
                    </p>
                    {/* Role Badges */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {user.role === 'ADMIN' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                          <Sparkles className="h-3 w-3" />
                          Admin
                        </span>
                      )}
                      {user.isTeacher && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                          <GraduationCap className="h-3 w-3" />
                          Teacher
                        </span>
                      )}
                      {user.isAffiliate && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                          <Award className="h-3 w-3" />
                          Affiliate
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group"
                        role="menuitem"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                          <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Sign Out Section */}
              <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-2 bg-slate-50 dark:bg-slate-900/50">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all w-full group"
                  role="menuitem"
                >
                  <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 group-hover:bg-red-200 dark:group-hover:bg-red-500/30 transition-colors">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span>Sign Out</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
