"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useReadingPreferences } from "@/hooks/use-reading-preferences";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { useReadingAnalytics } from "@/hooks/use-reading-analytics";
import { Button } from "@/components/ui/button";
import { BookOpen, Eye, Newspaper, Clock, Presentation as PresentationIcon, Sparkles, Book } from "lucide-react";
import StandardMode from "./reading-modes/standard";
import FocusMode from "./reading-modes/focus";
import MagazineMode from "./reading-modes/magazine";
import TimelineMode from "./reading-modes/timeline";
import PresentationMode from "./reading-modes/presentation";
import ImmersiveMode from "./reading-modes/immersive";
import BookMode from "./reading-modes/book";
import { EnhancedTableOfContents } from "./enhanced-table-of-contents";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { PrintStyles } from "./print-styles";

type ReadingMode = "standard" | "focus" | "magazine" | "timeline" | "presentation" | "immersive" | "book";

interface Chapter {
  id: string;
  title: string;
  content: string | null;
  description: string | null;
  imageUrl: string | null;
  position: number;
}

interface PostContentProps {
  chapters: Chapter[];
  images?: any[];
  postId: string;
}

const readingModes = {
  standard: { component: StandardMode, icon: BookOpen, label: "Standard" },
  focus: { component: FocusMode, icon: Eye, label: "Focus" },
  magazine: { component: MagazineMode, icon: Newspaper, label: "Magazine" },
  timeline: { component: TimelineMode, icon: Clock, label: "Timeline" },
  presentation: { component: PresentationMode, icon: PresentationIcon, label: "Presentation" },
  immersive: { component: ImmersiveMode, icon: Sparkles, label: "Immersive" },
  book: { component: BookMode, icon: Book, label: "Book" },
} as const;

export default function PostContent({ chapters, postId }: PostContentProps) {
  const [mode, setMode] = useState<ReadingMode>("standard");
  const [showTOC, setShowTOC] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  const { preferences, updatePreference } = useReadingPreferences();
  const { readingTime, scrollDepth, trackChapterView, trackModeChange } = useReadingAnalytics({
    postId,
    totalChapters: chapters.length,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress((scrolled / total) * 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleModeChange = useCallback((newMode: ReadingMode) => {
    setMode(newMode);
    trackModeChange(newMode);
    updatePreference("mode", newMode);
  }, [trackModeChange, updatePreference]);

  // Navigate chapters
  const nextChapter = useCallback(() => {
    if (currentChapterIndex < chapters.length - 1) {
      const nextIndex = currentChapterIndex + 1;
      setCurrentChapterIndex(nextIndex);
      document.getElementById(`chapter-${chapters[nextIndex].id}`)?.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentChapterIndex, chapters]);

  const prevChapter = useCallback(() => {
    if (currentChapterIndex > 0) {
      const prevIndex = currentChapterIndex - 1;
      setCurrentChapterIndex(prevIndex);
      document.getElementById(`chapter-${chapters[prevIndex].id}`)?.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentChapterIndex, chapters]);

  // Bookmark current position
  const handleBookmark = useCallback(() => {
    localStorage.setItem(`bookmark-${postId}`, JSON.stringify({
      chapterIndex: currentChapterIndex,
      scrollPosition: window.scrollY,
      timestamp: Date.now(),
    }));
    alert("Bookmark saved!");
  }, [postId, currentChapterIndex]);

  // Share post
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  }, []);

  // Keyboard shortcuts - memoize to prevent recreation
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    { key: "?", shift: true, description: "Show keyboard shortcuts", handler: () => setShowShortcuts(true) },
    { key: "t", description: "Toggle table of contents", handler: () => setShowTOC(prev => !prev) },
    { key: "j", description: "Next chapter", handler: nextChapter },
    { key: "k", description: "Previous chapter", handler: prevChapter },
    { key: "b", description: "Bookmark current position", handler: handleBookmark },
    { key: "s", description: "Share post", handler: handleShare },
    { key: "1", description: "Standard mode", handler: () => handleModeChange("standard") },
    { key: "2", description: "Focus mode", handler: () => handleModeChange("focus") },
    { key: "3", description: "Magazine mode", handler: () => handleModeChange("magazine") },
    { key: "4", description: "Timeline mode", handler: () => handleModeChange("timeline") },
    { key: "5", description: "Presentation mode", handler: () => handleModeChange("presentation") },
    { key: "6", description: "Immersive mode", handler: () => handleModeChange("immersive") },
    { key: "7", description: "Book mode", handler: () => handleModeChange("book") },
  ], [handleModeChange, nextChapter, prevChapter, handleBookmark, handleShare]);

  useKeyboardShortcuts({ shortcuts, enabled: mounted });

  const ModeComponent = readingModes[mode].component;

  if (!mounted) {
    return null;
  }

  return (
    <>
      <PrintStyles />

      {/* Reading Progress Bar - Enhanced with Indigo/Purple Gradient */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200/70 dark:bg-slate-800/70 z-50">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transition-all duration-200 shadow-sm"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mode Selector - Enterprise Design */}
      <div className="sticky top-6 z-40 flex justify-center mb-8 px-4">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl p-2 flex flex-wrap gap-2 border border-gray-200/70 dark:border-slate-800/70 ring-1 ring-indigo-500/10 dark:ring-indigo-500/20">
          {Object.entries(readingModes).map(([key, { icon: Icon, label }]) => (
            <Button
              key={key}
              variant={mode === key ? "default" : "ghost"}
              size="sm"
              onClick={() => handleModeChange(key as ReadingMode)}
              className={`rounded-xl transition-all duration-200 ${
                mode === key
                  ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-md ring-2 ring-indigo-500/20 dark:ring-indigo-500/30"
                  : "hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Icon className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline text-sm font-medium">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ModeComponent chapters={chapters} preferences={preferences} />

      {/* Table of Contents */}
      <EnhancedTableOfContents
        chapters={chapters}
        open={showTOC}
        onOpenChange={setShowTOC}
        onChapterView={trackChapterView}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        shortcuts={shortcuts}
      />

      {/* Reading Stats (Dev Only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono">
          <div>Reading: {Math.floor(readingTime / 60)}:{(readingTime % 60).toString().padStart(2, "0")}</div>
          <div>Progress: {Math.round(scrollDepth)}%</div>
          <div>Mode: {mode}</div>
        </div>
      )}
    </>
  );
}
