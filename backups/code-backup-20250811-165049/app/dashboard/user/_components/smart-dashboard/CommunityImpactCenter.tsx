"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, Heart, Share2, MessageCircle, 
  TrendingUp, Star, Award, BookOpen,
  ChevronRight, Eye, ThumbsUp, UserPlus,
  Trophy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "next-auth";
import Link from "next/link";

interface CommunityImpactCenterProps {
  user: User;
}

interface SharedCourse {
  id: string;
  title: string;
  description: string;
  enrollments: number;
  rating: number;
  reviews: number;
  category: string;
  thumbnail?: string;
  createdAt: string;
}

interface CommunityActivity {
  id: string;
  type: "course_shared" | "review_received" | "milestone_achieved" | "badge_earned";
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

interface CommunityStats {
  totalStudents: number;
  totalCourses: number;
  totalReviews: number;
  averageRating: number;
  totalHours: number;
  reputation: number;
}

export function CommunityImpactCenter({ user }: CommunityImpactCenterProps) {
  const [stats] = useState<CommunityStats>({
    totalStudents: 1247,
    totalCourses: 8,
    totalReviews: 156,
    averageRating: 4.8,
    totalHours: 324,
    reputation: 2150
  });

  const [sharedCourses] = useState<SharedCourse[]>([
    {
      id: "1",
      title: "Modern React Development",
      description: "Learn React with hooks, context, and modern patterns",
      enrollments: 342,
      rating: 4.9,
      reviews: 47,
      category: "Frontend",
      createdAt: "2023-11-15"
    },
    {
      id: "2",
      title: "JavaScript Fundamentals",
      description: "Master the basics of JavaScript programming",
      enrollments: 589,
      rating: 4.7,
      reviews: 89,
      category: "Programming",
      createdAt: "2023-10-20"
    },
    {
      id: "3",
      title: "Node.js Backend Basics",
      description: "Build scalable backend applications with Node.js",
      enrollments: 316,
      rating: 4.8,
      reviews: 42,
      category: "Backend",
      createdAt: "2023-12-03"
    }
  ]);

  const [recentActivities] = useState<CommunityActivity[]>([
    {
      id: "1",
      type: "review_received",
      title: "New 5-star review",
      description: "Sarah loved your React course!",
      timestamp: "2 hours ago",
      icon: Star,
      color: "text-yellow-600"
    },
    {
      id: "2",
      type: "milestone_achieved",
      title: "1000+ students reached",
      description: "Your courses have helped over 1000 learners",
      timestamp: "1 day ago",
      icon: Users,
      color: "text-blue-600"
    },
    {
      id: "3",
      type: "course_shared",
      title: "Course shared",
      description: "Node.js course was shared 15 times this week",
      timestamp: "2 days ago",
      icon: Share2,
      color: "text-green-600"
    },
    {
      id: "4",
      type: "badge_earned",
      title: "Expert Educator badge",
      description: "Earned for exceptional teaching quality",
      timestamp: "3 days ago",
      icon: Award,
      color: "text-purple-600"
    }
  ]);

  const topCourse = sharedCourses.sort((a, b) => b.enrollments - a.enrollments)[0];

  return (
    <div className="space-y-6">
      {/* Community Impact Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-green-50/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <Heart className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-white">Your Community Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-800/60 border border-slate-600/30 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">{stats.totalStudents}</span>
                </div>
                <p className="text-sm text-slate-400">Total Students</p>
              </div>
              
              <div className="text-center p-4 bg-slate-800/60 border border-slate-600/30 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-600">{stats.totalCourses}</span>
                </div>
                <p className="text-sm text-slate-400">Courses Created</p>
              </div>
              
              <div className="text-center p-4 bg-slate-800/60 border border-slate-600/30 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="text-2xl font-bold text-yellow-600">{stats.averageRating}</span>
                </div>
                <p className="text-sm text-slate-400">Avg Rating</p>
              </div>
              
              <div className="text-center p-4 bg-slate-800/60 border border-slate-600/30 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">{stats.totalReviews}</span>
                </div>
                <p className="text-sm text-slate-400">Reviews</p>
              </div>
              
              <div className="text-center p-4 bg-slate-800/60 border border-slate-600/30 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span className="text-2xl font-bold text-indigo-600">{stats.totalHours}</span>
                </div>
                <p className="text-sm text-slate-400">Hours Taught</p>
              </div>
              
              <div className="text-center p-4 bg-slate-800/60 border border-slate-600/30 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Award className="w-5 h-5 text-orange-600" />
                  <span className="text-2xl font-bold text-orange-600">{stats.reputation}</span>
                </div>
                <p className="text-sm text-slate-400">Reputation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Performing Course */}
      {topCourse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-yellow-50/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-100">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-white">Your Top Course</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-slate-800/60 border border-slate-600/30 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">{topCourse.title}</h3>
                  <p className="text-sm text-slate-400 mb-3">{topCourse.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-300">{topCourse.enrollments} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <span className="text-slate-300">{topCourse.rating} ({topCourse.reviews} reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link href={`/courses/${topCourse.id}/analytics`}>
                    <Button variant="outline" size="sm">
                      View Analytics
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Community Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-purple-50/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-white">Recent Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => {
                const ActivityIcon = activity.icon;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-slate-800/60 border border-slate-600/30 rounded-lg hover:bg-slate-700/80 transition-colors"
                  >
                    <div className="p-2 rounded-full bg-slate-700/80">
                      <ActivityIcon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{activity.title}</h4>
                      <p className="text-sm text-slate-400">{activity.description}</p>
                    </div>
                    <span className="text-xs text-slate-500">{activity.timestamp}</span>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Share2 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-white">Community Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/courses/create">
                <Button
                  variant="ghost"
                  className="w-full h-auto p-4 bg-slate-800/60 border border-slate-600/30 hover:bg-slate-700/80 border border-slate-600/30 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white group-hover:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-white">Create New Course</h4>
                      <p className="text-sm text-slate-400">Share your expertise</p>
                    </div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/my-courses/analytics">
                <Button
                  variant="ghost"
                  className="w-full h-auto p-4 bg-slate-800/60 border border-slate-600/30 hover:bg-slate-700/80 border border-slate-600/30 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-white">View Analytics</h4>
                      <p className="text-sm text-slate-400">Track your impact</p>
                    </div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/community/discussions">
                <Button
                  variant="ghost"
                  className="w-full h-auto p-4 bg-slate-800/60 border border-slate-600/30 hover:bg-slate-700/80 border border-slate-600/30 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-white">Join Discussions</h4>
                      <p className="text-sm text-slate-400">Connect with learners</p>
                    </div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/community/mentorship">
                <Button
                  variant="ghost"
                  className="w-full h-auto p-4 bg-slate-800/60 border border-slate-600/30 hover:bg-slate-700/80 border border-slate-600/30 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white group-hover:scale-110 transition-transform">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-white">Become Mentor</h4>
                      <p className="text-sm text-slate-400">Guide other learners</p>
                    </div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}