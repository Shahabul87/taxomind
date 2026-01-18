'use client';

/**
 * NotificationCenter Component
 *
 * Comprehensive notification management center with tabs for inbox,
 * category preferences, channel settings, and history.
 *
 * Features a distinctive command-center aesthetic with smooth animations.
 *
 * @module components/sam/notification-center/NotificationCenter
 */

import React, { useState, useCallback } from 'react';
import {
  Bell,
  Inbox,
  Settings2,
  History,
  Sliders,
  X,
  ChevronLeft,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNotifications } from '@sam-ai/react';
import { NotificationInbox } from './NotificationInbox';
import { ChannelSettings } from './ChannelSettings';
import { NotificationHistory } from './NotificationHistory';
import { NotificationPreferences } from '../notifications/NotificationPreferences';

// Tab configuration
const TABS = [
  {
    id: 'inbox',
    label: 'Inbox',
    icon: Inbox,
    description: 'View and manage notifications',
  },
  {
    id: 'preferences',
    label: 'Categories',
    icon: Sliders,
    description: 'Notification category preferences',
  },
  {
    id: 'channels',
    label: 'Channels',
    icon: Settings2,
    description: 'Delivery channel settings',
  },
  {
    id: 'history',
    label: 'History',
    icon: History,
    description: 'View notification history',
  },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface NotificationCenterProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  defaultTab?: TabId;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  embedded?: boolean;
}

export function NotificationCenter({
  className,
  isOpen = true,
  onClose,
  defaultTab = 'inbox',
  isFullscreen = false,
  onToggleFullscreen,
  embedded = false,
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const { unreadCount = 0 } = useNotifications();

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: { duration: 0.15 },
    },
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.15 },
    },
  };

  if (!isOpen) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'flex flex-col overflow-hidden',
        embedded
          ? 'h-full rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/98 to-zinc-950/98'
          : isFullscreen
            ? 'fixed inset-0 z-50 bg-zinc-950'
            : 'h-[700px] w-[520px] rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/98 to-zinc-950/98 shadow-2xl backdrop-blur-xl',
        className
      )}
    >
      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-zinc-800/60 px-5 py-4">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-purple-600/5 to-fuchsia-600/5" />

        <div className="relative flex items-center gap-3">
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 shadow-lg shadow-indigo-500/25">
              <Bell className="h-5 w-5 text-white" />
            </div>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-zinc-900"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
              Notification Center
            </h1>
            <p className="text-xs text-zinc-500">
              Manage your notifications and preferences
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-1">
          {onToggleFullscreen && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleFullscreen}
                    className="h-9 w-9 text-zinc-400 hover:text-zinc-100"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {onClose && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-9 w-9 text-zinc-400 hover:text-zinc-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Close</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-zinc-800/40 px-2">
        <nav className="flex gap-1 py-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === 'inbox' && unreadCount > 0;

            return (
              <TooltipProvider key={tab.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'group relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-zinc-800/80 text-zinc-100'
                          : 'text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 transition-colors',
                          isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'
                        )}
                      />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {showBadge && (
                        <Badge className="ml-1 h-5 min-w-[20px] rounded-full bg-rose-500/90 px-1.5 text-[10px] text-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}

                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-fuchsia-500/10"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="sm:hidden">
                    {tab.label}: {tab.description}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="h-full"
          >
            {activeTab === 'inbox' && (
              <NotificationInbox
                className="h-full border-0 rounded-none bg-transparent shadow-none"
                showHeader={false}
                maxHeight="calc(100vh - 200px)"
              />
            )}

            {activeTab === 'preferences' && (
              <div className="h-full overflow-auto p-4">
                <NotificationPreferences />
              </div>
            )}

            {activeTab === 'channels' && (
              <div className="h-full overflow-auto p-4">
                <ChannelSettings />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="h-full overflow-auto p-4">
                <NotificationHistory />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/**
 * NotificationCenterTrigger Component
 *
 * A button that opens the NotificationCenter in a popover.
 */
interface NotificationCenterTriggerProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function NotificationCenterTrigger({
  className,
  variant = 'ghost',
  size = 'icon',
}: NotificationCenterTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount = 0 } = useNotifications();

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={() => setIsOpen(true)}
              className={cn('relative', className)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            {/* Center */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <NotificationCenter
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
              />
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * NotificationCenterDrawer Component
 *
 * A drawer version of the NotificationCenter for mobile/responsive layouts.
 */
interface NotificationCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
}

export function NotificationCenterDrawer({
  isOpen,
  onClose,
  side = 'right',
}: NotificationCenterDrawerProps) {
  const drawerVariants = {
    hidden: {
      x: side === 'right' ? '100%' : '-100%',
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      x: side === 'right' ? '100%' : '-100%',
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed inset-y-0 z-50 w-full max-w-md',
              side === 'right' ? 'right-0' : 'left-0'
            )}
          >
            <div className="flex h-full flex-col bg-zinc-950">
              {/* Drawer Header */}
              <div className="flex items-center gap-3 border-b border-zinc-800/60 px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-9 w-9 text-zinc-400 hover:text-zinc-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm font-medium text-zinc-300">Back</span>
              </div>

              {/* Content */}
              <NotificationCenter
                embedded
                className="flex-1"
                onClose={onClose}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NotificationCenter;
