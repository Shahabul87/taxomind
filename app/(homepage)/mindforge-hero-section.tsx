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
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const aiFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Learning",
    description: "Adaptive algorithms that personalize your learning journey in real-time",
    gradient: "from-purple-500 to-indigo-500",
    stats: "98% Accuracy",
    delay: 0.1
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Advanced insights and predictive analytics for optimal learning outcomes",
    gradient: "from-blue-500 to-cyan-500",
    stats: "Live Insights",
    delay: 0.2
  },
  {
    icon: Target,
    title: "Adaptive Assessment",
    description: "Intelligent question generation that adjusts to your skill level dynamically",
    gradient: "from-emerald-500 to-teal-500",
    stats: "Smart Testing",
    delay: 0.3
  },
];

const userTypes = [
  {
    icon: GraduationCap,
    title: "Students",
    description: "Personalized learning paths with AI tutoring",
    link: "/auth/register?role=student",
    color: "purple"
  },
  {
    icon: Users,
    title: "Teachers",
    description: "AI-assisted content creation and analytics",
    link: "/auth/register?role=teacher", 
    color: "blue"
  },
  {
    icon: Building2,
    title: "Enterprise",
    description: "Scalable solutions for organizations",
    link: "/enterprise",
    color: "emerald"
  }
];

const stats = [
  { value: "500K+", label: "AI-Powered Assessments" },
  { value: "95%", label: "Learning Improvement" },
  { value: "24/7", label: "Intelligent Support" },
  { value: "Enterprise", label: "Security Ready" }
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
                  Intelligent
                </span>
                <span className="text-white/90">Learning</span>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-4">
                <span className="text-white/90">Powered by</span>
                <div className="relative">
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent bg-300% animate-gradient">
                    AI
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
              Transform your organization's learning potential with AI-powered adaptive education. 
              <span className="text-purple-300 font-medium"> Personalized learning paths</span>, 
              real-time analytics, and intelligent assessment systems that evolve with your learners.
            </motion.p>
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
                className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
              >
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 font-medium">
                  {stat.label}
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
                  Start Your AI Learning Journey
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
                <span className="text-base sm:text-lg">Explore Features</span>
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
              <Shield className="h-5 w-5 text-emerald-400" />
              <span className="text-gray-300 font-medium">Enterprise Security</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-400" />
              <span className="text-gray-300 font-medium">ISO Certified</span>
            </div>
            <div className="flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-blue-400" />
              <span className="text-gray-300 font-medium">AI-First Platform</span>
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