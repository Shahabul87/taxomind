'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ProfilePageLayout } from './_components/ProfilePageLayout';
import {
  User,
  BookOpen,
  Award,
  Calendar,
  Settings,
  Activity,
  TrendingUp,
  Clock,
  Target,
  Trophy,
  Star,
  ChevronRight,
  Edit2,
  Camera,
  Mail,
  MapPin,
  Link as LinkIcon,
  Twitter,
  Linkedin,
  Github,
  Globe,
  BarChart3,
  Users,
  FileText,
  Video,
  MessageSquare,
  Heart,
  Sparkles,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  location?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  createdAt: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
  totalLearningHours: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  recentActivity: Activity[];
  skills: Skill[];
  courses: EnrolledCourse[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Activity {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  progress?: number;
}

interface Skill {
  name: string;
  level: number;
  progress: number;
}

interface EnrolledCourse {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  thumbnail: string;
  lastAccessed: string;
  totalChapters: number;
  completedChapters: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login');
    }
  }, [status]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/user/profile');

        console.log('[Profile] API Response Status:', response.status);

        const result = await response.json();
        console.log('[Profile] API Response:', result);

        if (!response.ok) {
          const errorMsg = result.error?.message || `API returned ${response.status}`;
          console.error('[Profile] API Error:', {
            status: response.status,
            error: result.error,
            details: result.error?.details
          });
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive",
          });
          return;
        }

        if (result.success && result.data) {
          setProfile(result.data);
        } else {
          console.error('[Profile] Invalid response format:', result);
          toast({
            title: "Error",
            description: result.error?.message || 'Failed to load profile data',
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('[Profile] Fetch error:', error);
        toast({
          title: "Error",
          description: `Failed to load profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session, toast]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="animate-spin rounded-full h-10 w-10 xs:h-12 xs:w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Unable to Load Profile
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 break-words">
            We encountered an issue loading your profile data. Please check the browser console for details.
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="h-9 sm:h-10 text-xs sm:text-sm"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <ProfilePageLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen"
      >
        {/* Profile Header Banner */}
        <div className="relative overflow-hidden">
          <div className="h-40 xs:h-48 sm:h-56 md:h-64 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 relative">
            <motion.div
              className="absolute inset-0"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                backgroundSize: '100px 100px'
              }}
            />
          </div>
        </div>

        <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 -mt-16 xs:-mt-20 sm:-mt-24 relative z-10">
        <motion.div
          variants={itemVariants}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
        >
          <div className="flex flex-col md:flex-row items-start gap-4 sm:gap-6 md:gap-8">
            {/* Profile Picture */}
            <div className="relative group mx-auto md:mx-0">
              <Avatar className="h-24 w-24 xs:h-28 xs:w-28 sm:h-32 sm:w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile.image} alt={profile.name} />
                <AvatarFallback className="text-xl xs:text-2xl sm:text-3xl">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => toast({
                  title: "Coming Soon",
                  description: "Profile picture upload feature is currently in development!",
                })}
              >
                <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full">
              <div className="flex items-start justify-between flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 w-full min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white break-words">
                      {profile.name}
                    </h1>
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                      className="flex-shrink-0"
                    >
                      <Sparkles className="h-4 w-4 xs:h-5 xs:w-5 sm:h-5 sm:w-5 text-indigo-500" />
                    </motion.div>
                  </div>
                  <p className="text-xs xs:text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 break-all">
                    <Mail className="h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
                    <span className="min-w-0 break-all">{profile.email}</span>
                  </p>
                  {profile.bio && (
                    <p className="mt-3 sm:mt-4 max-w-2xl text-sm xs:text-base text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-5 text-xs xs:text-sm text-slate-600 dark:text-slate-400">
                    {profile.location && (
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full">
                        <MapPin className="h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
                        <span className="break-words">{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full">
                        <Globe className="h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
                        <a href={profile.website} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-all">
                          Portfolio
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full">
                      <Calendar className="h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
                      <span className="break-words">Member since {new Date(profile.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-1.5 sm:gap-2 mt-4 sm:mt-5">
                    {profile.twitter && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 xs:h-9 xs:w-9 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <Twitter className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                      </Button>
                    )}
                    {profile.linkedin && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 xs:h-9 xs:w-9 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
                        <Linkedin className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                      </Button>
                    )}
                    {profile.github && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 xs:h-9 xs:w-9 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Github className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Edit Profile button clicked');
                    toast({
                      title: "Coming Soon",
                      description: "Profile editing feature is currently in development!",
                    });
                  }}
                  className="border-slate-300 dark:border-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 dark:hover:border-blue-600 transition-all w-full sm:w-auto mt-3 sm:mt-0 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Edit2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Overview - Enhanced */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200 dark:border-slate-700">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
            >
              <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{profile.coursesEnrolled}</div>
              <div className="text-[10px] xs:text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 break-words">Courses Enrolled</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20"
            >
              <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{profile.coursesCompleted}</div>
              <div className="text-[10px] xs:text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 break-words">Completed</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20"
            >
              <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{profile.certificatesEarned}</div>
              <div className="text-[10px] xs:text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 break-words">Certificates</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20"
            >
              <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400">{profile.totalLearningHours}h</div>
              <div className="text-[10px] xs:text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 break-words">Learning Hours</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20"
            >
              <div className="text-xl xs:text-2xl sm:text-3xl font-bold flex items-center justify-center gap-0.5 sm:gap-1 text-orange-600 dark:text-orange-400">
                {profile.currentStreak}
                <motion.span
                  animate={{
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity
                  }}
                  className="text-orange-500 text-base xs:text-lg sm:text-xl"
                >
                  🔥
                </motion.span>
              </div>
              <div className="text-[10px] xs:text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 break-words">Day Streak</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20"
            >
              <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{profile.longestStreak}</div>
              <div className="text-[10px] xs:text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 break-words">Best Streak</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6 md:space-y-8">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-x-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-md sm:rounded-lg text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 py-1.5 sm:py-2">
                Overview
              </TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-md sm:rounded-lg text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 py-1.5 sm:py-2">
                Courses
              </TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-md sm:rounded-lg text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 py-1.5 sm:py-2">
                Achievements
              </TabsTrigger>
              <TabsTrigger value="skills" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-md sm:rounded-lg text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 py-1.5 sm:py-2">
                Skills
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-md sm:rounded-lg text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 py-1.5 sm:py-2">
                Activity
              </TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6 md:space-y-8">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              {/* Continue Learning */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl hover:shadow-xl transition-all duration-300">
                <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base sm:text-lg">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500">
                      <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    Continue Learning
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">Pick up where you left off</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 p-4 sm:p-6">
                  {profile.courses.slice(0, 2).map((course) => (
                    <div key={course.id} className="flex gap-2 sm:gap-3 md:gap-4">
                      <div className="relative w-20 h-14 xs:w-24 xs:h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs sm:text-sm break-words">{course.title}</h4>
                        <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                          {course.completedChapters}/{course.totalChapters} chapters
                        </p>
                        <Progress value={course.progress} className="h-1.5 sm:h-2 mt-1.5 sm:mt-2" />
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0">
                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Achievements */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl hover:shadow-xl transition-all duration-300">
                <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base sm:text-lg">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    Recent Achievements
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">Your latest accomplishments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                  {profile.achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-2 sm:gap-3 md:gap-4">
                      <div className="text-xl sm:text-2xl flex-shrink-0">{achievement.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs sm:text-sm break-words">{achievement.title}</h4>
                        <p className="text-[10px] xs:text-xs text-muted-foreground break-words">{achievement.description}</p>
                      </div>
                      <Badge className={cn(getRarityColor(achievement.rarity), "text-[9px] xs:text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0")}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Learning Stats */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl hover:shadow-xl transition-all duration-300">
                <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base sm:text-lg">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    Learning Analytics
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">Your progress this month</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                        <span>Weekly Goal</span>
                        <span className="font-semibold">15/20 hours</span>
                      </div>
                      <Progress value={75} className="h-1.5 sm:h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                        <span>Monthly Progress</span>
                        <span className="font-semibold">65%</span>
                      </div>
                      <Progress value={65} className="h-1.5 sm:h-2" />
                    </div>
                    <div className="pt-3 sm:pt-4 border-t">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                        <div>
                          <div className="text-xl sm:text-2xl font-bold text-primary">92%</div>
                          <div className="text-[10px] xs:text-xs text-muted-foreground">Completion Rate</div>
                        </div>
                        <div>
                          <div className="text-xl sm:text-2xl font-bold text-primary">4.8</div>
                          <div className="text-[10px] xs:text-xs text-muted-foreground">Avg. Rating Given</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Skills */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl hover:shadow-xl transition-all duration-300">
                <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base sm:text-lg">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    Top Skills
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">Your skill progression</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {profile.skills.slice(0, 5).map((skill) => (
                      <div key={skill.name}>
                        <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                          <span className="break-words">{skill.name}</span>
                          <span className="font-semibold ml-2 flex-shrink-0">{skill.level}%</span>
                        </div>
                        <Progress value={skill.progress} className="h-1.5 sm:h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-4 sm:space-y-6 md:space-y-8">
            <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">My Courses</h2>
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 whitespace-nowrap">All</Button>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 whitespace-nowrap">In Progress</Button>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 whitespace-nowrap">Completed</Button>
              </div>
            </div>
            
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profile.courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow rounded-xl sm:rounded-2xl">
                  <div className="relative h-40 xs:h-44 sm:h-48 bg-gradient-to-br from-primary/20 to-secondary/20">
                    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                      <Badge variant="secondary" className="mb-1.5 sm:mb-2 text-[9px] xs:text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                        {course.progress}% Complete
                      </Badge>
                      <h3 className="font-bold text-sm xs:text-base sm:text-lg text-white break-words line-clamp-2">{course.title}</h3>
                      <p className="text-xs sm:text-sm text-white/80 mt-0.5 sm:mt-1 break-words">by {course.instructor}</p>
                    </div>
                  </div>
                  <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
                    <div className="space-y-2.5 sm:space-y-3">
                      <Progress value={course.progress} className="h-1.5 sm:h-2" />
                      <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                        <span className="break-words">{course.completedChapters}/{course.totalChapters} chapters</span>
                        <span className="ml-2 flex-shrink-0">{course.lastAccessed}</span>
                      </div>
                      <Button className="w-full h-9 sm:h-10 text-xs sm:text-sm">Continue Learning</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4 sm:space-y-6 md:space-y-8">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profile.achievements.map((achievement) => (
                <Card key={achievement.id} className="hover:shadow-lg transition-shadow rounded-xl sm:rounded-2xl">
                  <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                    <div className="text-center space-y-3 sm:space-y-4">
                      <div className="text-4xl sm:text-5xl">{achievement.icon}</div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base break-words">{achievement.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                          {achievement.description}
                        </p>
                      </div>
                      <Badge className={cn(getRarityColor(achievement.rarity), "text-[10px] xs:text-xs px-2 sm:px-3 py-0.5 sm:py-1")}>
                        {achievement.rarity}
                      </Badge>
                      <p className="text-[10px] xs:text-xs text-muted-foreground">
                        Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4 sm:space-y-6 md:space-y-8">
            <Card className="rounded-xl sm:rounded-2xl">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Skill Development</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">Track your expertise across different technologies</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  {profile.skills.map((skill) => (
                    <div key={skill.name} className="space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base break-words">{skill.name}</span>
                        <Badge variant={skill.level >= 70 ? 'default' : 'secondary'} className="text-[10px] xs:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0">
                          Level {Math.floor(skill.level / 20) + 1}
                        </Badge>
                      </div>
                      <Progress value={skill.progress} className="h-2 sm:h-3" />
                      <p className="text-[10px] xs:text-xs text-muted-foreground">
                        {100 - skill.progress}% to next level
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4 sm:space-y-6 md:space-y-8">
            <Card className="rounded-xl sm:rounded-2xl">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">Your learning journey</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {profile.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 sm:gap-4 pb-3 sm:pb-4 border-b last:border-0">
                      <div className="h-8 w-8 xs:h-10 xs:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {activity.type === 'course_progress' && <BookOpen className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />}
                        {activity.type === 'course_completed' && <Trophy className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />}
                        {activity.type === 'certificate_earned' && <Award className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base break-words">{activity.title}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground break-words">{activity.timestamp}</p>
                        {activity.progress && (
                          <Progress value={activity.progress} className="h-1.5 sm:h-2 mt-1.5 sm:mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </motion.div>
        </div>
      </motion.div>
    </ProfilePageLayout>
  );
}