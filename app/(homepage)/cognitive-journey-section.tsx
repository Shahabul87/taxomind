"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Award,
  Brain,
  ChevronRight,
  Lightbulb,
  Shield,
  Sparkles,
  Target,
  Zap,
  Puzzle,
  FlaskConical
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

// Bloom's Taxonomy levels with enhanced interactive content
const taxonomyLevels = [
  {
    level: 1,
    name: "Remember",
    icon: Brain,
    color: "from-purple-500 to-purple-600",
    lightColor: "from-purple-400 to-purple-500",
    description: "Recall facts and basic concepts",
    aiFeature: "AI-powered flashcards & memory games",
    whatItIs: "Foundation of all learning - storing and retrieving information",
    howItWorks: "AI tracks what you've learned and optimizes memory retention",
    whatItTests: "Recall of facts, terms, concepts, and procedures",
    examples: ["Define photosynthesis", "List the planets", "Name the capitals"],
    visualization: "memory-cards",
    interactiveDemo: {
      type: "flashcard",
      question: "What is the capital of France?",
      answer: "Paris",
      confidence: 95,
    },
  },
  {
    level: 2,
    name: "Understand",
    icon: Lightbulb,
    color: "from-indigo-500 to-indigo-600",
    lightColor: "from-indigo-400 to-indigo-500",
    description: "Explain ideas and concepts",
    aiFeature: "Intelligent explanations & concept mapping",
    whatItIs: "Making meaning from information and explaining it in your own words",
    howItWorks: "AI analyzes your explanations and provides personalized clarifications",
    whatItTests: "Comprehension, interpretation, and explanation abilities",
    examples: ["Explain photosynthesis", "Summarize the plot", "Describe the process"],
    visualization: "concept-map",
    interactiveDemo: {
      type: "explanation",
      concept: "Gravity",
      explanation: "Force that pulls objects toward Earth",
      understanding: 88,
    },
  },
  {
    level: 3,
    name: "Apply",
    icon: Target,
    color: "from-blue-500 to-blue-600",
    lightColor: "from-blue-400 to-blue-500",
    description: "Use information in new situations",
    aiFeature: "Real-world scenarios & practice exercises",
    whatItIs: "Using knowledge and skills in practical, real-world contexts",
    howItWorks: "AI creates personalized scenarios matching your learning level",
    whatItTests: "Implementation of procedures and problem-solving skills",
    examples: ["Solve math problems", "Code a program", "Apply a formula"],
    visualization: "problem-solving",
    interactiveDemo: {
      type: "scenario",
      problem: "Calculate the area of a garden",
      solution: "Length × Width = Area",
      accuracy: 82,
    },
  },
  {
    level: 4,
    name: "Analyze",
    icon: Puzzle,
    color: "from-cyan-500 to-cyan-600",
    lightColor: "from-cyan-400 to-cyan-500",
    description: "Draw connections among ideas",
    aiFeature: "Pattern recognition & data analysis",
    whatItIs: "Breaking down information to understand relationships and patterns",
    howItWorks: "AI guides you through systematic analysis and pattern recognition",
    whatItTests: "Critical thinking and analytical reasoning skills",
    examples: ["Compare theories", "Find patterns", "Analyze data trends"],
    visualization: "pattern-analysis",
    interactiveDemo: {
      type: "analysis",
      data: "Sales trends over 6 months",
      pattern: "Increasing trend in Q2",
      insight: 76,
    },
  },
  {
    level: 5,
    name: "Evaluate",
    icon: FlaskConical,
    color: "from-emerald-500 to-emerald-600",
    lightColor: "from-emerald-400 to-emerald-500",
    description: "Justify decisions and judgments",
    aiFeature: "Critical thinking & peer reviews",
    whatItIs: "Making informed judgments based on criteria and evidence",
    howItWorks: "AI facilitates structured evaluation and provides feedback frameworks",
    whatItTests: "Critical judgment and evidence-based decision making",
    examples: ["Critique an argument", "Judge the quality", "Assess effectiveness"],
    visualization: "judgment-scale",
    interactiveDemo: {
      type: "evaluation",
      criteria: "Source credibility",
      judgment: "Highly reliable",
      confidence: 91,
    },
  },
  {
    level: 6,
    name: "Create",
    icon: Sparkles,
    color: "from-yellow-500 to-yellow-600",
    lightColor: "from-yellow-400 to-yellow-500",
    description: "Produce original work",
    aiFeature: "Creative challenges & portfolio builder",
    whatItIs: "Generating new ideas, products, or solutions from learned knowledge",
    howItWorks: "AI provides creative prompts and helps structure innovative thinking",
    whatItTests: "Originality, innovation, and synthesis of knowledge",
    examples: ["Design a solution", "Write a story", "Build a prototype"],
    visualization: "creative-workshop",
    interactiveDemo: {
      type: "creation",
      project: "Design an eco-friendly product",
      creativity: "Solar-powered backpack",
      innovation: 94,
    },
  },
];

export default function CognitiveJourneySection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const [showPyramid, setShowPyramid] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  const activeLevel = selectedLevel || hoveredLevel || 1;

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setShowPyramid(true), prefersReducedMotion ? 100 : 500);
      return () => clearTimeout(timer);
    }
  }, [isInView, prefersReducedMotion]);

  const onKeyActivate = (e: React.KeyboardEvent, level: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedLevel(level);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-12 sm:py-16"
    >
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Interactive Bloom's Taxonomy Pyramid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-start">
            {/* Interactive Pyramid Visualization */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={showPyramid ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center lg:text-left">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Your Interactive Cognitive Journey
                </span>
              </h2>

              <div className="space-y-3 sm:space-y-4">
                {taxonomyLevels.map((level, index) => {
                  const mdWidths = [
                    "md:w-[100%]",
                    "md:w-[88%]",
                    "md:w-[76%]",
                    "md:w-[64%]",
                    "md:w-[52%]",
                    "md:w-[40%]",
                  ];
                  const isActive = activeLevel === level.level;
                  const isHovered = hoveredLevel === level.level;
                  return (
                    <motion.div
                      key={level.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={showPyramid ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className={`relative group mx-auto lg:mx-0 w-full ${mdWidths[index]}`}
                    >
                      <button
                        type="button"
                        role="button"
                        tabIndex={0}
                        aria-pressed={isActive}
                        onMouseEnter={() => setHoveredLevel(level.level)}
                        onMouseLeave={() => setHoveredLevel(null)}
                        onFocus={() => setHoveredLevel(level.level)}
                        onBlur={() => setHoveredLevel(null)}
                        onClick={() => setSelectedLevel(level.level)}
                        onKeyDown={(e) => onKeyActivate(e, level.level)}
                        className={`w-full text-left relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 min-h-[60px] sm:min-h-[70px] bg-white dark:bg-slate-900/60 border transition-all duration-300 ${
                          isActive
                            ? "border-purple-400/60 shadow-lg shadow-purple-500/15"
                            : isHovered
                            ? "border-slate-200 dark:border-slate-700 shadow"
                            : "border-slate-200/60 dark:border-slate-800"
                        } focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${level.lightColor} text-white`}>
                              <level.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                                {level.name}
                              </h3>
                              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Level {level.level}</p>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isHovered || isActive ? "translate-x-1 text-slate-900 dark:text-slate-100" : "text-slate-400"}`} />
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* AI Tracking indicator */}
              <motion.div
                className="mt-6 text-center lg:text-left"
                initial={{ opacity: 0 }}
                animate={showPyramid ? { opacity: 1 } : {}}
                transition={{ delay: 1.5 }}
              >
                <div className="inline-flex items-center gap-3 px-4 py-3 bg-purple-500/10 backdrop-blur-sm rounded-full border border-purple-500/30">
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Activity className="w-4 h-4 text-purple-400" />
                  </motion.div>
                  <span className="text-sm text-purple-300 font-medium">AI actively analyzing cognitive patterns</span>
                  <motion.div className="w-2 h-2 bg-green-400 rounded-full" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} />
                </div>
              </motion.div>

              {/* Interaction hint */}
              <motion.div className="mt-4 text-center lg:text-left" initial={{ opacity: 0 }} animate={showPyramid ? { opacity: 1 } : {}} transition={{ delay: 2 }}>
                <p className="text-sm text-slate-500 dark:text-gray-400 italic">
                  💡 <span className="md:hidden">Tap</span>
                  <span className="hidden md:inline">Hover over</span> each level to see detailed explanations
                </p>
              </motion.div>
            </motion.div>

            {/* Floating Details Panel */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.96 }}
              animate={showPyramid ? { opacity: 1, x: 0, scale: 1 } : {}}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="md:sticky md:top-4">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center lg:text-left">
                  <span className="bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    Cognitive Level Deep Dive
                  </span>
                </h2>

                <AnimatePresence mode="wait">
                  {taxonomyLevels.map((level) => {
                    if (level.level !== activeLevel) return null;
                    return (
                      <motion.div
                        key={level.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <motion.div
                          className="rounded-3xl p-6 sm:p-8 border relative overflow-hidden bg-white border-slate-200 shadow-sm dark:bg-gradient-to-br dark:from-slate-900/80 dark:to-slate-900/90 dark:border-slate-800"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <motion.div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full" animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />

                          <div className="flex items-start gap-6 mb-6 sm:mb-8">
                            <div className={`p-5 rounded-3xl bg-gradient-to-br ${level.color} text-white relative shadow-md`}>
                              <level.icon className="w-10 h-10 sm:w-12 sm:h-12" />
                            </div>
                            <div className="flex-1">
                              <motion.h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                {level.name}
                              </motion.h3>
                              <motion.p className="text-slate-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                {level.description}
                              </motion.p>
                              <div className="flex flex-wrap items-center gap-3">
                                <motion.span className="text-sm bg-purple-100 dark:bg-purple-500/20 px-4 py-2 rounded-full text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 font-medium" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }}>
                                  Level {level.level} of 6
                                </motion.span>
                                <motion.span className="text-sm bg-blue-100 dark:bg-blue-500/20 px-4 py-2 rounded-full text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 font-medium" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}>
                                  Bloom&apos;s Taxonomy
                                </motion.span>
                                <motion.span className="text-sm bg-emerald-100 dark:bg-emerald-500/20 px-4 py-2 rounded-full text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-medium" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }}>
                                  AI-Enhanced
                                </motion.span>
                              </div>
                            </div>
                          </div>

                          {/* Three-Column Information Layout */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            {/* What It Is */}
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-500/10 dark:to-indigo-500/10 rounded-xl p-4 border border-purple-200 dark:border-purple-500/20">
                              <div className="flex items-center gap-2 mb-3">
                                <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <span className="text-purple-700 dark:text-purple-300 font-semibold text-sm">What It Is</span>
                              </div>
                              <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed">{level.whatItIs}</p>
                            </div>

                            {/* How It Works */}
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-xl p-4 border border-blue-200 dark:border-blue-500/20">
                              <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-blue-700 dark:text-blue-300 font-semibold text-sm">How AI Helps</span>
                              </div>
                              <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed">{level.howItWorks}</p>
                            </div>

                            {/* What It Tests */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-xl p-4 border border-emerald-200 dark:border-emerald-500/20">
                              <div className="flex items-center gap-2 mb-3">
                                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">What It Tests</span>
                              </div>
                              <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed">{level.whatItTests}</p>
                            </div>
                          </div>

                          {/* Visual representation */}
                          <div className="mt-6 mb-6">
                            <h6 className="text-sm font-semibold text-gray-400 mb-4">Visual Learning Representation:</h6>
                            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl p-6 border border-slate-600/50">
                              {mounted && level.level === 1 && (
                                <div className="flex items-center justify-center space-x-4">
                                  {[1, 2, 3].map((card) => (
                                    <motion.div
                                      key={card}
                                      className="w-16 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
                                      animate={!prefersReducedMotion ? { rotateY: [0, 180, 0], scale: [1, 1.05, 1] } : {}}
                                      transition={!prefersReducedMotion ? { duration: 2, delay: card * 0.3, repeat: Infinity, repeatDelay: 3 } : {}}
                                    >
                                      <span className="text-white font-bold text-lg">{card}</span>
                                    </motion.div>
                                  ))}
                                  <motion.div className="text-yellow-300" animate={!prefersReducedMotion ? { opacity: [0.5, 1, 0.5] } : {}} transition={!prefersReducedMotion ? { duration: 1.5, repeat: Infinity } : {}}>
                                    <span className="text-sm">💡 Memory Recall</span>
                                  </motion.div>
                                </div>
                              )}

                              {mounted && level.level === 2 && (
                                <div className="relative w-full h-32">
                                  <div className="flex items-center justify-center h-full">
                                    {[0, 1, 2].map((i) => (
                                      <motion.div
                                        key={i}
                                        className="w-24 h-24 rounded-full border-2 border-yellow-300/50 mx-2"
                                        animate={!prefersReducedMotion ? { scale: [1, 1.1, 1] } : {}}
                                        transition={!prefersReducedMotion ? { duration: 2, delay: i * 0.2, repeat: Infinity, repeatDelay: 1 } : {}}
                                      />
                                    ))}
                                  </div>
                                  <motion.div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                      <Lightbulb className="w-8 h-8 text-white" />
                                    </div>
                                  </motion.div>
                                  <motion.div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-yellow-300 text-xs font-medium" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                    💡 Innovation in Progress
                                  </motion.div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Learning Examples */}
                          <div className="mt-6">
                            <h6 className="text-sm font-semibold text-gray-400 mb-3">Learning Activities:</h6>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {level.examples.map((example, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${level.color}`} />
                                  <span className="text-sm text-gray-300">{example}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-wrap justify-center items-center gap-8 mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 0.6, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="font-medium text-slate-500 dark:text-gray-300">Research-Based</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="font-medium text-slate-500 dark:text-gray-300">Secure Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-slate-500 dark:text-gray-300">Real-Time Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="font-medium text-slate-500 dark:text-gray-300">Award Winning</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
