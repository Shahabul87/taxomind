"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  X,
  SlidersHorizontal,
  TrendingUp,
  BookOpen,
  Users,
  Star,
  Clock,
  DollarSign,
  Loader2,
  BarChart3,
  Sparkles,
  Route,
  Shield,
  Award,
  Zap,
  Brain,
  Target,
  Activity,
  ArrowRight,
  CheckCircle2,
  Globe,
  Briefcase,
  GraduationCap,
  Trophy,
  Flame,
  Rocket,
  Code2,
  Database,
  Cloud,
  Cpu,
  Lock,
  Palette,
  Heart
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Modern Course Card Component
const ModernCourseCard = ({ course, viewMode }: any) => {
  const [isHovered, setIsHovered] = useState(false);

  // Ensure image URLs use HTTPS for Next.js Image component
  const secureImageUrl = course.imageUrl?.replace(/^http:\/\//i, 'https://') || null;
  const secureInstructorAvatar = course.instructor?.avatar?.replace(/^http:\/\//i, 'https://');

  return (
    <Link href={`/courses/${course.id}`} className="block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -4 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative"
      >
        <Card className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900">
        {/* Image Section with Overlay */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
          {secureImageUrl && (
            <Image
              src={secureImageUrl}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {course.badges?.map((badge: string, index: number) => (
              <Badge
                key={index}
                className={cn(
                  "backdrop-blur-sm",
                  badge === "Hot" && "bg-red-500/90 text-white",
                  badge === "New" && "bg-emerald-500/90 text-white",
                  badge === "Bestseller" && "bg-purple-500/90 text-white"
                )}
              >
                {badge === "Hot" && <Flame className="w-3 h-3 mr-1" />}
                {badge === "New" && <Sparkles className="w-3 h-3 mr-1" />}
                {badge === "Bestseller" && <Trophy className="w-3 h-3 mr-1" />}
                {badge}
              </Badge>
            ))}
          </div>

          {/* Price Badge */}
          <div className="absolute top-3 right-3">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg px-3 py-1.5">
              {course.price === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE</span>
              ) : (
                <div className="flex items-center gap-2">
                  {course.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      ${course.originalPrice}
                    </span>
                  )}
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    ${course.price}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Category Pill */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
              {course.category.name}
            </Badge>
          </div>
        </div>

        <CardContent className="p-5">
          {/* Instructor Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400">
              {secureInstructorAvatar ? (
                <Image
                  src={secureInstructorAvatar}
                  alt={course.instructor.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
                  {course.instructor?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{course.instructor?.name}</p>
            </div>
            {course.isEnrolled && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Enrolled
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {course.description}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="font-medium">{course.rating?.toFixed(1)}</span>
              <span className="text-muted-foreground">({course.reviewsCount})</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{course.enrolledCount?.toLocaleString()} students</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{course.duration} hours</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              <span>{course.lessonsCount} lessons</span>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-4">
            {course.hasCertificate && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs">
                      <Award className="w-3 h-3 mr-1" />
                      Certificate
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Certificate of Completion</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {course.difficulty && (
              <Badge variant="outline" className="text-xs">
                {course.difficulty}
              </Badge>
            )}
            {course.hasExercises && (
              <Badge variant="outline" className="text-xs">
                <Code2 className="w-3 h-3 mr-1" />
                Exercises
              </Badge>
            )}
          </div>

          {/* Progress Bar (if enrolled) */}
          {course.isEnrolled && course.progress !== null && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1 group/btn"
              variant={course.isEnrolled ? "secondary" : "default"}
            >
              {course.isEnrolled ? "Continue Learning" : "Enroll Now"}
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
            </Button>
            <Button size="icon" variant="outline">
              <Heart className={cn("w-4 h-4", course.isWishlisted && "fill-current text-red-500")} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
    </Link>
  );
};

// Modern Hero Section
const ModernHeroSection = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="relative container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm">Trusted by 50,000+ learners worldwide</span>
          </div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent"
          >
            Master Tomorrow&apos;s Skills Today
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/80 mb-12 max-w-2xl mx-auto"
          >
            Accelerate your career with AI-powered personalized learning.
            Industry-led courses designed for the modern professional.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="What do you want to learn today?"
                className="pl-12 pr-32 py-6 text-lg bg-white/95 backdrop-blur-sm text-slate-900 border-0"
              />
              <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Search
              </Button>
            </div>
          </motion.div>

          {/* Popular Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mt-8"
          >
            {["AI & Machine Learning", "Web Development", "Data Science", "Cloud Computing", "Cybersecurity"].map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 cursor-pointer transition-all"
              >
                {cat}
              </Badge>
            ))}
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-pink-500 rounded-full blur-3xl opacity-30" />
      </div>
    </div>
  );
};

// Modern Stats Bar
const ModernStatsBar = ({ stats }: any) => {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-y">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { icon: BookOpen, label: "Total Courses", value: stats.totalCourses, color: "text-purple-600" },
            { icon: TrendingUp, label: "New This Week", value: stats.newCoursesThisWeek, color: "text-emerald-600" },
            { icon: Users, label: "Active Learners", value: `${stats.activeLearners}+`, color: "text-blue-600" },
            { icon: Star, label: "Avg. Rating", value: stats.averageRating, color: "text-amber-600" },
            { icon: Trophy, label: "Completion Rate", value: `${stats.completionRate}%`, color: "text-pink-600" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <stat.icon className={cn("w-6 h-6 mx-auto mb-2", stat.color)} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Modern Filter Sidebar
const ModernFilterSidebar = ({
  filterOptions,
  selectedCategories,
  setSelectedCategories,
  selectedPriceRange,
  setSelectedPriceRange,
  selectedDifficulties,
  setSelectedDifficulties,
  onClearAll
}: any) => {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Filters</h3>
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categories */}
        <div>
          <h4 className="font-medium mb-3">Categories</h4>
          <div className="space-y-2">
            {filterOptions.categories.map((category: any) => (
              <label key={category.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, category.id]);
                    } else {
                      setSelectedCategories(selectedCategories.filter((c: string) => c !== category.id));
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="flex-1 text-sm group-hover:text-primary transition-colors">
                  {category.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div>
          <h4 className="font-medium mb-3">Price Range</h4>
          <div className="space-y-2">
            {filterOptions.priceRanges.map((range: any) => (
              <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="priceRange"
                  checked={selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max}
                  onChange={() => setSelectedPriceRange({ min: range.min, max: range.max })}
                  className="rounded-full"
                />
                <span className="text-sm group-hover:text-primary transition-colors">
                  {range.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* Difficulty */}
        <div>
          <h4 className="font-medium mb-3">Difficulty Level</h4>
          <div className="space-y-2">
            {filterOptions.difficulties.map((diff: any) => (
              <label key={diff.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedDifficulties.includes(diff.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDifficulties([...selectedDifficulties, diff.value]);
                    } else {
                      setSelectedDifficulties(selectedDifficulties.filter((d: string) => d !== diff.value));
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="flex-1 text-sm group-hover:text-primary transition-colors">
                  {diff.label}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {diff.count}
                </Badge>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Modern Courses Page Component
export function ModernCoursesPage({
  initialCourses,
  filterOptions,
  totalCourses,
  userId
}: any) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State Management
  const [courses, setCourses] = useState(initialCourses);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<any>(null);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedPriceRange(null);
    setSelectedDifficulties([]);
    setSearchQuery("");
    setSortBy("relevance");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (selectedPriceRange) count++;
    if (selectedDifficulties.length > 0) count += selectedDifficulties.length;
    return count;
  }, [selectedCategories, selectedPriceRange, selectedDifficulties]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Modern Hero Section */}
      <ModernHeroSection />

      {/* Stats Bar */}
      <ModernStatsBar
        stats={{
          totalCourses,
          newCoursesThisWeek: 12,
          activeLearners: 1234,
          averageRating: 4.5,
          completionRate: 78
        }}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Controls Bar */}
        <div className="mb-8">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button variant="outline" className="group">
              <Brain className="w-4 h-4 mr-2 text-purple-600" />
              AI Recommendations
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" className="group">
              <Route className="w-4 h-4 mr-2 text-blue-600" />
              Learning Paths
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" className="group">
              <Zap className="w-4 h-4 mr-2 text-amber-600" />
              Quick Start
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" className="group">
              <Target className="w-4 h-4 mr-2 text-emerald-600" />
              Career Goals
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-full mt-4">
                  <ModernFilterSidebar
                    filterOptions={filterOptions}
                    selectedCategories={selectedCategories}
                    setSelectedCategories={setSelectedCategories}
                    selectedPriceRange={selectedPriceRange}
                    setSelectedPriceRange={setSelectedPriceRange}
                    selectedDifficulties={selectedDifficulties}
                    setSelectedDifficulties={setSelectedDifficulties}
                    onClearAll={clearAllFilters}
                  />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Most Relevant</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden md:flex items-center border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <ModernFilterSidebar
                filterOptions={filterOptions}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                selectedPriceRange={selectedPriceRange}
                setSelectedPriceRange={setSelectedPriceRange}
                selectedDifficulties={selectedDifficulties}
                setSelectedDifficulties={setSelectedDifficulties}
                onClearAll={clearAllFilters}
              />
            </div>
          </aside>

          {/* Courses Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="h-96" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map((course: any) => (
                  <ModernCourseCard
                    key={course.id}
                    course={course}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}