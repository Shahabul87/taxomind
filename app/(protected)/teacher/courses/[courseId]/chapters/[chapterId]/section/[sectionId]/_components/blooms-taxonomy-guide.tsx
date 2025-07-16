"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Brain, 
  Lightbulb, 
  BookOpen, 
  Target, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  Play,
  Pause,
  RotateCcw,
  GraduationCap,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  Zap,
  Settings,
  HelpCircle,
  Info,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BloomsLevel } from "@prisma/client";
import { ENHANCED_BLOOMS_FRAMEWORK } from "@/lib/ai-question-generator";

interface BloomsTaxonomyGuideProps {
  onLevelSelect?: (level: BloomsLevel) => void;
  selectedLevel?: BloomsLevel;
  showQuestionExamples?: boolean;
  isInteractive?: boolean;
}

const BLOOM_COLORS = {
  REMEMBER: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-800 dark:text-blue-200",
    accent: "text-blue-600 dark:text-blue-400"
  },
  UNDERSTAND: {
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-700",
    text: "text-green-800 dark:text-green-200",
    accent: "text-green-600 dark:text-green-400"
  },
  APPLY: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-700",
    text: "text-yellow-800 dark:text-yellow-200",
    accent: "text-yellow-600 dark:text-yellow-400"
  },
  ANALYZE: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-700",
    text: "text-orange-800 dark:text-orange-200",
    accent: "text-orange-600 dark:text-orange-400"
  },
  EVALUATE: {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-700",
    text: "text-red-800 dark:text-red-200",
    accent: "text-red-600 dark:text-red-400"
  },
  CREATE: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-700",
    text: "text-purple-800 dark:text-purple-200",
    accent: "text-purple-600 dark:text-purple-400"
  }
};

const QUESTION_EXAMPLES = {
  REMEMBER: [
    "What is the definition of photosynthesis?",
    "List the three main types of rocks.",
    "Who wrote 'Romeo and Juliet'?",
    "When did World War II end?"
  ],
  UNDERSTAND: [
    "Explain why plants need sunlight to grow.",
    "How does the water cycle work?",
    "What is the main theme of this story?",
    "Why is exercise important for health?"
  ],
  APPLY: [
    "Use the Pythagorean theorem to solve this triangle problem.",
    "Apply the scientific method to design an experiment.",
    "Demonstrate how to calculate compound interest.",
    "Show how you would use this formula in a real-world scenario."
  ],
  ANALYZE: [
    "Compare and contrast democracy and monarchy.",
    "What evidence supports the theory of evolution?",
    "Analyze the cause and effect relationships in this historical event.",
    "Break down the components of this argument."
  ],
  EVALUATE: [
    "Evaluate the effectiveness of this environmental policy.",
    "Which solution would you recommend and why?",
    "Assess the credibility of this news source.",
    "Judge the ethical implications of this decision."
  ],
  CREATE: [
    "Design a sustainable city for the future.",
    "Compose a poem that captures the essence of friendship.",
    "Develop a business plan for a new invention.",
    "Create a solution to reduce plastic waste in oceans."
  ]
};

const LEARNING_ACTIVITIES = {
  REMEMBER: ["Flash cards", "Matching exercises", "Multiple choice quizzes", "Timeline creation"],
  UNDERSTAND: ["Concept mapping", "Summarizing", "Explaining to others", "Graphic organizers"],
  APPLY: ["Case studies", "Simulations", "Problem-solving exercises", "Role-playing"],
  ANALYZE: ["Debates", "Venn diagrams", "Compare/contrast charts", "Research projects"],
  EVALUATE: ["Peer review", "Criteria development", "Decision matrices", "Critical essays"],
  CREATE: ["Design projects", "Creative writing", "Innovation challenges", "Model building"]
};

export const BloomsTaxonomyGuide = ({
  onLevelSelect,
  selectedLevel,
  showQuestionExamples = true,
  isInteractive = true
}: BloomsTaxonomyGuideProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedLevels, setExpandedLevels] = useState<Set<BloomsLevel>>(new Set());
  const [hoveredLevel, setHoveredLevel] = useState<BloomsLevel | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [currentExample, setCurrentExample] = useState<Record<BloomsLevel, number>>({
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0
  });

  const toggleExpanded = (level: BloomsLevel) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  const cycleExample = (level: BloomsLevel) => {
    const examples = QUESTION_EXAMPLES[level];
    setCurrentExample(prev => ({
      ...prev,
      [level]: (prev[level] + 1) % examples.length
    }));
  };

  const getBloomColor = (level: BloomsLevel) => {
    return BLOOM_COLORS[level];
  };

  const handleMouseEnter = (level: BloomsLevel, event: React.MouseEvent) => {
    setHoveredLevel(level);
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPosition({ 
      x: rect.left + rect.width / 2, 
      y: rect.top - 10
    });
  };

  const handleMouseLeave = () => {
    setHoveredLevel(null);
  };

  const getCognitiveSignificance = (level: BloomsLevel) => {
    const significance = {
      CREATE: "The pinnacle of cognitive development - students synthesize knowledge to produce original, innovative solutions. This level demonstrates mastery and creativity, requiring integration of all lower levels.",
      EVALUATE: "Critical thinking emerges - students make informed judgments using criteria and evidence. This develops analytical reasoning and decision-making skills essential for leadership and problem-solving.",
      ANALYZE: "Deep understanding begins - students break down complex information into components. This builds logical thinking patterns and prepares students for evidence-based reasoning.",
      APPLY: "Knowledge becomes functional - students transfer learning to new contexts. This bridges theory and practice, developing practical problem-solving abilities.",
      UNDERSTAND: "Meaning-making occurs - students grasp concepts and can explain them in their own words. This forms the foundation for all higher-order thinking.",
      REMEMBER: "Learning foundation - students acquire and recall factual knowledge. This creates the knowledge base necessary for all subsequent cognitive development."
    };
    return significance[level];
  };

  const BloomLevelCard = ({ level }: { level: BloomsLevel }) => {
    const framework = ENHANCED_BLOOMS_FRAMEWORK[level];
    const colors = getBloomColor(level);
    const isExpanded = expandedLevels.has(level);
    const isSelected = selectedLevel === level;

    return (
      <Card className={cn(
        "transition-all duration-200 cursor-pointer",
        colors.bg,
        colors.border,
        isSelected && "ring-2 ring-offset-2 ring-blue-500",
        isInteractive && "hover:shadow-md"
      )}>
        <CardHeader 
          className="pb-3"
          onClick={() => {
            if (isInteractive) {
              onLevelSelect?.(level);
              toggleExpanded(level);
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", colors.bg, colors.border)}>
                <Brain className={cn("h-5 w-5", colors.accent)} />
              </div>
              <div>
                <CardTitle className={cn("text-lg font-bold", colors.text)}>
                  {level}
                </CardTitle>
                <CardDescription className={cn("text-xs", colors.text)}>
                  Cognitive Load: {framework.cognitiveLoad}/5
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", colors.text, colors.border)}>
                Level {framework.cognitiveLoad}
              </Badge>
              {isInteractive && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
          
          <Progress value={(framework.cognitiveLoad / 5) * 100} className="h-2 mt-2" />
        </CardHeader>

        <CardContent className="pt-0">
          <p className={cn("text-sm mb-3", colors.text)}>
            {framework.description}
          </p>

          <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(level)}>
            <CollapsibleContent>
              <div className="space-y-4">
                {/* Key Verbs */}
                <div>
                  <h4 className={cn("text-sm font-semibold mb-2", colors.text)}>Key Action Verbs:</h4>
                  <div className="flex flex-wrap gap-1">
                    {framework.verbs.slice(0, 8).map((verb) => (
                      <Badge key={verb} variant="outline" className={cn("text-xs", colors.border)}>
                        {verb}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Question Starters */}
                <div>
                  <h4 className={cn("text-sm font-semibold mb-2", colors.text)}>Question Starters:</h4>
                  <div className="space-y-1">
                    {framework.questionStarters.slice(0, 3).map((starter, index) => (
                      <div key={index} className={cn("text-xs", colors.text, "opacity-80")}>
                        • {starter}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Example Question */}
                {showQuestionExamples && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={cn("text-sm font-semibold", colors.text)}>Example Question:</h4>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          cycleExample(level);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Next
                      </Button>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg text-xs italic",
                      "bg-white/50 dark:bg-gray-900/50",
                      colors.border,
                      colors.text
                    )}>
                      &quot;{QUESTION_EXAMPLES[level][currentExample[level]]}&quot;
                    </div>
                  </div>
                )}

                {/* Learning Activities */}
                <div>
                  <h4 className={cn("text-sm font-semibold mb-2", colors.text)}>Suggested Activities:</h4>
                  <div className="space-y-1">
                    {LEARNING_ACTIVITIES[level].slice(0, 3).map((activity, index) => (
                      <div key={index} className={cn("text-xs", colors.text, "opacity-80")}>
                        • {activity}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prerequisites */}
                {framework.prerequisites.length > 0 && (
                  <div>
                    <h4 className={cn("text-sm font-semibold mb-2", colors.text)}>Prerequisites:</h4>
                    <div className="flex flex-wrap gap-1">
                      {framework.prerequisites.map((prereq) => (
                        <Badge key={prereq} variant="outline" className="text-xs">
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pyramid">Pyramid View</TabsTrigger>
          <TabsTrigger value="interactive">Interactive Guide</TabsTrigger>
          <TabsTrigger value="tips">Teaching Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Bloom&apos;s Taxonomy Overview
              </CardTitle>
              <CardDescription>
                A framework for categorizing educational goals and measuring learning depth
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Lower-Order Thinking:</h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div>• <strong>Remember:</strong> Recall factual information</div>
                    <div>• <strong>Understand:</strong> Comprehend meaning</div>
                    <div>• <strong>Apply:</strong> Use knowledge in new situations</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Higher-Order Thinking:</h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div>• <strong>Analyze:</strong> Break down complex ideas</div>
                    <div>• <strong>Evaluate:</strong> Make judgments and defend decisions</div>
                    <div>• <strong>Create:</strong> Produce original work and solutions</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(Object.keys(ENHANCED_BLOOMS_FRAMEWORK) as BloomsLevel[]).map((level) => (
              <BloomLevelCard key={level} level={level} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pyramid" className="space-y-4 relative">
          <Card className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Bloom&apos;s Taxonomy Pyramid
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Hover over each level to explore its significance in cognitive development and learning progression
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Interactive Learning Guide
                </h3>
                <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                  Bloom&apos;s Taxonomy represents a hierarchical framework where each level builds upon the previous one. 
                  Hover over any level to discover its educational significance, recommended activities, and practical applications.
                </p>
              </div>

              <div className="space-y-4">
                {(Object.keys(ENHANCED_BLOOMS_FRAMEWORK) as BloomsLevel[]).reverse().map((level, index) => {
                  const framework = ENHANCED_BLOOMS_FRAMEWORK[level];
                  const colors = getBloomColor(level);
                  const width = 100 - (index * 12);
                  const isHigherOrder = index < 3;
                  
                  return (
                    <motion.div
                      key={level}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex justify-center"
                    >
                      <div
                        className={cn(
                          "relative p-4 rounded-xl cursor-pointer transition-all duration-300 border-2",
                          "shadow-lg hover:shadow-xl transform hover:scale-105",
                          colors.bg,
                          colors.border,
                          "bg-gradient-to-r from-white to-gray-50 dark:from-slate-800 dark:to-slate-700"
                        )}
                        style={{ width: `${width}%` }}
                        onClick={() => onLevelSelect?.(level)}
                        onMouseEnter={(e) => handleMouseEnter(level, e)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {/* Level indicator */}
                        <div className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 rounded-full p-2 border-2 border-current shadow-md">
                          <span className={cn("text-sm font-bold", colors.text)}>{6 - index}</span>
                        </div>

                        {/* Higher-order thinking badge */}
                        {isHigherOrder && (
                          <div className="absolute -top-4 left-6">
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-3 py-1 shadow-md z-10">
                              Higher-Order Thinking
                            </Badge>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-lg shadow-md", colors.bg)}>
                              <Brain className={cn("h-6 w-6", colors.accent)} />
                            </div>
                            <div>
                              <h3 className={cn("text-2xl font-bold", colors.text)}>
                                {level}
                              </h3>
                              <p className={cn("text-sm", colors.text, "opacity-75")}>
                                {framework.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <Progress value={(framework.cognitiveLoad / 5) * 100} className="h-2 w-20 mb-2" />
                              <Badge variant="outline" className={cn("text-xs", colors.text, colors.border)}>
                                Load: {framework.cognitiveLoad}/5
                              </Badge>
                            </div>
                            <div className={cn("p-2 rounded-full", colors.bg)}>
                              <Eye className={cn("h-4 w-4", colors.accent)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Hover Tooltip */}
          <AnimatePresence>
            {hoveredLevel && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="fixed z-50 pointer-events-none"
                style={{
                  left: hoverPosition.x - 200,
                  top: hoverPosition.y - 320,
                  width: '400px'
                }}
              >
                <div className={cn(
                  "p-5 rounded-lg shadow-2xl border-2 backdrop-blur-sm",
                  "bg-gradient-to-r from-white to-gray-50",
                  "dark:from-slate-800 dark:to-slate-700",
                  "border-gray-300 dark:border-slate-500"
                )}>
                  {(() => {
                    const framework = ENHANCED_BLOOMS_FRAMEWORK[hoveredLevel];
                    const colors = getBloomColor(hoveredLevel);
                    
                    return (
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-slate-600">
                          <div className={cn("p-2 rounded-lg", colors.bg)}>
                            <Brain className={cn("h-5 w-5", colors.accent)} />
                          </div>
                          <div>
                            <h3 className={cn("text-lg font-bold", colors.text)}>{hoveredLevel}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Cognitive Load: {framework.cognitiveLoad}/5</p>
                          </div>
                        </div>

                        {/* Cognitive Significance */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                            Cognitive Development Significance
                          </h4>
                          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                            {getCognitiveSignificance(hoveredLevel)}
                          </p>
                        </div>

                        {/* Key Action Verbs */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-500" />
                            Key Action Verbs
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {framework.verbs.slice(0, 8).map((verb) => (
                              <Badge key={verb} variant="outline" className="text-xs border-gray-300 dark:border-gray-600">
                                {verb}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Learning Activities */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-green-500" />
                            Recommended Activities
                          </h4>
                          <div className="space-y-1">
                            {LEARNING_ACTIVITIES[hoveredLevel].slice(0, 4).map((activity, idx) => (
                              <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                • {activity}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Example Question */}
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            Example Question
                          </h4>
                          <p className="text-xs italic text-blue-700 dark:text-blue-300">
                            &quot;{QUESTION_EXAMPLES[hoveredLevel][currentExample[hoveredLevel]]}&quot;
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="interactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Interactive Learning Guide
              </CardTitle>
              <CardDescription>
                Click on levels to explore detailed information and examples
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {(Object.keys(ENHANCED_BLOOMS_FRAMEWORK) as BloomsLevel[]).map((level) => (
              <BloomLevelCard key={level} level={level} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tips" className="space-y-6">
          {/* Header Section */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                Comprehensive Teaching Guide for Bloom&apos;s Taxonomy
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Practical strategies, assessment techniques, and pedagogical approaches to effectively implement Bloom&apos;s Taxonomy in your classroom
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Core Teaching Strategies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-md">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Foundation Building Strategies
                </CardTitle>
                <CardDescription className="text-emerald-50">
                  Essential practices for establishing cognitive progression
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="bg-emerald-500 p-1.5 rounded">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Sequential Progression</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Start with lower-order thinking before advancing to higher cognitive levels. Ensure students master foundational knowledge.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="bg-emerald-500 p-1.5 rounded">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Clear Learning Objectives</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Connect specific learning objectives to corresponding Bloom&apos;s levels for transparent expectations.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="bg-emerald-500 p-1.5 rounded">
                      <Layers className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Scaffolded Practice</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Provide guided practice at each cognitive level before independent application.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Assessment Design Excellence
                </CardTitle>
                <CardDescription className="text-blue-50">
                  Creating effective assessments across cognitive levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="bg-blue-500 p-1.5 rounded">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Cognitive Load Balance</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Distribute questions across all levels, with emphasis on higher-order thinking for advanced learners.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="bg-blue-500 p-1.5 rounded">
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Clear Rubrics</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Develop rubrics that explicitly match cognitive complexity and expected thinking processes.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="bg-blue-500 p-1.5 rounded">
                      <HelpCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Varied Question Types</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Use multiple question formats to assess different cognitive levels and learning styles.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Level-Specific Teaching Strategies */}
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-lg">
            <CardHeader className="border-b border-slate-200 dark:border-slate-600">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                Level-Specific Teaching Strategies
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Targeted approaches for each cognitive level in Bloom&apos;s Taxonomy
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.keys(ENHANCED_BLOOMS_FRAMEWORK) as BloomsLevel[]).map((level) => {
                  const framework = ENHANCED_BLOOMS_FRAMEWORK[level];
                  const levelColors = {
                    REMEMBER: "from-blue-500 to-blue-600",
                    UNDERSTAND: "from-green-500 to-green-600",
                    APPLY: "from-yellow-500 to-amber-500",
                    ANALYZE: "from-orange-500 to-orange-600",
                    EVALUATE: "from-red-500 to-red-600",
                    CREATE: "from-purple-500 to-purple-600"
                  };
                  const strategies = {
                    REMEMBER: ["Use flashcards and repetition", "Create timeline exercises", "Practice recall games", "Build vocabulary banks"],
                    UNDERSTAND: ["Encourage paraphrasing", "Use graphic organizers", "Practice summarization", "Create concept maps"],
                    APPLY: ["Provide case studies", "Use simulation exercises", "Practice problem-solving", "Create real-world scenarios"],
                    ANALYZE: ["Facilitate debates", "Use compare/contrast activities", "Practice breaking down arguments", "Create analysis frameworks"],
                    EVALUATE: ["Use peer review sessions", "Create decision matrices", "Practice criteria development", "Facilitate critical discussions"],
                    CREATE: ["Design project work", "Encourage innovation challenges", "Practice synthesis activities", "Build original solutions"]
                  };
                  
                  return (
                    <div key={level} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={cn("p-1.5 rounded bg-gradient-to-r", levelColors[level])}>
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{level}</h4>
                      </div>
                      <div className="space-y-2">
                        {strategies[level].map((strategy, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-slate-400 dark:bg-slate-500"></div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{strategy}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Teaching Tips */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-md">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Engagement & Motivation
                </CardTitle>
                <CardDescription className="text-purple-50">
                  Strategies to keep students actively involved in learning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="bg-purple-500 p-1.5 rounded">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Collaborative Learning</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Use group activities for analysis and evaluation tasks. Peer discussions enhance critical thinking skills.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="bg-purple-500 p-1.5 rounded">
                      <Lightbulb className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Creative Expression</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Encourage original thinking through creative projects and open-ended challenges.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="bg-purple-500 p-1.5 rounded">
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Metacognitive Awareness</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Help students understand their own thinking processes and learning strategies.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-md">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Implementation & Time Management
                </CardTitle>
                <CardDescription className="text-orange-50">
                  Practical guidance for classroom implementation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="bg-orange-500 p-1.5 rounded">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Progressive Timing</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Allocate more time for higher-order thinking questions. Complex cognitive tasks require additional processing time.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="bg-orange-500 p-1.5 rounded">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Formative Assessment</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Use regular check-ins to gauge student understanding before summative assessments.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="bg-orange-500 p-1.5 rounded">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Student Readiness</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Consider individual student readiness levels when introducing complex cognitive challenges.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Reference Guide */}
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-lg">
            <CardHeader className="border-b border-slate-200 dark:border-slate-600">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                Quick Reference: Action Verbs by Level
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Essential verbs for crafting questions at each cognitive level
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {(Object.keys(ENHANCED_BLOOMS_FRAMEWORK) as BloomsLevel[]).map((level) => {
                  const framework = ENHANCED_BLOOMS_FRAMEWORK[level];
                  const levelColors = {
                    REMEMBER: "bg-blue-500",
                    UNDERSTAND: "bg-green-500",
                    APPLY: "bg-yellow-500",
                    ANALYZE: "bg-orange-500",
                    EVALUATE: "bg-red-500",
                    CREATE: "bg-purple-500"
                  };
                  
                  return (
                    <div key={level} className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={cn("w-2 h-2 rounded-full", levelColors[level])}></div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{level}</h4>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {framework.verbs.slice(0, 5).map((verb) => (
                          <span key={verb} className="text-xs px-2 py-1 bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-500">
                            {verb}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};