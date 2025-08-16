"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';
import {
  ExternalLink,
  Filter,
  Search,
  Star,
  Clock,
  BookOpen,
  Video,
  FileText,
  Code,
  Download,
  Sparkles,
  Shield,
  Brain,
  ChevronRight,
  Loader2,
  RefreshCw,
  Globe,
  Languages,
  Award,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ResourceIntelligenceContentProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  sectionTitle: string;
  courseTitle?: string;
  chapterTitle?: string;
}

interface ExternalResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "video" | "article" | "tutorial" | "documentation" | "course" | "book";
  source: string;
  language: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration?: string;
  author?: string;
  publishedDate?: string;
  qualityScore: number;
  relevanceScore: number;
  engagementScore: number;
  license: string;
  tags: string[];
  thumbnail?: string;
  views?: number;
  rating?: number;
  aiInsights?: {
    keyTopics: string[];
    learningOutcomes: string[];
    prerequisites: string[];
    bestFor: string[];
  };
}

interface ResourceCategory {
  id: string;
  label: string;
  icon: any;
  color: string;
  description: string;
}

const resourceCategories: ResourceCategory[] = [
  {
    id: "recommended",
    label: "AI Recommended",
    icon: Sparkles,
    color: "text-purple-600 dark:text-purple-400",
    description: "Personalized resources based on your learning style",
  },
  {
    id: "videos",
    label: "Video Tutorials",
    icon: Video,
    color: "text-red-600 dark:text-red-400",
    description: "Visual learning content from top platforms",
  },
  {
    id: "articles",
    label: "Articles & Blogs",
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    description: "In-depth written content and guides",
  },
  {
    id: "interactive",
    label: "Interactive",
    icon: Code,
    color: "text-green-600 dark:text-green-400",
    description: "Hands-on coding exercises and playgrounds",
  },
  {
    id: "documentation",
    label: "Documentation",
    icon: BookOpen,
    color: "text-orange-600 dark:text-orange-400",
    description: "Official docs and references",
  },
];

export function ResourceIntelligenceContent({
  courseId,
  chapterId,
  sectionId,
  sectionTitle,
  courseTitle,
  chapterTitle,
}: ResourceIntelligenceContentProps) {
  const [activeCategory, setActiveCategory] = useState("recommended");
  const [resources, setResources] = useState<ExternalResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<ExternalResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch resources from SAM AI
  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/sam/resource-intelligence", {
        action: "discover-resources",
        data: {
          topics: [sectionTitle, courseTitle, chapterTitle].filter(Boolean),
          courseId,
          sectionId,
          qualityThreshold: 0.7,
          maxResults: 20,
          includeAIInsights: true,
        },
      });

      if (response.data.success) {
        setResources(response.data.data.resources || []);
        setLastUpdated(new Date());
        toast.success("Resources discovered successfully!");
      }
    } catch (error: any) {
      logger.error("Failed to fetch resources:", error);
      toast.error("Failed to discover resources");
      // Use demo data as fallback
      setResources(getDemoResources());
    } finally {
      setIsLoading(false);
    }
  }, [courseId, sectionId, sectionTitle, courseTitle, chapterTitle]);

  // Initial fetch
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Filter resources based on category, search, and filters
  useEffect(() => {
    let filtered = [...resources];

    // Category filter
    if (activeCategory !== "recommended") {
      const categoryTypeMap: Record<string, string[]> = {
        videos: ["video", "course"],
        articles: ["article", "tutorial", "blog"],
        interactive: ["tutorial", "course"],
        documentation: ["documentation", "book"],
      };
      
      const allowedTypes = categoryTypeMap[activeCategory] || [];
      filtered = filtered.filter((r) => allowedTypes.includes(r.type));
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Language filter
    if (languageFilter !== "all") {
      filtered = filtered.filter((r) => r.language === languageFilter);
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter((r) => r.difficulty === difficultyFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "relevance":
          return b.relevanceScore - a.relevanceScore;
        case "quality":
          return b.qualityScore - a.qualityScore;
        case "engagement":
          return b.engagementScore - a.engagementScore;
        case "recent":
          return new Date(b.publishedDate || 0).getTime() - new Date(a.publishedDate || 0).getTime();
        default:
          return 0;
      }
    });

    setFilteredResources(filtered);
  }, [resources, activeCategory, searchQuery, languageFilter, difficultyFilter, sortBy]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "article":
      case "blog":
        return <FileText className="w-4 h-4" />;
      case "tutorial":
      case "course":
        return <Code className="w-4 h-4" />;
      case "documentation":
      case "book":
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 dark:text-green-400";
    if (score >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "intermediate":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "advanced":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            SAM AI Resource Hub
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Curated external resources to enhance your learning
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Updated {lastUpdated.toLocaleTimeString()}
            </Badge>
          )}
          <Button
            onClick={fetchResources}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-gray-100 dark:bg-gray-800")}
          >
            <Filter className="w-4 h-4" />
            <span className="ml-2">Filters</span>
          </Button>
        </div>

        {/* Expandable Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger>
                    <Languages className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <Award className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Most Relevant</SelectItem>
                    <SelectItem value="quality">Highest Quality</SelectItem>
                    <SelectItem value="engagement">Most Engaging</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          {resourceCategories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex items-center gap-2"
            >
              <category.icon className={cn("w-4 h-4", category.color)} />
              <span className="hidden sm:inline">{category.label}</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {filteredResources.filter((r) => {
                  if (category.id === "recommended") return r.relevanceScore > 0.8;
                  // Similar logic as in filter effect
                  return true;
                }).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content */}
        {resourceCategories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <div className="space-y-4">
              {/* Category Description */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Info className="w-4 h-4" />
                {category.description}
              </div>

              {/* Resources Grid */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Discovering resources with SAM AI...
                    </p>
                  </div>
                </div>
              ) : filteredResources.length > 0 ? (
                <div className="grid gap-4">
                  {filteredResources.map((resource) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Thumbnail or Icon */}
                            <div className="flex-shrink-0">
                              {resource.thumbnail ? (
                                <Image
                                  src={resource.thumbnail}
                                  alt={resource.title}
                                  width={96}
                                  height={64}
                                  className="w-24 h-16 object-cover rounded-lg"
                                />
                              ) : (
                                <div className={cn(
                                  "w-24 h-16 rounded-lg flex items-center justify-center",
                                  "bg-gradient-to-br from-gray-100 to-gray-200",
                                  "dark:from-gray-800 dark:to-gray-700"
                                )}>
                                  {getResourceIcon(resource.type)}
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {resource.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                    {resource.description}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-shrink-0"
                                  onClick={() => window.open(resource.url, "_blank")}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Metadata */}
                              <div className="flex items-center gap-4 mt-3 text-xs">
                                <div className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  <span>{resource.source}</span>
                                </div>
                                {resource.duration && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{resource.duration}</span>
                                  </div>
                                )}
                                {resource.author && (
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{resource.author}</span>
                                  </div>
                                )}
                                <Badge className={getDifficultyColor(resource.difficulty)}>
                                  {resource.difficulty}
                                </Badge>
                              </div>

                              {/* Quality Scores */}
                              <div className="grid grid-cols-3 gap-2 mt-3">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div className={cn("text-sm font-bold", getQualityColor(resource.qualityScore))}>
                                    {Math.round(resource.qualityScore * 100)}%
                                  </div>
                                  <div className="text-xs text-gray-500">Quality</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div className={cn("text-sm font-bold", getQualityColor(resource.relevanceScore))}>
                                    {Math.round(resource.relevanceScore * 100)}%
                                  </div>
                                  <div className="text-xs text-gray-500">Relevance</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div className={cn("text-sm font-bold", getQualityColor(resource.engagementScore))}>
                                    {Math.round(resource.engagementScore * 100)}%
                                  </div>
                                  <div className="text-xs text-gray-500">Engagement</div>
                                </div>
                              </div>

                              {/* AI Insights */}
                              {resource.aiInsights && (
                                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                      SAM AI Insights
                                    </span>
                                  </div>
                                  <div className="space-y-1 text-xs text-purple-600 dark:text-purple-400">
                                    {resource.aiInsights.bestFor.slice(0, 2).map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1 mt-3">
                                {resource.tags.slice(0, 4).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {resource.tags.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{resource.tags.length - 4}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No resources found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your filters or search query
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {resources.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Resources Found
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {resources.filter((r) => r.qualityScore > 0.8).length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                High Quality
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {new Set(resources.map((r) => r.language)).size}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Languages
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {new Set(resources.map((r) => r.source)).size}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Sources
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Demo data fallback
function getDemoResources(): ExternalResource[] {
  return [
    {
      id: "1",
      title: "React Hooks Explained",
      description: "A comprehensive guide to React Hooks with practical examples",
      url: "https://example.com/react-hooks",
      type: "article",
      source: "Medium",
      language: "English",
      difficulty: "intermediate",
      duration: "15 min",
      author: "Dan Abramov",
      publishedDate: "2024-01-15",
      qualityScore: 0.92,
      relevanceScore: 0.88,
      engagementScore: 0.85,
      license: "CC BY-SA",
      tags: ["React", "Hooks", "JavaScript", "Frontend"],
      rating: 4.8,
      views: 45000,
      aiInsights: {
        keyTopics: ["useState", "useEffect", "Custom Hooks"],
        learningOutcomes: ["Understand hook rules", "Build custom hooks"],
        prerequisites: ["Basic React knowledge", "JavaScript ES6"],
        bestFor: ["Intermediate React developers", "Frontend engineers"],
      },
    },
    // Add more demo resources...
  ];
}