"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book,
  BookOpen,
  Columns,
  Eye,
  EyeOff,
  FileText,
  Layers,
  LayoutGrid,
  LayoutList,
  Maximize,
  Minimize,
  Moon,
  Newspaper,
  Settings,
  Sun,
  Type,
  Clock,
  Bookmark,
  Download,
  Printer,
  List,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PostChapterCard from "./post-chapter-card";
import PostCardModelTwo from "./post-card-model-two";
import { PostCardCarouselDemo } from "./post-card-carousel-model-demo";
import { PostCardFlipBook } from "./post-card-flip-book";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PostChapterSection {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  postId: string;
  isPublished: boolean | null;
  isFree: boolean | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  content: string | null;
}

interface PostData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  PostChapterSection: PostChapterSection[];
  [key: string]: unknown;
}

interface ReadingModesProps {
  post: PostData;
}

// Reading mode definitions with enhanced metadata
const readingModes = [
  {
    id: 2,
    name: "Chapter Cards",
    icon: LayoutGrid,
    description: "Card-based chapter layout",
    desktopOnly: true,
    color: "blue",
  },
  {
    id: 3,
    name: "Normal",
    icon: FileText,
    description: "Traditional article view",
    desktopOnly: false,
    color: "green",
  },
  {
    id: 4,
    name: "Carousel",
    icon: LayoutList,
    description: "Swipeable chapter carousel",
    desktopOnly: false,
    color: "orange",
  },
  {
    id: 5,
    name: "FlipBook",
    icon: BookOpen,
    description: "Interactive book-style reading",
    desktopOnly: true,
    color: "pink",
  },
];

const ReadingModesRedesigned = ({ post }: ReadingModesProps) => {
  // State management
  const [fontSize, setFontSize] = useState<number>(16);
  const [lineHeight, setLineHeight] = useState<number>(1.6);
  const [alignment, setAlignment] = useState<"left" | "center" | "justify">("left");
  const [theme, setTheme] = useState<"light" | "dark" | "sepia">("light");
  const [activeMode, setActiveMode] = useState<number>(3);
  const [mounted, setMounted] = useState<boolean>(false);
  const [showToolbar, setShowToolbar] = useState<boolean>(true);
  const [showTOC, setShowTOC] = useState<boolean>(false);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [estimatedReadTime, setEstimatedReadTime] = useState<number>(0);
  const [bookmarkedChapters, setBookmarkedChapters] = useState<Set<string>>(new Set());

  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize component
  useEffect(() => {
    setMounted(true);

    // Load preferences from localStorage
    if (typeof window !== "undefined") {
      const savedPreferences = localStorage.getItem("reading-preferences");
      if (savedPreferences) {
        const prefs = JSON.parse(savedPreferences);
        setFontSize(prefs.fontSize || 16);
        setLineHeight(prefs.lineHeight || 1.6);
        setAlignment(prefs.alignment || "left");
        setTheme(prefs.theme || "light");
      }

      // Set initial mode based on screen size
      const isLargeScreen = window.innerWidth >= 1024;
      setActiveMode(isLargeScreen ? 2 : 3);
    }

    // Calculate estimated reading time (average 200 words per minute)
    const totalWords = post.PostChapterSection.reduce((acc, chapter) => {
      const words = chapter.description?.split(/\s+/).length || 0;
      return acc + words;
    }, 0);
    setEstimatedReadTime(Math.ceil(totalWords / 200));
  }, [post.PostChapterSection]);

  // Save preferences to localStorage
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      const preferences = {
        fontSize,
        lineHeight,
        alignment,
        theme,
      };
      localStorage.setItem("reading-preferences", JSON.stringify(preferences));
    }
  }, [fontSize, lineHeight, alignment, theme, mounted]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const windowHeight = window.innerHeight;
      const documentHeight = contentRef.current.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100;

      setReadingProgress(Math.min(Math.max(progress, 0), 100));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Responsive mode switching
  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      const currentMode = readingModes.find((m) => m.id === activeMode);

      if (!isLargeScreen && currentMode?.desktopOnly) {
        setActiveMode(3); // Switch to Normal mode on smaller screens
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeMode]);

  // Handlers
  const handleFontSizeChange = useCallback((value: number[]) => {
    setFontSize(Math.min(Math.max(value[0], 12), 28));
  }, []);

  const handleLineHeightChange = useCallback((value: number[]) => {
    setLineHeight(Math.min(Math.max(value[0], 1.2), 2.5));
  }, []);

  const toggleBookmark = useCallback((chapterId: string) => {
    setBookmarkedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    setFontSize(16);
    setLineHeight(1.6);
    setAlignment("left");
    setTheme("light");
  }, []);

  if (!mounted) {
    return null;
  }

  const currentMode = readingModes.find((m) => m.id === activeMode);

  return (
    <div className="flex flex-col w-full relative">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 z-50 origin-left"
        style={{ scaleX: readingProgress / 100 }}
        initial={{ scaleX: 0 }}
      />

      {/* Advanced Toolbar */}
      <AnimatePresence>
        {showToolbar && !focusMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-40 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm"
          >
            <div className="w-full px-4 py-3">
              {/* Top Row - Mode Selection */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Reading Mode
                  </span>
                  {currentMode && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      ({currentMode.description})
                    </span>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  {/* TOC Toggle */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTOC(!showTOC)}
                          className={cn(
                            "h-8 w-8 p-0",
                            showTOC && "bg-purple-100 dark:bg-purple-900/30"
                          )}
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Table of Contents</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Focus Mode Toggle */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFocusMode(!focusMode)}
                          className="h-8 w-8 p-0"
                        >
                          {focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Toolbar Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowToolbar(false)}
                    className="h-8 w-8 p-0"
                  >
                    {showToolbar ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Bottom Row - Reading Modes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {readingModes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = activeMode === mode.id;
                  const isDisabled = mode.desktopOnly && typeof window !== "undefined" && window.innerWidth < 1024;

                  return (
                    <TooltipProvider key={mode.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.button
                            onClick={() => !isDisabled && setActiveMode(mode.id)}
                            disabled={isDisabled}
                            whileHover={!isDisabled ? { scale: 1.02 } : {}}
                            whileTap={!isDisabled ? { scale: 0.98 } : {}}
                            className={cn(
                              "relative p-3 rounded-lg border-2 transition-all duration-200 group",
                              "flex flex-col items-center justify-center gap-1.5",
                              isActive
                                ? `border-${mode.color}-500 bg-${mode.color}-50 dark:bg-${mode.color}-900/20`
                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50",
                              isDisabled && "opacity-40 cursor-not-allowed",
                              !isActive && !isDisabled && "hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800",
                              mode.desktopOnly && "hidden lg:flex"
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? `text-${mode.color}-600 dark:text-${mode.color}-400` : "text-gray-600 dark:text-gray-400"
                              )}
                            />
                            <span
                              className={cn(
                                "text-xs font-medium transition-colors",
                                isActive ? `text-${mode.color}-700 dark:text-${mode.color}-300` : "text-gray-700 dark:text-gray-300"
                              )}
                            >
                              {mode.name}
                            </span>
                            {isActive && (
                              <motion.div
                                layoutId="activeIndicator"
                                className={`absolute inset-0 rounded-lg border-2 border-${mode.color}-500 pointer-events-none`}
                                transition={{ type: "spring", duration: 0.5 }}
                              />
                            )}
                          </motion.button>
                        </TooltipTrigger>
                        <TooltipContent>{mode.description}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>

              {/* Reader Controls Row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 gap-4 flex-wrap">
                {/* Left Side - Typography Controls */}
                <div className="flex items-center gap-4">
                  {/* Font Size */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFontSize((prev) => Math.max(prev - 1, 12))}
                      className="h-7 w-7 p-0"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex flex-col items-center min-w-[80px]">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Font</span>
                      <Slider
                        value={[fontSize]}
                        onValueChange={handleFontSizeChange}
                        min={12}
                        max={28}
                        step={1}
                        className="w-20"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{fontSize}px</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFontSize((prev) => Math.min(prev + 1, 28))}
                      className="h-7 w-7 p-0"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Line Height */}
                  <div className="flex flex-col items-center min-w-[80px]">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Spacing</span>
                    <Slider
                      value={[lineHeight]}
                      onValueChange={handleLineHeightChange}
                      min={1.2}
                      max={2.5}
                      step={0.1}
                      className="w-20"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{lineHeight.toFixed(1)}</span>
                  </div>

                  {/* Alignment */}
                  <div className="flex gap-1">
                    {[
                      { value: "left" as const, icon: AlignLeft },
                      { value: "center" as const, icon: AlignCenter },
                      { value: "justify" as const, icon: AlignJustify },
                    ].map(({ value, icon: Icon }) => (
                      <Button
                        key={value}
                        variant="ghost"
                        size="sm"
                        onClick={() => setAlignment(value)}
                        className={cn(
                          "h-7 w-7 p-0",
                          alignment === value && "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Right Side - Theme & Utils */}
                <div className="flex items-center gap-2">
                  {/* Reading Stats */}
                  <div className="hidden sm:flex items-center gap-3 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{estimatedReadTime} min</span>
                    </div>
                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{Math.round(readingProgress)}%</span>
                    </div>
                  </div>

                  {/* Theme Toggle */}
                  <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                    {[
                      { value: "light" as const, icon: Sun },
                      { value: "dark" as const, icon: Moon },
                      { value: "sepia" as const, icon: Sparkles },
                    ].map(({ value, icon: Icon }) => (
                      <Button
                        key={value}
                        variant="ghost"
                        size="sm"
                        onClick={() => setTheme(value)}
                        className={cn(
                          "h-7 w-7 p-0",
                          theme === value && "bg-white dark:bg-gray-700"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </Button>
                    ))}
                  </div>

                  {/* More Options Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Reader Settings</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print Article
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={resetPreferences}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset Preferences
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Toolbar Trigger */}
      {!showToolbar && !focusMode && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowToolbar(true)}
          className="fixed top-4 right-4 z-40 h-10 px-3 bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800"
        >
          <Maximize className="w-4 h-4 mr-2" />
          Show Controls
        </Button>
      )}

      {/* Table of Contents Sidebar */}
      <AnimatePresence>
        {showTOC && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30"
              onClick={() => setShowTOC(false)}
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Table of Contents</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowTOC(false)} className="h-8 w-8 p-0">
                    ×
                  </Button>
                </div>

                <div className="space-y-2">
                  {post.PostChapterSection.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        // Scroll to chapter (implementation needed)
                        setShowTOC(false);
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                              Chapter {index + 1}
                            </span>
                            {bookmarkedChapters.has(chapter.id) && (
                              <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                            {chapter.title}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div
        ref={contentRef}
        className={cn(
          "flex-1 w-full transition-all duration-300",
          focusMode && "pt-0",
          !focusMode && showToolbar && "pt-4"
        )}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          textAlign: alignment,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {activeMode === 2 && (
              <div className="hidden lg:grid grid-cols-1 gap-6">
                {post.PostChapterSection.map((chapter) => (
                  <PostChapterCard
                    key={chapter.id}
                    title={chapter.title}
                    description={chapter.description}
                    imageUrl={chapter.imageUrl}
                  />
                ))}
              </div>
            )}
            {activeMode === 3 && <PostCardModelTwo data={post.PostChapterSection} />}
            {activeMode === 4 && <PostCardCarouselDemo postchapter={post.PostChapterSection} />}
            {activeMode === 5 && (
              <div className="hidden lg:block">
                <PostCardFlipBook data={post.PostChapterSection} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReadingModesRedesigned;
