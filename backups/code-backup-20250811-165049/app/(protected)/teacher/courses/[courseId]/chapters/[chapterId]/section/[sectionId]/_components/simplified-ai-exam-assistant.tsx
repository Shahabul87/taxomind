"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  FileQuestion, 
  Target, 
  Clock,
  ChevronRight,
  Wand2,
  Settings,
  BookOpen,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { InterfaceModeToggle } from "@/components/ui/interface-mode-toggle";
import { cn } from "@/lib/utils";

interface SimplifiedAIExamAssistantProps {
  courseContext: {
    courseId: string;
    chapterId: string;
    sectionId: string;
    courseTitle?: string;
    chapterTitle?: string;
    sectionTitle?: string;
  };
  onGenerate: (questions: any[]) => void;
  isGenerating?: boolean;
}

// Smart presets for common exam scenarios
const EXAM_PRESETS = [
  {
    id: "quick-quiz",
    name: "Quick Quiz",
    description: "5-10 questions for checking understanding",
    icon: <Clock className="w-4 h-4" />,
    defaults: {
      questionCount: 7,
      difficulty: "easy",
      timeEstimate: "10 minutes",
      bloomsLevels: ["remember", "understand", "apply"]
    }
  },
  {
    id: "comprehensive-test",
    name: "Comprehensive Test",
    description: "15-25 questions covering all learning objectives",
    icon: <FileQuestion className="w-4 h-4" />,
    defaults: {
      questionCount: 20,
      difficulty: "medium",
      timeEstimate: "45 minutes",
      bloomsLevels: ["remember", "understand", "apply", "analyze"]
    }
  },
  {
    id: "critical-thinking",
    name: "Critical Thinking Assessment",
    description: "Focus on analysis, evaluation, and creation",
    icon: <Brain className="w-4 h-4" />,
    defaults: {
      questionCount: 12,
      difficulty: "hard",
      timeEstimate: "30 minutes",
      bloomsLevels: ["analyze", "evaluate", "create"]
    }
  },
  {
    id: "review-exam",
    name: "Review Exam",
    description: "Mixed difficulty for comprehensive review",
    icon: <BookOpen className="w-4 h-4" />,
    defaults: {
      questionCount: 15,
      difficulty: "mixed",
      timeEstimate: "25 minutes",
      bloomsLevels: ["remember", "understand", "apply", "analyze", "evaluate"]
    }
  }
];

export const SimplifiedAIExamAssistant = ({
  courseContext,
  onGenerate,
  isGenerating = false
}: SimplifiedAIExamAssistantProps) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [questionCount, setQuestionCount] = useState([10]);
  const [difficulty, setDifficulty] = useState("medium");
  const [questionTypes, setQuestionTypes] = useState(["multiple-choice"]);
  const [bloomsLevels, setBloomsLevels] = useState(["understand", "apply"]);
  const [customInstructions, setCustomInstructions] = useState("");

  // Apply preset settings
  const applyPreset = (presetId: string) => {
    const preset = EXAM_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setQuestionCount([preset.defaults.questionCount]);
      setDifficulty(preset.defaults.difficulty);
      setBloomsLevels(preset.defaults.bloomsLevels);
    }
  };

  const handleGenerate = () => {
    const generationConfig = {
      topic: customTopic || `${courseContext.sectionTitle || courseContext.chapterTitle || "Course content"}`,
      questionCount: questionCount[0],
      difficulty,
      questionTypes,
      bloomsLevels,
      customInstructions: isAdvancedMode ? customInstructions : "",
      courseContext,
      preset: selectedPreset
    };

    // Mock generation for demo - replace with actual API call

    onGenerate([]);
  };

  return (
    <div className="space-y-6">
      {/* Interface Mode Toggle */}
      <InterfaceModeToggle
        isAdvancedMode={isAdvancedMode}
        onModeChange={setIsAdvancedMode}
      />

      <AnimatePresence mode="wait">
        {!isAdvancedMode ? (
          /* Simple Mode */
          <motion.div
            key="simple"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Smart Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-blue-600" />
                  Quick Start Templates
                </CardTitle>
                <CardDescription>
                  Choose a template that matches your assessment goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {EXAM_PRESETS.map((preset) => (
                    <motion.div
                      key={preset.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={cn(
                          "cursor-pointer transition-all duration-200 border-2",
                          selectedPreset === preset.id 
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                            : "border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-600"
                        )}
                        onClick={() => applyPreset(preset.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                              {preset.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm mb-1">{preset.name}</h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {preset.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Badge variant="outline" className="text-xs">
                                  {preset.defaults.questionCount} questions
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {preset.defaults.timeEstimate}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Simple Configuration */}
            {selectedPreset && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-green-600" />
                      Quick Customization
                    </CardTitle>
                    <CardDescription>
                      Fine-tune your exam with these simple options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Custom Topic */}
                    <div className="space-y-2">
                      <Label htmlFor="custom-topic">
                        Focus Topic (optional)
                      </Label>
                      <Input
                        id="custom-topic"
                        placeholder={`e.g., "Functions and Variables" or leave blank for section content`}
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Leave blank to use: {courseContext.sectionTitle || courseContext.chapterTitle || "Current section content"}
                      </p>
                    </div>

                    {/* Question Count */}
                    <div className="space-y-2">
                      <Label>Number of Questions: {questionCount[0]}</Label>
                      <Slider
                        value={questionCount}
                        onValueChange={setQuestionCount}
                        max={30}
                        min={5}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>5 (Quick)</span>
                        <span>30 (Comprehensive)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleGenerate}
                disabled={!selectedPreset || isGenerating}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
              >
                {isGenerating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 mr-2"
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Exam Questions
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Advanced Mode */
          <motion.div
            key="advanced"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Advanced Configuration
                </CardTitle>
                <CardDescription>
                  Full control over AI question generation parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Topic and Instructions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="advanced-topic">Topic/Subject</Label>
                    <Input
                      id="advanced-topic"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="Enter specific topic or learning objective"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="question-count">Question Count</Label>
                    <Input
                      id="question-count"
                      type="number"
                      value={questionCount[0]}
                      onChange={(e) => setQuestionCount([parseInt(e.target.value) || 10])}
                      min={1}
                      max={50}
                    />
                  </div>
                </div>

                {/* Difficulty and Question Types */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Question Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {["multiple-choice", "true-false", "short-answer"].map((type) => (
                        <Badge
                          key={type}
                          variant={questionTypes.includes(type) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (questionTypes.includes(type)) {
                              setQuestionTypes(questionTypes.filter(t => t !== type));
                            } else {
                              setQuestionTypes([...questionTypes, type]);
                            }
                          }}
                        >
                          {type.replace("-", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bloom's Taxonomy Levels */}
                <div className="space-y-2">
                  <Label>Bloom&apos;s Taxonomy Levels</Label>
                  <div className="flex flex-wrap gap-2">
                    {["remember", "understand", "apply", "analyze", "evaluate", "create"].map((level) => (
                      <Badge
                        key={level}
                        variant={bloomsLevels.includes(level) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (bloomsLevels.includes(level)) {
                            setBloomsLevels(bloomsLevels.filter(l => l !== level));
                          } else {
                            setBloomsLevels([...bloomsLevels, level]);
                          }
                        }}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Custom Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="custom-instructions">Custom Instructions (optional)</Label>
                  <Textarea
                    id="custom-instructions"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Additional instructions for the AI (e.g., specific format requirements, context, or constraints)"
                    rows={3}
                  />
                </div>

                {/* Generate Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8"
                  >
                    {isGenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 mr-2"
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                        Generating Advanced Questions...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        Generate Custom Exam
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};