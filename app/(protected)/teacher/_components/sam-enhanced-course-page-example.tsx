/**
 * Enhanced Course Page Example with Context-Aware SAM
 * 
 * This example shows how to integrate the context-aware SAM assistant
 * with a course page to provide intelligent, context-sensitive assistance.
 */

"use client";

import { useCourseDetailPageContext } from './use-sam-page-context';
import { useGlobalSam } from './global-sam-provider';
import { useEffect } from 'react';

interface EnhancedCoursePageProps {
  courseId: string;
  courseData: {
    id: string;
    title: string;
    description: string | null;
    isPublished: boolean;
    categoryId: string | null;
    whatYouWillLearn: string[];
    chapters: Array<{
      id: string;
      title: string;
      description: string | null;
      position: number;
      isPublished: boolean;
      isFree: boolean;
      sections: Array<{
        id: string;
        title: string;
        description: string | null;
        position: number;
        isPublished: boolean;
      }>;
    }>;
    attachments: Array<{
      id: string;
      name: string;
      url: string;
    }>;
    category?: {
      id: string;
      name: string;
    };
  };
  completionStatus: {
    titleDesc: boolean;
    learningObj: boolean;
    chapters: boolean;
    price: boolean;
    category: boolean;
    image: boolean;
    attachments: boolean;
  };
  categories: any[];
}

export function EnhancedCoursePageExample({
  courseId,
  courseData,
  completionStatus,
  categories
}: EnhancedCoursePageProps) {
  const { updatePageContext } = useGlobalSam();
  
  // Provide rich context to SAM
  useCourseDetailPageContext(courseData, courseData.chapters, categories);

  // Update SAM with completion status and health metrics
  useEffect(() => {
    const completionCount = Object.values(completionStatus).filter(Boolean).length;
    const completionRate = (completionCount / Object.keys(completionStatus).length) * 100;
    
    updatePageContext({
      dataContext: {
        courseId,
        completionStatus,
        completionRate,
        healthScore: Math.round(completionRate),
        hasObjectives: courseData.whatYouWillLearn.length > 0,
        hasChapters: courseData.chapters.length > 0,
        publishedChapters: courseData.chapters.filter(ch => ch.isPublished).length,
        totalSections: courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
        isPublished: courseData.isPublished,
        category: courseData.category?.name || 'Uncategorized',
        attachmentCount: courseData.attachments.length,
      },
      capabilities: [
        'course_editing',
        'chapter_management', 
        'learning_objectives',
        'course_analytics',
        'content_optimization',
        'structure_analysis',
        'blooms_taxonomy',
        'assessment_creation',
        'publishing_workflow',
        'attachment_management'
      ]
    });
  }, [courseData, completionStatus, updatePageContext, courseId]);

  return (
    <div className="relative">
      {/* Your existing course page content goes here */}
      <div className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {courseData.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {courseData.description || 'No description available'}
          </p>
          
          {/* Health Score Display */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Course Health:
              </span>
              <span className={`text-sm font-semibold ${
                Object.values(completionStatus).filter(Boolean).length >= 6 
                  ? 'text-green-600' 
                  : 'text-yellow-600'
              }`}>
                {Math.round((Object.values(completionStatus).filter(Boolean).length / Object.keys(completionStatus).length) * 100)}%
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {courseData.chapters.length} chapters • {courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0)} sections
            </div>
          </div>
        </div>

        {/* Course Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Learning Objectives
            </h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {courseData.whatYouWillLearn.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {courseData.whatYouWillLearn.length === 0 ? 'No objectives set' : 'objectives defined'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Chapters
            </h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {courseData.chapters.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {courseData.chapters.filter(ch => ch.isPublished).length} published
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sections
            </h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              across all chapters
            </p>
          </div>
        </div>

        {/* Course Forms and Components */}
        <div className="space-y-8">
          {/* Learning Objectives Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Learning Objectives
            </h3>
            <div className="space-y-2">
              {courseData.whatYouWillLearn.length > 0 ? (
                courseData.whatYouWillLearn.map((objective, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {index + 1}.
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {objective}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  No learning objectives defined yet. Ask SAM to generate some!
                </p>
              )}
            </div>
          </div>

          {/* Chapters Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Course Chapters
            </h3>
            <div className="space-y-4">
              {courseData.chapters.length > 0 ? (
                courseData.chapters.map((chapter, index) => (
                  <div key={chapter.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {chapter.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {chapter.sections.length} sections
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        chapter.isPublished 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {chapter.isPublished ? 'Published' : 'Draft'}
                      </span>
                      {chapter.isFree && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  No chapters created yet. Ask SAM to help you create some!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SAM Integration Notice */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">SAM</span>
            </div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Context-Aware AI Assistant
            </h4>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            SAM is now aware of your course context and can help you with:
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Generate learning objectives using Bloom's taxonomy</li>
            <li>• Create well-structured chapters and sections</li>
            <li>• Analyze and improve your course structure</li>
            <li>• Provide content optimization suggestions</li>
            <li>• Help with publishing workflow</li>
          </ul>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Click the floating SAM button in the bottom right to get started!
          </p>
        </div>
      </div>
      
      {/* SAM is automatically available via the GlobalSamProvider */}
    </div>
  );
}

/**
 * Usage Instructions:
 * 
 * 1. Replace your existing course page component with this enhanced version
 * 2. The context-aware SAM will automatically understand:
 *    - Current course data and structure
 *    - Completion status and health metrics
 *    - Available capabilities based on the course state
 *    - Page-specific actions and suggestions
 * 
 * 3. SAM will provide intelligent assistance for:
 *    - Learning objectives generation
 *    - Chapter creation and management
 *    - Content optimization
 *    - Structure analysis
 *    - Publishing workflow
 * 
 * 4. The assistant is context-aware and will adapt its responses based on:
 *    - Current course completion status
 *    - Available data (chapters, objectives, etc.)
 *    - User's current workflow position
 *    - Page-specific capabilities
 */