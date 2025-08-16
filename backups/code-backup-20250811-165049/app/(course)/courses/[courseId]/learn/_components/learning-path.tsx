"use client";

import { motion } from "framer-motion";
import { 
  MapPin, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Star, 
  Trophy,
  Play,
  Clock,
  Target
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  chapters: Array<{
    id: string;
    title: string;
    position: number;
    sections: Array<{
      id: string;
      title: string;
      position: number;
      duration?: number | null;
      userProgress: Array<{
        isCompleted: boolean;
      }>;
    }>;
  }>;
}

interface LearningPathProps {
  course: Course;
  detailed?: boolean;
}

export const LearningPath = ({ course, detailed = false }: LearningPathProps) => {
  // Create a flattened learning path
  const learningPath = course.chapters.flatMap(chapter => 
    chapter.sections.map(section => ({
      id: section.id,
      title: section.title,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      chapterPosition: chapter.position,
      sectionPosition: section.position,
      isCompleted: section.userProgress.some(p => p.isCompleted),
      duration: section.duration || 10,
      globalPosition: (chapter.position - 1) * 100 + section.position
    }))
  ).sort((a, b) => a.globalPosition - b.globalPosition);

  const completedSections = learningPath.filter(item => item.isCompleted).length;
  const currentSection = learningPath.find(item => !item.isCompleted);
  const progressPercentage = learningPath.length > 0 ? (completedSections / learningPath.length) * 100 : 0;

  // Group by chapters for detailed view
  const groupedByChapter = course.chapters.map(chapter => ({
    ...chapter,
    sections: learningPath.filter(item => item.chapterId === chapter.id)
  }));

  if (detailed) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Complete Learning Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {groupedByChapter.map((chapter, chapterIndex) => {
                const chapterCompleted = chapter.sections.filter(s => s.isCompleted).length;
                const chapterProgress = chapter.sections.length > 0 
                  ? (chapterCompleted / chapter.sections.length) * 100 
                  : 0;

                return (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: chapterIndex * 0.1 }}
                    className="relative"
                  >
                    {/* Chapter Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                        chapterProgress === 100 
                          ? "bg-emerald-500 text-white" 
                          : chapterProgress > 0 
                          ? "bg-blue-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      )}>
                        {chapterProgress === 100 ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          chapter.position
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {chapter.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {chapterCompleted} of {chapter.sections.length} sections completed
                        </p>
                      </div>
                      {chapterProgress === 100 && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Complete
                        </Badge>
                      )}
                    </div>

                    {/* Chapter Sections */}
                    <div className="ml-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-3">
                      {chapter.sections.map((section, sectionIndex) => (
                        <motion.div
                          key={section.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (chapterIndex * 0.1) + (sectionIndex * 0.05) }}
                          className="relative"
                        >
                          <Link 
                            href={`/courses/${course.id}/learn/${section.chapterId}/sections/${section.id}`}
                            className="block"
                          >
                            <div className={cn(
                              "p-3 rounded-lg border transition-all duration-200 hover:shadow-md group",
                              section.isCompleted 
                                ? "bg-emerald-50/80 border-emerald-200/50 dark:bg-emerald-900/20 dark:border-emerald-800/30"
                                : "bg-slate-50/80 border-slate-200/50 dark:bg-slate-700/30 dark:border-slate-600/30 hover:bg-slate-100/80 dark:hover:bg-slate-700/50"
                            )}>
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center",
                                  section.isCompleted 
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400"
                                )}>
                                  {section.isCompleted ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : (
                                    <Circle className="w-3 h-3" />
                                  )}
                                </div>
                                
                                <div className="flex-1">
                                  <h4 className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {section.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    <span>{section.duration} min</span>
                                  </div>
                                </div>
                                
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" />
          Your Learning Path
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Summary */}
        <div className="text-center p-4 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {completedSections} of {learningPath.length} sections completed
          </p>
        </div>

        {/* Current Section */}
        {currentSection && (
          <div className="space-y-2">
            <h4 className="font-medium text-slate-900 dark:text-slate-100">Up Next</h4>
            <Link 
              href={`/courses/${course.id}/learn/${currentSection.chapterId}/sections/${currentSection.id}`}
              className="block"
            >
              <div className="p-3 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 rounded-lg hover:bg-blue-100/80 dark:hover:bg-blue-900/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {currentSection.title}
                    </h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {currentSection.chapterTitle}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Recent Progress */}
        <div className="space-y-2">
          <h4 className="font-medium text-slate-900 dark:text-slate-100">Recent Progress</h4>
          <div className="space-y-2">
            {learningPath
              .filter(item => item.isCompleted)
              .slice(-3)
              .reverse()
              .map((section) => (
                <div 
                  key={section.id}
                  className="flex items-center gap-3 p-2 bg-emerald-50/80 dark:bg-emerald-900/20 rounded-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                      {section.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {section.chapterTitle}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Achievement */}
        {progressPercentage === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-lg"
          >
            <Trophy className="w-8 h-8 mx-auto mb-2" />
            <h4 className="font-bold">Congratulations!</h4>
            <p className="text-sm text-yellow-100">
              You&apos;ve completed the entire course!
            </p>
          </motion.div>
        )}

        {/* View Full Path */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          View Complete Path
        </Button>
      </CardContent>
    </Card>
  );
}; 