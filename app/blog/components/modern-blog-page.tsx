"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import MyPostCard from "../blog-card";
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
  List,
  X,
  Home
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

// Featured Article Component with Horizontal Layout - Compact Version
const FeaturedArticleCard = ({ post, index }: { post: BlogPost; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/blog/${post.id}`}>
        <Card className="overflow-hidden bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group cursor-pointer h-[145px]">
          {/* Horizontal Layout: Image Left, Content Right */}
          <div className="flex h-full">
            {/* Image Section - Left */}
            <div className="relative w-[35%] overflow-hidden">
              <Image
                src={post.imageUrl || "/api/placeholder/800/400"}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/50" />
              {index === 0 && (
                <Badge className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md border-0 px-2 py-0.5 text-xs">
                  Featured
                </Badge>
              )}
            </div>

            {/* Content Section - Right */}
            <div className="w-[65%] p-3 flex flex-col justify-between">
              {/* Top Section */}
              <div>
                {/* Metadata */}
                <div className="flex items-center gap-2 mb-1.5 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {post.readingTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-2.5 h-2.5" />
                    {post.views.toLocaleString()}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold mb-1.5 line-clamp-2 text-white group-hover:text-blue-400 transition-colors leading-tight">
                  {post.title}
                </h3>

                {/* Description */}
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
                  {post.description}
                </p>
              </div>

              {/* CTA Button */}
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 w-full h-7 text-[11px] mt-1.5">
                Read Article
                <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

// Modern Hero Section with Recent Articles
const ModernHeroSection = ({
  featuredPosts,
  statistics,
  isLoading
}: {
  featuredPosts: BlogPost[];
  statistics?: BlogStatistics | null;
  isLoading?: boolean;
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      tag: "Tech Insights",
      title: "Ideas That Shape Tomorrow",
      subtitle: "Explore cutting-edge insights on technology, innovation, and digital transformation. Join our community of forward-thinkers.",
      gradient: "from-blue-600 via-indigo-600 to-purple-600"
    },
    {
      id: 2,
      tag: "Innovation Hub",
      title: "Learn From Industry Experts",
      subtitle: "Discover thought leadership, best practices, and real-world experiences from top technology professionals.",
      gradient: "from-emerald-600 via-teal-600 to-cyan-600"
    },
    {
      id: 3,
      tag: "Knowledge Base",
      title: "Master Modern Technologies",
      subtitle: "Deep-dive tutorials, comprehensive guides, and practical insights to accelerate your technical journey.",
      gradient: "from-purple-600 via-pink-600 to-rose-600"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlideData = slides[currentSlide];

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${Math.floor(num / 1000)}K+`;
    }
    return `${num}+`;
  };

  return (
    <div className="relative min-h-[85vh] flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000" />

        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]" />
      </div>

      {/* Breadcrumb Navigation */}
      <div className="relative z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors group"
            >
              <Home className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="font-medium">Home</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-500" />
            <span className="text-white font-semibold">Blog</span>
          </nav>
        </div>
      </div>

      <div className="relative flex-1 flex items-center container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Tag Badge with Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Badge className="bg-white/10 backdrop-blur-md border-white/20 text-white px-4 py-2 text-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {currentSlideData.tag}
                </Badge>
              </motion.div>
            </AnimatePresence>

            {/* Main Heading with Slide Animation */}
            <AnimatePresence mode="wait">
              <motion.h1
                key={`title-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
              >
                <span className={cn(
                  "bg-gradient-to-r bg-clip-text text-transparent",
                  currentSlideData.gradient
                )}>
                  {currentSlideData.title.split(' ').slice(0, 2).join(' ')}
                </span>
                {' '}
                <span className="text-white">
                  {currentSlideData.title.split(' ').slice(2).join(' ')}
                </span>
              </motion.h1>
            </AnimatePresence>

            {/* Subtitle with Animation */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`subtitle-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl"
              >
                {currentSlideData.subtitle}
              </motion.p>
            </AnimatePresence>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row flex-wrap gap-4"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl px-8 py-6 text-lg group w-full sm:w-auto"
              >
                Start Reading
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-8 py-6 text-lg group w-full sm:w-auto"
              >
                <PenSquare className="mr-2 w-5 h-5" />
                Write an Article
              </Button>
            </motion.div>

            {/* Live Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-4 sm:gap-6 pt-4"
            >
              <div className="flex items-center gap-2 min-w-[140px]">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <p className="text-xl sm:text-2xl font-bold text-white animate-pulse">--</p>
                  ) : (
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {formatNumber(statistics?.publishedArticles || 0)}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-slate-400 truncate">Published Articles</p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-[140px]">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <p className="text-xl sm:text-2xl font-bold text-white animate-pulse">--</p>
                  ) : (
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {formatNumber(statistics?.totalReaders || 0)}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-slate-400 truncate">Active Readers</p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-[140px]">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <p className="text-xl sm:text-2xl font-bold text-white animate-pulse">--</p>
                  ) : (
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {formatNumber(statistics?.totalAuthors || 0)}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-slate-400 truncate">Expert Authors</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Floating Cards Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block relative"
          >
            <div className="relative">
              {/* Floating Card 1 - Top */}
              {featuredPosts[0] && (
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0 right-0 w-80"
                >
                  <Link href={`/blog/${featuredPosts[0].id}`}>
                    <Card className="overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-2xl hover:shadow-3xl transition-all cursor-pointer group">
                      <div className="relative h-32">
                        <Image
                          src={featuredPosts[0].imageUrl || "/api/placeholder/800/400"}
                          alt={featuredPosts[0].title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <Badge className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 text-xs px-2 py-1">
                          Featured
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-sm line-clamp-2 text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {featuredPosts[0].title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {featuredPosts[0].views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {featuredPosts[0].readingTime}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )}

              {/* Floating Card 2 - Middle */}
              {featuredPosts[1] && (
                <motion.div
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute top-56 left-0 w-72"
                >
                  <Link href={`/blog/${featuredPosts[1].id}`}>
                    <Card className="overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-2xl hover:shadow-3xl transition-all cursor-pointer group">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">
                              Trending Now
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {featuredPosts[1].views.toLocaleString()} views
                            </p>
                          </div>
                        </div>
                        <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                          {featuredPosts[1].title}
                        </h4>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )}

              {/* Floating Card 3 - Bottom Right */}
              {featuredPosts[2] && (
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute top-[26rem] -right-10 w-64"
                >
                  <Card className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-2xl p-5 text-white">
                    <BookOpen className="w-8 h-8 mb-3 opacity-90" />
                    <p className="font-bold text-2xl mb-1">
                      {formatNumber(statistics?.publishedArticles || 50)}
                    </p>
                    <p className="text-sm opacity-90">Articles Published</p>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-white/30 border-2 border-purple-500" />
                        ))}
                      </div>
                      <span className="opacity-75">+{formatNumber(statistics?.totalAuthors || 20)} authors</span>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/30"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Old ModernBlogCard component removed - now using MyPostCard from blog-card.tsx

// Trending Sidebar Component - Redesigned
const TrendingSidebar = ({ posts }: { posts: BlogPost[] }) => {
  const gradients = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-purple-500"
  ];

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Trending Now
          </h3>
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-3 py-1 text-xs font-semibold shadow-md">
            Hot
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
          {posts.slice(0, 5).map((post, index) => (
            <Link key={post.id} href={`/blog/${post.id}`}>
              <div className="px-5 py-4 group cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all duration-200">
                <div className="flex gap-4 items-start">
                  {/* Gradient Number Badge */}
                  <div className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${gradients[index]} text-white flex items-center justify-center font-bold text-lg shadow-lg`}>
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold line-clamp-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 leading-tight">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.user.name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Newsletter Subscription Component
const NewsletterSection = () => {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-slate-200/50 dark:border-slate-700/50 shadow-sm rounded-xl">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 mb-3">
            <Rocket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
// Blog Statistics Interface
interface BlogStatistics {
  totalArticles: number;
  publishedArticles: number;
  totalReaders: number;
  totalAuthors: number;
  totalViews: number;
  totalComments: number;
  averageViews: number;
  popularCategories: Array<{ category: string; count: number }>;
}

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
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [statistics, setStatistics] = useState<BlogStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Advanced filter states
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [minViews, setMinViews] = useState<number>(0);
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month" | "year">("all");

  // Fetch blog statistics on mount
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setStatsLoading(true);
        const response = await fetch('/api/blog/statistics');
        const result = await response.json();

        if (result.success && result.data) {
          setStatistics(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch blog statistics:', error);
        // Fallback to default values
        setStatistics({
          totalArticles: initialPosts.length,
          publishedArticles: initialPosts.length,
          totalReaders: 50000,
          totalAuthors: 100,
          totalViews: 0,
          totalComments: 0,
          averageViews: 0,
          popularCategories: [],
        });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStatistics();
  }, [initialPosts.length]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Hero Section */}
      <ModernHeroSection
        featuredPosts={featuredPosts}
        statistics={statistics}
        isLoading={statsLoading}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Search and Filter Bar - Sticky */}
        <div className="sticky top-0 z-40 mb-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 pb-4 -mx-4 px-4 pt-4 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            {/* Search Input - Consistent Height */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-5 w-5" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 text-base bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {/* Sort Dropdown - Consistent Height */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[160px] h-11 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>

              {/* Advanced Filters Popover - Consistent Height */}
              <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-11 px-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700/80 w-full sm:w-auto">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {(minViews > 0 || dateRange !== "all") && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                        {(minViews > 0 ? 1 : 0) + (dateRange !== "all" ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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
                      <Button
                        size="sm"
                        className="h-9"
                        onClick={() => setIsFilterPopoverOpen(false)}
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* View Mode Toggle - Consistent Height */}
              <div className="hidden md:flex items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-lg h-11">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none h-9 w-11 text-slate-900 dark:text-white"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none h-9 w-11 text-slate-900 dark:text-white"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || minViews > 0 || dateRange !== "all") && (
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: &quot;{searchQuery}&quot;
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {minViews > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Min views: {minViews.toLocaleString()}
                  <button
                    onClick={() => setMinViews(0)}
                    className="ml-1 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {dateRange !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Date: {dateRange}
                  <button
                    onClick={() => setDateRange("all")}
                    className="ml-1 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Category Tabs - Non-Sticky, Below Search/Filter */}
        <div className="mb-8">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 h-11">
              {categories.map(category => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="whitespace-nowrap h-9 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
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
                    <MyPostCard
                      key={post.id}
                      post={{
                        id: post.id,
                        title: post.title,
                        description: post.description,
                        imageUrl: post.imageUrl || null,
                        published: true,
                        category: post.category || null,
                        createdAt: post.createdAt.toISOString(),
                        comments: post.comments,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Posts Grid */}
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {selectedCategory === "all" ? "Latest Articles" : `${categories.find(c => c.id === selectedCategory)?.name} Articles`}
                  </h2>
                  <Badge variant="secondary" className="text-sm">
                    {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}
                  </Badge>
                </div>

                {/* Active Filters Indicator */}
                {(searchQuery || selectedCategory !== "all" || minViews > 0 || dateRange !== "all" || sortBy !== "latest") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setMinViews(0);
                      setDateRange("all");
                      setSortBy("latest");
                    }}
                    className="h-8 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Reset all filters
                  </Button>
                )}
              </div>

              {filteredPosts.length > 0 ? (
                <div className={cn(
                  viewMode === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-6" : "grid md:grid-cols-2 xl:grid-cols-3 gap-6"
                )}>
                  {filteredPosts.map((post, index) => (
                    <MyPostCard
                      key={post.id}
                      post={{
                        id: post.id,
                        title: post.title,
                        description: post.description,
                        imageUrl: post.imageUrl || null,
                        published: true,
                        category: post.category || null,
                        createdAt: post.createdAt.toISOString(),
                        comments: post.comments,
                      }}
                    />
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
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm rounded-xl">
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
                      className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Authors */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm rounded-xl">
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