"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileQuestion, Brain, Eye, Target, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIExamAssistant } from "../ai-exam-assistant";
import { EnhancedAIExamAssistant } from "../enhanced-ai-exam-assistant";
import { BloomsTaxonomyGuide } from "../blooms-taxonomy-guide";
import { SimpleQuestionValidation } from "./SimpleQuestionValidation";
import { CognitiveAnalyticsDashboard } from "../cognitive-analytics-dashboard";
import { CognitivePathwayVisualizer } from "../cognitive-pathway-visualizer";
import { Question, CourseContext, ValidationResult } from "./types";
import { BloomsLevel } from "@prisma/client";

interface BloomsTaxonomyTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  questions: Question[];
  courseContext: CourseContext;
  onAIGenerate: (questions: Question[]) => void;
  onValidationChange: (questionId: string, result: ValidationResult) => void;
  onBloomsLevelSelect: (level: string) => void;
  selectedBloomsLevel: string | null;
  children: React.ReactNode; // For the exam creation form
}

export function BloomsTaxonomyTabs({
  activeTab,
  onTabChange,
  questions,
  courseContext,
  onAIGenerate,
  onValidationChange,
  onBloomsLevelSelect,
  selectedBloomsLevel,
  children,
}: BloomsTaxonomyTabsProps) {
  return (
    <div className="animate-fadeIn">
      {/* Enhanced Bloom's Taxonomy Exam Creation Interface */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-red-50 via-purple-50 to-blue-50 dark:from-red-900/20 dark:via-purple-900/20 dark:to-blue-900/20 border-l-4 border-gradient-to-b from-red-500 via-purple-500 to-blue-500 rounded-r-lg mb-4 sm:mb-6">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-red-700 via-purple-700 to-blue-700 dark:from-red-300 dark:via-purple-300 dark:to-blue-300 bg-clip-text text-transparent mb-1 sm:mb-2">
              Bloom&apos;s Taxonomy AI Exam Creator
            </h3>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              Create sophisticated assessments using AI-powered Bloom&apos;s taxonomy analysis and
              cognitive-level question generation
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] sm:text-xs">
              AI Enhanced
            </Badge>
            <Badge variant="outline" className="text-[10px] sm:text-xs">Cognitive Analysis</Badge>
          </div>
        </div>
      </div>

      {/* Comprehensive Bloom's Taxonomy Interface */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-slate-100 via-gray-100 to-slate-100 dark:from-slate-800 dark:via-gray-800 dark:to-slate-800 rounded-lg sm:rounded-xl p-0.5 sm:p-1 mb-4 sm:mb-6 gap-0.5 sm:gap-1 overflow-x-auto">
          <TabsTrigger
            value="creation"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm font-medium transition-all text-[9px] xs:text-[10px] sm:text-xs h-9 sm:h-10 px-1 xs:px-1.5 sm:px-2 flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5"
          >
            <FileQuestion className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden xs:inline whitespace-nowrap">Exam Creation</span>
            <span className="xs:hidden">Exam</span>
          </TabsTrigger>
          <TabsTrigger
            value="guide"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm font-medium transition-all text-[9px] xs:text-[10px] sm:text-xs h-9 sm:h-10 px-1 xs:px-1.5 sm:px-2 flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5"
          >
            <Brain className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden xs:inline whitespace-nowrap">Bloom&apos;s Guide</span>
            <span className="xs:hidden">Guide</span>
          </TabsTrigger>
          <TabsTrigger
            value="validation"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm font-medium transition-all text-[9px] xs:text-[10px] sm:text-xs h-9 sm:h-10 px-1 xs:px-1.5 sm:px-2 flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5"
          >
            <Eye className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden xs:inline whitespace-nowrap">Question Validation</span>
            <span className="xs:hidden">Validate</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm font-medium transition-all text-[9px] xs:text-[10px] sm:text-xs h-9 sm:h-10 px-1 xs:px-1.5 sm:px-2 flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5"
          >
            <Target className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden xs:inline whitespace-nowrap">Analytics</span>
            <span className="xs:hidden">Analytics</span>
          </TabsTrigger>
          <TabsTrigger
            value="pathway"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm font-medium transition-all text-[9px] xs:text-[10px] sm:text-xs h-9 sm:h-10 px-1 xs:px-1.5 sm:px-2 flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5"
          >
            <Lightbulb className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden xs:inline whitespace-nowrap">Learning Paths</span>
            <span className="xs:hidden">Paths</span>
          </TabsTrigger>
        </TabsList>

        {/* Exam Creation Tab */}
        <TabsContent value="creation" className="space-y-4 sm:space-y-6">
          {/* AI Question Generators - Side by Side */}
          <div className="mb-4 sm:mb-6">
            <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
              AI Question Generation
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Enhanced AI Generator (Pro) */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-3 sm:p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                  <div className="h-2 w-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <h5 className="font-medium text-xs sm:text-sm text-purple-800 dark:text-purple-200">Pro AI Generator</h5>
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200 text-[10px] sm:text-xs">Advanced</Badge>
                </div>
                <EnhancedAIExamAssistant
                  sectionTitle={courseContext.sectionTitle}
                  chapterTitle={courseContext.chapterTitle}
                  courseTitle={courseContext.courseTitle}
                  learningObjectives={[]}
                  onGenerate={onAIGenerate}
                  disabled={!courseContext.sectionTitle}
                />
              </div>

              {/* Basic AI Generator */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                  <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <h5 className="font-medium text-xs sm:text-sm text-blue-800 dark:text-blue-200">Basic AI Generator</h5>
                  <Badge variant="outline" className="text-[10px] sm:text-xs border-blue-300 text-blue-600 dark:border-blue-600 dark:text-blue-300">Quick Start</Badge>
                </div>
                <AIExamAssistant
                  sectionTitle={courseContext.sectionTitle}
                  onGenerate={onAIGenerate}
                  disabled={!courseContext.sectionTitle}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!courseContext.sectionTitle}
                      className="w-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 h-9 sm:h-10 text-xs sm:text-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Generate Questions
                    </Button>
                  }
                />
              </div>
            </div>
          </div>

          {/* Real-time Validation Section */}
          {questions.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                Real-time Validation
              </h4>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-3 sm:p-4 rounded-lg border border-emerald-200 dark:border-emerald-700">
                <div className="space-y-2.5 sm:space-y-3 max-h-64 overflow-y-auto">
                  {questions.slice(0, 3).map((question) => (
                    <div key={question.id} className="bg-white dark:bg-slate-800 p-2.5 sm:p-3 rounded border border-emerald-100 dark:border-emerald-800">
                      <SimpleQuestionValidation
                        question={{
                          question: question.question,
                          bloomsLevel: question.bloomsLevel,
                          questionType: question.type,
                          difficulty: question.difficulty,
                          points: question.points,
                        }}
                        isVisible={true}
                        onValidationChange={(result) => onValidationChange(question.id, result)}
                      />
                    </div>
                  ))}
                  {questions.length > 3 && (
                    <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 text-center">
                      +{questions.length - 3} more questions available for validation
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Section within Creation Tab */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 p-3 sm:p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <FileQuestion className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 flex-shrink-0" />
              Exam Details
            </h4>
            {children}
          </div>
        </TabsContent>

        {/* Bloom's Taxonomy Guide Tab */}
        <TabsContent value="guide" className="space-y-4 sm:space-y-6">
          <div
            className={cn(
              "group relative overflow-hidden",
              "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",
              "dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50",
              "border border-blue-200/60 dark:border-blue-700/60",
              "rounded-lg sm:rounded-xl shadow-sm hover:shadow-md",
              "transition-all duration-300 ease-out",
              "hover:border-blue-300 dark:hover:border-blue-600",
              "p-3 sm:p-4 md:p-6"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <BloomsTaxonomyGuide
                onLevelSelect={onBloomsLevelSelect}
                selectedLevel={selectedBloomsLevel as BloomsLevel | undefined}
                showQuestionExamples={true}
                isInteractive={true}
              />
            </div>
          </div>
        </TabsContent>

        {/* Question Validation Tab */}
        <TabsContent value="validation" className="space-y-4 sm:space-y-6">
          <div
            className={cn(
              "group relative overflow-hidden",
              "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50",
              "dark:from-emerald-950/50 dark:via-teal-950/50 dark:to-cyan-950/50",
              "border border-emerald-200/60 dark:border-emerald-700/60",
              "rounded-lg sm:rounded-xl shadow-sm hover:shadow-md",
              "transition-all duration-300 ease-out",
              "hover:border-emerald-300 dark:hover:border-emerald-600",
              "p-3 sm:p-4 md:p-6"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <div className="h-1 w-6 sm:w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex-shrink-0"></div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                    Question Quality Validation
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm ml-8 sm:ml-11">
                  Analyze the quality and cognitive alignment of your exam questions
                </p>
              </div>

              {questions.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {questions.map((question) => (
                    <SimpleQuestionValidation
                      key={question.id}
                      question={{
                        question: question.question,
                        bloomsLevel: question.bloomsLevel,
                        questionType: question.type,
                        difficulty: question.difficulty,
                        points: question.points,
                      }}
                      isVisible={true}
                      onValidationChange={(result) => onValidationChange(question.id, result)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 sm:p-8 bg-gray-50 dark:bg-gray-900/30 rounded-lg sm:rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                  <Eye className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h4 className="text-sm sm:text-base md:text-lg font-medium text-gray-600 dark:text-gray-300 mb-1.5 sm:mb-2">
                    No Questions to Validate
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Create or generate questions in the Exam Creation tab to see validation results
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Cognitive Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
          <div
            className={cn(
              "group relative overflow-hidden",
              "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50",
              "dark:from-orange-950/50 dark:via-amber-950/50 dark:to-yellow-950/50",
              "border border-orange-200/60 dark:border-orange-700/60",
              "rounded-lg sm:rounded-xl shadow-sm hover:shadow-md",
              "transition-all duration-300 ease-out",
              "hover:border-orange-300 dark:hover:border-orange-600",
              "p-3 sm:p-4 md:p-6"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <CognitiveAnalyticsDashboard
                courseId={courseContext.courseId}
                chapterId={courseContext.chapterId}
                sectionId={courseContext.sectionId}
              />
            </div>
          </div>
        </TabsContent>

        {/* Learning Pathway Tab */}
        <TabsContent value="pathway" className="space-y-4 sm:space-y-6">
          <div
            className={cn(
              "group relative overflow-hidden",
              "bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50",
              "dark:from-rose-950/50 dark:via-pink-950/50 dark:to-purple-950/50",
              "border border-rose-200/60 dark:border-rose-700/60",
              "rounded-lg sm:rounded-xl shadow-sm hover:shadow-md",
              "transition-all duration-300 ease-out",
              "hover:border-rose-300 dark:hover:border-rose-600",
              "p-3 sm:p-4 md:p-6"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <div className="h-1 w-6 sm:w-8 bg-gradient-to-r from-violet-500 to-pink-600 rounded-full flex-shrink-0"></div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-violet-700 via-purple-700 to-pink-700 dark:from-violet-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                    Cognitive Learning Pathways
                  </h3>
                </div>
                <p className="text-violet-600 dark:text-violet-400 text-xs sm:text-sm ml-8 sm:ml-11">
                  Visualize cognitive progression and learning dependencies for optimal educational
                  scaffolding
                </p>
              </div>

              {/* Error Boundary for CognitivePathwayVisualizer */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4">
                {questions.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Analyzing {questions.length} questions for cognitive pathways...
                    </div>
                    {/* Simple pathway display to avoid maximum depth errors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                      {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map((level, index) => {
                        const questionsInLevel = questions.filter(q => 
                          q.bloomsLevel?.toLowerCase().includes(level.toLowerCase())
                        );
                        return (
                          <div key={level} className="bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 p-2.5 sm:p-3 rounded-lg">
                            <h4 className="font-medium text-violet-700 dark:text-violet-300 text-xs sm:text-sm">{level}</h4>
                            <p className="text-[10px] sm:text-xs text-violet-600 dark:text-violet-400 mt-0.5 sm:mt-1">
                              {questionsInLevel.length} question{questionsInLevel.length !== 1 ? 's' : ''}
                            </p>
                            <div className="mt-1.5 sm:mt-2 h-1.5 sm:h-2 bg-violet-200 dark:bg-violet-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-violet-500 transition-all duration-300"
                                style={{ width: `${questions.length > 0 ? (questionsInLevel.length / questions.length) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Lightbulb className="h-10 w-10 sm:h-12 sm:w-12 text-violet-400 mx-auto mb-3 sm:mb-4" />
                    <h4 className="text-sm sm:text-base md:text-lg font-medium text-violet-700 dark:text-violet-300 mb-1.5 sm:mb-2">
                      No Questions Available
                    </h4>
                    <p className="text-xs sm:text-sm text-violet-600 dark:text-violet-400">
                      Create questions to visualize cognitive learning pathways
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}