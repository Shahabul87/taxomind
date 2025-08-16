"use client"

import { motion, useInView } from "framer-motion";
import { 
  Brain,
  BarChart3,
  Target,
  Zap,
  Users,
  Shield,
  Cpu,
  TrendingUp,
  BookOpen,
  Award,
  Settings,
  Globe,
  Clock,
  PieChart,
  ArrowRight,
  Check,
  CheckCircle,
  Sparkles,
  Building2,
  GraduationCap,
  Lightbulb,
  Database,
  Lock,
  Wifi,
  MessageSquare,
  Video,
  FileText,
  Download,
  Search,
  Bell,
  Calendar,
  Layers,
  CloudUpload,
  BarChart4,
  Eye,
  Puzzle,
  Rocket,
  Heart,
  Play,
  ChevronRight,
  Progress
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FeaturesShowcaseSection from "@/app/(homepage)/features-showcase-section";

// Enhanced feature categories - concise & visual
const featureCategories = {
  "ai-learning": {
    title: "AI-Powered Learning",
    description: "Smart AI that adapts to you",
    icon: Brain,
    gradient: "from-purple-500 to-indigo-500",
    features: [
      {
        icon: Brain,
        title: "AI Tutor",
        description: "24/7 personalized guidance that knows your learning style",
        benefits: ["Auto-adapts difficulty", "Instant help", "Learns your patterns"],
        metric: { value: "98%", label: "Accuracy", progress: 98 }
      },
      {
        icon: Target,
        title: "Smart Assessment",
        description: "Dynamic questions that adapt in real-time",
        benefits: ["Perfect difficulty", "Skill mapping", "Instant feedback"],
        metric: { value: "85%", label: "Score Boost", progress: 85 }
      },
      {
        icon: Lightbulb,
        title: "Content Curation",
        description: "AI finds the perfect materials for your goals",
        benefits: ["Personalized paths", "Gap filling", "Optimal sequence"],
        metric: { value: "3x", label: "Faster Learning", progress: 75 }
      }
    ]
  },
  "analytics": {
    title: "Smart Analytics",
    description: "Real-time insights for optimal learning",
    icon: BarChart3,
    gradient: "from-blue-500 to-cyan-500",
    features: [
      {
        icon: TrendingUp,
        title: "Performance Prediction",
        description: "AI predicts outcomes and suggests improvements",
        benefits: ["Early alerts", "Success scoring", "Risk prevention"],
        metric: { value: "90%", label: "Prediction Accuracy", progress: 90 }
      },
      {
        icon: Eye,
        title: "Learning Analytics",
        description: "Live insights into engagement and progress",
        benefits: ["Pattern analysis", "Engagement tracking", "Progress visualization"],
        metric: { value: "Real-time", label: "Data Updates", progress: 100 }
      },
      {
        icon: Clock,
        title: "Velocity Tracking",
        description: "Optimize learning speed and retention",
        benefits: ["Speed optimization", "Retention analysis", "Efficiency metrics"],
        metric: { value: "40%", label: "Better Retention", progress: 40 }
      }
    ]
  },
  "platform": {
    title: "Platform Tools",
    description: "Modern learning & collaboration",
    icon: Settings,
    gradient: "from-emerald-500 to-teal-500",
    features: [
      {
        icon: Video,
        title: "Interactive Video",
        description: "AI-enhanced videos with smart interactions",
        benefits: ["Interactive elements", "Adaptive speed", "Embedded quizzes"],
        metric: { value: "70%", label: "Higher Engagement", progress: 70 }
      },
      {
        icon: MessageSquare,
        title: "Collaboration",
        description: "Virtual study groups and peer learning",
        benefits: ["Real-time collaboration", "Study groups", "Discussion forums"],
        metric: { value: "5x", label: "More Interactions", progress: 80 }
      },
      {
        icon: Calendar,
        title: "Smart Scheduling",
        description: "AI optimizes your learning schedule",
        benefits: ["Optimal timing", "Workload balance", "Deadline management"],
        metric: { value: "60%", label: "Better Completion", progress: 60 }
      }
    ]
  },
  "enterprise": {
    title: "Enterprise Ready",
    description: "Scalable & secure for organizations",
    icon: Building2,
    gradient: "from-orange-500 to-red-500",
    features: [
      {
        icon: Shield,
        title: "Enterprise Security",
        description: "Bank-grade security with full compliance",
        benefits: ["SOC 2 certified", "GDPR ready", "Advanced encryption"],
        metric: { value: "99.9%", label: "Uptime SLA", progress: 99 }
      },
      {
        icon: Users,
        title: "User Management",
        description: "Advanced roles and permissions system",
        benefits: ["Role-based access", "Bulk operations", "Org hierarchy"],
        metric: { value: "100K+", label: "User Support", progress: 95 }
      },
      {
        icon: Globe,
        title: "Global Scale",
        description: "Cloud infrastructure that scales worldwide",
        benefits: ["Auto-scaling", "Global CDN", "Multi-region"],
        metric: { value: "Global", label: "Availability", progress: 100 }
      }
    ]
  }
};

// Visual stats with progress indicators
const platformStats = [
  { icon: Target, value: "500K+", label: "AI Assessments Generated", progress: 85, color: "purple" },
  { icon: TrendingUp, value: "95%", label: "Learning Improvement", progress: 95, color: "blue" },
  { icon: Clock, value: "24/7", label: "AI Tutor Availability", progress: 100, color: "emerald" },
  { icon: Shield, value: "99.9%", label: "Uptime SLA", progress: 99, color: "orange" },
  { icon: Users, value: "1M+", label: "Active Learners", progress: 78, color: "purple" },
  { icon: Globe, value: "150+", label: "Countries", progress: 60, color: "blue" }
];

// Progress bar component
const ProgressBar = ({ progress, color }: { progress: number; color: string }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 500);
    return () => clearTimeout(timer);
  }, [progress]);

  const colorClasses = {
    purple: "from-purple-500 to-indigo-500",
    blue: "from-blue-500 to-cyan-500", 
    emerald: "from-emerald-500 to-teal-500",
    orange: "from-orange-500 to-red-500"
  };

  return (
    <div className="w-full bg-slate-700/30 rounded-full h-1.5 mt-3 overflow-hidden">
      <motion.div
        className={`h-full bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${animatedProgress}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const featureVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.25, 0, 1] }
  }
};

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState("ai-learning");
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  const currentCategory = featureCategories[activeCategory as keyof typeof featureCategories];

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 bg-[url('/circuit-pattern.svg')] bg-center opacity-5"></div>
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-full blur-3xl"></div>

      {/* Hero Section */}
      <motion.div
        ref={heroRef}
        className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate={heroInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center space-x-2 bg-indigo-500/10 rounded-full px-6 py-2 border border-indigo-500/20 mb-8"
            variants={featureVariants}
          >
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-300 font-medium">AI-Powered Platform</span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            variants={featureVariants}
          >
            <span className="text-white">Powerful Features for</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Intelligent Learning
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-16"
            variants={featureVariants}
          >
            AI-powered tools that adapt to your learning style, track progress in real-time, 
            and accelerate your educational journey.
          </motion.p>

          {/* Enhanced Stats Grid */}
          <motion.div
            ref={statsRef}
            className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16"
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
            variants={containerVariants}
          >
            {platformStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={featureVariants}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/30 hover:border-indigo-500/30 transition-all duration-300 group"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color === 'purple' ? 'from-purple-500 to-indigo-500' : stat.color === 'blue' ? 'from-blue-500 to-cyan-500' : stat.color === 'emerald' ? 'from-emerald-500 to-teal-500' : 'from-orange-500 to-red-500'} rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 font-medium mb-3">
                  {stat.label}
                </div>
                <ProgressBar progress={stat.progress} color={stat.color} />
              </motion.div>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
            variants={featureVariants}
          >
            <motion.a
              href="/auth/register"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 border-0"
              >
                <span className="flex items-center text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </span>
              </Button>
            </motion.a>
            
            <motion.a
              href="/features"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="font-semibold py-4 px-8 rounded-2xl border-2 border-indigo-400/50 text-indigo-300 hover:bg-indigo-900/30 hover:border-indigo-400 backdrop-blur-sm transition-all duration-300"
              >
                <span className="flex items-center text-lg">
                  <BookOpen className="mr-2 w-5 h-5" />
                  Explore Features
                </span>
              </Button>
            </motion.a>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Features Section */}
      <motion.div
        ref={featuresRef}
        className="relative py-24 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate={featuresInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="max-w-6xl mx-auto">
          {/* Feature category tabs */}
          <motion.div
            className="flex flex-col md:flex-row justify-center mb-12 space-y-4 md:space-y-0 md:space-x-4"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {Object.entries(featureCategories).map(([key, category]) => (
              <motion.button
                key={key}
                className={`relative px-8 py-4 rounded-2xl transition-all duration-300 border-2 ${
                  activeCategory === key
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-600 hover:border-indigo-400 bg-slate-800/50"
                }`}
                onClick={() => setActiveCategory(key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r ${category.gradient}`}>
                    <category.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">{category.title}</div>
                    <div className="text-sm text-gray-400 hidden md:block">{category.description}</div>
                  </div>
                </div>
                
                {activeCategory === key && (
                  <motion.div
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${category.gradient} rounded-b-2xl`}
                    layoutId="activeTab"
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>

          {/* Feature details */}
          <motion.div
            key={activeCategory}
            className="max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentCategory.features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="group relative"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                >
                  <div className={`absolute -inset-1 bg-gradient-to-r ${currentCategory.gradient} rounded-3xl blur opacity-0 group-hover:opacity-25 transition duration-300`}></div>
                  
                  <div className="relative rounded-3xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-8 shadow-2xl border border-slate-700/50 group-hover:border-indigo-500/30 transition-all duration-300 h-full">
                    {/* Feature icon */}
                    <div className={`w-16 h-16 bg-gradient-to-r ${currentCategory.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Feature content */}
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-indigo-300 transition-colors">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-300 leading-relaxed mb-6">
                      {feature.description}
                    </p>

                    {/* Benefits list */}
                    <div className="space-y-3 mb-6">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <motion.div
                          key={benefitIndex}
                          className="flex items-center text-sm text-gray-400"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + benefitIndex * 0.05 }}
                        >
                          <CheckCircle className="w-4 h-4 text-indigo-400 mr-3 flex-shrink-0" />
                          <span>{benefit}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Metric with progress */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                          {feature.metric.value}
                        </div>
                        <div className="text-xs text-gray-500">{feature.metric.label}</div>
                      </div>
                      <div className="w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-700"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <motion.path
                            className="text-indigo-400"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={`${feature.metric.progress}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            initial={{ strokeDasharray: "0, 100" }}
                            animate={{ strokeDasharray: `${feature.metric.progress}, 100` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Hover effect accent */}
                    <div className={`absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r ${currentCategory.gradient} rounded-b-3xl opacity-0 group-hover:opacity-100 transition-all duration-300`}></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Enhanced CTA section */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Transform Your Learning Experience?
              </h3>
              <p className="text-lg text-gray-300 mb-8">
                Join thousands of learners and educators who are already experiencing 
                the power of AI-driven education.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <motion.a
                  href="/auth/register"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 border-0"
                  >
                    <span className="flex items-center text-lg">
                      Start Free Trial
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </span>
                  </Button>
                </motion.a>
                
                <motion.a
                  href="/contact"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="font-semibold py-4 px-8 rounded-2xl border-2 border-indigo-400/50 text-indigo-300 hover:bg-indigo-900/30 hover:border-indigo-400 backdrop-blur-sm transition-all duration-300"
                  >
                    <span className="flex items-center text-lg">
                      <MessageSquare className="mr-2 w-5 h-5" />
                      Talk to Expert
                    </span>
                  </Button>
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Add the FeaturesShowcaseSection from homepage */}
      <FeaturesShowcaseSection />
    </div>
  );
}