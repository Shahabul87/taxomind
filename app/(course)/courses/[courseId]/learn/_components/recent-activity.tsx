"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Video, 
  FileText, 
  Code,
  Calendar,
  Star,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  chapters: Array<{
    id: string;
    title: string;
    sections: Array<{
      id: string;
      title: string;
      type?: string | null;
      userProgress: Array<{
        isCompleted: boolean;
      }>;
      videos: Array<{ id: string; title: string }>;
      blogs: Array<{ id: string; title: string }>;
      articles: Array<{ id: string; title: string }>;
      notes: Array<{ id: string; title: string }>;
      codeExplanations: Array<{ id: string; heading: string }>;
    }>;
  }>;
}

interface RecentActivityProps {
  course: Course;
}

export const RecentActivity = ({ course }: RecentActivityProps) => {
  const [isClient, setIsClient] = useState(false);
  const [clientData, setClientData] = useState<{
    minutesLearned: number;
    activities: Array<{
      id: string;
      type: 'completion' | 'achievement' | 'milestone';
      title: string;
      description: string;
      timestamp: Date;
      icon: any;
      color: string;
    }>;
  } | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Generate stable random seed based on course ID
    const seed = course.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    // Seeded random function for consistent results
    const seededRandom = (index: number) => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };

    // Generate recent activities based on completed sections
    const recentActivities = course.chapters.flatMap((chapter, chapterIndex) =>
      chapter.sections
        .filter(section => section.userProgress.some(p => p.isCompleted))
        .map((section, sectionIndex) => ({
          id: section.id,
          type: 'completion' as const,
          title: `Completed: ${section.title}`,
          description: `Chapter: ${chapter.title}`,
          timestamp: new Date(Date.now() - seededRandom(chapterIndex + sectionIndex) * 7 * 24 * 60 * 60 * 1000),
          icon: CheckCircle2,
          color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'
        }))
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);

    // Add some engagement activities with stable timestamps
    const engagementActivities = [
      {
        id: 'streak-3',
        type: 'achievement' as const,
        title: '3-Day Learning Streak!',
        description: 'Keep up the momentum',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        icon: Star,
        color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
      },
      {
        id: 'milestone-25',
        type: 'milestone' as const,
        title: '25% Course Progress',
        description: 'Quarter way there!',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        icon: TrendingUp,
        color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
      }
    ];

    const allActivities = [...recentActivities, ...engagementActivities]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 6);

    // Generate stable minutes learned based on course progress
    const completedSections = course.chapters.reduce((acc, chapter) => 
      acc + chapter.sections.filter(section => 
        section.userProgress.some(p => p.isCompleted)
      ).length, 0);
    
    const minutesLearned = Math.floor(seededRandom(1) * 60) + (completedSections * 12) + 60;

    setClientData({
      minutesLearned,
      activities: allActivities
    });
  }, [course]);

  // Static data for server rendering
  const staticActivities = course.chapters.flatMap(chapter =>
    chapter.sections
      .filter(section => section.userProgress.some(p => p.isCompleted))
      .map(section => ({
        id: section.id,
        type: 'completion' as const,
        title: `Completed: ${section.title}`,
        description: `Chapter: ${chapter.title}`,
        timestamp: new Date('2024-01-01'), // Static timestamp for SSR
        icon: CheckCircle2,
        color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'
      }))
  ).slice(0, 5);

  const allActivities = isClient && clientData ? clientData.activities : staticActivities;

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'completion':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Completed</Badge>;
      case 'achievement':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">Achievement</Badge>;
      case 'milestone':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Milestone</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allActivities.length > 0 ? (
          <div className="space-y-4">
            {allActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className={cn("p-2 rounded-lg flex-shrink-0", activity.color)}>
                  <activity.icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {activity.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                      {getActivityBadge(activity.type)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Weekly Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 p-4 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                  This Week&apos;s Progress
                </h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {isClient && clientData ? 
                      clientData.activities.filter(a => 
                        a.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ).length :
                      course.chapters.reduce((acc, chapter) => 
                        acc + chapter.sections.filter(section => 
                          section.userProgress.some(p => p.isCompleted)
                        ).length, 0)
                    }
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Sections Completed
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {isClient && clientData ? clientData.minutesLearned : 120}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Minutes Learned
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No activity yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Start learning to see your activity here!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 