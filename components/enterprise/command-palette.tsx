"use client";

import { useEffect, useState, useCallback } from "react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Brain,
  Save,
  Eye,
  Sparkles,
  FileText,
  Code2,
  Calculator,
  Video,
  BookOpen,
  FileQuestion,
  Layout,
  Maximize2,
  Focus,
} from "lucide-react";

interface CommandAction {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
  category: 'ai' | 'content' | 'view' | 'navigation';
}

interface CommandPaletteProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  onSave?: () => void;
  onPreview?: () => void;
  onAIAssist?: () => void;
  onLayoutChange?: (layout: 'compact' | 'focus' | 'dashboard') => void;
}

export const CommandPalette = ({
  courseId,
  chapterId,
  sectionId,
  onSave,
  onPreview,
  onAIAssist,
  onLayoutChange,
}: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);

  const commands: CommandAction[] = [
    // AI Commands
    {
      id: 'ai-assist',
      label: 'Open AI Assistant',
      icon: Brain,
      action: () => onAIAssist?.(),
      shortcut: '⌘K',
      category: 'ai',
    },
    {
      id: 'ai-improve',
      label: 'Improve Content with AI',
      icon: Sparkles,
      action: () => console.log('AI Improve'),
      category: 'ai',
    },
    {
      id: 'ai-generate',
      label: 'Generate Content Suggestions',
      icon: FileText,
      action: () => console.log('AI Generate'),
      category: 'ai',
    },

    // Content Commands
    {
      id: 'add-video',
      label: 'Add Video',
      icon: Video,
      action: () => console.log('Add Video'),
      category: 'content',
    },
    {
      id: 'add-code',
      label: 'Add Code Explanation',
      icon: Code2,
      action: () => console.log('Add Code'),
      category: 'content',
    },
    {
      id: 'add-math',
      label: 'Add Math Equation',
      icon: Calculator,
      action: () => console.log('Add Math'),
      category: 'content',
    },
    {
      id: 'add-blog',
      label: 'Add Blog Post',
      icon: BookOpen,
      action: () => console.log('Add Blog'),
      category: 'content',
    },
    {
      id: 'add-quiz',
      label: 'Add Quiz',
      icon: FileQuestion,
      action: () => console.log('Add Quiz'),
      category: 'content',
    },

    // View Commands
    {
      id: 'save',
      label: 'Save Changes',
      icon: Save,
      action: () => onSave?.(),
      shortcut: '⌘S',
      category: 'view',
    },
    {
      id: 'preview',
      label: 'Preview Section',
      icon: Eye,
      action: () => onPreview?.(),
      shortcut: '⌘P',
      category: 'view',
    },
    {
      id: 'layout-compact',
      label: 'Compact Layout',
      icon: Layout,
      action: () => onLayoutChange?.('compact'),
      category: 'view',
    },
    {
      id: 'layout-focus',
      label: 'Focus Mode',
      icon: Focus,
      action: () => onLayoutChange?.('focus'),
      category: 'view',
    },
    {
      id: 'layout-dashboard',
      label: 'Dashboard View',
      icon: Maximize2,
      action: () => onLayoutChange?.('dashboard'),
      category: 'view',
    },
  ];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSave?.();
      }
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onPreview?.();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onSave, onPreview]);

  const executeCommand = useCallback((command: CommandAction) => {
    command.action();
    setOpen(false);
  }, []);

  const groupedCommands = {
    ai: commands.filter(cmd => cmd.category === 'ai'),
    content: commands.filter(cmd => cmd.category === 'content'),
    view: commands.filter(cmd => cmd.category === 'view'),
    navigation: commands.filter(cmd => cmd.category === 'navigation'),
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="AI Assistant">
          {groupedCommands.ai.map((command) => {
            const Icon = command.icon;
            return (
              <CommandItem
                key={command.id}
                onSelect={() => executeCommand(command)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Icon className="h-4 w-4" />
                <span>{command.label}</span>
                {command.shortcut && (
                  <span className="ml-auto text-xs text-gray-500">
                    {command.shortcut}
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandGroup heading="Add Content">
          {groupedCommands.content.map((command) => {
            const Icon = command.icon;
            return (
              <CommandItem
                key={command.id}
                onSelect={() => executeCommand(command)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Icon className="h-4 w-4" />
                <span>{command.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandGroup heading="View & Layout">
          {groupedCommands.view.map((command) => {
            const Icon = command.icon;
            return (
              <CommandItem
                key={command.id}
                onSelect={() => executeCommand(command)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Icon className="h-4 w-4" />
                <span>{command.label}</span>
                {command.shortcut && (
                  <span className="ml-auto text-xs text-gray-500">
                    {command.shortcut}
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
