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
  ChevronRight
} from "lucide-react";
import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Feature categories with comprehensive features
const featureCategories = {
  "ai-learning": {
    title: "AI-Powered Learning",
    description: "Revolutionary artificial intelligence that adapts to every learner",
    icon: Brain,
    color: "purple",
    gradient: "from-purple-500 to-indigo-500",
    features: [
      {
        icon: Brain,
        title: "Adaptive AI Tutor",
        description: "24/7 personal AI assistant that understands your learning style and provides customized guidance",
        benefits: ["Personalized explanations", "Real-time doubt resolution", "Learning style adaptation"],
        stats: "98% accuracy in learning predictions"
      },
      {
        icon: Target,
        title: "Intelligent Assessment",
        description: "Dynamic question generation that adapts difficulty based on your performance in real-time",
        benefits: ["Adaptive difficulty scaling", "Comprehensive skill mapping", "Instant feedback"],
        stats: "85% improvement in test scores"
      },
      {
        icon: Lightbulb,
        title: "Smart Content Recommendations",
        description: "AI curates perfect learning materials based on your goals, pace, and knowledge gaps",
        benefits: ["Personalized content paths", "Gap analysis", "Optimal learning sequence"],
        stats: "3x faster concept mastery"
      },
      {
        icon: Puzzle,
        title: "Cognitive Load Optimization",
        description: "AI monitors your mental load and adjusts content complexity to maximize retention",
        benefits: ["Prevents cognitive overload", "Optimizes retention", "Maintains engagement"],
        stats: "40% better knowledge retention"
      }
    ]
  },
  "analytics": {
    title: "Advanced Analytics",
    description: "Deep insights into learning patterns and performance metrics",
    icon: BarChart3,
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
    features: [
      {
        icon: BarChart3,
        title: "Real-Time Learning Analytics",
        description: "Comprehensive dashboards showing learning progress, strengths, and improvement areas",
        benefits: ["Progress tracking", "Performance insights", "Goal monitoring"],
        stats: "Live data updates every second"
      },
      {
        icon: TrendingUp,
        title: "Predictive Performance Modeling",
        description: "AI predicts learning outcomes and suggests interventions to optimize success rates",
        benefits: ["Early intervention alerts", "Success probability scoring", "Risk assessment"],
        stats: "90% accuracy in outcome predictions"
      },
      {
        icon: Eye,
        title: "Learning Behavior Analysis",
        description: "Deep insights into study patterns, engagement levels, and learning velocity",
        benefits: ["Behavior pattern recognition", "Engagement optimization", "Study habit insights"],
        stats: "Identifies 15+ learning patterns"
      },
      {
        icon: PieChart,
        title: "Multi-Dimensional Reporting",
        description: "Comprehensive reports covering all aspects of learning journey and institutional performance",
        benefits: ["Custom report generation", "Data visualization", "Export capabilities"],
        stats: "50+ visualization types"
      }
    ]
  },
  "platform": {
    title: "Platform Features",
    description: "Comprehensive tools for modern learning and collaboration",
    icon: Settings,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-500",
    features: [
      {
        icon: Video,
        title: "Interactive Video Learning",
        description: "AI-enhanced video content with interactive elements, quizzes, and adaptive playback",
        benefits: ["Interactive elements", "Adaptive playback speed", "Embedded assessments"],
        stats: "70% higher engagement rates"
      },
      {
        icon: MessageSquare,
        title: "Collaborative Learning Spaces",
        description: "Virtual study groups, peer learning, and instructor-student communication tools",
        benefits: ["Real-time collaboration", "Peer learning", "Discussion forums"],
        stats: "5x more peer interactions"
      },
      {
        icon: FileText,
        title: "Smart Content Creation",
        description: "AI-assisted course creation tools with automated content generation and optimization",
        benefits: ["Automated content generation", "Template library", "Version control"],
        stats: "80% faster content creation"
      },
      {
        icon: Calendar,
        title: "Adaptive Scheduling",
        description: "AI-powered scheduling that optimizes learning sessions based on your availability and energy levels",
        benefits: ["Optimal timing suggestions", "Workload balancing", "Deadline management"],
        stats: "60% improvement in completion rates"
      }
    ]
  },
  "enterprise": {
    title: "Enterprise Solutions",
    description: "Scalable, secure solutions for organizations of all sizes",
    icon: Building2,
    color: "orange",
    gradient: "from-orange-500 to-red-500",
    features: [
      {
        icon: Shield,
        title: "Enterprise Security",
        description: "Bank-grade security with SSO, advanced user management, and compliance frameworks",
        benefits: ["SOC 2 compliance", "GDPR ready", "Advanced encryption"],
        stats: "99.9% uptime guarantee"
      },
      {
        icon: Users,
        title: "Advanced User Management",
        description: "Sophisticated role-based access control, bulk user operations, and organizational hierarchy",
        benefits: ["Role-based permissions", "Bulk operations", "Organizational structure"],
        stats: "Supports 100K+ users"
      },
      {
        icon: Database,
        title: "Advanced Integrations",
        description: "Seamless integration with LMS, HRIS, and other enterprise systems via robust APIs",
        benefits: ["REST APIs", "Webhook support", "Custom integrations"],
        stats: "200+ integration endpoints"
      },
      {
        icon: BarChart4,
        title: "Enterprise Analytics",
        description: "Organization-wide insights, ROI tracking, and comprehensive learning effectiveness metrics",
        benefits: ["ROI tracking", "Organizational insights", "Custom dashboards"],
        stats: "360° organizational view"
      }
    ]
  }
};

const platformStats = [
  { icon: Users, value: "1M+", label: "Active Learners", description: "Worldwide" },
  { icon: Building2, value: "500+", label: "Enterprise Clients", description: "Fortune 500" },
  { icon: Award, value: "98%", label: "Satisfaction Rate", description: "User Rating" },
  { icon: TrendingUp, value: "3x", label: "Learning Speed", description: "Average Improvement" },
  { icon: Clock, value: "24/7", label: "AI Support", description: "Always Available" },
  { icon: Globe, value: "150+", label: "Countries", description: "Global Reach" }
];

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
    <div className="relative min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/neural-bg.svg')] bg-center opacity-5"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>

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
            className="inline-flex items-center space-x-2 bg-purple-500/10 rounded-full px-6 py-2 border border-purple-500/20 mb-8"
            variants={featureVariants}
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-medium">AI-Powered Platform</span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8"
            variants={featureVariants}
          >
            <span className="text-white">Intelligent Features</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              That Adapt to You
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12"
            variants={featureVariants}
          >
            Discover how MindForge's cutting-edge AI technology transforms learning experiences 
            with personalized pathways, real-time analytics, and adaptive intelligence that 
            evolves with every interaction.
          </motion.p>

          {/* Stats grid */}
          <motion.div
            ref={statsRef}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto mb-16"
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
            variants={containerVariants}
          >
            {platformStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={featureVariants}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/30 hover:border-purple-500/30 transition-all duration-300 group"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-white mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-400">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
            variants={featureVariants}
          >
            <Link href="/auth/register" className="group">
              <Button size="lg" className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 border-0 overflow-hidden">
                <span className="relative z-10 flex items-center text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </Link>
            
            <Link href="/demo" className="group">
              <Button size="lg" variant="outline" className="font-semibold py-4 px-8 rounded-2xl border-2 border-purple-400/50 text-purple-300 hover:bg-purple-900/30 hover:border-purple-400 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-purple-500/20">
                <Play className="mr-2 h-5 w-5" />
                <span className="text-lg">Watch Demo</span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        ref={featuresRef}
        className="relative py-24 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate={featuresInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <motion.div
            className="text-center mb-16"
            variants={featureVariants}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">Explore Our</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Feature Categories
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Each category is designed to revolutionize different aspects of the learning experience
            </p>
          </motion.div>

          {/* Category tabs */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-16"
            variants={featureVariants}
          >
            {Object.entries(featureCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                  activeCategory === key
                    ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg scale-105`
                    : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-slate-700/50'
                }`}
              >
                <category.icon className="w-5 h-5" />
                <span>{category.title}</span>
              </button>
            ))}
          </motion.div>

          {/* Active category description */}
          <motion.div
            className="text-center mb-16"
            key={`${activeCategory}-description`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`inline-flex items-center space-x-3 bg-gradient-to-r ${currentCategory.gradient} rounded-2xl p-6 mb-6`}>
              <currentCategory.icon className="w-8 h-8 text-white" />
              <div className="text-left">
                <h3 className="text-2xl font-bold text-white">{currentCategory.title}</h3>
                <p className="text-white/90">{currentCategory.description}</p>
              </div>
            </div>
          </motion.div>

          {/* Features grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            key={`${activeCategory}-grid`}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {currentCategory.features.map((feature, index) => (
              <motion.div
                key={`${activeCategory}-${index}-${feature.title}`}
                variants={featureVariants}
                className="group relative"
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className={`absolute -inset-1 bg-gradient-to-r ${currentCategory.gradient} rounded-3xl blur opacity-0 group-hover:opacity-25 transition duration-300`}></div>
                
                <div className="relative rounded-3xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-8 shadow-2xl border border-slate-700/50 group-hover:border-purple-500/30 transition-all duration-300 h-full">
                  {/* Feature icon */}
                  <div className={`inline-block rounded-2xl bg-gradient-to-r ${currentCategory.gradient} p-4 shadow-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  {/* Feature content */}
                  <h4 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">
                    {feature.title}
                  </h4>
                  
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  
                  {/* Benefits list */}
                  <div className="mb-6">
                    <h5 className="text-lg font-semibold text-white mb-3">Key Benefits:</h5>
                    <div className="space-y-2">
                      {feature.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-gray-300">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className={`inline-block bg-gradient-to-r ${currentCategory.gradient} rounded-xl px-4 py-2`}>
                    <span className="text-white font-semibold text-sm">{feature.stats}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA section */}
          <motion.div
            className="text-center mt-20"
            variants={featureVariants}
          >
            <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 backdrop-blur-sm">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Learning?
              </h3>
              <p className="text-lg text-gray-300 mb-8">
                Join millions of learners who are already experiencing the future of education with MindForge's intelligent platform.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/auth/register" className="group">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300">
                    <span className="flex items-center text-lg">
                      Get Started Free
                      <Rocket className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    </span>
                  </Button>
                </Link>
                
                <Link href="/contact" className="group">
                  <Button size="lg" variant="outline" className="border-2 border-purple-400/50 text-purple-300 hover:bg-purple-900/30 hover:border-purple-400 font-semibold py-4 px-8 rounded-2xl backdrop-blur-sm transition-all duration-300">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    <span className="text-lg">Talk to Expert</span>
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}