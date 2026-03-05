"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  GraduationCap, 
  Code, 
  Briefcase, 
  Heart, 
  Palette,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Clock,
  Users,
  Target,
  Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InterfaceModeToggle } from "@/components/ui/interface-mode-toggle";
import { cn } from "@/lib/utils";

// Course templates with smart defaults
const COURSE_TEMPLATES = [
  {
    id: "academic",
    name: "Academic Course",
    description: "Traditional semester/term-based academic course",
    icon: <GraduationCap className="w-6 h-6" />,
    color: "blue",
    defaults: {
      duration: "16 weeks",
      difficulty: "intermediate",
      structure: "lectures-labs-assignments",
      chapters: 12,
      assessmentStyle: "traditional"
    },
    features: ["Lecture-based", "Progressive difficulty", "Academic rigor", "Research components"]
  },
  {
    id: "professional",
    name: "Professional Development",
    description: "Skills-focused training for working professionals",
    icon: <Briefcase className="w-6 h-6" />,
    color: "green",
    defaults: {
      duration: "8 weeks",
      difficulty: "practical",
      structure: "modules-projects",
      chapters: 8,
      assessmentStyle: "project-based"
    },
    features: ["Practical skills", "Real-world projects", "Flexible schedule", "Industry-relevant"]
  },
  {
    id: "coding",
    name: "Programming Course",
    description: "Hands-on coding and software development",
    icon: <Code className="w-6 h-6" />,
    color: "purple",
    defaults: {
      duration: "12 weeks",
      difficulty: "hands-on",
      structure: "theory-practice-projects",
      chapters: 10,
      assessmentStyle: "code-review"
    },
    features: ["Code exercises", "Live coding", "Portfolio projects", "Peer review"]
  },
  {
    id: "creative",
    name: "Creative Arts",
    description: "Art, design, and creative expression courses",
    icon: <Palette className="w-6 h-6" />,
    color: "pink",
    defaults: {
      duration: "10 weeks",
      difficulty: "exploratory",
      structure: "workshops-critiques",
      chapters: 8,
      assessmentStyle: "portfolio"
    },
    features: ["Creative projects", "Peer feedback", "Portfolio building", "Artistic exploration"]
  },
  {
    id: "wellness",
    name: "Health & Wellness",
    description: "Personal development and wellness training",
    icon: <Heart className="w-6 h-6" />,
    color: "red",
    defaults: {
      duration: "6 weeks",
      difficulty: "accessible",
      structure: "lessons-practice",
      chapters: 6,
      assessmentStyle: "reflection"
    },
    features: ["Self-paced", "Reflective practice", "Community support", "Holistic approach"]
  },
  {
    id: "general",
    name: "General Knowledge",
    description: "Broad educational content for general learning",
    icon: <BookOpen className="w-6 h-6" />,
    color: "gray",
    defaults: {
      duration: "8 weeks",
      difficulty: "beginner",
      structure: "sequential-learning",
      chapters: 8,
      assessmentStyle: "quizzes"
    },
    features: ["Beginner-friendly", "Sequential learning", "Knowledge checks", "Broad coverage"]
  }
];

const WIZARD_STEPS = [
  { id: "template", title: "Choose Template", description: "Select a course type" },
  { id: "basics", title: "Course Basics", description: "Title and description" },
  { id: "structure", title: "Course Structure", description: "Chapters and content" },
  { id: "review", title: "Review & Create", description: "Final review" }
];

interface SimplifiedCourseWizardProps {
  onComplete: (courseData: any) => void;
  isCreating?: boolean;
}

export const SimplifiedCourseWizard = ({
  onComplete,
  isCreating = false
}: SimplifiedCourseWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    duration: "",
    targetAudience: "",
    learningObjectives: "",
    chapterCount: 8,
    customStructure: ""
  });

  const selectedTemplateData = COURSE_TEMPLATES.find(t => t.id === selectedTemplate);

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
      green: "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
      purple: "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
      pink: "border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300",
      red: "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
      gray: "border-gray-500 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = COURSE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        difficulty: template.defaults.difficulty,
        duration: template.defaults.duration,
        chapterCount: template.defaults.chapters
      }));
    }
  };

  const handleComplete = () => {
    const courseData = {
      ...formData,
      template: selectedTemplate,
      templateData: selectedTemplateData,
      isAdvancedMode
    };
    onComplete(courseData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedTemplate;
      case 1: return formData.title && formData.description;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {WIZARD_STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
              index <= currentStep 
                ? "border-blue-500 bg-blue-500 text-white" 
                : "border-gray-300 text-gray-400"
            )}>
              {index + 1}
            </div>
            <div className="ml-3 hidden sm:block">
              <p className={cn(
                "text-sm font-medium",
                index <= currentStep ? "text-blue-600" : "text-gray-400"
              )}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-400 mx-4" />
            )}
          </div>
        ))}
      </div>

      {/* Interface Mode Toggle */}
      <InterfaceModeToggle
        isAdvancedMode={isAdvancedMode}
        onModeChange={setIsAdvancedMode}
      />

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Template Selection */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-blue-600" />
                  Choose Your Course Template
                </CardTitle>
                <CardDescription>
                  Select a template that best matches your course type. We&apos;ll set up smart defaults for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COURSE_TEMPLATES.map((template) => (
                    <motion.div
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={cn(
                          "cursor-pointer transition-all duration-200 border-2 h-full",
                          selectedTemplate === template.id
                            ? getColorClasses(template.color)
                            : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                        )}
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className={cn(
                              "p-2 rounded-lg flex-shrink-0",
                              selectedTemplate === template.id 
                                ? "bg-white/20" 
                                : "bg-gray-100 dark:bg-gray-800"
                            )}>
                              {template.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm mb-1">{template.name}</h3>
                              <p className="text-xs opacity-80 mb-2">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="w-3 h-3" />
                              <span>{template.defaults.duration}</span>
                              <Badge variant="outline" className="text-xs">
                                {template.defaults.chapters} chapters
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {template.features.slice(0, 2).map((feature) => (
                                <Badge key={feature} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Course Basics */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  Course Basics
                </CardTitle>
                <CardDescription>
                  Tell us about your course. We&apos;ll use AI to help generate additional content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTemplateData && (
                  <div className={cn(
                    "p-3 rounded-lg border-2",
                    getColorClasses(selectedTemplateData.color)
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedTemplateData.icon}
                      <span className="font-medium text-sm">
                        {selectedTemplateData.name} Template Selected
                      </span>
                    </div>
                    <p className="text-xs opacity-80">
                      {selectedTemplateData.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-title">Course Title *</Label>
                    <Input
                      id="course-title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Introduction to Web Development"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="science">Science</SelectItem>
                        <SelectItem value="arts">Arts</SelectItem>
                        <SelectItem value="health">Health & Wellness</SelectItem>
                        <SelectItem value="language">Language</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Course Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what students will learn in this course..."
                    rows={4}
                  />
                </div>

                {isAdvancedMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="target-audience">Target Audience</Label>
                      <Input
                        id="target-audience"
                        value={formData.targetAudience}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                        placeholder="e.g., Beginner developers, Marketing professionals"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="learning-objectives">Learning Objectives</Label>
                      <Textarea
                        id="learning-objectives"
                        value={formData.learningObjectives}
                        onChange={(e) => setFormData(prev => ({ ...prev, learningObjectives: e.target.value }))}
                        placeholder="What will students be able to do after completing this course?"
                        rows={3}
                      />
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Course Structure */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Course Structure
                </CardTitle>
                <CardDescription>
                  Configure how your course will be organized
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAdvancedMode ? (
                  /* Simple Mode - Use Template Defaults */
                  <div className="space-y-4">
                    {selectedTemplateData && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h3 className="font-medium text-sm mb-2">Smart Structure (Based on Template)</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                            <span className="ml-2 font-medium">{selectedTemplateData.defaults.duration}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Chapters:</span>
                            <span className="ml-2 font-medium">{selectedTemplateData.defaults.chapters}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Structure:</span>
                            <span className="ml-2 font-medium capitalize">{selectedTemplateData.defaults.structure.replace(/-/g, ' + ')}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Assessment:</span>
                            <span className="ml-2 font-medium capitalize">{selectedTemplateData.defaults.assessmentStyle.replace(/-/g, ' ')}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          AI will generate chapter outlines and content structure based on your course description and this template.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Advanced Mode - Custom Configuration */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="chapter-count">Number of Chapters</Label>
                        <Input
                          id="chapter-count"
                          type="number"
                          value={formData.chapterCount}
                          onChange={(e) => setFormData(prev => ({ ...prev, chapterCount: parseInt(e.target.value) || 8 }))}
                          min={1}
                          max={30}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Course Duration</Label>
                        <Select 
                          value={formData.duration} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4 weeks">4 weeks</SelectItem>
                            <SelectItem value="6 weeks">6 weeks</SelectItem>
                            <SelectItem value="8 weeks">8 weeks</SelectItem>
                            <SelectItem value="12 weeks">12 weeks</SelectItem>
                            <SelectItem value="16 weeks">16 weeks</SelectItem>
                            <SelectItem value="self-paced">Self-paced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select 
                          value={formData.difficulty} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="mixed">Mixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom-structure">Custom Structure Notes (Optional)</Label>
                      <Textarea
                        id="custom-structure"
                        value={formData.customStructure}
                        onChange={(e) => setFormData(prev => ({ ...prev, customStructure: e.target.value }))}
                        placeholder="Any specific requirements for course structure, pacing, or organization..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review & Create */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  Review & Create Course
                </CardTitle>
                <CardDescription>
                  Review your course setup before AI generates the full structure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Course Summary */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <h3 className="font-medium mb-3">Course Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Title:</span>
                      <span className="ml-2 font-medium">{formData.title}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Template:</span>
                      <span className="ml-2 font-medium">{selectedTemplateData?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Category:</span>
                      <span className="ml-2 font-medium">{formData.category || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Chapters:</span>
                      <span className="ml-2 font-medium">{formData.chapterCount}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-gray-600 dark:text-gray-400">Description:</span>
                    <p className="mt-1 text-sm">{formData.description}</p>
                  </div>
                </div>

                {/* AI Generation Preview */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    AI Will Generate
                  </h3>
                  <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
                    <li>• Chapter outlines and learning objectives</li>
                    <li>• Lesson plans and content structure</li>
                    <li>• Assessment questions and rubrics</li>
                    <li>• Suggested resources and activities</li>
                    <li>• Course timeline and pacing guide</li>
                  </ul>
                </div>

                {/* Create Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleComplete}
                    disabled={isCreating}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8"
                  >
                    {isCreating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 mr-2"
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                        Creating Course...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Course with AI
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        {currentStep < WIZARD_STEPS.length - 1 && (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};