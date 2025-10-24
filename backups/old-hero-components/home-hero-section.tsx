"use client"

import { motion, useAnimationControls } from "framer-motion";
import { 
  ArrowRight, 
  Users, 
  Pencil, 
  Share2, 
  BarChart3,
  Sparkles,
  Play,
  Star,
  CheckCircle,
  BookOpen,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const features = [
  {
    icon: Pencil,
    title: "Design Your Own Courses",
    description: "Create personalized learning paths with our intuitive course builder",
    gradient: "from-purple-500 to-pink-500",
    stats: "500+ Templates"
  },
  {
    icon: Share2,
    title: "Share Your Resources",
    description: "Connect with a global community of learners and educators",
    gradient: "from-blue-500 to-cyan-500",
    stats: "50K+ Resources"
  },
  {
    icon: BarChart3,
    title: "Track Progress with AI",
    description: "Advanced analytics to monitor your learning journey and achievements",
    gradient: "from-green-500 to-emerald-500",
    stats: "Real-time Insights"
  },
];

const testimonials = [
  { name: "Sarah Chen", role: "Student", text: "Transformed my learning experience!" },
  { name: "Mike Johnson", role: "Educator", text: "Best platform for collaborative learning." },
  { name: "Emma Davis", role: "Professional", text: "Achieved my goals faster than ever." }
];

// Enhanced animation variants with proper delays
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3, // Wait for header to settle
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
      staggerChildren: 0.2
    }
  }
};

const wordVariants = {
  hidden: { opacity: 0, y: 20, rotateX: -90 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.6,
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
      delay: 0.5,
    }
  }
};

const buttonContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.8
    }
  }
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
    }
  }
};

const featureContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 1.2
    }
  }
};

const featureVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.8, rotateY: -15 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateY: 0,
    transition: {
      duration: 0.6
    }
  }
};

const testimonialVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      delay: 1.5 + index * 0.1,
    }
  })
};

// Floating animations with different patterns
const floatingAnimation1 = {
  y: [0, -20, 0],
  rotate: [0, 180, 360],
  scale: [1, 1.2, 1],
  transition: {
    duration: 6,
    repeat: Infinity
  }
};

const floatingAnimation2 = {
  y: [0, -15, 0],
  x: [0, 10, 0],
  rotate: [0, -180, -360],
  transition: {
    duration: 8,
    repeat: Infinity,
    delay: 1
  }
};

const floatingAnimation3 = {
  y: [0, -25, 0],
  x: [0, -15, 0],
  scale: [1, 0.8, 1],
  transition: {
    duration: 7,
    repeat: Infinity,
    delay: 2
  }
};

// Typewriter effect hook
const useTypewriter = (text: string, speed: number = 100) => {
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

export default function HomeHeroSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [isHeaderReady, setIsHeaderReady] = useState(false);
  const typewriterText = useTypewriter("Transform Your Learning Journey", 80);

  // Wait for header to be ready (DOM mounted + small delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHeaderReady(true);
    }, 200); // Reduced from 500ms to 200ms for faster loading
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInView && isHeaderReady) {
      const timer = setTimeout(() => setShowTypewriter(true), 800); // Reduced from 1000ms
      return () => clearTimeout(timer);
    }
  }, [isInView, isHeaderReady]);

  const shouldAnimate = isInView && isHeaderReady;

  return (
    <div 
      ref={sectionRef} 
      className="relative w-full overflow-hidden min-h-screen flex items-center justify-center"
      style={{ paddingTop: '80px' }} // Account for fixed header
    >
      {/* Enhanced background with multiple layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900"></div>
      
      {/* Animated background orbs - Responsive sizes */}
      <motion.div 
        className="absolute top-10 sm:top-20 right-4 sm:right-8 md:right-24 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
        animate={floatingAnimation1}
      />
      <motion.div 
        className="absolute bottom-10 sm:bottom-20 left-4 sm:left-8 md:left-24 w-40 sm:w-60 md:w-80 h-40 sm:h-60 md:h-80 bg-gradient-to-tr from-blue-500/20 via-cyan-500/20 to-teal-500/20 rounded-full blur-3xl"
        animate={floatingAnimation2}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 sm:w-60 md:w-72 h-48 sm:h-60 md:h-72 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 rounded-full blur-3xl"
        animate={floatingAnimation3}
      />
      
      {/* Enhanced animated particles - Responsive positioning */}
      <motion.div 
        className="absolute top-1/4 right-1/4 sm:right-1/3 w-3 sm:w-4 h-3 sm:h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full shadow-lg"
        animate={floatingAnimation1}
      />
      <motion.div 
        className="absolute top-2/3 left-1/5 sm:left-1/4 w-2 sm:w-3 h-2 sm:h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-lg"
        animate={floatingAnimation2}
      />
      <motion.div 
        className="absolute top-1/2 right-1/5 sm:right-1/4 w-4 sm:w-5 h-4 sm:h-5 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full shadow-lg"
        animate={floatingAnimation3}
      />
      <motion.div 
        className="absolute top-1/3 left-1/6 sm:left-1/5 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg"
        animate={{
          ...floatingAnimation1,
          transition: { ...floatingAnimation1.transition, delay: 0.5 }
        }}
      />

      {/* Main content container - Full width with proper constraints */}
      <motion.div 
        className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 md:py-12 lg:py-16 relative z-10"
        initial="hidden"
        animate={shouldAnimate ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 md:space-y-12">
          
          {/* Enhanced header with typewriter effect */}
          <div className="relative text-center w-full">
            <motion.div 
              className="absolute -top-8 sm:-top-12 md:-top-16 -left-8 sm:-left-12 md:-left-16 w-16 sm:w-20 md:w-32 h-16 sm:h-20 md:h-32"
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.8, duration: 1 }}
            >
              <div className="w-full h-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-500 rounded-full opacity-30 blur-2xl animate-pulse"></div>
            </motion.div>
            
            {/* Typewriter subtitle */}
            <motion.div
              className="mb-3 sm:mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: showTypewriter ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-purple-300 text-base sm:text-lg md:text-xl font-medium">
                {typewriterText}
                <motion.span
                  className="inline-block w-0.5 h-4 sm:h-5 md:h-6 bg-purple-400 ml-1"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </span>
            </motion.div>
            
            <motion.div
              initial="hidden"
              animate={shouldAnimate ? "visible" : "hidden"}
              variants={titleVariants}
            >
              <motion.h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight px-2"
                variants={titleVariants}
              >
                <motion.div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 md:gap-4" variants={titleVariants}>
                  <motion.div className="inline-block relative" variants={wordVariants}>
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-300% animate-gradient">
                      Learn
                    </span>
                    <motion.span 
                      className="absolute -top-2 sm:-top-3 md:-top-4 -right-2 sm:-right-3 md:-right-4"
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: 1.5, duration: 0.5 }}
                    >
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-400 drop-shadow-lg" />
                    </motion.span>
                  </motion.div>
                  
                  <motion.span className="text-white/90" variants={wordVariants}>Together,</motion.span>
                  
                  <motion.div className="inline-block relative" variants={wordVariants}>
                    <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent bg-300% animate-gradient">
                      Grow
                    </span>
                    <motion.span 
                      className="absolute -top-2 sm:-top-3 md:-top-4 -right-2 sm:-right-3 md:-right-4"
                      initial={{ opacity: 0, scale: 0, rotate: 180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: 1.8, duration: 0.5 }}
                    >
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-emerald-400 drop-shadow-lg" />
                    </motion.span>
                  </motion.div>
                  
                  <motion.span className="text-white/90" variants={wordVariants}>Together</motion.span>
                </motion.div>
              </motion.h1>
            </motion.div>
          </div>

          <motion.p 
            className="text-lg sm:text-xl md:text-2xl text-gray-300/90 mb-6 sm:mb-8 max-w-xs sm:max-w-2xl md:max-w-3xl mx-auto text-center leading-relaxed font-light px-4"
            initial="hidden"
            animate={shouldAnimate ? "visible" : "hidden"}
            variants={subtitleVariants}
          >
            Join our collaborative learning ecosystem and connect with{" "}
            <span className="text-purple-300 font-medium">passionate learners</span> worldwide.
            Share knowledge, exchange ideas, and achieve your academic goals together.
          </motion.p>

          {/* Social proof - Responsive layout */}
          <motion.div
            className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 px-4"
            initial="hidden"
            animate={shouldAnimate ? "visible" : "hidden"}
            variants={featureContainerVariants}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                custom={index}
                variants={testimonialVariants}
                className="flex items-center space-x-1 sm:space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-2 sm:px-3 md:px-4 py-1 sm:py-2 border border-white/10 text-xs sm:text-sm"
              >
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-2 h-2 sm:w-3 sm:h-3 fill-current" />
                  ))}
                </div>
                <span className="text-gray-300 hidden sm:inline">&quot;{testimonial.text}&quot;</span>
                <span className="text-gray-300 sm:hidden">&quot;Great!&quot;</span>
                <span className="text-gray-400 text-xs hidden md:inline">- {testimonial.name}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced CTA buttons - Responsive layout */}
          <motion.div
            initial="hidden"
            animate={shouldAnimate ? "visible" : "hidden"}
            variants={buttonContainerVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full mb-12 sm:mb-16 px-4"
          >
            <motion.div variants={buttonVariants} className="w-full sm:w-auto">
              <Link href="/auth/register" className="group relative block w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 border-0 overflow-hidden bg-300% animate-gradient w-full sm:w-auto"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 flex items-center justify-center text-base sm:text-lg">
                    Start Learning Free
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  />
                </Button>
              </Link>
            </motion.div>
            
            <motion.div variants={buttonVariants} className="w-full sm:w-auto">
              <Link href="/groups" className="group block w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl border-2 border-purple-400/50 text-purple-300 hover:bg-purple-900/30 hover:border-purple-400 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-purple-500/20 w-full sm:w-auto"
                >
                  <span className="flex items-center justify-center text-base sm:text-lg">
                    <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Watch Demo
                  </span>
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Enhanced features grid - Fully responsive */}
          <motion.div
            initial="hidden"
            animate={shouldAnimate ? "visible" : "hidden"}
            variants={featureContainerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-7xl px-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={featureVariants}
                className="relative group"
                whileHover={{ 
                  y: -10,
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative rounded-3xl bg-gradient-to-br from-slate-800/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl border border-slate-700/50 group-hover:border-purple-500/50 transition-all duration-300">
                  <div className={`absolute -top-4 sm:-top-6 left-4 sm:left-6 inline-block rounded-2xl bg-gradient-to-r ${feature.gradient} p-3 sm:p-4 shadow-xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                    <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  
                  <div className="pt-4 sm:pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                        {feature.title}
                      </h3>
                      <span className="text-xs text-purple-400 font-medium bg-purple-500/10 px-2 py-1 rounded-full self-start sm:self-auto">
                        {feature.stats}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    
                    <div className="flex items-center text-purple-400 font-medium">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="text-xs sm:text-sm">Get Started Today</span>
                    </div>
                  </div>
                  
                  <div className={`absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r ${feature.gradient} rounded-b-3xl opacity-0 group-hover:opacity-100 transition-all duration-300`}></div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Additional trust indicators - Responsive layout */}
          <motion.div
            className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 mt-12 sm:mt-16 opacity-60 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ delay: 2, duration: 0.8 }}
          >
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              <span className="text-gray-300 font-medium text-sm sm:text-base">50,000+ Active Learners</span>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              <span className="text-gray-300 font-medium text-sm sm:text-base">10,000+ Courses Created</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
              <span className="text-gray-300 font-medium text-sm sm:text-base">4.9/5 Average Rating</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Custom CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 300% 300%;
          animation: gradient 3s ease infinite;
        }
        .bg-300\\% {
          background-size: 300% 300%;
        }
      `}</style>
    </div>
  );
}
