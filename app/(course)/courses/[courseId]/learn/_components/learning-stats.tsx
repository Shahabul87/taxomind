"use client";

import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  Calendar,
  Video,
  BookOpen,
  FileText,
  Code,
  CheckCircle2,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  title: string;
  chapters: Array<{
    id: string;
    title: string;
    sections: Array<{
      id: string;
      title: string;
      type?: string | null;
      duration?: number | null;
      user_progress: Array<{
        isCompleted: boolean;
      }>;
      videos: Array<{ id: string; title: string; duration?: number | null }>;
      blogs: Array<{ id: string; title: string }>;
      articles: Array<{ id: string; title: string }>;
      notes: Array<{ id: string; title: string }>;
      codeExplanations: Array<{ id: string; title: string }>;
    }>;
  }>;
}

interface LearningStatsProps {
  course: Course;
  progressPercentage: number;
  totalSections: number;
  completedSections: number;
}

export const LearningStats = ({
  course,
  progressPercentage,
  totalSections,
  completedSections
}: LearningStatsProps) => {
  // Calculate chapter-wise progress
  const chapterProgress = course.chapters.map(chapter => {
    const chapterSections = chapter.sections.length;
    const completedInChapter = chapter.sections.filter(
      section => section.user_progress.some(p => p.isCompleted)
    ).length;
    
    return {
      id: chapter.id,
      title: chapter.title,
      total: chapterSections,
      completed: completedInChapter,
      percentage: chapterSections > 0 ? (completedInChapter / chapterSections) * 100 : 0
    };
  });

  // Calculate content type statistics
  const contentStats = course.chapters.reduce((acc, chapter) => {
    chapter.sections.forEach(section => {
      acc.videos += section.videos.length;
      acc.blogs += section.blogs.length;
      acc.articles += section.articles.length;
      acc.notes += section.notes.length;
      acc.codeExplanations += section.codeExplanations.length;
    });
    return acc;
  }, {
    videos: 0,
    blogs: 0,
    articles: 0,
    notes: 0,
    codeExplanations: 0
  });

  // Calculate estimated completion time
  const totalMinutes = course.chapters.reduce((acc, chapter) => {
    return acc + chapter.sections.reduce((sectionAcc, section) => {
      return sectionAcc + (section.duration || 10);
    }, 0);
  }, 0);

  const remainingMinutes = course.chapters.reduce((acc, chapter) => {
    return acc + chapter.sections.reduce((sectionAcc, section) => {
      if (!section.user_progress.some(p => p.isCompleted)) {
        return sectionAcc + (section.duration || 10);
      }
      return sectionAcc;
    }, 0);
  }, 0);

  const contentTypeItems = [
    { 
      type: 'Videos', 
      count: contentStats.videos, 
      icon: Video, 
      color: 'text-red-500 bg-red-100 dark:bg-red-900/30' 
    },
    { 
      type: 'Articles', 
      count: contentStats.articles, 
      icon: FileText, 
      color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' 
    },
    { 
      type: 'Blogs', 
      count: contentStats.blogs, 
      icon: BookOpen, 
      color: 'text-green-500 bg-green-100 dark:bg-green-900/30' 
    },
    { 
      type: 'Code', 
      count: contentStats.codeExplanations, 
      icon: Code, 
      color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' 
    },
    { 
      type: 'Notes', 
      count: contentStats.notes, 
      icon: BookOpen, 
      color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' 
    }
  ].filter(item => item.count > 0);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Learning Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Overall Progress</h4>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {Math.round(progressPercentage)}%
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>{completedSections} completed</span>
              <span>{totalSections - completedSections} remaining</span>
            </div>
          </div>

          {/* Time Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {Math.ceil(totalMinutes / 60)}h
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Duration</p>
            </div>
            <div className="text-center p-4 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg">
              <Target className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {Math.ceil(remainingMinutes / 60)}h
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Time Left</p>
            </div>
          </div>

          {/* Content Types */}
          {contentTypeItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Content Types</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {contentTypeItems.map((item, index) => (
                  <motion.div
                    key={item.type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className={`p-2 rounded-md ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {item.count}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {item.type}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chapter Progress */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Chapter Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chapterProgress.map((chapter, index) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                    {chapter.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {chapter.completed}/{chapter.total}
                    </span>
                    {chapter.percentage === 100 && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                </div>
                <Progress value={chapter.percentage} className="h-2" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badge */}
      {progressPercentage >= 25 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0">
            <CardContent className="p-6 text-center">
              <Award className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">
                {progressPercentage >= 100 ? "Course Master!" : 
                 progressPercentage >= 75 ? "Almost There!" :
                 progressPercentage >= 50 ? "Halfway Hero!" : "Great Start!"}
              </h3>
              <p className="text-yellow-100 text-sm">
                {progressPercentage >= 100 ? "You've completed the entire course! 🎉" :
                 progressPercentage >= 75 ? "You're in the final stretch!" :
                 progressPercentage >= 50 ? "You've reached the halfway point!" : "Keep up the momentum!"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}; 