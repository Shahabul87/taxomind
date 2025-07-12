"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Brain,
  Zap,
  Sparkles,
  Play,
  Shield,
  Activity,
  Award,
  GraduationCap,
  Building2,
  Users,
  Lightbulb,
  Target,
  Puzzle,
  FlaskConical,
  ChevronRight,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
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
      confidence: 95
    }
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
      understanding: 88
    }
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
      accuracy: 82
    }
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
      insight: 76
    }
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
      confidence: 91
    }
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
      innovation: 94
    }
  }
];

// User types with enhanced descriptions
const userTypes = [
  {
    icon: GraduationCap,
    title: "Students",
    description: "Master all 6 cognitive levels with personalized AI guidance",
    link: "/auth/register?role=student",
    gradient: "from-purple-500 to-indigo-500"
  },
  {
    icon: Users,
    title: "Teachers",
    description: "Create adaptive content that evolves with student progress",
    link: "/auth/register?role=teacher", 
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Building2,
    title: "Enterprise",
    description: "Scale cognitive development across your organization",
    link: "/enterprise",
    gradient: "from-emerald-500 to-teal-500"
  }
];

export default function HeroSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const [showPyramid, setShowPyramid] = useState(false);

  const activeLevel = selectedLevel || hoveredLevel || 1;

  useEffect(() => {
    if (isInView) {
      setTimeout(() => setShowPyramid(true), 500);
    }
  }, [isInView]);

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900 flex items-center"
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0">
        {/* Neural network pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1200 800">
            <defs>
              <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            <g stroke="url(#neuralGradient)" strokeWidth="1" fill="none">
              {[0, 1, 2].map((i) => (
                <motion.path
                  key={i}
                  d={`M${100 + i * 50},${200 + i * 200} Q${300 + i * 200},${100 + i * 100} ${500 + i * 200},${200 + i * 200} T${900 + i * 200},${200 + i * 200}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 3, delay: 1 + i * 0.5 }}
                />
              ))}
            </g>
          </svg>
        </div>

        {/* Floating orbs */}
        <motion.div 
          className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            {/* Brand with icon */}
            <motion.div 
              className="inline-flex items-center gap-3 mb-6"
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl shadow-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Taxomind
              </span>
            </motion.div>

            {/* Main headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
              <motion.span 
                className="block text-white mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 }}
              >
                AI-Powered Learning
              </motion.span>
              <motion.span 
                className="block bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.4 }}
              >
                Through Bloom&apos;s Taxonomy
              </motion.span>
            </h1>

            <motion.p 
              className="text-xl text-gray-300 max-w-3xl mx-auto mb-8"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
            >
              Track cognitive development across 6 scientifically-proven levels. 
              Our AI adapts to each learner&apos;s unique journey, ensuring mastery at every stage.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 }}
            >
              <Link href="/auth/register">
                <Button 
                  size="lg"
                  className="group relative bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-8 py-6 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    Start Your Journey
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                </Button>
              </Link>
              
              <Link href="/features">
                <Button 
                  size="lg"
                  variant="outline"
                  className="group font-semibold px-8 py-6 rounded-2xl border-2 border-purple-400/50 text-purple-300 hover:bg-purple-900/30 hover:border-purple-400 backdrop-blur-sm"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Interactive Bloom's Taxonomy Pyramid */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Interactive Pyramid Visualization */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={showPyramid ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <h3 className="text-2xl font-bold text-white mb-6 text-center lg:text-left">
                <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Your Interactive Cognitive Journey
                </span>
              </h3>

              <div className="space-y-4">
                {taxonomyLevels.map((level, index) => {
                  const width = 100 - (index * 12);
                  const isActive = activeLevel === level.level;
                  const isHovered = hoveredLevel === level.level;
                  
                  return (
                    <motion.div
                      key={level.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={showPyramid ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      onMouseEnter={() => setHoveredLevel(level.level)}
                      onMouseLeave={() => setHoveredLevel(null)}
                      onClick={() => setSelectedLevel(level.level)}
                      style={{ width: `${width}%` }}
                      className={`
                        relative cursor-pointer transition-all duration-500 group mx-auto lg:mx-0
                        ${isActive ? 'scale-105 z-20' : isHovered ? 'scale-102 z-10' : ''}
                      `}
                    >
                      {/* Compact Level Card */}
                      <div className={`
                        relative overflow-hidden rounded-2xl p-4 
                        bg-gradient-to-r ${isActive || isHovered ? level.color : level.lightColor}
                        ${isActive ? 'shadow-2xl shadow-purple-500/25' : isHovered ? 'shadow-xl' : 'shadow-lg'}
                        transform transition-all duration-500 border-2
                        ${isHovered ? 'border-white/30' : 'border-transparent'}
                      `}>
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-3">
                            <motion.div 
                              className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"
                              animate={isActive || isHovered ? { rotate: 360, scale: 1.1 } : { scale: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <level.icon className="w-5 h-5" />
                            </motion.div>
                            <div>
                              <h4 className="font-semibold text-lg">{level.name}</h4>
                              <p className="text-sm text-white/80">Level {level.level}</p>
                            </div>
                          </div>
                          <motion.div
                            animate={isHovered ? { x: 5 } : { x: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </motion.div>
                        </div>
                        
                        {/* Simple hover indicator */}
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
                          />
                        )}

                        {/* Connection indicator */}
                        {isHovered && (
                          <motion.div
                            className="absolute -right-6 top-1/2 -translate-y-1/2 z-50"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                          >
                            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                              <motion.div
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="w-2 h-2 bg-white rounded-full"
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Enhanced AI Tracking Indicator */}
              <motion.div
                className="mt-6 text-center lg:text-left"
                initial={{ opacity: 0 }}
                animate={showPyramid ? { opacity: 1 } : {}}
                transition={{ delay: 1.5 }}
              >
                <div className="inline-flex items-center gap-3 px-4 py-3 bg-purple-500/10 backdrop-blur-sm rounded-full border border-purple-500/30">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Activity className="w-4 h-4 text-purple-400" />
                  </motion.div>
                  <span className="text-sm text-purple-300 font-medium">
                    AI actively analyzing cognitive patterns
                  </span>
                  <motion.div
                    className="w-2 h-2 bg-green-400 rounded-full"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              {/* Interactive Hint */}
              <motion.div
                className="mt-4 text-center lg:text-left"
                initial={{ opacity: 0 }}
                animate={showPyramid ? { opacity: 1 } : {}}
                transition={{ delay: 2 }}
              >
                <p className="text-sm text-gray-400 italic">
                  💡 Hover over each level to see detailed explanations
                </p>
              </motion.div>
            </motion.div>

            {/* Floating Details Panel */}
            <div className="relative">
              {/* Main Floating Panel */}
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={showPyramid ? { opacity: 1, x: 0, scale: 1 } : {}}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="sticky top-4">
                  <h3 className="text-2xl font-bold text-white mb-6 text-center lg:text-left">
                    <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                      Cognitive Level Deep Dive
                    </span>
                  </h3>

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
                          {/* Enhanced Floating Level Card */}
                          <motion.div 
                            className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border-2 border-slate-700/50 shadow-2xl relative overflow-hidden"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            {/* Floating indicator */}
                            <motion.div
                              className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full"
                              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            
                            {/* Enhanced Header */}
                            <div className="flex items-start gap-6 mb-8">
                              <motion.div 
                                className={`p-5 rounded-3xl bg-gradient-to-br ${level.color} text-white shadow-2xl relative`}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                              >
                                <level.icon className="w-12 h-12" />
                                <motion.div
                                  className="absolute inset-0 bg-white/20 rounded-3xl"
                                  animate={{ opacity: [0, 0.3, 0] }}
                                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                                />
                              </motion.div>
                              <div className="flex-1">
                                <motion.h4 
                                  className="text-4xl font-bold text-white mb-3"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.2 }}
                                >
                                  {level.name}
                                </motion.h4>
                                <motion.p 
                                  className="text-gray-300 text-xl leading-relaxed mb-4"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.3 }}
                                >
                                  {level.description}
                                </motion.p>
                                <div className="flex flex-wrap items-center gap-3">
                                  <motion.span 
                                    className="text-sm bg-purple-500/20 px-4 py-2 rounded-full text-purple-300 border border-purple-500/30"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.4, type: "spring" }}
                                  >
                                    Level {level.level} of 6
                                  </motion.span>
                                  <motion.span 
                                    className="text-sm bg-blue-500/20 px-4 py-2 rounded-full text-blue-300 border border-blue-500/30"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5, type: "spring" }}
                                  >
                                    Bloom&apos;s Taxonomy
                                  </motion.span>
                                  <motion.span 
                                    className="text-sm bg-emerald-500/20 px-4 py-2 rounded-full text-emerald-300 border border-emerald-500/30"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.6, type: "spring" }}
                                  >
                                    AI-Enhanced
                                  </motion.span>
                                </div>
                              </div>
                            </div>

                            {/* Three-Column Information Layout */}
                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                              {/* What It Is */}
                              <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                  <Brain className="w-4 h-4 text-purple-400" />
                                  <span className="text-purple-300 font-semibold text-sm">What It Is</span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">{level.whatItIs}</p>
                              </div>

                              {/* How It Works */}
                              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                  <Zap className="w-4 h-4 text-blue-400" />
                                  <span className="text-blue-300 font-semibold text-sm">How AI Helps</span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">{level.howItWorks}</p>
                              </div>

                              {/* What It Tests */}
                              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl p-4 border border-emerald-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                  <Target className="w-4 h-4 text-emerald-400" />
                                  <span className="text-emerald-300 font-semibold text-sm">What It Tests</span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">{level.whatItTests}</p>
                              </div>
                            </div>

                            {/* Interactive Visual Representation */}
                            <div className="mt-6 mb-6">
                              <h6 className="text-sm font-semibold text-gray-400 mb-4">Visual Learning Representation:</h6>
                              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl p-6 border border-slate-600/50">
                                {/* Different visual for each level */}
                                {level.level === 1 && (
                                  // Remember - Memory Cards Animation
                                  <div className="flex items-center justify-center space-x-4">
                                    {[1, 2, 3].map((card) => (
                                      <motion.div
                                        key={card}
                                        className="w-16 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
                                        animate={{ 
                                          rotateY: [0, 180, 0],
                                          scale: [1, 1.05, 1]
                                        }}
                                        transition={{ 
                                          duration: 2,
                                          delay: card * 0.3,
                                          repeat: Infinity,
                                          repeatDelay: 3
                                        }}
                                      >
                                        <span className="text-white font-bold text-lg">{card}</span>
                                      </motion.div>
                                    ))}
                                    <motion.div
                                      className="text-yellow-400"
                                      animate={{ opacity: [0.5, 1, 0.5] }}
                                      transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                      <span className="text-sm">💡 Memory Recall</span>
                                    </motion.div>
                                  </div>
                                )}

                                {level.level === 2 && (
                                  // Understand - Concept Map
                                  <div className="relative w-full h-32">
                                    <svg viewBox="0 0 300 120" className="w-full h-full">
                                      <defs>
                                        <linearGradient id="conceptGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                          <stop offset="0%" stopColor="#6366f1" />
                                          <stop offset="100%" stopColor="#8b5cf6" />
                                        </linearGradient>
                                      </defs>
                                      {/* Central concept */}
                                      <motion.circle
                                        cx="150" cy="60" r="25"
                                        fill="url(#conceptGrad)"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                      />
                                      <text x="150" y="65" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                                        Core
                                      </text>
                                      
                                      {/* Connected concepts */}
                                      {[
                                        { x: 75, y: 30, label: "A" },
                                        { x: 225, y: 30, label: "B" },
                                        { x: 75, y: 90, label: "C" },
                                        { x: 225, y: 90, label: "D" }
                                      ].map((node, i) => (
                                        <g key={i}>
                                          <motion.line
                                            x1="150" y1="60"
                                            x2={node.x} y2={node.y}
                                            stroke="#6366f1"
                                            strokeWidth="2"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 1, delay: i * 0.2 }}
                                          />
                                          <motion.circle
                                            cx={node.x} cy={node.y} r="15"
                                            fill="#4f46e5"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.5 + i * 0.2 }}
                                          />
                                          <text x={node.x} y={node.y + 5} textAnchor="middle" fill="white" fontSize="10">
                                            {node.label}
                                          </text>
                                        </g>
                                      ))}
                                    </svg>
                                  </div>
                                )}

                                {level.level === 3 && (
                                  // Apply - Problem Solving Steps
                                  <div className="flex items-center justify-between">
                                    {['Problem', 'Method', 'Solution'].map((step, i) => (
                                      <div key={step} className="flex flex-col items-center">
                                        <motion.div
                                          className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-2"
                                          animate={{ 
                                            scale: [1, 1.2, 1],
                                            rotate: [0, 360, 0]
                                          }}
                                          transition={{ 
                                            duration: 3,
                                            delay: i * 0.5,
                                            repeat: Infinity,
                                            repeatDelay: 2
                                          }}
                                        >
                                          <span className="text-white font-bold">{i + 1}</span>
                                        </motion.div>
                                        <span className="text-blue-300 text-xs font-medium">{step}</span>
                                        {i < 2 && (
                                          <motion.div
                                            className="text-blue-400 mt-1"
                                            animate={{ x: [0, 10, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                          >
                                            →
                                          </motion.div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {level.level === 4 && (
                                  // Analyze - Data Patterns
                                  <div className="w-full h-32">
                                    <svg viewBox="0 0 300 120" className="w-full h-full">
                                      <defs>
                                        <linearGradient id="analyzeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                          <stop offset="0%" stopColor="#06b6d4" />
                                          <stop offset="100%" stopColor="#0891b2" />
                                        </linearGradient>
                                      </defs>
                                      {/* Bar chart */}
                                      {[20, 35, 55, 45, 70, 60].map((height, i) => (
                                        <motion.rect
                                          key={i}
                                          x={30 + i * 40}
                                          y={100 - height}
                                          width="25"
                                          height={height}
                                          fill="url(#analyzeGrad)"
                                          initial={{ height: 0, y: 100 }}
                                          animate={{ height, y: 100 - height }}
                                          transition={{ duration: 1, delay: i * 0.1 }}
                                        />
                                      ))}
                                      {/* Trend line */}
                                      <motion.path
                                        d="M 42 80 Q 82 65 122 45 T 202 40 T 282 30"
                                        stroke="#fbbf24"
                                        strokeWidth="3"
                                        fill="none"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 2, delay: 0.8 }}
                                      />
                                    </svg>
                                  </div>
                                )}

                                {level.level === 5 && (
                                  // Evaluate - Judgment Scale
                                  <div className="flex items-center justify-center">
                                    <div className="relative w-48 h-20">
                                      {/* Scale background */}
                                      <div className="absolute top-8 left-0 w-full h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full opacity-30" />
                                      
                                      {/* Moving indicator */}
                                      <motion.div
                                        className="absolute top-6 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center"
                                        animate={{ 
                                          left: ['10%', '80%', '10%'],
                                          scale: [1, 1.2, 1]
                                        }}
                                        transition={{ 
                                          duration: 4,
                                          repeat: Infinity,
                                          ease: "easeInOut"
                                        }}
                                      >
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                                      </motion.div>
                                      
                                      {/* Scale labels */}
                                      <div className="absolute top-0 left-0 text-xs text-red-400">Poor</div>
                                      <div className="absolute top-0 right-0 text-xs text-green-400">Excellent</div>
                                      
                                      <motion.div
                                        className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-emerald-300 text-xs font-medium"
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                      >
                                        ⚖️ Critical Assessment
                                      </motion.div>
                                    </div>
                                  </div>
                                )}

                                {level.level === 6 && (
                                  // Create - Innovation Process
                                  <div className="relative w-full h-32 overflow-hidden">
                                    {/* Creativity sparks */}
                                    {[...Array(8)].map((_, i) => (
                                      <motion.div
                                        key={i}
                                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                                        style={{
                                          left: `${20 + (i * 10)}%`,
                                          top: `${30 + Math.sin(i) * 20}%`
                                        }}
                                        animate={{
                                          scale: [0, 1.5, 0],
                                          opacity: [0, 1, 0],
                                          rotate: [0, 180, 360]
                                        }}
                                        transition={{
                                          duration: 2,
                                          delay: i * 0.2,
                                          repeat: Infinity,
                                          repeatDelay: 1
                                        }}
                                      />
                                    ))}
                                    
                                    {/* Central lightbulb */}
                                    <motion.div
                                      className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                                      animate={{ 
                                        scale: [1, 1.3, 1],
                                        rotate: [0, 10, -10, 0]
                                      }}
                                      transition={{ 
                                        duration: 3,
                                        repeat: Infinity
                                      }}
                                    >
                                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                        <Lightbulb className="w-8 h-8 text-white" />
                                      </div>
                                    </motion.div>
                                    
                                    <motion.div
                                      className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-yellow-300 text-xs font-medium"
                                      animate={{ opacity: [0.5, 1, 0.5] }}
                                      transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                      💡 Innovation in Progress
                                    </motion.div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Learning Examples */}
                            <div className="mt-6">
                              <h6 className="text-sm font-semibold text-gray-400 mb-3">Learning Activities:</h6>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {level.examples.map((example, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                                  >
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
          </div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-wrap justify-center items-center gap-8 mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 0.6, y: 0 } : {}}
            transition={{ delay: 2, duration: 0.8 }}
          >
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300 font-medium">Research-Based</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-gray-300 font-medium">Secure Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300 font-medium">Real-Time Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300 font-medium">Award Winning</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </section>
  );
}