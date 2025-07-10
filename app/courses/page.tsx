"use client"

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Grid3X3, 
  LayoutList, 
  Star, 
  Clock, 
  Users, 
  TrendingUp,
  Sparkles,
  BookOpen,
  Award,
  BarChart3,
  ChevronRight,
  ArrowUpRight,
  Brain,
  Target,
  Shield,
  X,
  Loader2,
  Play,
  Download,
  Bookmark,
  Share2,
  Eye,
  Calendar,
  Trophy,
  Briefcase,
  Globe,
  Code,
  Palette,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';

interface Course {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  cleanDescription?: string;
  imageUrl?: string | null;
  price?: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  category?: { 
    id: string;
    name: string;
  } | null;
  chapters: any[];
  chaptersLength: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  averageRating: number;
  reviewsCount: number;
  enrollmentsCount: number;
  isEnrolled: boolean;
  // Enhanced display properties
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  duration?: string;
  lastUpdated?: Date;
  skills?: string[];
  certificateOffered?: boolean;
  difficulty?: number;
  popularity?: number;
  trending?: boolean;
}

// Enterprise Course Card Component
const EnterpriseCourseCard = ({ course, viewMode }: { course: Course; viewMode: 'grid' | 'list' }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const difficultyConfig = {
    Beginner: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: '🌱' },
    Intermediate: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: '🚀' },
    Advanced: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: '🔥' },
    Expert: { color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: '💎' }
  };

  const level = course.level || 'Beginner';
  const config = difficultyConfig[level];

  if (viewMode === 'list') {
    return (
      <Card className="bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl group">
        <div className="flex flex-col lg:flex-row">
          {/* Image Section */}
          <div className="relative w-full lg:w-80 h-48 lg:h-auto overflow-hidden">
            <img 
              src={course.imageUrl || "/placeholder.svg"} 
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Floating badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Badge className={`${config.color} border backdrop-blur-sm`}>
                <span className="mr-1">{config.icon}</span>
                {level}
              </Badge>
              {course.trending && (
                <Badge className="bg-orange-500/90 text-white border-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending
                </Badge>
              )}
              {course.certificateOffered && (
                <Badge className="bg-purple-500/90 text-white border-0">
                  <Award className="w-3 h-3 mr-1" />
                  Certificate
                </Badge>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-blue-600' : ''}`} />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Price tag */}
            <div className="absolute bottom-4 right-4">
              <div className="bg-slate-900/90 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <span className="text-lg font-bold">${course.price || 0}</span>
              </div>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {/* Category & Rating */}
                <div className="flex items-center gap-4 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {course.category?.name || 'General'}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= course.averageRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {course.averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      ({course.enrollmentsCount.toLocaleString()})
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {course.title}
                </h3>
                
                {course.subtitle && (
                  <p className="text-slate-600 dark:text-slate-400 mb-3 font-medium">
                    {course.subtitle}
                  </p>
                )}

                <p className="text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                  {course.cleanDescription || course.description || "Unlock your potential with this comprehensive course designed for modern learners."}
                </p>

                {/* Skills Tags */}
                {course.skills && course.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.skills.slice(0, 5).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700">
                        {skill}
                      </Badge>
                    ))}
                    {course.skills.length > 5 && (
                      <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700">
                        +{course.skills.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {course.chaptersLength}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Lessons</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {course.duration || '8h'}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {course.enrollmentsCount.toLocaleString()}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Students</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {course.reviewsCount}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Reviews</div>
              </div>
            </div>

            {/* Instructor & CTA */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={course.user.image || `https://ui-avatars.com/api/?name=${course.user.name || 'Expert'}&background=6366f1&color=fff`}
                  alt={course.user.name || 'Instructor'}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white text-sm">
                    {course.user.name || 'Expert Instructor'}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Course Instructor
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  {course.isEnrolled ? 'Continue Learning' : 'Enroll Now'}
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid View
  return (
    <Card className="bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 h-full flex flex-col overflow-hidden shadow-sm hover:shadow-xl group">
      {/* Image Section */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img 
          src={course.imageUrl || "/placeholder.svg"} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge className={`${config.color} border backdrop-blur-sm text-xs`}>
            <span className="mr-1">{config.icon}</span>
            {level}
          </Badge>
          {course.trending && (
            <Badge className="bg-orange-500/90 text-white border-0 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Hot
            </Badge>
          )}
        </div>

        {/* Quick actions */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-7 p-0 bg-white/90 hover:bg-white backdrop-blur-sm"
            onClick={() => setIsBookmarked(!isBookmarked)}
          >
            <Bookmark className={`w-3 h-3 ${isBookmarked ? 'fill-current text-blue-600' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-7 p-0 bg-white/90 hover:bg-white backdrop-blur-sm"
          >
            <Share2 className="w-3 h-3" />
          </Button>
        </div>

        {/* Price badge */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-slate-900/90 text-white px-2 py-1 rounded-md backdrop-blur-sm">
            <span className="text-sm font-bold">${course.price || 0}</span>
          </div>
        </div>

        {/* Certificate badge */}
        {course.certificateOffered && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-purple-500/90 text-white border-0 text-xs">
              <Award className="w-3 h-3 mr-1" />
              Certificate
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            {course.category?.name || 'General'}
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs font-medium text-slate-900 dark:text-white">
              {course.averageRating.toFixed(1)}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              ({course.enrollmentsCount})
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-3 flex-1">
          {course.cleanDescription || course.description || "Learn essential skills with this comprehensive course."}
        </p>

        {/* Skills (first 2) */}
        {course.skills && course.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {course.skills.slice(0, 2).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700">
                {skill}
              </Badge>
            ))}
            {course.skills.length > 2 && (
              <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700">
                +{course.skills.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-4">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>{course.chaptersLength} lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{course.duration || '8h'}</span>
          </div>
        </div>

        {/* Instructor & CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={course.user.image || `https://ui-avatars.com/api/?name=${course.user.name || 'Expert'}&background=6366f1&color=fff`}
              alt={course.user.name || 'Instructor'}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
              {course.user.name || 'Expert'}
            </span>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs px-3">
            {course.isEnrolled ? 'Continue' : 'Enroll'}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default function EnterpriseCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('popularity');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showCertificateOnly, setShowCertificateOnly] = useState(false);
  const [showTrendingOnly, setShowTrendingOnly] = useState(false);

  // Enhanced categories with icons
  const categories = [
    { id: 'all', name: 'All Categories', icon: Grid3X3, color: 'text-slate-600' },
    { id: 'technology', name: 'Technology', icon: Code, color: 'text-blue-600' },
    { id: 'business', name: 'Business', icon: Briefcase, color: 'text-green-600' },
    { id: 'design', name: 'Design', icon: Palette, color: 'text-purple-600' },
    { id: 'marketing', name: 'Marketing', icon: Target, color: 'text-orange-600' },
    { id: 'data-science', name: 'Data Science', icon: BarChart3, color: 'text-indigo-600' },
    { id: 'ai-ml', name: 'AI & Machine Learning', icon: Brain, color: 'text-pink-600' },
    { id: 'cybersecurity', name: 'Cybersecurity', icon: Shield, color: 'text-red-600' },
  ];


  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log('🚀 Fetching enterprise course catalog...');
        const response = await fetch('/api/courses');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Loaded course catalog:', data.length, 'courses');
        
        // Enhance courses with enterprise features
        const enhancedCourses = data.map((course: any, index: number) => ({
          ...course,
          level: (['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const)[Math.floor(Math.random() * 4)],
          duration: [`${Math.floor(Math.random() * 15) + 5}h`, `${Math.floor(Math.random() * 8) + 2}w`][Math.floor(Math.random() * 2)],
          skills: [
            'React', 'Node.js', 'Python', 'TypeScript', 'Next.js', 'AWS', 'Docker', 
            'GraphQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Kubernetes', 'Machine Learning', 
            'Data Analysis', 'UI/UX Design', 'Figma', 'Adobe XD', 'Digital Marketing', 
            'SEO', 'Content Strategy', 'Project Management', 'Agile', 'Leadership'
          ].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 6) + 2),
          certificateOffered: Math.random() > 0.3,
          difficulty: Math.floor(Math.random() * 5) + 1,
          popularity: Math.floor(Math.random() * 100) + 1,
          trending: index < 5 && Math.random() > 0.7,
          lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)
        }));
        
        setCourses(enhancedCourses);
        setFilteredCourses(enhancedCourses);
      } catch (error) {
        console.error('❌ Failed to load course catalog:', error);
        setCourses([]);
        setFilteredCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Advanced filtering logic
  const filteredResults = useMemo(() => {
    let filtered = [...courses];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(query) ||
        course.cleanDescription?.toLowerCase().includes(query) ||
        course.user.name?.toLowerCase().includes(query) ||
        course.skills?.some(skill => skill.toLowerCase().includes(query)) ||
        course.category?.name.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => 
        course.category?.name.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }

    // Price filter
    filtered = filtered.filter(course => {
      const price = course.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Skills filter
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(course =>
        course.skills?.some(skill => selectedSkills.includes(skill))
      );
    }

    // Certificate filter
    if (showCertificateOnly) {
      filtered = filtered.filter(course => course.certificateOffered);
    }

    // Trending filter
    if (showTrendingOnly) {
      filtered = filtered.filter(course => course.trending);
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'enrollments':
        filtered.sort((a, b) => b.enrollmentsCount - a.enrollmentsCount);
        break;
      case 'trending':
        filtered.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'popularity':
      default:
        filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    return filtered;
  }, [courses, searchQuery, selectedCategory, selectedLevel, priceRange, sortBy, selectedSkills, showCertificateOnly, showTrendingOnly]);

  // Get all available skills
  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    courses.forEach(course => {
      course.skills?.forEach(skill => skillSet.add(skill));
    });
    return Array.from(skillSet).sort();
  }, [courses]);

  useEffect(() => {
    setFilteredCourses(filteredResults);
  }, [filteredResults]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Professional Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Course Catalog
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Discover {courses.length} professional courses designed to advance your career
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {courses.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {filteredCourses.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Filtered Results</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Advanced Search & Filters */}
        <div className="mb-8">
          {/* Primary Search Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses, skills, instructors..."
                  className="pl-12 pr-4 h-12 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 rounded-lg text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-3">
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-40 h-12 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 h-12 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="enrollments">Most Enrolled</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="alphabetical">A-Z</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-12 px-4 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {(selectedSkills.length > 0 || showCertificateOnly || showTrendingOnly) && (
                    <Badge className="ml-2 bg-blue-500 text-white">
                      {selectedSkills.length + (showCertificateOnly ? 1 : 0) + (showTrendingOnly ? 1 : 0)}
                    </Badge>
                  )}
                </Button>

                {/* View Toggle */}
                <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-lg p-1 border border-slate-300 dark:border-slate-600">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-10 px-3"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-10 px-3"
                  >
                    <LayoutList className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-3 mt-6">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50'
                  }`}
                >
                  <category.icon className={`w-4 h-4 ${selectedCategory === category.id ? 'text-white' : category.color}`} />
                  <span className="font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Price Range */}
                <div>
                  <label className="text-sm font-semibold text-slate-900 dark:text-white mb-3 block">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={1000}
                    step={25}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mt-2">
                    <span>Free</span>
                    <span>$1000+</span>
                  </div>
                </div>

                {/* Feature Filters */}
                <div>
                  <label className="text-sm font-semibold text-slate-900 dark:text-white mb-3 block">
                    Course Features
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="certificate"
                        checked={showCertificateOnly}
                        onCheckedChange={(checked) => setShowCertificateOnly(checked === true)}
                      />
                      <label htmlFor="certificate" className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        Certificate Offered
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="trending"
                        checked={showTrendingOnly}
                        onCheckedChange={(checked) => setShowTrendingOnly(checked === true)}
                      />
                      <label htmlFor="trending" className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        Trending Courses
                      </label>
                    </div>
                  </div>
                </div>

                {/* Skills Filter */}
                <div>
                  <label className="text-sm font-semibold text-slate-900 dark:text-white mb-3 block">
                    Skills ({selectedSkills.length} selected)
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {allSkills.slice(0, 10).map((skill) => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox
                          id={skill}
                          checked={selectedSkills.includes(skill)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSkills([...selectedSkills, skill]);
                            } else {
                              setSelectedSkills(selectedSkills.filter(s => s !== skill));
                            }
                          }}
                        />
                        <label htmlFor={skill} className="text-sm text-slate-700 dark:text-slate-300">
                          {skill}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {filteredCourses.length} courses match your criteria
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSkills([]);
                    setShowCertificateOnly(false);
                    setShowTrendingOnly(false);
                    setPriceRange([0, 1000]);
                  }}
                  className="text-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Results Summary & Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Course Catalog
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              <span className="font-semibold text-slate-900 dark:text-white">{filteredCourses.length}</span> courses found
              {searchQuery && ` for "${searchQuery}"`}
              {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
            </p>
          </div>

          {/* Quick Reset */}
          {(searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all' || selectedSkills.length > 0 || showCertificateOnly || showTrendingOnly) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedLevel('all');
                setSelectedSkills([]);
                setShowCertificateOnly(false);
                setShowTrendingOnly(false);
                setPriceRange([0, 1000]);
                setSortBy('popularity');
              }}
              className="text-sm"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Course Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Loading enterprise course catalog...</p>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "space-y-6"
          }>
            {filteredCourses.map((course) => (
              <EnterpriseCourseCard key={course.id} course={course} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No courses found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              We couldn't find any courses matching your criteria. Try adjusting your filters or search terms.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedLevel('all');
                  setSelectedSkills([]);
                  setShowCertificateOnly(false);
                  setShowTrendingOnly(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Eye className="w-4 h-4 mr-2" />
                View All Courses
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}