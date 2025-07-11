"use client"

import { motion, useAnimationControls } from "framer-motion";
import { 
  ArrowRight, 
  Brain,
  Zap,
  Target,
  TrendingUp,
  Sparkles,
  Play,
  Star,
  Users,
  Award,
  BarChart3,
  BookOpen,
  Shield,
  Cpu,
  GraduationCap,
  Building2,
  Lightbulb,
  Layers,
  GitBranch,
  Activity,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

// Bloom's Taxonomy levels for cognitive tracking
const bloomsLevels = [
  { name: "Remember", color: "from-purple-600 to-purple-500", icon: BookOpen, progress: 95 },
  { name: "Understand", color: "from-indigo-600 to-indigo-500", icon: Brain, progress: 88 },
  { name: "Apply", color: "from-blue-600 to-blue-500", icon: Target, progress: 76 },
  { name: "Analyze", color: "from-cyan-600 to-cyan-500", icon: GitBranch, progress: 68 },
  { name: "Evaluate", color: "from-emerald-600 to-emerald-500", icon: BarChart3, progress: 54 },
  { name: "Create", color: "from-yellow-600 to-yellow-500", icon: Lightbulb, progress: 42 }
];

const aiFeatures = [
  {
    icon: Brain,
    title: "Cognitive Tracking",
    description: "AI monitors your progress through all 6 levels of Bloom's taxonomy in real-time",
    gradient: "from-purple-500 to-indigo-500",
    stats: "6 Levels",
    delay: 0.1
  },
  {
    icon: Activity,
    title: "Learning Analytics",
    description: "Track cognitive development patterns and get personalized insights for growth",
    gradient: "from-blue-500 to-cyan-500",
    stats: "Real-Time",
    delay: 0.2
  },
  {
    icon: Layers,
    title: "Adaptive Path",
    description: "AI adjusts content difficulty based on your current cognitive level mastery",
    gradient: "from-emerald-500 to-teal-500",
    stats: "Personalized",
    delay: 0.3
  },
];

const userTypes = [
  {
    icon: GraduationCap,
    title: "Students",
    description: "Track your cognitive growth through 6 levels with personalized AI guidance",
    link: "/auth/register?role=student",
    color: "purple"
  },
  {
    icon: Users,
    title: "Teachers",
    description: "Monitor student cognitive development and create adaptive assessments",
    link: "/auth/register?role=teacher", 
    color: "blue"
  },
  {
    icon: Building2,
    title: "Enterprise",
    description: "Measure team cognitive capabilities and optimize learning outcomes",
    link: "/enterprise",
    color: "emerald"
  }
];

const stats = [
  { value: "6 Levels", label: "Cognitive Tracking", icon: Layers },
  { value: "Real-Time", label: "Progress Monitoring", icon: Activity },
  { value: "98%", label: "Accuracy Rate", icon: Target },
  { value: "Adaptive", label: "Learning Paths", icon: GitBranch }
];

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.1
    }
  }
};

const titleVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.25, 0, 1]
    }
  }
};

const subtitleVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      delay: 0.3,
      ease: "easeOut"
    }
  }
};

const featureVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.8 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: 0.8 + delay,
      ease: [0.25, 0.25, 0, 1]
    }
  })
};

const floatingAnimation = {
  y: [0, -20, 0],
  rotate: [0, 360],
  scale: [1, 1.1, 1],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const brainFloatingAnimation = {
  y: [0, -15, 0],
  x: [0, 10, 0],
  rotate: [0, 180, 360],
  scale: [1, 1.2, 1],
  transition: {
    duration: 10,
    repeat: Infinity,
    ease: "easeInOut",
    delay: 1
  }
};

// Typewriter effect for tagline
const useTypewriter = (text: string, speed: number = 50) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return displayText;
};

export default function MindForgeHeroSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const typewriterText = useTypewriter("Where Minds Are Forged Through Intelligence", 30);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      setShowTypewriter(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const shouldAnimate = isInView && isReady;

  return (
    <div 
      ref={sectionRef} 
      className="relative w-full overflow-hidden min-h-screen flex items-center justify-center"
      style={{ paddingTop: '80px' }}
    >
      {/* Enhanced background with neural network pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900"></div>
      
      {/* Animated neural network background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1200 800">
          <defs>
            <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6"/>
              <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.6"/>
            </linearGradient>
            <linearGradient id="cognitiveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8"/>
              <stop offset="16.66%" stopColor="#6366F1" stopOpacity="0.8"/>
              <stop offset="33.33%" stopColor="#3B82F6" stopOpacity="0.8"/>
              <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.8"/>
              <stop offset="66.66%" stopColor="#10B981" stopOpacity="0.8"/>
              <stop offset="83.33%" stopColor="#EAB308" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.8"/>
            </linearGradient>
          </defs>
          {/* Neural network connections */}
          <g stroke="url(#neuralGradient)" strokeWidth="1" fill="none">
            <motion.path
              d="M100,200 Q300,100 500,200 T900,200"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 3, delay: 1 }}
            />
            <motion.path
              d="M150,400 Q400,300 650,400 T1050,400"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ duration: 3, delay: 1.5 }}
            />
            <motion.path
              d="M200,600 Q500,500 800,600 T1100,600"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ duration: 3, delay: 2 }}
            />
          </g>
          {/* Neural nodes */}
          <g fill="url(#neuralGradient)">
            {[...Array(12)].map((_, i) => (
              <motion.circle
                key={i}
                cx={100 + i * 100}
                cy={200 + Math.sin(i) * 200}
                r="4"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.8 }}
                transition={{ duration: 0.5, delay: 2.5 + i * 0.1 }}
              />
            ))}
          </g>
          {/* Cognitive Level Indicators */}
          <g>
            {bloomsLevels.map((level, index) => (
              <motion.g key={level.name}>
                <motion.circle
                  cx={200 + index * 150}
                  cy={400}
                  r="20"
                  fill="url(#cognitiveGradient)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.3 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: 3 + index * 0.2,
                    type: "spring"
                  }}
                />
                <motion.circle
                  cx={200 + index * 150}
                  cy={400}
                  r="8"
                  fill="white"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 3.5 + index * 0.2,
                  }}
                />
                {/* Pulsing effect */}
                <motion.circle
                  cx={200 + index * 150}
                  cy={400}
                  r="20"
                  fill="none"
                  stroke="url(#cognitiveGradient)"
                  strokeWidth="2"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.8, 0, 0.8]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5
                  }}
                />
              </motion.g>
            ))}
          </g>
        </svg>
      </div>
      
      {/* Floating AI brain elements */}
      <motion.div 
        className="absolute top-20 right-24 w-64 h-64 bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20 rounded-full blur-3xl"
        animate={floatingAnimation}
      />
      <motion.div 
        className="absolute bottom-20 left-24 w-80 h-80 bg-gradient-to-tr from-blue-500/15 via-cyan-500/15 to-emerald-500/15 rounded-full blur-3xl"
        animate={brainFloatingAnimation}
      />
      
      {/* Floating brain icon */}
      <motion.div 
        className="absolute top-1/4 right-1/4 w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl"
        animate={floatingAnimation}
      >
        <Brain className="w-8 h-8 text-white" />
      </motion.div>
      
      {/* Main content */}
      <motion.div 
        className="w-full px-4 sm:px-6 lg:px-8 py-16 relative z-10"
        initial="hidden"
        animate={shouldAnimate ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="text-center space-y-12">
          
          {/* Brand tagline with typewriter effect */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: showTypewriter ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                MindForge
              </span>
            </div>
            <span className="text-purple-300 text-lg font-medium">
              {typewriterText}
              <motion.span
                className="inline-block w-0.5 h-6 bg-purple-400 ml-1"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </span>
          </motion.div>
          
          {/* Main headline */}
          <motion.div
            initial="hidden"
            animate={shouldAnimate ? "visible" : "hidden"}
            variants={titleVariants}
            className="space-y-6"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
                <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent bg-300% animate-gradient">
                  Track Cognitive
                </span>
                <span className="text-white/90">Development</span>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-4">
                <span className="text-white/90">with</span>
                <div className="relative">
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent bg-300% animate-gradient">
                    AI & Bloom's Taxonomy
                  </span>
                  <motion.div
                    className="absolute -top-3 -right-3"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                  >
                    <Sparkles className="h-8 w-8 text-yellow-400 drop-shadow-lg" />
                  </motion.div>
                </div>
              </div>
            </h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-300/90 max-w-4xl mx-auto leading-relaxed font-light"
              variants={subtitleVariants}
            >
              Watch your learners progress through all 6 cognitive levels with our
              <span className="text-purple-300 font-medium"> AI-powered tracking system</span>. 
              Real-time visualization of cognitive development, personalized learning paths, 
              and intelligent assessments that adapt to each learner's growth.
            </motion.p>
          </motion.div>

          {/* Bloom's Taxonomy Visualization */}
          <motion.div
            className="w-full max-w-6xl mx-auto mt-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <motion.h3 
              className="text-2xl font-bold text-center mb-8 text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                AI Tracks Your Cognitive Journey
              </span>
            </motion.h3>
            
            {/* Cognitive Levels Pyramid */}
            <div className="relative">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-emerald-500/20 blur-3xl rounded-full" />
              
              {/* Bloom's Levels */}
              <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
                {bloomsLevels.map((level, index) => (
                  <motion.div
                    key={level.name}
                    className="relative"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 + index * 0.1, duration: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 shadow-xl">
                      {/* Level Icon */}
                      <div className={`w-12 h-12 bg-gradient-to-r ${level.color} rounded-xl flex items-center justify-center mb-4`}>
                        <level.icon className="w-6 h-6 text-white" />
                      </div>
                      
                      {/* Level Name */}
                      <h4 className="text-lg font-bold text-white mb-2">{level.name}</h4>
                      
                      {/* Progress Bar */}
                      <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden mb-2">
                        <motion.div
                          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${level.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${level.progress}%` }}
                          transition={{ delay: 2 + index * 0.1, duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      
                      {/* Progress Percentage */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Mastery Level</span>
                        <motion.span 
                          className="text-sm font-bold text-purple-400"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 2.5 + index * 0.1 }}
                        >
                          {level.progress}%
                        </motion.span>
                      </div>
                      
                      {/* AI Tracking Indicator */}
                      <motion.div
                        className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 2.8 + index * 0.1, type: "spring" }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </motion.div>
                      
                      {/* Animated pulse effect */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${level.color} rounded-2xl opacity-0`}
                        animate={{ opacity: [0, 0.2, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.3,
                          repeatDelay: 3
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Connecting Lines Animation */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                {bloomsLevels.slice(0, -1).map((_, index) => (
                  <motion.path
                    key={index}
                    d={`M${150 + index * 200},150 Q${250 + index * 200},100 ${350 + index * 200},150`}
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ delay: 3 + index * 0.2, duration: 1 }}
                  />
                ))}
              </svg>
            </div>
            
            {/* Real-time tracking indicator */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 backdrop-blur-sm rounded-full border border-purple-500/30">
                <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-300 font-medium">
                  AI actively tracking cognitive progress in real-time
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats showcase */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="relative group text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 transition-all duration-300 overflow-hidden"
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
              >
                {/* Background gradient on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                
                {/* Icon */}
                <div className="relative mb-3">
                  <motion.div
                    className="w-12 h-12 mx-auto bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <stat.icon className="w-6 h-6 text-purple-400" />
                  </motion.div>
                </div>
                
                <div className="relative">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 font-medium mt-1">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* User type selection - Enhanced responsive */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            {userTypes.map((userType, index) => (
              <motion.div
                key={userType.title}
                className="w-full"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Link href={userType.link} className="block h-full">
                  <div className={`group relative p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 hover:border-${userType.color}-500/50 transition-all duration-300 shadow-xl hover:shadow-${userType.color}-500/20 h-full flex flex-col`}>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-${userType.color}-500 to-${userType.color}-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <userType.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{userType.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed flex-grow">{userType.description}</p>
                    <div className="flex items-center mt-3 sm:mt-4 text-purple-400 font-medium text-sm">
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* AI Features showcase - Enhanced responsive */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full mt-12 sm:mt-16"
            initial="hidden"
            animate={shouldAnimate ? "visible" : "hidden"}
            variants={containerVariants}
          >
            {aiFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                custom={feature.delay}
                variants={featureVariants}
                className="relative group"
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className={`absolute -inset-1 bg-gradient-to-r ${feature.gradient} rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-300`}></div>
                <div className="relative rounded-3xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl border border-slate-700/50 group-hover:border-purple-500/50 transition-all duration-300 h-full flex flex-col">
                  <div className={`absolute -top-4 sm:-top-6 left-4 sm:left-6 inline-block rounded-2xl bg-gradient-to-r ${feature.gradient} p-3 sm:p-4 shadow-xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  
                  <div className="pt-4 sm:pt-6 flex flex-col h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                        {feature.title}
                      </h3>
                      <span className="text-xs text-purple-400 font-medium bg-purple-500/10 px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">
                        {feature.stats}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-4 sm:mb-6 flex-grow">
                      {feature.description}
                    </p>
                    
                    <div className="flex items-center text-purple-400 font-medium mt-auto">
                      <Zap className="h-4 w-4 mr-2" />
                      <span className="text-sm">Powered by AI</span>
                    </div>
                  </div>
                  
                  <div className={`absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r ${feature.gradient} rounded-b-3xl opacity-0 group-hover:opacity-100 transition-all duration-300`}></div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Cognitive Journey Visualization */}
          <motion.div
            className="w-full max-w-4xl mx-auto mt-16 mb-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.8 }}
          >
            <motion.h3 
              className="text-2xl font-bold text-center mb-8 text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.7 }}
            >
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Your Personalized Learning Journey
              </span>
            </motion.h3>
            
            {/* Journey Path */}
            <div className="relative h-32">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 128">
                <defs>
                  <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="25%" stopColor="#6366F1" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="75%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
                
                {/* Main path */}
                <motion.path
                  d="M50,64 Q200,20 350,64 T650,64 L750,64"
                  stroke="url(#pathGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, delay: 3 }}
                />
                
                {/* Moving dot */}
                <motion.circle
                  r="8"
                  fill="#FBBF24"
                  initial={{ offsetDistance: "0%" }}
                  animate={{ offsetDistance: "100%" }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 3.5
                  }}
                  style={{
                    offsetPath: "path('M50,64 Q200,20 350,64 T650,64 L750,64')",
                  }}
                >
                  <animate
                    attributeName="r"
                    values="8;12;8"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </motion.circle>
              </svg>
              
              {/* Journey milestones */}
              <div className="absolute inset-0 flex justify-between items-center px-12">
                {["Start", "Assess", "Learn", "Practice", "Master"].map((stage, index) => (
                  <motion.div
                    key={stage}
                    className="relative"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 3.5 + index * 0.2, type: "spring" }}
                  >
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                      {stage}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* AI Features */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4 }}
            >
              <div className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Brain className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">AI analyzes your cognitive patterns</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Adapts content to your level</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Tracks improvement over time</p>
              </div>
            </motion.div>
          </motion.div>

          {/* CTA Section - Enhanced responsive */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-12 sm:mt-16 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.8 }}
          >
            <Link href="/auth/register" className="group w-full sm:w-auto">
              <Button 
                size="lg" 
                className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 border-0 overflow-hidden bg-300% animate-gradient w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center justify-center text-base sm:text-lg">
                  Begin Cognitive Tracking
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </Button>
            </Link>
            
            <Link href="/features" className="group w-full sm:w-auto">
              <Button 
                size="lg" 
                variant="outline"
                className="font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl border-2 border-purple-400/50 text-purple-300 hover:bg-purple-900/30 hover:border-purple-400 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-purple-500/20 w-full sm:w-auto"
              >
                <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-base sm:text-lg">See How It Works</span>
              </Button>
            </Link>
          </motion.div>

          {/* Enterprise trust indicators */}
          <motion.div
            className="flex flex-wrap justify-center items-center gap-8 mt-16 opacity-60"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ delay: 2.5, duration: 0.8 }}
          >
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <span className="text-gray-300 font-medium">Bloom's Taxonomy</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <span className="text-gray-300 font-medium">Secure Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-400" />
              <span className="text-gray-300 font-medium">Real-Time Tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-400" />
              <span className="text-gray-300 font-medium">Research-Backed</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 300% 300%;
          animation: gradient 4s ease infinite;
        }
        .bg-300\\% {
          background-size: 300% 300%;
        }
      `}</style>
    </div>
  );
}