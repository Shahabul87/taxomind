'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Target,
  ChevronRight,
  Bell,
  Send,
  CheckCircle,
  Clock,
  Filter,
  Search,
  BarChart3,
  Zap,
  Eye,
  MessageSquare,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface CourseHealth {
  courseId: string;
  courseTitle: string;
  enrolledCount: number;
  activeCount: number;
  atRiskCount: number;
  avgMastery: number;
  avgProgress: number;
  completionRate: number;
  trend: 'up' | 'down' | 'stable';
}

interface AtRiskStudent {
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: string[];
  lastActive: string;
  currentMastery: number;
  suggestedIntervention?: string;
}

interface Intervention {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  type: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'COMPLETED' | 'DISMISSED';
  createdAt: string;
  scheduledFor?: string;
}

interface MasteryHeatmapCell {
  topic: string;
  mastery: number;
  studentCount: number;
}

interface CourseCreatorOversightDashboardProps {
  courseId?: string;
  onStudentSelect?: (userId: string) => void;
  onInterventionCreate?: (intervention: Intervention) => void;
}

export function CourseCreatorOversightDashboard({
  courseId,
  onStudentSelect,
  onInterventionCreate,
}: CourseCreatorOversightDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'at-risk' | 'interventions' | 'mastery'>('overview');
  const [courseHealthData, setCourseHealthData] = useState<CourseHealth[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [masteryHeatmap, setMasteryHeatmap] = useState<MasteryHeatmapCell[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(courseId ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null);

  // Fetch course health data
  const fetchCourseHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/sam/mentor/risk-radar?type=course-health');
      if (response.ok) {
        const data = await response.json();
        setCourseHealthData(data.courses ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch course health:', error);
    }
  }, []);

  // Fetch at-risk students
  const fetchAtRiskStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCourse) params.set('courseId', selectedCourse);
      if (riskFilter !== 'all') params.set('riskLevel', riskFilter);

      const response = await fetch(`/api/sam/mentor/risk-radar?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAtRiskStudents(data.atRiskStudents ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch at-risk students:', error);
    }
  }, [selectedCourse, riskFilter]);

  // Fetch interventions
  const fetchInterventions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCourse) params.set('courseId', selectedCourse);

      const response = await fetch(`/api/sam/mentor/interventions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setInterventions(data.interventions ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch interventions:', error);
    }
  }, [selectedCourse]);

  // Fetch mastery heatmap
  const fetchMasteryHeatmap = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCourse) params.set('courseId', selectedCourse);

      const response = await fetch(`/api/sam/mentor/mastery-map?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMasteryHeatmap(data.heatmap ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch mastery heatmap:', error);
    }
  }, [selectedCourse]);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCourseHealth(),
        fetchAtRiskStudents(),
        fetchInterventions(),
        fetchMasteryHeatmap(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchCourseHealth, fetchAtRiskStudents, fetchInterventions, fetchMasteryHeatmap]);

  // Create intervention
  const handleCreateIntervention = async (student: AtRiskStudent, type: string, message: string) => {
    try {
      const response = await fetch('/api/sam/mentor/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.userId,
          courseId: student.courseId,
          type,
          title: `Intervention for ${student.userName}`,
          description: message,
          priority: student.riskLevel === 'critical' ? 'URGENT' :
                   student.riskLevel === 'high' ? 'HIGH' : 'MEDIUM',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInterventions(prev => [data.intervention, ...prev]);
        onInterventionCreate?.(data.intervention);
        setShowInterventionModal(false);
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Failed to create intervention:', error);
    }
  };

  // Filter students by search
  const filteredStudents = atRiskStudents.filter(student =>
    student.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate aggregate stats
  const totalEnrolled = courseHealthData.reduce((sum, c) => sum + c.enrolledCount, 0);
  const totalAtRisk = courseHealthData.reduce((sum, c) => sum + c.atRiskCount, 0);
  const avgMastery = courseHealthData.length > 0
    ? courseHealthData.reduce((sum, c) => sum + c.avgMastery, 0) / courseHealthData.length
    : 0;
  const pendingInterventions = interventions.filter(i => i.status === 'PENDING').length;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'HIGH': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'LOW': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400';
      case 'ACKNOWLEDGED': return 'text-blue-400';
      case 'SENT': return 'text-purple-400';
      case 'PENDING': return 'text-yellow-400';
      case 'DISMISSED': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 0.8) return 'bg-emerald-500';
    if (mastery >= 0.6) return 'bg-green-500';
    if (mastery >= 0.4) return 'bg-yellow-500';
    if (mastery >= 0.2) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-purple-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-xl border border-white/10 p-5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
          <div className="relative">
            <Users className="w-5 h-5 text-purple-400 mb-2" />
            <div className="text-3xl font-bold text-white">{totalEnrolled}</div>
            <div className="text-sm text-gray-400">Total Enrolled</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600/20 to-orange-600/20 backdrop-blur-xl border border-white/10 p-5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
          <div className="relative">
            <AlertTriangle className="w-5 h-5 text-red-400 mb-2" />
            <div className="text-3xl font-bold text-white">{totalAtRisk}</div>
            <div className="text-sm text-gray-400">At Risk</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-xl border border-white/10 p-5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <div className="relative">
            <Target className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-3xl font-bold text-white">{Math.round(avgMastery * 100)}%</div>
            <div className="text-sm text-gray-400">Avg Mastery</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600/20 to-yellow-600/20 backdrop-blur-xl border border-white/10 p-5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
          <div className="relative">
            <Bell className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-3xl font-bold text-white">{pendingInterventions}</div>
            <div className="text-sm text-gray-400">Pending Actions</div>
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
        {[
          { id: 'overview', label: 'Course Overview', icon: BarChart3 },
          { id: 'at-risk', label: 'At-Risk Learners', icon: AlertTriangle },
          { id: 'interventions', label: 'Interventions', icon: MessageSquare },
          { id: 'mastery', label: 'Mastery Map', icon: Target },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {courseHealthData.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No courses created yet</p>
                <p className="text-sm mt-1">Create your first course to see learner analytics here</p>
              </div>
            ) : (
              courseHealthData.map((course, index) => (
                <motion.div
                  key={course.courseId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedCourse(course.courseId)}
                  className={cn(
                    'relative overflow-hidden rounded-2xl backdrop-blur-xl border p-5 cursor-pointer transition-all hover:scale-[1.01]',
                    selectedCourse === course.courseId
                      ? 'bg-gradient-to-br from-purple-600/30 to-blue-600/30 border-purple-500/30'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        {course.courseTitle}
                        {course.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                        {course.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                      </h3>
                      <div className="flex flex-wrap gap-4 mt-3 text-sm">
                        <span className="text-gray-400">
                          <Users className="w-4 h-4 inline mr-1" />
                          {course.enrolledCount} enrolled
                        </span>
                        <span className="text-gray-400">
                          <Zap className="w-4 h-4 inline mr-1" />
                          {course.activeCount} active
                        </span>
                        {course.atRiskCount > 0 && (
                          <span className="text-red-400">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            {course.atRiskCount} at risk
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>

                  {/* Progress Bars */}
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Average Mastery</span>
                        <span className="text-white font-medium">{Math.round(course.avgMastery * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.avgMastery * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Completion Rate</span>
                        <span className="text-white font-medium">{Math.round(course.completionRate * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.completionRate * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* At-Risk Learners Tab */}
        {activeTab === 'at-risk' && (
          <motion.div
            key="at-risk"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search learners..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setRiskFilter(level)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                      riskFilter === level
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Student List */}
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400 opacity-50" />
                <p>No at-risk learners found</p>
                <p className="text-sm mt-1">All your learners are progressing well</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student, index) => (
                  <motion.div
                    key={`${student.userId}-${student.courseId}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {student.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{student.userName}</h4>
                            <p className="text-sm text-gray-400">{student.courseTitle}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getRiskColor(student.riskLevel))}>
                            {student.riskLevel.toUpperCase()} RISK
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-gray-300">
                            {Math.round(student.currentMastery * 100)}% mastery
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-gray-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(student.lastActive).toLocaleDateString()}
                          </span>
                        </div>

                        {student.riskFactors.length > 0 && (
                          <div className="mt-3 text-sm text-gray-400">
                            <span className="text-gray-500">Risk factors:</span>{' '}
                            {student.riskFactors.join(', ')}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => onStudentSelect?.(student.userId)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="View profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowInterventionModal(true);
                          }}
                          className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 transition-colors"
                          title="Create intervention"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Interventions Tab */}
        {activeTab === 'interventions' && (
          <motion.div
            key="interventions"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {interventions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No interventions yet</p>
                <p className="text-sm mt-1">Create interventions from the At-Risk tab</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interventions.map((intervention, index) => (
                  <motion.div
                    key={intervention.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'relative overflow-hidden rounded-xl backdrop-blur-sm border p-4',
                      getPriorityColor(intervention.priority)
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium">{intervention.title}</h4>
                          <span className={cn('text-xs font-medium', getStatusColor(intervention.status))}>
                            {intervention.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {intervention.studentName} • {intervention.courseTitle}
                        </p>
                        <p className="text-sm text-gray-300 mt-2">{intervention.description}</p>
                        <div className="flex gap-3 mt-3 text-xs text-gray-500">
                          <span>Created: {new Date(intervention.createdAt).toLocaleDateString()}</span>
                          {intervention.scheduledFor && (
                            <span>Scheduled: {new Date(intervention.scheduledFor).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <span className={cn('px-2 py-1 rounded text-xs font-medium', getPriorityColor(intervention.priority))}>
                        {intervention.priority}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Mastery Map Tab */}
        {activeTab === 'mastery' && (
          <motion.div
            key="mastery"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Cohort Mastery Heatmap</h3>

              {masteryHeatmap.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No mastery data available yet</p>
                  <p className="text-sm mt-1">Mastery data will appear as learners progress</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {masteryHeatmap.map((cell, index) => (
                    <motion.div
                      key={cell.topic}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="relative group"
                    >
                      <div
                        className={cn(
                          'aspect-square rounded-xl p-3 flex flex-col items-center justify-center text-center transition-transform group-hover:scale-105',
                          getMasteryColor(cell.mastery),
                          'bg-opacity-80'
                        )}
                      >
                        <span className="text-2xl font-bold text-white">{Math.round(cell.mastery * 100)}%</span>
                        <span className="text-xs text-white/80 mt-1 line-clamp-2">{cell.topic}</span>
                      </div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {cell.studentCount} learners
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Legend */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span className="text-gray-400">0-20%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500" />
                  <span className="text-gray-400">20-40%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500" />
                  <span className="text-gray-400">40-60%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span className="text-gray-400">60-80%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500" />
                  <span className="text-gray-400">80-100%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intervention Modal */}
      <AnimatePresence>
        {showInterventionModal && selectedStudent && (
          <InterventionModal
            student={selectedStudent}
            onClose={() => {
              setShowInterventionModal(false);
              setSelectedStudent(null);
            }}
            onCreate={handleCreateIntervention}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Intervention Creation Modal
interface InterventionModalProps {
  student: AtRiskStudent;
  onClose: () => void;
  onCreate: (student: AtRiskStudent, type: string, message: string) => void;
}

function InterventionModal({ student, onClose, onCreate }: InterventionModalProps) {
  const [interventionType, setInterventionType] = useState('encouragement');
  const [message, setMessage] = useState(student.suggestedIntervention ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const interventionTypes = [
    { id: 'encouragement', label: 'Encouragement', icon: '💪' },
    { id: 'resource', label: 'Additional Resources', icon: '📚' },
    { id: 'checkin', label: 'Check-in Request', icon: '💬' },
    { id: 'deadline', label: 'Deadline Reminder', icon: '⏰' },
    { id: 'custom', label: 'Custom Message', icon: '✍️' },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    await onCreate(student, interventionType, message);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Create Intervention</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Student Info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
              {student.userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-white font-medium">{student.userName}</div>
              <div className="text-sm text-gray-400">{student.courseTitle}</div>
            </div>
          </div>

          {/* Intervention Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Intervention Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {interventionTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setInterventionType(type.id)}
                  className={cn(
                    'p-3 rounded-xl text-sm font-medium transition-all text-left',
                    interventionType === type.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  )}
                >
                  <span className="text-lg mr-2">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your intervention message..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || isSubmitting}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send Intervention
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
