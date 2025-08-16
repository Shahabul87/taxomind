"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Search, TrendingUp, Clock, Eye, MessageCircle, ChevronRight, ChevronDown, Menu, Flame, Calendar, BookOpen, Users, Star, Code, Briefcase, Palette, Target, BarChart3, Brain, Shield } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  duration?: string;
  skills?: string[];
  certificateOffered?: boolean;
  difficulty?: number;
  popularity?: number;
  trending?: boolean;
}

interface CompactCourseCard {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  isPublished: boolean;
  category?: string | null;
  createdAt: string;
  chaptersLength: number;
  price?: number | null;
  averageRating: number;
  enrollmentsCount: number;
}

// Compact Course Card Component (similar to blog CompactCard)
const CompactCard = ({ course }: { course: CompactCourseCard }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image 
          src={course.imageUrl || "/placeholder.svg"} 
          alt={course.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 right-3">
          <div className="bg-black/70 text-white px-2 py-1 rounded-md backdrop-blur-sm">
            <span className="text-sm font-bold">${course.price || 0}</span>
          </div>
        </div>
      </div>
      
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
            {course.category || 'General'}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
              {course.averageRating.toFixed(1)}
            </span>
          </div>
        </div>
        
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {course.title}
        </h3>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {course.description || "Learn essential skills with this comprehensive course."}
        </p>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 dark:text-gray-400 gap-1 sm:gap-0">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>{course.chaptersLength} lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{course.enrollmentsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wide Course Card Component with Enhanced Mobile Responsiveness
const WideCard = ({ course }: { course: CompactCourseCard }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Image Section - Responsive sizing */}
        <div className="relative w-full sm:w-48 md:w-56 lg:w-80 aspect-[16/10] sm:aspect-[4/3] lg:aspect-auto overflow-hidden">
          <Image 
            src={course.imageUrl || "/placeholder.svg"} 
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
            <div className="bg-black/70 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md backdrop-blur-sm">
              <span className="text-sm sm:text-base lg:text-lg font-bold">${course.price || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Content Section - Mobile optimized */}
        <div className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6">
          {/* Header with category and rating */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-2 sm:gap-0">
            <span className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 sm:px-3 rounded-full w-fit">
              {course.category || 'General'}
            </span>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${star <= course.averageRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                {course.averageRating.toFixed(1)}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                ({course.enrollmentsCount})
              </span>
            </div>
          </div>
          
          {/* Title - Responsive text sizing */}
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {course.title}
          </h3>
          
          {/* Description - Hide on very small screens */}
          <p className="hidden xs:block text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4">
            {course.description || "Comprehensive course designed to help you master essential skills and advance your career."}
          </p>
          
          {/* Bottom section - Responsive layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Course stats - Responsive grid */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate">{course.chaptersLength} lessons</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate">8h total</span>
              </div>
              <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate">{course.enrollmentsCount} students</span>
              </div>
            </div>
            
            {/* Action button - Mobile optimized */}
            <Link href={`/courses/${course.id}`} className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base">
                <span className="sm:hidden">View</span>
                <span className="hidden sm:inline">View Course</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [showTabMenu, setShowTabMenu] = useState(false);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [excitingCourses, setExcitingCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [visibleTabs, setVisibleTabs] = useState<string[]>([]);
  const [hiddenTabs, setHiddenTabs] = useState<string[]>([]);

  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState('3.5rem');
  const [contentTopPadding, setContentTopPadding] = useState('6.75rem');

  // Calculate which tabs fit in the available space
  const calculateVisibleTabs = useCallback(() => {
    if (!tabsContainerRef.current || categories.length === 0) return;

    const container = tabsContainerRef.current;
    const containerWidth = container.clientWidth;
    const moreButtonWidth = 120; // Approximate width of "More" button
    const availableWidth = containerWidth - moreButtonWidth;

    let totalWidth = 0;
    let visibleCount = 0;

    // Calculate approximate width for each tab (rough estimation)
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      // Approximate tab width: padding (24px) + text width + border
      const estimatedWidth = category.length * 8 + 48; // 8px per character + padding
      
      if (totalWidth + estimatedWidth <= availableWidth) {
        totalWidth += estimatedWidth;
        visibleCount++;
      } else {
        break;
      }
    }

    // If all tabs fit, show all and no "More" button
    if (visibleCount >= categories.length) {
      setVisibleTabs(categories);
      setHiddenTabs([]);
    } else {
      // Ensure at least 2 tabs are visible, rest go to "More"
      const minVisible = Math.max(2, Math.min(visibleCount, categories.length - 1));
      setVisibleTabs(categories.slice(0, minVisible));
      setHiddenTabs(categories.slice(minVisible));
    }
  }, [categories]);

  // Handle responsive header height and tab calculation
  useEffect(() => {
    const updateLayout = () => {
      const isSmallScreen = window.innerWidth < 640; // sm breakpoint
      const newHeaderHeight = isSmallScreen ? '3.5rem' : '4rem';
      setHeaderHeight(newHeaderHeight);
      // Tab height is approximately 3rem (py-4 + text), so total is header + tabs with minimal gap
      setContentTopPadding(isSmallScreen ? '5.5rem' : '6rem');
      
      // Recalculate visible tabs on resize
      setTimeout(calculateVisibleTabs, 100); // Small delay to ensure DOM updates
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [categories, calculateVisibleTabs]);

  // Fetch courses from API route
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/courses');
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Enhance courses with additional data
          const enhancedCourses = data.map((course: any, index: number) => ({
            ...course,
            level: (['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const)[Math.floor(Math.random() * 4)],
            duration: `${Math.floor(Math.random() * 15) + 5}h`,
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
          }));

          setCourses(enhancedCourses);
          
          // Sort by date for recent courses
          const sortedByDate = [...enhancedCourses].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setRecentCourses(sortedByDate.slice(0, 6));
          
          // Sort by enrollments for popular courses
          const sortedByEnrollments = [...enhancedCourses].sort((a, b) => b.enrollmentsCount - a.enrollmentsCount);
          setPopularCourses(sortedByEnrollments.slice(0, 5));
          
          // Mix of high enrollments and recent for exciting courses
          const exciting = [...enhancedCourses]
            .filter(course => course.enrollmentsCount > 100)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4);
          setExcitingCourses(exciting);
          
          // Get unique categories from courses
          const courseCategories = Array.from(new Set(enhancedCourses.map((course: Course) => course.category?.name).filter(Boolean)));
          
          // Combine with additional categories for demonstration
          const additionalCategories = [
            "Data Science",
            "Mobile Development", 
            "DevOps",
            "Blockchain",
            "Cloud Computing"
          ];
          
          const allCategories = [
            "All", 
            ...courseCategories,
            ...additionalCategories.filter(cat => !courseCategories.includes(cat))
          ];
          
          setCategories(allCategories);
          
          // Initial tab calculation will be handled by useEffect
        } else {
          setError("Failed to load courses");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Recalculate visible tabs when categories change
  useEffect(() => {
    if (categories.length > 0) {
      setTimeout(calculateVisibleTabs, 200); // Allow time for DOM to update
    }
  }, [categories, calculateVisibleTabs]);

  // Transform courses for card component
  const transformCourseForCard = (course: Course): CompactCourseCard => ({
    id: course.id,
    title: course.title,
    description: course.description,
    imageUrl: course.imageUrl,
    isPublished: course.isPublished,
    category: course.category?.name,
    createdAt: course.createdAt,
    chaptersLength: course.chaptersLength,
    price: course.price,
    averageRating: course.averageRating,
    enrollmentsCount: course.enrollmentsCount
  });

  // Get courses for active category
  const getCoursesByCategory = (category: string) => {
    if (category === "All") return courses;
    return courses.filter(course => course.category?.name === category);
  };

  // Scroll to category section
  const scrollToCategory = (category: string) => {
    setActiveTab(category);
    if (category === "All") {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(`category-${category.replace(/\s+/g, '-').toLowerCase()}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle tab selection from dropdown
  const handleTabSelect = (category: string) => {
    setActiveTab(category);
    setShowTabMenu(false);
    scrollToCategory(category);
  };

  // Update active tab based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = categories.filter(cat => cat !== "All").map(category => {
        const element = document.getElementById(`category-${category.replace(/\s+/g, '-').toLowerCase()}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          return {
            category,
            top: rect.top,
            inView: rect.top <= 200 && rect.bottom >= 200
          };
        }
        return null;
      }).filter(Boolean);

      const currentSection = sections.find(section => section?.inView);
      if (currentSection) {
        setActiveTab(currentSection.category);
      } else if (window.scrollY < 500) {
        setActiveTab("All");
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Failed to Load Courses
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Category Tabs - Positioned to connect seamlessly with header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed left-0 right-0 z-40" style={{top: headerHeight}}>
        <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6">
          <div ref={tabsContainerRef} className="flex items-center justify-between">
            <div ref={tabsRef} className="flex items-center space-x-1 overflow-hidden">
              {visibleTabs.map((category) => (
                <button
                  key={category}
                  onClick={() => scrollToCategory(category)}
                  className={`px-3 sm:px-4 md:px-5 lg:px-6 py-3 md:py-4 text-xs sm:text-sm md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === category
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {hiddenTabs.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowTabMenu(!showTabMenu)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Menu className="w-4 h-4 mr-1" />
                  More
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showTabMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showTabMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {hiddenTabs.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleTabSelect(category)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-full py-2" style={{paddingTop: contentTopPadding}}>
        {/* 4-Column Layout for Main Page */}
        <section id="main-section" className="mb-6 sm:mb-8 md:mb-16 px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 2xl:px-12">
          <div className="grid grid-cols-12 gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 2xl:gap-8 max-w-[1920px] mx-auto">
            {/* Left Column - Recent Courses */}
            <div className="col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 md:border-r border-gray-200 dark:border-gray-700 px-2 sm:px-3 md:pr-3 lg:pr-4 xl:pr-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
                <div className="flex items-center mb-3 sm:mb-4 md:mb-6 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-100 dark:border-purple-800/30">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 mr-2 sm:mr-3">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text">Recent Courses</h3>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {recentCourses.map((course) => (
                    <Link key={course.id} href={`/courses/${course.id}`} className="block group">
                      <div className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0">
                        <div className="flex items-start gap-2 sm:gap-3">
                          {/* Course Image */}
                          <div className="relative w-12 h-9 sm:w-16 sm:h-12 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image 
                              src={course.imageUrl || "/placeholder.svg"} 
                              alt={course.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          </div>
                          
                          {/* Course Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-2 mb-1 sm:mb-2">
                              {course.title}
                            </h4>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 dark:text-gray-400 gap-1 sm:gap-0">
                              <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                              <span>{course.enrollmentsCount} students</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 mt-1">
                              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                ${course.price || 0}
                              </span>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {course.averageRating.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Section - Main Content */}
            <div className="col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 px-2 sm:px-3 md:px-3 lg:px-4 xl:px-6">
              <div className="mb-4 sm:mb-6 md:mb-8 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-blue-100 to-indigo-100 dark:from-purple-900/10 dark:via-blue-900/10 dark:to-indigo-900/10 rounded-xl sm:rounded-2xl blur-xl opacity-50"></div>
                <div className="relative p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/30">
                  <div className="flex items-center mb-2 sm:mb-3">
                    <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 mr-2 sm:mr-3 md:mr-4">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400 text-transparent bg-clip-text">
                      Featured Courses
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 ml-8 sm:ml-10 md:ml-12">
                    Browse through our most popular courses
                  </p>
                </div>
              </div>

              {/* Featured Courses Grid - Enhanced Responsive Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                {courses.slice(0, 6).map((course) => (
                  <CompactCard 
                    key={course.id}
                    course={transformCourseForCard(course)} 
                  />
                ))}
              </div>
            </div>

            {/* Right Column - Popular & Trending */}
            <div className="col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 md:border-l lg:border-l border-gray-200 dark:border-gray-700 px-2 sm:px-3 md:pl-3 lg:pl-4 xl:pl-6 md:mt-0 lg:mt-0">
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {/* Most Enrolled */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
                  <div className="flex items-center mb-3 sm:mb-4 md:mb-6 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800/30">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 mr-2 sm:mr-3">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text">Most Enrolled</h3>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {popularCourses.map((course, index) => (
                      <Link key={course.id} href={`/courses/${course.id}`} className="block group">
                        <div className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0">
                          <div className="flex items-start gap-2 sm:gap-3">
                            {/* Ranking Number */}
                            <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold flex items-center justify-center mt-1">
                              {index + 1}
                            </span>
                            
                            {/* Course Image */}
                            <div className="relative w-12 h-9 sm:w-16 sm:h-12 flex-shrink-0 rounded-lg overflow-hidden">
                              <Image 
                                src={course.imageUrl || "/placeholder.svg"} 
                                alt={course.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                            
                            {/* Course Content */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 mb-1">
                                {course.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {course.enrollmentsCount} students
                              </p>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  ${course.price || 0}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {course.averageRating.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Trending */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
                  <div className="flex items-center mb-3 sm:mb-4 md:mb-6 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-100 dark:border-orange-800/30">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 mr-2 sm:mr-3">
                      <Flame className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 text-transparent bg-clip-text">Trending</h3>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {excitingCourses.map((course) => (
                      <Link key={course.id} href={`/courses/${course.id}`} className="block group">
                        <div className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0">
                          <div className="flex items-start gap-2 sm:gap-3">
                            {/* Course Image */}
                            <div className="relative w-12 h-9 sm:w-16 sm:h-12 flex-shrink-0 rounded-lg overflow-hidden">
                              <Image 
                                src={course.imageUrl || "/placeholder.svg"} 
                                alt={course.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                              {/* Trending Badge */}
                              <div className="absolute top-1 right-1">
                                <TrendingUp className="w-3 h-3 text-orange-500" />
                              </div>
                            </div>
                            
                            {/* Course Content */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 line-clamp-2 mb-1 sm:mb-2">
                                {course.title}
                              </h4>
                              <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 dark:text-gray-400 mb-1 gap-1 sm:gap-0">
                                <span>{course.enrollmentsCount} students</span>
                                <span className="hidden sm:inline mx-1">•</span>
                                <span>{course.reviewsCount} reviews</span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                  ${course.price || 0}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {course.averageRating.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Sections - Enhanced Responsive Layout */}
        <div className="max-w-full px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 2xl:px-12">
          <div className="max-w-[1920px] mx-auto">
          {categories.filter(cat => cat !== "All").map((category) => {
            const categoryCourses = getCoursesByCategory(category);
            
            return (
              <section 
                key={category} 
                id={`category-${category.replace(/\s+/g, '-').toLowerCase()}`}
                className="scroll-mt-16 sm:scroll-mt-20 md:scroll-mt-24 mb-8 sm:mb-12 md:mb-16 lg:mb-20"
              >
                {/* Category Header with Separator Line */}
                <div className="relative mb-4 sm:mb-6 md:mb-8 lg:mb-12">
                  <div className="h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60"></div>
                  <div className="absolute inset-0 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-40 blur-sm"></div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 md:mb-8 lg:mb-12 gap-3 sm:gap-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10 rounded-xl sm:rounded-2xl blur-xl opacity-40 -z-10"></div>
                  <div className="relative">
                    <div className="flex items-center mb-1 sm:mb-2 lg:mb-3">
                      <div className="p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mr-3 sm:mr-4 shadow-lg">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
                        {category}
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 ml-10 sm:ml-12 md:ml-16">
                      {categoryCourses.length > 0 
                        ? `${categoryCourses.length} course${categoryCourses.length !== 1 ? 's' : ''} in this category`
                        : 'Explore courses in this category'
                      }
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-30"></div>
                    <span className="relative px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-pink-900/40 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm md:text-base font-bold rounded-full border border-indigo-200 dark:border-indigo-700/50 shadow-lg">
                      {categoryCourses.length} courses
                    </span>
                  </div>
                </div>
                
                {/* Wide Cards for Category Pages */}
                {categoryCourses.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6 md:space-y-8 max-w-none">
                    {categoryCourses.map((course) => (
                      <WideCard 
                        key={course.id}
                        course={transformCourseForCard(course)} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 md:py-12 lg:py-16 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-400 dark:to-gray-200 text-transparent bg-clip-text mb-1 sm:mb-2">
                      No courses yet
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 md:mb-6 px-4">
                      Courses in the {category} category will appear here
                    </p>
                    <button 
                      onClick={() => scrollToCategory("All")}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 bg-purple-600 text-white text-xs sm:text-sm md:text-base rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Browse All Courses
                    </button>
                  </div>
                )}
              </section>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}