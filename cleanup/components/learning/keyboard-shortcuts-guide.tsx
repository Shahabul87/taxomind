'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Keyboard,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  Maximize,
  PanelLeft,
  Hash,
  Command,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyboardShortcut {
  category: string;
  shortcuts: {
    keys: string[];
    description: string;
    icon?: React.ReactNode;
  }[];
}

const shortcuts: KeyboardShortcut[] = [
  {
    category: 'Navigation',
    shortcuts: [
      {
        keys: ['Ctrl/⌘', '←'],
        description: 'Previous section',
        icon: <ArrowLeft className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl/⌘', '→'],
        description: 'Next section',
        icon: <ArrowRight className="h-4 w-4" />,
      },
      {
        keys: ['1', '-', '7'],
        description: 'Switch content tabs',
        icon: <Hash className="h-4 w-4" />,
      },
      {
        keys: ['Tab'],
        description: 'Navigate through elements',
      },
    ],
  },
  {
    category: 'Video Controls',
    shortcuts: [
      {
        keys: ['Space'],
        description: 'Play/Pause video',
        icon: <Play className="h-4 w-4" />,
      },
      {
        keys: ['K'],
        description: 'Play/Pause (YouTube-style)',
        icon: <Pause className="h-4 w-4" />,
      },
      {
        keys: ['F'],
        description: 'Toggle fullscreen',
        icon: <Maximize className="h-4 w-4" />,
      },
      {
        keys: ['←', '→'],
        description: 'Seek backward/forward (5s)',
      },
      {
        keys: ['J'],
        description: 'Seek backward 10 seconds',
      },
      {
        keys: ['L'],
        description: 'Seek forward 10 seconds',
      },
      {
        keys: ['M'],
        description: 'Mute/Unmute',
      },
    ],
  },
  {
    category: 'Interface',
    shortcuts: [
      {
        keys: ['Ctrl/⌘', 'B'],
        description: 'Toggle sidebar',
        icon: <PanelLeft className="h-4 w-4" />,
      },
      {
        keys: ['Esc'],
        description: 'Exit fullscreen or close modal',
      },
      {
        keys: ['?'],
        description: 'Show keyboard shortcuts help',
        icon: <HelpCircle className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl/⌘', 'H'],
        description: 'Show keyboard shortcuts help',
      },
    ],
  },
  {
    category: 'Accessibility',
    shortcuts: [
      {
        keys: ['Tab'],
        description: 'Navigate forward through focusable elements',
      },
      {
        keys: ['Shift', 'Tab'],
        description: 'Navigate backward through focusable elements',
      },
      {
        keys: ['Enter'],
        description: 'Activate focused element',
      },
      {
        keys: ['Esc'],
        description: 'Close dialogs and cancel actions',
      },
    ],
  },
];

interface KeyboardShortcutsGuideProps {
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}

export function KeyboardShortcutsGuide({
  trigger,
  defaultOpen = false,
}: KeyboardShortcutsGuideProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Keyboard className="h-4 w-4" />
            <span className="hidden sm:inline">Keyboard Shortcuts</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Keyboard className="h-6 w-6" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Master these shortcuts to navigate the learning platform efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcuts.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {category.category}
                <Badge variant="secondary" className="ml-auto">
                  {category.shortcuts.length} shortcuts
                </Badge>
              </h3>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {category.shortcuts.map((shortcut, shortcutIndex) => (
                      <div key={shortcutIndex}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            {shortcut.icon && (
                              <div className="text-muted-foreground">
                                {shortcut.icon}
                              </div>
                            )}
                            <span className="text-sm">
                              {shortcut.description}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {shortcut.keys.map((key, keyIndex) => (
                              <span key={keyIndex} className="flex items-center gap-1">
                                <kbd
                                  className={cn(
                                    "px-2 py-1 text-xs font-semibold",
                                    "bg-slate-100 dark:bg-slate-800",
                                    "border border-slate-300 dark:border-slate-600",
                                    "rounded shadow-sm",
                                    "min-w-[2rem] text-center"
                                  )}
                                >
                                  {key === 'Ctrl/⌘' ? (
                                    <span className="inline-flex items-center gap-0.5">
                                      <span className="hidden sm:inline">Ctrl</span>
                                      <span className="sm:hidden"><Command className="h-3 w-3" /></span>
                                    </span>
                                  ) : (
                                    key
                                  )}
                                </kbd>
                                {keyIndex < shortcut.keys.length - 1 && (
                                  <span className="text-muted-foreground text-xs mx-0.5">
                                    +
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>

                        {shortcutIndex < category.shortcuts.length - 1 && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}

          {/* Pro Tips */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Pro Tips
              </h4>
              <ul className="text-sm space-y-1.5 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    Press <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-slate-800 rounded border">?</kbd> anytime to see this shortcuts guide
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    Keyboard shortcuts won&apos;t work when you&apos;re typing in text fields
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    On Mac, use <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-slate-800 rounded border">⌘</kbd> (Command) instead of Ctrl
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    Some shortcuts like video controls only work when the video player is loaded
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => setOpen(false)}>
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Floating keyboard shortcuts button (position: fixed)
 * Can be placed anywhere in the app
 */
export function FloatingKeyboardShortcuts() {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <KeyboardShortcutsGuide
        trigger={
          <Button
            size="lg"
            className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 rounded-lg"
          >
            <Keyboard className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline font-medium">Shortcuts</span>
          </Button>
        }
      />
    </div>
  );
}
