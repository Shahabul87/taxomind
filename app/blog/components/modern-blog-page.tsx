"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Calendar,
  Clock,
  Eye,
  MessageSquare,
  Bookmark,
  Share2,
  TrendingUp,
  Star,
  ChevronRight,
  Filter,
  ArrowRight,
  Sparkles,
  PenSquare,
  BookOpen,
  Award,
  Zap,
  Coffee,
  Code2,
  Palette,
  Brain,
  Rocket,
  Target,
  Users,
  Heart,
  ThumbsUp,
  ArrowUpRight,
  BarChart3,
  Hash,
  User,
  Shield,
  Globe,
  Lightbulb,
  FileText,
  Grid3X3,
  List
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category?: string;
  createdAt: Date;
  views: number;
  readingTime?: string;
  user: { name: string | null; image?: string };
  comments: { length: number };
  tags?: string[];
}

interface ModernBlogPageProps {
  featuredPosts: BlogPost[];
  initialPosts: BlogPost[];
  categories: { id: string; name: string; count: number }[];
  trendingPosts: BlogPost[];
}

// Modern Hero Section with Featured Article
const ModernHeroSection = ({ featuredPost }: { featuredPost?: BlogPost }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/25 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,white)]" />

      <div className="relative container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Blog Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium mb-6">
              <PenSquare className="w-4 h-4" />
              <span>Insights & Innovation</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent">
              Ideas That Shape Tomorrow
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              Explore cutting-edge insights on technology, innovation, and digital transformation.
              Join our community of forward-thinkers.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Articles</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">50K+</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Readers</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">100+</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Authors</div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="group">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Reading
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline">
                <PenSquare className="w-5 h-5 mr-2" />
                Write an Article
              </Button>
            </div>
          </motion.div>

          {/* Right Content - Featured Article */}
          {featuredPost && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-shadow duration-300">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={featuredPost.imageUrl || "/api/placeholder/800/400"}
                    alt={featuredPost.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <Badge className="absolute top-4 left-4 bg-purple-600 text-white">
                    Featured
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(featuredPost.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readingTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {featuredPost.views.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 line-clamp-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                    {featuredPost.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-3 mb-4">
                    {featuredPost.description}
                  </p>
                  <Link href={`/blog/${featuredPost.id}`}>
                    <Button className="w-full group">
                      Read Article
                      <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-purple-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-20" />
    </div>
  );
};

// Modern Blog Card Component
const ModernBlogCard = ({ post, index, viewMode = "grid" }: { post: BlogPost; index: number; viewMode?: "grid" | "list" }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const categoryColors: Record<string, string> = {
    "Programming": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Design": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    "Data Science": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "AI/ML": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    "DevOps": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  // List view layout
  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="w-full"
      >
        <Card className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 h-full">
          <div className="flex gap-5 p-5">
            {/* Image Thumbnail - Consistent Size */}
            <div className="relative flex-shrink-0 w-40 h-40 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
              {post.imageUrl && (
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              )}
              {post.category && (
                <Badge
                  className={cn(
                    "absolute top-2 left-2 text-xs h-5 px-2",
                    categoryColors[post.category] || "bg-slate-100 text-slate-700"
                  )}
                >
                  {post.category}
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  {/* Author and Date */}
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={post.user.image} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                        {post.user.name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {post.user.name || "Anonymous"} • {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>

                  {/* Title */}
                  <Link href={`/blog/${post.id}`}>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      {post.title}
                    </h3>
                  </Link>

                  {/* Description */}
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                    {post.description}
                  </p>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readingTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {post.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {post.comments.length}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => setIsBookmarked(!isBookmarked)}
                  >
                    <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current text-purple-600")} />
                  </Button>
                  <Link href={`/blog/${post.id}`}>
                    <Button size="sm" className="h-9 px-4">
                      Read
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Grid view layout (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900">
        {/* Image - Consistent Height */}
        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
          {post.imageUrl && (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 hover:scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Category Badge */}
          {post.category && (
            <Badge
              className={cn(
                "absolute top-3 left-3 h-6 px-2.5",
                categoryColors[post.category] || "bg-slate-100 text-slate-700"
              )}
            >
              {post.category}
            </Badge>
          )}

          {/* Bookmark Button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-3 right-3 h-9 w-9 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800"
            onClick={() => setIsBookmarked(!isBookmarked)}
          >
            <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current text-purple-600")} />
          </Button>
        </div>

        <CardContent className="p-5 flex-1 flex flex-col">
          {/* Author and Date */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-9 h-9">
              <AvatarImage src={post.user.image} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                {post.user.name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{post.user.name || "Anonymous"}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}
              </p>
            </div>
          </div>

          {/* Title */}
          <Link href={`/blog/${post.id}`}>
            <h3 className="text-lg font-bold mb-2 line-clamp-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer min-h-[3.5rem]">
              {post.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 flex-1">
            {post.description}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs h-5 px-2">
                  <Hash className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer Metrics */}
          <div className="flex items-center justify-between pt-3 border-t mt-auto">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readingTime}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {post.views.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {post.comments.length}
              </span>
            </div>
            <Link href={`/blog/${post.id}`}>
              <Button size="sm" variant="ghost" className="group h-8 px-3">
                Read
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Trending Sidebar Component
const TrendingSidebar = ({ posts }: { posts: BlogPost[] }) => {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Trending Now
          </h3>
          <Badge variant="secondary">Hot</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.map((post, index) => (
          <Link key={post.id} href={`/blog/${post.id}`}>
            <div className="flex gap-3 group cursor-pointer">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {post.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{post.user.name}</span>
                  <span>•</span>
                  <span>{post.views.toLocaleString()} views</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

// Newsletter Subscription Component
const NewsletterSection = () => {
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 mb-3">
            <Rocket className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Get the latest articles and insights delivered to your inbox weekly.
          </p>
        </div>
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Enter your email"
            className="bg-white dark:bg-slate-800"
          />
          <Button className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Subscribe Now
          </Button>
        </div>
        <p className="text-xs text-center mt-3 text-slate-500">
          Join 10,000+ subscribers. No spam, unsubscribe anytime.
        </p>
      </CardContent>
    </Card>
  );
};

// Main Modern Blog Page Component
export function ModernBlogPage({
  featuredPosts,
  initialPosts,
  categories,
  trendingPosts
}: ModernBlogPageProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "trending">("latest");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Advanced filter states
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [minViews, setMinViews] = useState<number>(0);
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month" | "year">("all");

  // Filter posts by category and search
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        post => post.category?.toLowerCase().replace(/\s+/g, '-') === selectedCategory
      );
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        post =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Views filter
    if (minViews > 0) {
      filtered = filtered.filter(post => post.views >= minViews);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case "today":
          filterDate.setDate(now.getDate() - 1);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(post => new Date(post.createdAt) >= filterDate);
    }

    // Sorting
    switch (sortBy) {
      case "popular":
        filtered = [...filtered].sort((a, b) => b.views - a.views);
        break;
      case "trending":
        filtered = [...filtered].sort((a, b) => {
          // Combine recency and views for trending
          const aScore = a.views / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
          const bScore = b.views / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
          return bScore - aScore;
        });
        break;
      case "latest":
      default:
        filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  }, [posts, selectedCategory, searchQuery, minViews, dateRange, sortBy]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <ModernHeroSection featuredPost={featuredPosts[0]} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Input - Consistent Height */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
            <div className="flex gap-3">
              {/* Sort Dropdown - Consistent Height */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[160px] h-11">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>

              {/* Advanced Filters Popover - Consistent Height */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-11 px-4">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {(minViews > 0 || dateRange !== "all") && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                        {(minViews > 0 ? 1 : 0) + (dateRange !== "all" ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Advanced Filters</h4>
                      <Separator />
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="date-range">Date Range</Label>
                      <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                        <SelectTrigger id="date-range" className="h-10">
                          <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Minimum Views Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="min-views">Minimum Views: {minViews > 0 ? minViews.toLocaleString() : "Any"}</Label>
                      <Slider
                        id="min-views"
                        min={0}
                        max={10000}
                        step={100}
                        value={[minViews]}
                        onValueChange={(value) => setMinViews(value[0])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>0</span>
                        <span>10K+</span>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex justify-between pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9"
                        onClick={() => {
                          setMinViews(0);
                          setDateRange("all");
                        }}
                      >
                        Clear All
                      </Button>
                      <Button size="sm" className="h-9">Apply Filters</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* View Mode Toggle - Consistent Height */}
              <div className="hidden md:flex items-center border rounded-lg h-11">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none h-9 w-11"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none h-9 w-11"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Category Tabs - Consistent Height */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-slate-100 dark:bg-slate-800 h-11">
              {categories.map(category => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="whitespace-nowrap h-9 px-4"
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {category.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Featured Section */}
            {selectedCategory === "all" && featuredPosts.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-500" />
                    Editor&apos;s Picks
                  </h2>
                  <Link href="/blog/featured">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredPosts.slice(1, 3).map((post, index) => (
                    <ModernBlogCard key={post.id} post={post} index={index} viewMode="grid" />
                  ))}
                </div>
              </div>
            )}

            {/* All Posts Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {selectedCategory === "all" ? "Latest Articles" : `${selectedCategory} Articles`}
                </h2>
                <span className="text-sm text-slate-500">
                  {filteredPosts.length} articles found
                </span>
              </div>

              {filteredPosts.length > 0 ? (
                <div className={cn(
                  viewMode === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"
                )}>
                  {filteredPosts.map((post, index) => (
                    <ModernBlogCard key={post.id} post={post} index={index} viewMode={viewMode} />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                  <p className="text-slate-500">Try adjusting your search or filters</p>
                </Card>
              )}

              {/* Load More */}
              {filteredPosts.length > 9 && (
                <div className="text-center mt-8">
                  <Button size="lg" variant="outline">
                    Load More Articles
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Trending Posts */}
            <TrendingSidebar posts={trendingPosts} />

            {/* Newsletter */}
            <NewsletterSection />

            {/* Popular Tags */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Popular Topics
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "Next.js", "AI", "Web3", "Design", "Performance", "Security"].map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Authors */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Contributors
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {String.fromCharCode(65 + index)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Author Name</p>
                      <p className="text-xs text-slate-500">{10 - index * 2} articles</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Follow
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}