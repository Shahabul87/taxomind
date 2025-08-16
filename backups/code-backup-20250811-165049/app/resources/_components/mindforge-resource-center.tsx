"use client";

import { useState } from "react";
import { 
  Book, 
  Video, 
  FileText, 
  Search,
  LayoutGrid,
  List,
  Brain,
  Code,
  BarChart3,
  Sparkles,
  Target,
  Shield,
  Globe,
  Play,
  ExternalLink,
  ChevronRight,
  Trophy,
  MessageCircle,
  Calendar,
  Zap,
  TrendingUp,
  Database,
  CloudLightning
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: "guide" | "video" | "documentation" | "tool" | "template" | "api";
  category: string;
  icon: any;
  url?: string;
  downloadUrl?: string;
  tags: string[];
  featured?: boolean;
  difficulty?: "beginner" | "intermediate" | "advanced";
  duration?: string;
  views?: number;
  popular?: boolean;
}

const resources: Resource[] = [
  // Getting Started
  {
    id: "1",
    title: "MindForge Platform Overview",
    description: "Complete introduction to AI-powered learning platform features, navigation, and core concepts.",
    type: "guide",
    category: "Getting Started",
    icon: Sparkles,
    url: "/docs/overview",
    tags: ["beginner", "platform", "introduction"],
    featured: true,
    difficulty: "beginner",
    duration: "15 min read",
    views: 12500,
    popular: true
  },
  {
    id: "2",
    title: "First Steps with AI Tutor",
    description: "Learn how to interact with your personal AI tutor powered by Claude 3.5 Sonnet for maximum learning efficiency.",
    type: "video",
    category: "Getting Started",
    icon: Brain,
    url: "/tutorials/ai-tutor",
    tags: ["ai", "tutor", "beginner"],
    difficulty: "beginner",
    duration: "8 min watch",
    views: 8900,
    popular: true
  },
  {
    id: "3",
    title: "Setting Up Your Learning Profile",
    description: "Customize your learning preferences, goals, and AI personalization settings for optimal results.",
    type: "guide",
    category: "Getting Started",
    icon: Target,
    url: "/docs/profile-setup",
    tags: ["profile", "personalization", "setup"],
    difficulty: "beginner",
    duration: "10 min read",
    views: 6700
  },

  // AI Learning Tools
  {
    id: "4",
    title: "AI-Powered Adaptive Learning",
    description: "Understand how our AI analyzes your learning patterns and adapts content difficulty in real-time.",
    type: "documentation",
    category: "AI Learning Tools",
    icon: CloudLightning,
    url: "/docs/adaptive-learning",
    tags: ["ai", "adaptive", "personalization"],
    featured: true,
    difficulty: "intermediate",
    duration: "20 min read",
    views: 15600
  },
  {
    id: "5",
    title: "Cognitive Load Optimization Guide",
    description: "Learn how MindForge monitors mental load and optimizes content presentation for better learning outcomes.",
    type: "guide",
    category: "AI Learning Tools",
    icon: Brain,
    url: "/docs/cognitive-load",
    tags: ["cognitive", "optimization", "science"],
    difficulty: "intermediate",
    duration: "18 min read",
    views: 4300
  },
  {
    id: "6",
    title: "Smart Content Recommendations",
    description: "Deep dive into how AI curates personalized learning materials based on your knowledge gaps and goals.",
    type: "documentation",
    category: "AI Learning Tools",
    icon: Zap,
    url: "/docs/recommendations",
    tags: ["ai", "recommendations", "content"],
    difficulty: "intermediate",
    duration: "12 min read",
    views: 5800
  },

  // Course Creation
  {
    id: "7",
    title: "AI-Assisted Course Creation Toolkit",
    description: "Complete guide to creating courses with AI assistance, from outline to content generation.",
    type: "guide",
    category: "Course Creation",
    icon: Book,
    url: "/docs/course-creation",
    tags: ["course", "creation", "ai", "teaching"],
    featured: true,
    difficulty: "intermediate",
    duration: "25 min read",
    views: 9200,
    popular: true
  },
  {
    id: "8",
    title: "Bloom's Taxonomy Integration",
    description: "Learn how to structure assessments using Bloom's taxonomy for comprehensive cognitive development.",
    type: "video",
    category: "Course Creation",
    icon: Trophy,
    url: "/tutorials/blooms-taxonomy",
    tags: ["assessment", "taxonomy", "education"],
    difficulty: "intermediate",
    duration: "15 min watch",
    views: 3400
  },
  {
    id: "9",
    title: "Course Templates Library",
    description: "Access pre-built course templates optimized for different subjects and learning objectives.",
    type: "template",
    category: "Course Creation",
    icon: FileText,
    downloadUrl: "/templates/course-templates.zip",
    tags: ["templates", "courses", "structure"],
    difficulty: "beginner",
    duration: "Download",
    views: 7100
  },

  // Analytics & Insights
  {
    id: "10",
    title: "Learning Analytics Dashboard Guide",
    description: "Master the analytics dashboard to track learning progress, identify patterns, and optimize outcomes.",
    type: "guide",
    category: "Analytics & Insights",
    icon: BarChart3,
    url: "/docs/analytics",
    tags: ["analytics", "dashboard", "tracking"],
    difficulty: "intermediate",
    duration: "22 min read",
    views: 6800
  },
  {
    id: "11",
    title: "Predictive Learning Analytics",
    description: "Understand how AI predicts learning outcomes with 90% accuracy and suggests interventions.",
    type: "documentation",
    category: "Analytics & Insights",
    icon: TrendingUp,
    url: "/docs/predictive-analytics",
    tags: ["predictive", "ai", "outcomes"],
    difficulty: "advanced",
    duration: "30 min read",
    views: 2900
  },
  {
    id: "12",
    title: "Real-time Performance Monitoring",
    description: "Learn to interpret live learning data and make instant adjustments to improve student engagement.",
    type: "video",
    category: "Analytics & Insights",
    icon: Zap,
    url: "/tutorials/realtime-monitoring",
    tags: ["realtime", "monitoring", "performance"],
    difficulty: "intermediate",
    duration: "12 min watch",
    views: 4100
  },

  // API & Integrations
  {
    id: "13",
    title: "MindForge API Documentation",
    description: "Complete API reference with 200+ endpoints for integrating with LMS, HRIS, and enterprise systems.",
    type: "api",
    category: "API & Integrations",
    icon: Code,
    url: "/api-docs",
    tags: ["api", "integration", "development"],
    difficulty: "advanced",
    duration: "API Reference",
    views: 8500,
    popular: true
  },
  {
    id: "14",
    title: "Enterprise System Integration Guide",
    description: "Step-by-step guide for connecting MindForge with existing enterprise infrastructure and workflows.",
    type: "guide",
    category: "API & Integrations",
    icon: Database,
    url: "/docs/enterprise-integration",
    tags: ["enterprise", "integration", "system"],
    difficulty: "advanced",
    duration: "35 min read",
    views: 3700
  },
  {
    id: "15",
    title: "Authentication & Security Setup",
    description: "Implement secure authentication flows, SSO integration, and enterprise security standards.",
    type: "documentation",
    category: "API & Integrations",
    icon: Shield,
    url: "/docs/security",
    tags: ["security", "authentication", "sso"],
    difficulty: "advanced",
    duration: "28 min read",
    views: 5200
  },

  // Enterprise Solutions
  {
    id: "16",
    title: "Enterprise Implementation Guide",
    description: "Complete roadmap for deploying MindForge across large organizations with 100K+ users.",
    type: "guide",
    category: "Enterprise Solutions",
    icon: Globe,
    url: "/docs/enterprise-implementation",
    tags: ["enterprise", "deployment", "scale"],
    featured: true,
    difficulty: "advanced",
    duration: "45 min read",
    views: 4800
  },
  {
    id: "17",
    title: "Compliance & Data Privacy",
    description: "Understanding GDPR, SOC 2 compliance, and data protection measures in MindForge.",
    type: "documentation",
    category: "Enterprise Solutions",
    icon: Shield,
    url: "/docs/compliance",
    tags: ["compliance", "privacy", "gdpr"],
    difficulty: "advanced",
    duration: "25 min read",
    views: 2600
  },
  {
    id: "18",
    title: "ROI Measurement Framework",
    description: "Tools and methodologies for measuring learning ROI and demonstrating business impact.",
    type: "tool",
    category: "Enterprise Solutions",
    icon: TrendingUp,
    downloadUrl: "/tools/roi-calculator.xlsx",
    tags: ["roi", "measurement", "business"],
    difficulty: "intermediate",
    duration: "Tool Download",
    views: 3900
  },

  // Video Tutorials
  {
    id: "19",
    title: "MindForge Complete Video Series",
    description: "Comprehensive 10-part video series covering every aspect of the platform from beginner to advanced.",
    type: "video",
    category: "Video Tutorials",
    icon: Play,
    url: "/tutorials/complete-series",
    tags: ["video", "series", "comprehensive"],
    featured: true,
    difficulty: "beginner",
    duration: "2 hours total",
    views: 18700,
    popular: true
  },
  {
    id: "20",
    title: "AI Features Masterclass",
    description: "Advanced video tutorials on leveraging AI tutoring, adaptive assessments, and intelligent recommendations.",
    type: "video",
    category: "Video Tutorials",
    icon: Brain,
    url: "/tutorials/ai-masterclass",
    tags: ["ai", "advanced", "masterclass"],
    difficulty: "advanced",
    duration: "90 min watch",
    views: 7300
  },

  // Community
  {
    id: "21",
    title: "MindForge Community Forum",
    description: "Join discussions with 127K+ learners, share insights, and get help from the community.",
    type: "tool",
    category: "Community",
    icon: MessageCircle,
    url: "/community",
    tags: ["community", "forum", "discussion"],
    difficulty: "beginner",
    duration: "Online Community",
    views: 25600,
    popular: true
  },
  {
    id: "22",
    title: "Monthly Learning Events",
    description: "Attend live workshops, webinars, and training sessions with learning experts and AI researchers.",
    type: "guide",
    category: "Community",
    icon: Calendar,
    url: "/events",
    tags: ["events", "workshops", "live"],
    difficulty: "beginner",
    duration: "Event Schedule",
    views: 8900
  }
];

const categories = [
  "All",
  "Getting Started",
  "AI Learning Tools", 
  "Course Creation",
  "Analytics & Insights",
  "API & Integrations",
  "Enterprise Solutions",
  "Video Tutorials",
  "Community"
];

const resourceTypes = [
  "All Types",
  "Guide",
  "Video", 
  "Documentation",
  "Tool",
  "Template",
  "API"
];

export const MindForgeResourceCenter = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All Types");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === "All" || resource.category === selectedCategory;
    const matchesType = selectedType === "All Types" || resource.type === selectedType.toLowerCase();
    const matchesSearch = searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesType && matchesSearch;
  });

  const featuredResources = resources.filter(resource => resource.featured);
  const popularResources = resources.filter(resource => resource.popular);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 rounded-full px-6 py-2 border border-purple-500/20 mb-8">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-medium">MindForge Resources</span>
            <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">AI-Powered</Badge>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Resource Center
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Everything you need to master MindForge&apos;s AI-powered learning platform. From getting started guides to advanced enterprise integrations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="text-3xl font-bold text-white mb-2">{resources.length}</div>
              <div className="text-slate-400">Total Resources</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="text-3xl font-bold text-white mb-2">{categories.length - 1}</div>
              <div className="text-slate-400">Categories</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-slate-400">AI Support</div>
            </div>
          </div>
        </div>

        {/* Featured Resources */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <Sparkles className="w-6 h-6 text-yellow-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">Featured Resources</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredResources.map((resource, index) => (
              <div key={resource.id}>
                <Card className="relative h-full bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 group hover:shadow-2xl hover:shadow-purple-500/20">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="inline-block rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 p-3">
                        <resource.icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                        Featured
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                      {resource.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                      <span>{resource.duration}</span>
                      <span>{resource.views?.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={cn(
                        "text-xs",
                        resource.difficulty === "beginner" && "bg-green-500/20 text-green-300 border-green-500/30",
                        resource.difficulty === "intermediate" && "bg-blue-500/20 text-blue-300 border-blue-500/30",
                        resource.difficulty === "advanced" && "bg-red-500/20 text-red-300 border-red-500/30"
                      )}>
                        {resource.difficulty}
                      </Badge>
                      <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Search and Filters */}
        <section className="mb-12">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search resources, guides, videos..."
                  className="pl-12 pr-4 h-12 bg-slate-900/50 border-slate-600 rounded-xl text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              >
                {resourceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-900/50 rounded-xl p-1 border border-slate-600">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "h-10 px-3",
                    viewMode === 'grid' && "bg-purple-600 hover:bg-purple-700"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "h-10 px-3",
                    viewMode === 'list' && "bg-purple-600 hover:bg-purple-700"
                  )}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Resources Grid/List */}
        <section>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource, index) => (
                <div key={resource.id}>
                  <Card className="h-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 group hover:shadow-xl hover:shadow-purple-500/10">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="inline-block rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-3 border border-purple-500/30">
                          <resource.icon className="h-5 w-5 text-purple-300" />
                        </div>
                        {resource.popular && (
                          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                        {resource.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
                        {resource.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                        <span>{resource.duration}</span>
                        <span>{resource.views?.toLocaleString()} views</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className="text-xs bg-slate-700 text-slate-300">
                          {resource.category}
                        </Badge>
                        <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResources.map((resource, index) => (
                <div key={resource.id}>
                  <Card className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 group">
                    <div className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="inline-block rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-3 border border-purple-500/30">
                          <resource.icon className="h-5 w-5 text-purple-300" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                              {resource.title}
                            </h3>
                            {resource.popular && (
                              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                                Popular
                              </Badge>
                            )}
                            {resource.featured && (
                              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mb-3">
                            {resource.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-slate-500">
                            <span>{resource.category}</span>
                            <span>{resource.duration}</span>
                            <span>{resource.views?.toLocaleString()} views</span>
                            <Badge className={cn(
                              "text-xs",
                              resource.difficulty === "beginner" && "bg-green-500/20 text-green-300 border-green-500/30",
                              resource.difficulty === "intermediate" && "bg-blue-500/20 text-blue-300 border-blue-500/30",
                              resource.difficulty === "advanced" && "bg-red-500/20 text-red-300 border-red-500/30"
                            )}>
                              {resource.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Popular Resources */}
        {selectedCategory === "All" && selectedType === "All Types" && searchQuery === "" && (
          <section className="mt-16">
            <div className="flex items-center mb-8">
              <TrendingUp className="w-6 h-6 text-orange-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Most Popular</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularResources.slice(0, 4).map((resource, index) => (
                <div key={resource.id}>
                  <Card className="h-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 group">
                    <div className="p-4">
                      <div className="inline-block rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 p-3 border border-orange-500/30 mb-4">
                        <resource.icon className="h-5 w-5 text-orange-300" />
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-orange-300 transition-colors">
                        {resource.title}
                      </h3>
                      <div className="text-xs text-slate-500 mb-3">
                        {resource.views?.toLocaleString()} views
                      </div>
                      <Button size="sm" variant="outline" className="w-full border-orange-500/50 text-orange-300 hover:bg-orange-500/10">
                        View Resource
                      </Button>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredResources.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block rounded-full bg-slate-800/50 p-6 mb-6">
              <Search className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">No resources found</h3>
            <p className="text-slate-400 mb-6">
              Try adjusting your search terms or filters to find what you&apos;re looking for.
            </p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedType("All Types");
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};