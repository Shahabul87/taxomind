"use client"

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  Menu,
  X,
  GraduationCap,
  Settings,
  User,
  LogOut,
  Bell,
  MessageSquare,
  ChevronDown,
  Award,
  TrendingUp,
  Calendar,
  BarChart3,
  Brain,
  Sparkles,
  Shield,
  Users,
  BookMarked,
  FileText,
  Video,
  HelpCircle,
  CreditCard,
  Activity,
  Target,
  Zap,
  Trophy,
  Star
} from 'lucide-react';

interface TaxomindHeaderProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    isTeacher?: boolean;
    // Additional user stats
    coursesEnrolled?: number;
    coursesCompleted?: number;
    achievements?: number;
    learningStreak?: number;
    totalPoints?: number;
    level?: string;
  };
}

export const TaxomindHeader = ({ user }: TaxomindHeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = !!user?.id;
  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.isTeacher === true;

  // Calculate user progress
  const userProgress = user?.coursesCompleted && user?.coursesEnrolled 
    ? Math.round((user.coursesCompleted / user.coursesEnrolled) * 100) 
    : 0;

  useEffect(() => {
    setMounted(true);
    
    // Load notifications
    if (isAuthenticated) {
      // Mock notifications
      setNotifications([
        { id: 1, type: 'achievement', message: 'You earned a new badge!', time: '2h ago', icon: Trophy },
        { id: 2, type: 'course', message: 'New lesson available in React Course', time: '5h ago', icon: BookOpen },
        { id: 3, type: 'message', message: 'John replied to your discussion', time: '1d ago', icon: MessageSquare }
      ]);
    }
  }, [isAuthenticated]);

  // Handle click outside for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const getLevelColor = (level?: string) => {
    switch(level) {
      case 'Expert': return 'from-purple-600 to-indigo-600';
      case 'Advanced': return 'from-blue-600 to-cyan-600';
      case 'Intermediate': return 'from-green-600 to-emerald-600';
      default: return 'from-gray-600 to-slate-600';
    }
  };

  const getRoleBadge = () => {
    if (isAdmin) return { text: 'Admin', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    if (isTeacher) return { text: 'Teacher', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    return { text: 'Student', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-slate-900/5 to-blue-900/10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-slate-900 p-2 rounded-lg border border-purple-500/30">
                    <BookOpen className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 text-transparent bg-clip-text">
                    Taxomind
                  </span>
                  <p className="text-[10px] text-gray-500 font-medium">Intelligent Learning Platform</p>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1">
                <Link href="/courses" className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800/50 transition-all font-medium flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Courses
                </Link>
                <Link href="/blog" className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800/50 transition-all font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Blog
                </Link>
                <Link href="/community" className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800/50 transition-all font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Community
                </Link>
                {isAuthenticated && (
                  <Link href="/ai-tutor" className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800/50 transition-all font-medium flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Tutor
                  </Link>
                )}
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors text-gray-400 hover:text-white"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>


              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <button className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors text-gray-400 hover:text-white relative">
                      <Bell className="w-5 h-5" />
                      {notifications.length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </button>
                  </div>

                  {/* User Profile Dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center space-x-3 p-2 pr-3 rounded-xl hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-700"
                    >
                      {/* User Avatar */}
                      <div className="relative">
                        <div className="w-9 h-9 rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gradient-to-br from-purple-600 to-blue-600 p-0.5">
                          <div className="w-full h-full rounded-md overflow-hidden bg-slate-900">
                            {user?.image ? (
                              <Image
                                src={user.image}
                                alt={user.name || "User"}
                                width={36}
                                height={36}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Online Status */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
                      </div>

                      {/* User Info - Hidden on mobile */}
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium text-white flex items-center gap-2">
                          {user?.name || 'User'}
                          {user?.level && (
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${getLevelColor(user.level)} text-white`}>
                              {user.level}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-2">
                          {user?.totalPoints && (
                            <>
                              <Zap className="w-3 h-3 text-yellow-500" />
                              {user.totalPoints.toLocaleString()} pts
                            </>
                          )}
                          {user?.learningStreak && user.learningStreak > 0 && (
                            <>
                              <span className="text-gray-600">•</span>
                              <Activity className="w-3 h-3 text-orange-500" />
                              {user.learningStreak} day streak
                            </>
                          )}
                        </p>
                      </div>

                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Profile Dropdown Menu */}
                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden"
                        >
                          {/* User Header in Dropdown */}
                          <div className="p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-b border-slate-800">
                            <div className="flex items-center space-x-3">
                              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-purple-500/40 bg-gradient-to-br from-purple-600 to-blue-600 p-0.5">
                                <div className="w-full h-full rounded-lg overflow-hidden bg-slate-900">
                                  {user?.image ? (
                                    <Image
                                      src={user.image}
                                      alt={user.name || "User"}
                                      width={56}
                                      height={56}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-white">{user?.name || 'User'}</h3>
                                <p className="text-sm text-gray-400">{user?.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-1 rounded-md border ${getRoleBadge().color}`}>
                                    {getRoleBadge().text}
                                  </span>
                                  {user?.level && (
                                    <span className={`text-xs px-2 py-1 rounded-md bg-gradient-to-r ${getLevelColor(user.level)} text-white`}>
                                      {user.level}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 mt-4">
                              <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                <p className="text-xs text-gray-400">Courses</p>
                                <p className="text-sm font-bold text-white">{user?.coursesEnrolled || 0}</p>
                              </div>
                              <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                <p className="text-xs text-gray-400">Completed</p>
                                <p className="text-sm font-bold text-green-400">{user?.coursesCompleted || 0}</p>
                              </div>
                              <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                <p className="text-xs text-gray-400">Badges</p>
                                <p className="text-sm font-bold text-yellow-400">{user?.achievements || 0}</p>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            {userProgress > 0 && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-400">Overall Progress</span>
                                  <span className="text-purple-400 font-medium">{userProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                  <motion.div 
                                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${userProgress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Menu Items */}
                          <div className="p-2">
                            <Link href="/dashboard/user" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group">
                              <BarChart3 className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                              <span className="text-sm text-gray-300 group-hover:text-white">Dashboard</span>
                            </Link>
                            

                            <Link href="/my-courses" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group">
                              <BookMarked className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                              <span className="text-sm text-gray-300 group-hover:text-white">My Courses</span>
                            </Link>

                            <Link href="/achievements" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group">
                              <Trophy className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                              <span className="text-sm text-gray-300 group-hover:text-white">Achievements</span>
                              {user?.achievements && user.achievements > 0 && (
                                <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                                  {user.achievements}
                                </span>
                              )}
                            </Link>

                            <Link href="/calendar" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group">
                              <Calendar className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                              <span className="text-sm text-gray-300 group-hover:text-white">Study Calendar</span>
                            </Link>

                            {isTeacher && (
                              <Link href="/teacher" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group">
                                <Shield className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                                <span className="text-sm text-gray-300 group-hover:text-white">Teacher Portal</span>
                              </Link>
                            )}

                            {isAdmin && (
                              <Link href="/dashboard/admin" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group">
                                <Shield className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                                <span className="text-sm text-gray-300 group-hover:text-white">Admin Panel</span>
                              </Link>
                            )}

                            <hr className="my-2 border-slate-800" />

                            <Link href="/settings" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group">
                              <Settings className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                              <span className="text-sm text-gray-300 group-hover:text-white">Settings</span>
                            </Link>

                            <Link href="/billing" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group">
                              <CreditCard className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                              <span className="text-sm text-gray-300 group-hover:text-white">Billing</span>
                            </Link>

                            <Link href="/help" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group">
                              <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                              <span className="text-sm text-gray-300 group-hover:text-white">Help & Support</span>
                            </Link>

                            <hr className="my-2 border-slate-800" />

                            <button
                              onClick={() => router.push('/auth/logout')}
                              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors group"
                            >
                              <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                              <span className="text-sm text-gray-300 group-hover:text-red-400">Sign Out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/auth/login">
                    <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/auth/register">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg transition-all shadow-lg hover:shadow-purple-500/25">
                      Get Started
                    </button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-800/50 transition-colors text-gray-400 hover:text-white"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 right-0 bottom-0 w-full max-w-sm bg-slate-900 border-l border-slate-800 z-40 lg:hidden overflow-y-auto"
          >
            {/* Mobile menu content */}
            <div className="p-4">
              {isAuthenticated && (
                <div className="mb-6 p-4 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-purple-500/40">
                      {user?.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || "User"}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900/50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">Courses</p>
                      <p className="text-sm font-bold text-white">{user?.coursesEnrolled || 0}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">Points</p>
                      <p className="text-sm font-bold text-yellow-400">{user?.totalPoints || 0}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">Streak</p>
                      <p className="text-sm font-bold text-orange-400">{user?.learningStreak || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              <nav className="space-y-2">
                <Link href="/courses" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <GraduationCap className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">Courses</span>
                </Link>
                <Link href="/blog" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">Blog</span>
                </Link>
                <Link href="/community" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">Community</span>
                </Link>
                {isAuthenticated && (
                  <>
                    <Link href="/ai-tutor" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <Brain className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">AI Tutor</span>
                    </Link>
                    <hr className="border-slate-800" />
                    <Link href="/dashboard/user" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <BarChart3 className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">Dashboard</span>
                    </Link>
                    <Link href="/settings" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <Settings className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">Settings</span>
                    </Link>
                    <button
                      onClick={() => router.push('/auth/logout')}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-5 h-5 text-red-400" />
                      <span className="text-red-400">Sign Out</span>
                    </button>
                  </>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};