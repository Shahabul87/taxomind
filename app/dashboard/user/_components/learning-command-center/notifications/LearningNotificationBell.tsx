'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnreadNotificationCount } from '@/hooks/use-learning-notifications';
import { NotificationsList } from './NotificationsList';
import { NotificationPreferences } from './NotificationPreferences';
import { cn } from '@/lib/utils';

interface LearningNotificationBellProps {
  className?: string;
  showBadge?: boolean;
  popoverWidth?: number;
}

export function LearningNotificationBell({
  className,
  showBadge = true,
  popoverWidth = 420,
}: LearningNotificationBellProps) {
  const { count, isLoading } = useUnreadNotificationCount();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'relative h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800',
              className
            )}
            aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
          >
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />

            {/* Unread Badge */}
            <AnimatePresence>
              {showBadge && count > 0 && !isLoading && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={cn(
                    'absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white',
                    count > 9 ? 'h-5 w-5' : 'h-4 w-4'
                  )}
                >
                  {count > 99 ? '99+' : count}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Pulse animation for new notifications */}
            {showBadge && count > 0 && !isLoading && (
              <motion.span
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 0, scale: 2 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-red-500"
              />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0"
          style={{ width: `${popoverWidth}px` }}
          align="end"
          sideOffset={8}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Learning Notifications
              </h3>
              <div className="flex items-center gap-1">
                <TabsList className="h-8 bg-slate-100 dark:bg-slate-800">
                  <TabsTrigger value="notifications" className="h-6 px-2 text-xs">
                    <Bell className="mr-1 h-3 w-3" />
                    Alerts
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="h-6 px-2 text-xs">
                    <Settings className="mr-1 h-3 w-3" />
                    Settings
                  </TabsTrigger>
                </TabsList>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <TabsContent value="notifications" className="m-0 p-4">
              <NotificationsList
                maxHeight={350}
                onNotificationClick={() => setIsOpen(false)}
              />
            </TabsContent>

            <TabsContent value="settings" className="m-0 p-4">
              <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Quick settings preview. For full configuration, open the settings dialog.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsOpen(false);
                    setShowPreferencesDialog(true);
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Open Full Settings
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>

      {/* Full Preferences Dialog */}
      <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
        <DialogContent className="max-w-2xl p-0">
          <DialogTitle className="sr-only">Notification Preferences</DialogTitle>
          <DialogDescription className="sr-only">Configure your notification settings</DialogDescription>
          <NotificationPreferences onClose={() => setShowPreferencesDialog(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Compact version for mobile or small spaces
 */
export function LearningNotificationBellCompact({
  className,
}: {
  className?: string;
}) {
  const { count, isLoading } = useUnreadNotificationCount();
  const [showDialog, setShowDialog] = useState(false);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800',
            className
          )}
          aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
        >
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />

          {/* Unread Badge */}
          <AnimatePresence>
            {count > 0 && !isLoading && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={cn(
                  'absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white',
                  count > 9 ? 'h-5 w-5' : 'h-4 w-4'
                )}
              >
                {count > 99 ? '99+' : count}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] max-w-lg overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <DialogTitle className="font-semibold text-slate-900 dark:text-white">
            Learning Notifications
          </DialogTitle>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <NotificationsList
            maxHeight={500}
            onNotificationClick={() => setShowDialog(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
