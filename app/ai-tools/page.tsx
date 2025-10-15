"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Star, 
  ExternalLink, 
  ChevronRight,
  Sparkles,
  Brain,
  MessageSquare,
  Image as ImageIcon,
  Code,
  FileText,
  Video,
  Music,
  Palette,
  Globe,
  Shield,
  Zap,
  TrendingUp,
  DollarSign,
  Users,
  Check,
  X,
  Info,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Wand2,
  Gauge,
  Award,
  Heart
} from 'lucide-react';
import Link from 'next/link';
// PageBackground removed - using direct bg-background on body
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Tool interface
interface AITool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  features: string[];
  pricing: {
    type: 'free' | 'freemium' | 'paid' | 'enterprise';
    startingPrice?: string;
    freeTrialDays?: number;
  };
  rating: number;
  reviews: number;
  users: string;
  tags: string[];
  website: string;
  isIntegrated: boolean;
  integrationStatus?: 'available' | 'coming-soon' | 'beta';
  icon: React.ReactNode;
  trending?: boolean;
  recommended?: boolean;
  educationFocused?: boolean;
}

type ToolCategory = 
  | 'text-generation'
  | 'image-generation'
  | 'code-assistant'
  | 'education'
  | 'productivity'
  | 'research'
  | 'analytics'
  | 'automation'
  | 'voice-audio'
  | 'video';

// Mock AI tools data
const aiTools: AITool[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'Advanced conversational AI for text generation, problem-solving, and creative tasks',
    category: 'text-generation',
    features: [
      'Natural language understanding',
      'Code generation',
      'Creative writing',
      'Problem solving',
      'Multi-language support'
    ],
    pricing: {
      type: 'freemium',
      startingPrice: '$20/month',
      freeTrialDays: 0
    },
    rating: 4.8,
    reviews: 12500,
    users: '100M+',
    tags: ['NLP', 'Conversational AI', 'GPT-4', 'OpenAI'],
    website: 'https://chat.openai.com',
    isIntegrated: true,
    integrationStatus: 'available',
    icon: <MessageSquare className="w-6 h-6" />,
    trending: true,
    recommended: true
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'AI assistant focused on helpful, harmless, and honest interactions with advanced reasoning',
    category: 'text-generation',
    features: [
      'Long context window',
      'Code analysis',
      'Research assistance',
      'Document summarization',
      'Ethical AI responses'
    ],
    pricing: {
      type: 'freemium',
      startingPrice: '$20/month'
    },
    rating: 4.9,
    reviews: 8200,
    users: '10M+',
    tags: ['Anthropic', 'Constitutional AI', 'Research', 'Coding'],
    website: 'https://claude.ai',
    isIntegrated: true,
    integrationStatus: 'available',
    icon: <Brain className="w-6 h-6" />,
    recommended: true
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    description: 'AI-powered image generation tool for creating stunning artwork and designs',
    category: 'image-generation',
    features: [
      'Photorealistic images',
      'Artistic styles',
      'Custom parameters',
      'Upscaling',
      'Variations'
    ],
    pricing: {
      type: 'paid',
      startingPrice: '$10/month'
    },
    rating: 4.7,
    reviews: 9800,
    users: '15M+',
    tags: ['Image Generation', 'Art', 'Creative', 'Discord'],
    website: 'https://midjourney.com',
    isIntegrated: false,
    integrationStatus: 'coming-soon',
    icon: <ImageIcon className="w-6 h-6" />,
    trending: true
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    description: 'AI pair programmer that helps you write code faster with contextual suggestions',
    category: 'code-assistant',
    features: [
      'Code completion',
      'Function generation',
      'Test writing',
      'Documentation',
      'Multi-language support'
    ],
    pricing: {
      type: 'paid',
      startingPrice: '$10/month',
      freeTrialDays: 30
    },
    rating: 4.6,
    reviews: 7500,
    users: '1M+',
    tags: ['Coding', 'GitHub', 'Developer Tools', 'IDE'],
    website: 'https://github.com/features/copilot',
    isIntegrated: true,
    integrationStatus: 'available',
    icon: <Code className="w-6 h-6" />,
    recommended: true
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    description: 'AI-powered search engine and research assistant with real-time information',
    category: 'research',
    features: [
      'Real-time web search',
      'Source citations',
      'Follow-up questions',
      'Academic mode',
      'API access'
    ],
    pricing: {
      type: 'freemium',
      startingPrice: '$20/month'
    },
    rating: 4.7,
    reviews: 5200,
    users: '10M+',
    tags: ['Search', 'Research', 'Citations', 'Academic'],
    website: 'https://perplexity.ai',
    isIntegrated: false,
    integrationStatus: 'beta',
    icon: <Search className="w-6 h-6" />,
    educationFocused: true
  },
  {
    id: 'notion-ai',
    name: 'Notion AI',
    description: 'AI writing assistant integrated into Notion workspace for enhanced productivity',
    category: 'productivity',
    features: [
      'Writing assistance',
      'Summarization',
      'Translation',
      'Database autofill',
      'Meeting notes'
    ],
    pricing: {
      type: 'freemium',
      startingPrice: '$10/month'
    },
    rating: 4.5,
    reviews: 4300,
    users: '5M+',
    tags: ['Productivity', 'Writing', 'Workspace', 'Notes'],
    website: 'https://notion.so/ai',
    isIntegrated: false,
    icon: <FileText className="w-6 h-6" />
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Advanced AI voice synthesis and cloning for natural-sounding speech',
    category: 'voice-audio',
    features: [
      'Voice cloning',
      'Text-to-speech',
      'Multi-language',
      'Emotion control',
      'API integration'
    ],
    pricing: {
      type: 'freemium',
      startingPrice: '$5/month'
    },
    rating: 4.8,
    reviews: 3100,
    users: '1M+',
    tags: ['Voice', 'Audio', 'TTS', 'Voice Cloning'],
    website: 'https://elevenlabs.io',
    isIntegrated: false,
    integrationStatus: 'coming-soon',
    icon: <Music className="w-6 h-6" />
  },
  {
    id: 'grammarly',
    name: 'Grammarly',
    description: 'AI-powered writing assistant for grammar, clarity, and style improvements',
    category: 'education',
    features: [
      'Grammar checking',
      'Style suggestions',
      'Plagiarism detection',
      'Tone adjustment',
      'Vocabulary enhancement'
    ],
    pricing: {
      type: 'freemium',
      startingPrice: '$12/month'
    },
    rating: 4.6,
    reviews: 15000,
    users: '30M+',
    tags: ['Writing', 'Grammar', 'Education', 'Productivity'],
    website: 'https://grammarly.com',
    isIntegrated: true,
    integrationStatus: 'available',
    icon: <BookOpen className="w-6 h-6" />,
    educationFocused: true,
    recommended: true
  },
  {
    id: 'runway',
    name: 'Runway',
    description: 'AI-powered video editing and generation platform for creators',
    category: 'video',
    features: [
      'Video generation',
      'Green screen',
      'Motion tracking',
      'Style transfer',
      'Audio cleaning'
    ],
    pricing: {
      type: 'freemium',
      startingPrice: '$15/month'
    },
    rating: 4.7,
    reviews: 2800,
    users: '500K+',
    tags: ['Video', 'Creative', 'Editing', 'Generation'],
    website: 'https://runwayml.com',
    isIntegrated: false,
    icon: <Video className="w-6 h-6" />,
    trending: true
  },
  {
    id: 'jasper',
    name: 'Jasper AI',
    description: 'AI content creation platform for marketing and business writing',
    category: 'text-generation',
    features: [
      'Marketing copy',
      'Blog posts',
      'Social media content',
      'Email campaigns',
      'Brand voice'
    ],
    pricing: {
      type: 'paid',
      startingPrice: '$49/month',
      freeTrialDays: 7
    },
    rating: 4.5,
    reviews: 6200,
    users: '100K+',
    tags: ['Marketing', 'Content', 'Business', 'Writing'],
    website: 'https://jasper.ai',
    isIntegrated: false,
    icon: <Wand2 className="w-6 h-6" />
  }
];

// Category metadata
const categoryMeta = {
  'text-generation': { icon: <MessageSquare />, label: 'Text Generation', color: 'blue' },
  'image-generation': { icon: <ImageIcon />, label: 'Image Generation', color: 'purple' },
  'code-assistant': { icon: <Code />, label: 'Code Assistant', color: 'green' },
  'education': { icon: <BookOpen />, label: 'Education', color: 'orange' },
  'productivity': { icon: <Zap />, label: 'Productivity', color: 'yellow' },
  'research': { icon: <Search />, label: 'Research', color: 'indigo' },
  'analytics': { icon: <TrendingUp />, label: 'Analytics', color: 'pink' },
  'automation': { icon: <Gauge />, label: 'Automation', color: 'red' },
  'voice-audio': { icon: <Music />, label: 'Voice & Audio', color: 'emerald' },
  'video': { icon: <Video />, label: 'Video', color: 'cyan' }
};

export default function AIToolsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [selectedPricing, setSelectedPricing] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name'>('rating');
  const [showIntegratedOnly, setShowIntegratedOnly] = useState(false);
  const [filteredTools, setFilteredTools] = useState<AITool[]>(aiTools);

  // Filter and sort tools
  useEffect(() => {
    let filtered = [...aiTools];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tool => tool.category === selectedCategory);
    }

    // Pricing filter
    if (selectedPricing !== 'all') {
      filtered = filtered.filter(tool => tool.pricing.type === selectedPricing);
    }

    // Integration filter
    if (showIntegratedOnly) {
      filtered = filtered.filter(tool => tool.isIntegrated);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          return b.reviews - a.reviews;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredTools(filtered);
  }, [searchTerm, selectedCategory, selectedPricing, sortBy, showIntegratedOnly]);

  const renderToolCard = (tool: AITool) => (
    <motion.div
      key={tool.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn(
        "h-full hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-700",
        tool.trending && "ring-2 ring-purple-500/20",
        tool.recommended && "bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20"
      )}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                `bg-${categoryMeta[tool.category].color}-100 dark:bg-${categoryMeta[tool.category].color}-900/20`
              )}>
                {tool.icon}
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {tool.name}
                  {tool.trending && (
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                  {tool.recommended && (
                    <Badge variant="default" className="text-xs bg-blue-600">
                      <Award className="w-3 h-3 mr-1" />
                      Recommended
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{tool.rating}</span>
                    <span className="text-sm text-gray-500">({tool.reviews.toLocaleString()})</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {tool.users} users
                  </Badge>
                </div>
              </div>
            </div>
            {tool.isIntegrated && (
              <Badge className="bg-green-600 text-white">
                <Check className="w-3 h-3 mr-1" />
                Integrated
              </Badge>
            )}
            {!tool.isIntegrated && tool.integrationStatus && (
              <Badge variant="outline" className="text-xs">
                {tool.integrationStatus === 'coming-soon' ? 'Coming Soon' : 'Beta'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-sm">
            {tool.description}
          </CardDescription>

          {/* Features */}
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Key Features:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {tool.features.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <span className="text-sm text-gray-500">Pricing:</span>
              <div className="flex items-center gap-2">
                <Badge variant={tool.pricing.type === 'free' ? 'default' : 'secondary'}>
                  {tool.pricing.type === 'free' && <Sparkles className="w-3 h-3 mr-1" />}
                  {tool.pricing.type.charAt(0).toUpperCase() + tool.pricing.type.slice(1)}
                </Badge>
                {tool.pricing.startingPrice && (
                  <span className="text-sm font-medium">{tool.pricing.startingPrice}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {tool.isIntegrated ? (
                <Button size="sm" className="gap-2">
                  <Zap className="w-4 h-4" />
                  Use in Platform
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="gap-2" asChild>
                  <a href={tool.website} target="_blank" rel="noopener noreferrer">
                    Visit Site
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 pt-2">
            {tool.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderCategoryCard = (category: ToolCategory) => {
    const meta = categoryMeta[category];
    const count = aiTools.filter(tool => tool.category === category).length;
    
    return (
      <motion.div
        key={category}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSelectedCategory(category)}
        className="cursor-pointer"
      >
        <Card className={cn(
          "text-center p-6 hover:shadow-lg transition-all duration-300",
          selectedCategory === category && "ring-2 ring-purple-500"
        )}>
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3",
            `bg-${meta.color}-100 dark:bg-${meta.color}-900/20`
          )}>
            {meta.icon}
          </div>
          <h3 className="font-semibold">{meta.label}</h3>
          <p className="text-sm text-gray-500 mt-1">{count} tools</p>
        </Card>
      </motion.div>
    );
  };

  return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <Sparkles className="w-4 h-4 mr-1" />
                AI Tools Directory
              </Badge>
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                Discover AI Tools for Every Need
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                Explore our curated collection of cutting-edge AI tools. Find the perfect solution 
                for education, productivity, creativity, and more. Many tools integrate seamlessly 
                with our platform.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
                <Card className="p-4">
                  <div className="text-3xl font-bold text-purple-600">{aiTools.length}+</div>
                  <div className="text-sm text-gray-500">AI Tools</div>
                </Card>
                <Card className="p-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {Object.keys(categoryMeta).length}
                  </div>
                  <div className="text-sm text-gray-500">Categories</div>
                </Card>
                <Card className="p-4">
                  <div className="text-3xl font-bold text-green-600">
                    {aiTools.filter(t => t.isIntegrated).length}
                  </div>
                  <div className="text-sm text-gray-500">Integrated</div>
                </Card>
                <Card className="p-4">
                  <div className="text-3xl font-bold text-orange-600">
                    {aiTools.filter(t => t.educationFocused).length}
                  </div>
                  <div className="text-sm text-gray-500">Education Tools</div>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="py-8 px-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search AI tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              
              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(categoryMeta).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {meta.icon}
                          {meta.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPricing} onValueChange={setSelectedPricing}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Pricing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pricing</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="freemium">Freemium</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="reviews">Reviews</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={showIntegratedOnly ? "default" : "outline"}
                  onClick={() => setShowIntegratedOnly(!showIntegratedOnly)}
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Integrated Only
                </Button>
              </div>
            </div>

            {/* Active filters */}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-gray-500">
                Showing {filteredTools.length} of {aiTools.length} tools
              </span>
              {(selectedCategory !== 'all' || selectedPricing !== 'all' || showIntegratedOnly) && (
                <>
                  <span className="text-gray-400">•</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedPricing('all');
                      setShowIntegratedOnly(false);
                    }}
                  >
                    Clear filters
                    <X className="w-3 h-3 ml-1" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
              {Object.keys(categoryMeta).map((category) => 
                renderCategoryCard(category as ToolCategory)
              )}
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="all" className="mb-8">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                <TabsTrigger value="all">All Tools</TabsTrigger>
                <TabsTrigger value="recommended">
                  <Award className="w-4 h-4 mr-1" />
                  Recommended
                </TabsTrigger>
                <TabsTrigger value="trending">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Trending
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTools.map(renderToolCard)}
                </div>
              </TabsContent>
              
              <TabsContent value="recommended" className="mt-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTools.filter(t => t.recommended).map(renderToolCard)}
                </div>
              </TabsContent>
              
              <TabsContent value="trending" className="mt-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTools.filter(t => t.trending).map(renderToolCard)}
                </div>
              </TabsContent>
            </Tabs>

            {filteredTools.length === 0 && (
              <div className="text-center py-12">
                <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No tools found</h3>
                <p className="text-gray-500">Try adjusting your filters or search term</p>
              </div>
            )}
          </div>
        </section>

        {/* Integration CTA */}
        <section className="py-16 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Want Your AI Tool Integrated?</h2>
            <p className="text-xl mb-8 opacity-90">
              We&apos;re constantly adding new AI tools to our platform. If you&apos;re a tool developer 
              or want to see a specific tool integrated, let us know!
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" variant="secondary" className="gap-2">
                <Lightbulb className="w-5 h-5" />
                Suggest a Tool
              </Button>
              <Button size="lg" variant="outline" className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Heart className="w-5 h-5" />
                Become a Partner
              </Button>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">AI Resources & Guides</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Lightbulb className="w-8 h-8 text-yellow-500 mb-2" />
                  <CardTitle>Getting Started with AI</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    New to AI tools? Our comprehensive guide helps you understand the basics 
                    and choose the right tools for your needs.
                  </CardDescription>
                  <Button variant="link" className="mt-4 p-0" asChild>
                    <Link href="/guides/ai-basics">
                      Read Guide <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <BookOpen className="w-8 h-8 text-blue-500 mb-2" />
                  <CardTitle>AI in Education</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Discover how educators and students can leverage AI tools to enhance 
                    learning outcomes and streamline workflows.
                  </CardDescription>
                  <Button variant="link" className="mt-4 p-0" asChild>
                    <Link href="/guides/ai-education">
                      Learn More <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Shield className="w-8 h-8 text-green-500 mb-2" />
                  <CardTitle>AI Ethics & Safety</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Understand the ethical considerations and best practices for using AI 
                    tools responsibly in your work and studies.
                  </CardDescription>
                  <Button variant="link" className="mt-4 p-0" asChild>
                    <Link href="/guides/ai-ethics">
                      Explore <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
  );
}