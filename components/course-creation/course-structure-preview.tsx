"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Clock, 
  Users, 
  Target, 
  CheckCircle, 
  PlayCircle,
  FileText,
  Brain,
  Lightbulb,
  Eye,
  Palette,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CoursePreviewData {
  courseTitle: string;
  courseShortOverview: string;
  courseCategory: string;
  courseSubcategory?: string;
  courseIntent: string;
  targetAudience: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  chapterCount: number;
  sectionsPerChapter: number;
  courseGoals: string[];
  bloomsFocus: string[];
  preferredContentTypes: string[];
}

interface CourseStructurePreviewProps {
  data?: Partial<CoursePreviewData>;
  currentStep: number;
  className?: string;
}

export const CourseStructurePreview = ({ 
  data, 
  currentStep, 
  className 
}: CourseStructurePreviewProps) => {
  const completionPercentage = calculateCompletionPercentage(data);
  
  const getContentTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'video': <PlayCircle className="h-3 w-3" />,
      'reading': <FileText className="h-3 w-3" />,
      'interactive': <Brain className="h-3 w-3" />,
      'assessments': <CheckCircle className="h-3 w-3" />,
      'projects': <Target className="h-3 w-3" />,
      'discussions': <Lightbulb className="h-3 w-3" />
    };
    return iconMap[type] || <BookOpen className="h-3 w-3" />;
  };

  const getBloomsColor = (level: string) => {
    const colorMap: Record<string, string> = {
      'REMEMBER': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'UNDERSTAND': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      'APPLY': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      'ANALYZE': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      'EVALUATE': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      'CREATE': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
    };
    return colorMap[level] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colorMap: Record<string, string> = {
      'BEGINNER': 'text-green-600 dark:text-green-400',
      'INTERMEDIATE': 'text-yellow-600 dark:text-yellow-400',
      'ADVANCED': 'text-red-600 dark:text-red-400'
    };
    return colorMap[difficulty] || 'text-gray-600 dark:text-gray-400';
  };

  const estimatedTotalHours = data.chapterCount && data.sectionsPerChapter 
    ? Math.round((data.chapterCount * data.sectionsPerChapter * 20) / 60 * 10) / 10 
    : 0;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Live Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Progress value={completionPercentage} className="w-20 h-2" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {completionPercentage}%
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Course Header */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-base text-gray-900 dark:text-white">
              {data.courseTitle || "Your Course Title"}
            </h3>
            {data.courseCategory && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {data.courseCategory}
                </Badge>
                {data.courseSubcategory && (
                  <Badge variant="outline" className="text-xs">
                    {data.courseSubcategory}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {data.courseShortOverview && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
              {data.courseShortOverview}
            </p>
          )}
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-blue-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Target</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {data.targetAudience || "Not specified"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-green-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Duration</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {data.duration || estimatedTotalHours ? `${estimatedTotalHours}h` : "TBD"}
              </p>
            </div>
          </div>
          
          {data.difficulty && (
            <div className="flex items-center gap-2 text-sm">
              <Award className={cn("h-4 w-4", getDifficultyColor(data.difficulty))} />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Level</p>
                <p className={cn("text-xs font-medium", getDifficultyColor(data.difficulty))}>
                  {data.difficulty}
                </p>
              </div>
            </div>
          )}
          
          {data.chapterCount && (
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-purple-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Structure</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {data.chapterCount} chapters
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Learning Goals */}
        {data.courseGoals && data.courseGoals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              Learning Goals
            </h4>
            <div className="space-y-1">
              {data.courseGoals.slice(0, 3).map((goal, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 line-clamp-2">{goal}</span>
                </div>
              ))}
              {data.courseGoals.length > 3 && (
                <p className="text-xs text-gray-500 dark:text-gray-500 ml-5">
                  +{data.courseGoals.length - 3} more goals
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bloom's Taxonomy Focus */}
        {data.bloomsFocus && data.bloomsFocus.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="h-4 w-4 text-indigo-500" />
              Learning Approach
            </h4>
            <div className="flex flex-wrap gap-1">
              {data.bloomsFocus.map((level) => (
                <Badge 
                  key={level} 
                  variant="secondary"
                  className={cn("text-xs px-2 py-1", getBloomsColor(level))}
                >
                  {level.toLowerCase()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Content Types */}
        {data.preferredContentTypes && data.preferredContentTypes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Palette className="h-4 w-4 text-pink-500" />
              Content Mix
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {data.preferredContentTypes.map((type) => (
                <div key={type} className="flex items-center gap-2 text-xs">
                  {getContentTypeIcon(type)}
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {type.replace('-', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Structure Preview */}
        {data.chapterCount && data.sectionsPerChapter && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              Course Structure
            </h4>
            <div className="space-y-2">
              {Array.from({ length: Math.min(data.chapterCount, 3) }, (_, chapterIndex) => (
                <div key={chapterIndex} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-3 w-3 text-blue-500" />
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      Chapter {chapterIndex + 1}
                    </span>
                  </div>
                  <div className="ml-5 space-y-1">
                    {Array.from({ length: Math.min(data.sectionsPerChapter, 2) }, (_, sectionIndex) => (
                      <div key={sectionIndex} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                        Section {sectionIndex + 1}
                      </div>
                    ))}
                    {data.sectionsPerChapter > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 ml-3">
                        +{data.sectionsPerChapter - 2} more sections
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {data.chapterCount > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-500 text-center py-2">
                  +{data.chapterCount - 3} more chapters
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              Step {currentStep} of 4
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {completionPercentage}% complete
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function calculateCompletionPercentage(data: Partial<CoursePreviewData> | undefined): number {
  // Safety check for undefined data
  if (!data) {
    return 0;
  }

  const fields = [
    'courseTitle',
    'courseShortOverview', 
    'courseCategory',
    'courseIntent',
    'targetAudience',
    'difficulty',
    'duration',
    'chapterCount',
    'sectionsPerChapter'
  ];
  
  const arrayFields = ['courseGoals', 'bloomsFocus', 'preferredContentTypes'];
  
  let completed = 0;
  let total = fields.length + arrayFields.length;
  
  // Check regular fields
  fields.forEach(field => {
    if (data[field as keyof CoursePreviewData]) {
      completed++;
    }
  });
  
  // Check array fields
  arrayFields.forEach(field => {
    const arrayValue = data[field as keyof CoursePreviewData] as string[] | undefined;
    if (arrayValue && arrayValue.length > 0) {
      completed++;
    }
  });
  
  return Math.round((completed / total) * 100);
}