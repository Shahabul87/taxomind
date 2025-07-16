"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { 
  Lightbulb,
  BookOpen,
  Users,
  Clock,
  Star,
  TrendingUp,
  ArrowRight,
  Brain,
  Target,
  Sparkles,
  PlayCircle
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface PersonalizedRecommendationsProps {
  recommendations: any;
  userPreferences: any;
  learningStyle: any;
}

export default function PersonalizedRecommendations({ 
  recommendations, 
  userPreferences, 
  learningStyle 
}: PersonalizedRecommendationsProps) {
  // Mock recommendations based on learning platform context
  const mockRecommendations = {
    courses: [
      {
        id: "1",
        title: "Advanced React Patterns",
        description: "Master advanced React concepts and patterns used in production applications",
        imageUrl: "/placeholder-course.jpg",
        instructor: "Jane Smith",
        duration: "8 hours",
        rating: 4.8,
        studentsCount: 1247,
        category: "Web Development",
        difficulty: "Advanced",
        aiReason: "Based on your JavaScript expertise and recent React activities",
        tags: ["React", "JavaScript", "Frontend"]
      },
      {
        id: "2",
        title: "Machine Learning Fundamentals",
        description: "Introduction to ML concepts, algorithms, and practical applications",
        imageUrl: "/placeholder-course.jpg",
        instructor: "Dr. Alex Chen",
        duration: "12 hours",
        rating: 4.9,
        studentsCount: 892,
        category: "Data Science",
        difficulty: "Beginner",
        aiReason: "Trending in your field and matches your mathematical background",
        tags: ["ML", "Python", "Data Science"]
      },
      {
        id: "3",
        title: "System Design Interview Prep",
        description: "Prepare for system design interviews with real-world examples",
        imageUrl: "/placeholder-course.jpg",
        instructor: "Mike Johnson",
        duration: "6 hours",
        rating: 4.7,
        studentsCount: 654,
        category: "Career Development",
        difficulty: "Intermediate",
        aiReason: "Career goals alignment and current skill level match",
        tags: ["System Design", "Interviews", "Architecture"]
      }
    ],
    articles: [
      {
        id: "1",
        title: "The Future of Web Development in 2024",
        author: "Tech Insights",
        readTime: "5 min",
        category: "Technology Trends"
      },
      {
        id: "2",
        title: "Building Scalable React Applications",
        author: "Dev Community",
        readTime: "8 min",
        category: "Web Development"
      }
    ],
    groups: [
      {
        id: "1",
        name: "React Developers Community",
        members: 12500,
        description: "Share knowledge and discuss React best practices"
      },
      {
        id: "2",
        name: "Full Stack Developers",
        members: 8900,
        description: "Full stack development discussions and networking"
      }
    ]
  };

  const displayRecommendations = recommendations || mockRecommendations;
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Personalized Recommendations</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-curated content just for you
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            <Brain className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Learning Style Insight */}
        {learningStyle && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Your Learning Style: {learningStyle.type || "Visual Learner"}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {learningStyle.description || "You learn best through visual content and hands-on practice. We've tailored these recommendations accordingly."}
            </p>
          </div>
        )}

        {/* Recommended Courses */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Recommended Courses
            </h4>
            <Link href="/discover">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {displayRecommendations.courses?.slice(0, 3).map((course: any, index: number) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Image
                        src={course.imageUrl || "/placeholder-course.jpg"}
                        alt={course.title}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                      
                      <div className="flex-1 space-y-2">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                            {course.title}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {course.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                            {course.difficulty}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{course.rating}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="h-3 w-3" />
                            <span>{course.studentsCount}</span>
                          </div>
                        </div>
                        
                        {course.aiReason && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                              <span className="text-xs font-medium text-purple-800 dark:text-purple-300">
                                Why we recommend this:
                              </span>
                            </div>
                            <p className="text-xs text-purple-700 dark:text-purple-400">
                              {course.aiReason}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {course.tags?.slice(0, 3).map((tag: string, tagIndex: number) => (
                              <Badge key={`${course.id}-tag-${tagIndex}`} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <Link href={`/course/${course.id}`}>
                            <Button size="sm">
                              <PlayCircle className="h-3 w-3 mr-1" />
                              Enroll
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Other Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recommended Articles */}
          {displayRecommendations.articles && displayRecommendations.articles.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Trending Articles
              </h4>
              <div className="space-y-2">
                {displayRecommendations.articles.slice(0, 2).map((article: any, index: number) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:shadow-sm transition-all cursor-pointer"
                  >
                    <h6 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
                      {article.title}
                    </h6>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        by {article.author}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {article.readTime}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Groups */}
          {displayRecommendations.groups && displayRecommendations.groups.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-600" />
                Join Communities
              </h4>
              <div className="space-y-2">
                {displayRecommendations.groups.slice(0, 2).map((group: any, index: number) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:shadow-sm transition-all cursor-pointer"
                  >
                    <h6 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
                      {group.name}
                    </h6>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                      {group.description}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      <span>{group.members} members</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 