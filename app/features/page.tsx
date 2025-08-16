"use client"

import { motion, useInView } from "framer-motion";
import { 
  BookOpen,
  Lightbulb,
  Target,
  Users,
  TrendingUp,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Building2,
  GraduationCap,
  Brain,
  Network,
  Zap,
  Globe,
  BarChart3,
  Shield,
  Layers,
  MessageSquare,
  Video,
  FileText,
  Search,
  Heart,
  Award,
  Rocket,
  Settings,
  Calendar,
  Clock,
  Database,
  Star,
  Play,
  PlusCircle,
  Cpu,
  Lock,
  Workflow,
  BookMarked,
  Share,
  Code,
  LineChart,
  Bot,
  ChevronRight,
  ExternalLink,
  Briefcase
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Professional enterprise-focused feature categories
const enterpriseFeatures = {
  "content-studio": {
    title: "Intelligent Content Studio",
    subtitle: "AI-Powered Course Creation & Resource Curation",
    description: "Transform your expertise into engaging courses while intelligently collecting and organizing learning resources from across the web",
    icon: BookOpen,
    gradient: "from-blue-600 to-indigo-600",
    color: "blue",
    badge: "Most Popular",
    features: [
      {
        icon: Video,
        title: "Multi-Media Course Builder",
        description: "Create professional courses with videos, interactive content, quizzes, and rich multimedia support. Drag-and-drop interface with real-time preview.",
        businessValue: "Reduce content creation time by 70% with AI assistance",
        useCases: ["Corporate Training Programs", "Professional Certification Courses", "Educational Institution Curricula"],
        metrics: { value: "10x", label: "Faster Creation", roi: "350% ROI" },
        demo: "View Course Builder Demo",
        techSpecs: ["HD Video Support", "Interactive Assessments", "Real-time Collaboration"]
      },
      {
        icon: Globe,
        title: "Smart Resource Aggregation",
        description: "AI-powered system to automatically collect, categorize, and curate content from blogs, articles, videos, and documents across the web.",
        businessValue: "Save 40+ hours weekly on content research and curation",
        useCases: ["Industry Research", "Best Practices Collection", "Competitor Analysis"],
        metrics: { value: "40hrs", label: "Weekly Time Saved", roi: "500% ROI" },
        demo: "See Resource Collection",
        techSpecs: ["Web Scraping API", "Auto-categorization", "Duplicate Detection"]
      },
      {
        icon: Brain,
        title: "AI Content Intelligence",
        description: "Advanced AI analyzes and enhances your content for optimal learning outcomes, suggesting improvements and generating complementary materials.",
        businessValue: "Improve content effectiveness by 85% with AI insights",
        useCases: ["Content Optimization", "Learning Path Design", "Knowledge Gap Analysis"],
        metrics: { value: "85%", label: "Content Effectiveness", roi: "400% ROI" },
        demo: "Try AI Assistant",
        techSpecs: ["NLP Analysis", "Content Recommendations", "Learning Analytics"]
      }
    ]
  },
  "learning-journeys": {
    title: "Adaptive Learning Pathways",
    subtitle: "AI-Driven Personalized Study Plans & Progress Tracking",
    description: "Create intelligent study plans that adapt to learning style, pace, and goals while providing detailed progress analytics",
    icon: Target,
    gradient: "from-emerald-600 to-teal-600",
    color: "emerald",
    badge: "AI Enhanced",
    features: [
      {
        icon: Brain,
        title: "Intelligent Study Plan Generator",
        description: "AI creates personalized learning pathways based on skill assessments, goals, and learning preferences. Adapts in real-time based on performance.",
        businessValue: "Increase course completion rates by 75% with personalization",
        useCases: ["Employee Skill Development", "Professional Certification Prep", "Academic Course Planning"],
        metrics: { value: "75%", label: "Higher Completion", roi: "350% ROI" },
        demo: "Generate Study Plan",
        techSpecs: ["Machine Learning Algorithms", "Progress Tracking", "Goal-based Optimization"]
      },
      {
        icon: Calendar,
        title: "Flexible Learning Scheduler",
        description: "Smart scheduling system that adapts to busy professional schedules with calendar integration and intelligent reminders.",
        businessValue: "Improve learning consistency by 90% with smart scheduling",
        useCases: ["Executive Education", "Team Training Programs", "Continuous Learning"],
        metrics: { value: "90%", label: "Consistency Improvement", roi: "280% ROI" },
        demo: "Try Smart Scheduler",
        techSpecs: ["Calendar Integration", "Reminder System", "Time Optimization"]
      },
      {
        icon: LineChart,
        title: "Advanced Progress Analytics",
        description: "Comprehensive analytics dashboard showing learning velocity, knowledge retention, and predictive success indicators.",
        businessValue: "Identify and prevent learning gaps before they impact performance",
        useCases: ["Performance Monitoring", "Team Management", "Skills Assessment"],
        metrics: { value: "90%", label: "Success Prediction", roi: "420% ROI" },
        demo: "View Analytics Dashboard",
        techSpecs: ["Predictive Analytics", "Real-time Tracking", "Performance Insights"]
      }
    ]
  },
  "resource-hub": {
    title: "Resource Intelligence Hub",
    subtitle: "Smart Content Curation & Collection",
    description: "AI-powered system to collect, organize, and curate learning resources",
    icon: Search,
    gradient: "from-purple-600 to-pink-600",
    color: "purple",
    features: [
      {
        icon: Globe,
        title: "Universal Content Aggregation",
        description: "Collect and organize content from blogs, articles, videos, and documents",
        businessValue: "Save 40+ hours per week on content sourcing",
        useCases: ["Research Compilation", "Industry Updates", "Best Practices"],
        metrics: { value: "40hrs", label: "Time Saved Weekly", roi: "500% ROI" }
      },
      {
        icon: Lightbulb,
        title: "AI Content Curation",
        description: "Intelligent content recommendations based on learning objectives",
        businessValue: "Improve content relevance by 85%",
        useCases: ["Personalized Resources", "Skill-Based Content", "Industry Trends"],
        metrics: { value: "85%", label: "Relevance Score", roi: "375% ROI" }
      },
      {
        icon: Database,
        title: "Knowledge Base Management",
        description: "Centralized repository with smart tagging and search capabilities",
        businessValue: "Instant access to organizational knowledge",
        useCases: ["Corporate Wiki", "Best Practices", "Institutional Knowledge"],
        metrics: { value: "10x", label: "Faster Access", roi: "450% ROI" }
      }
    ]
  },
  "marketplace": {
    title: "Learning Marketplace & Community",
    subtitle: "Share Knowledge Freely or Monetize Your Expertise",
    description: "Build a thriving learning community where you can share knowledge freely to build reputation, or monetize premium content to generate revenue",
    icon: DollarSign,
    gradient: "from-orange-600 to-red-600",
    color: "orange",
    badge: "Revenue Generator",
    features: [
      {
        icon: Heart,
        title: "Free Knowledge Sharing Hub",
        description: "Share valuable content freely to build reputation, establish thought leadership, and grow your professional network within the learning community.",
        businessValue: "Build thought leadership and expand professional network by 500%",
        useCases: ["Thought Leadership", "Professional Branding", "Community Building", "Open Education"],
        metrics: { value: "5x", label: "Network Growth", roi: "Brand Authority" },
        demo: "Explore Free Content",
        techSpecs: ["Community Features", "Reputation System", "Social Sharing"]
      },
      {
        icon: DollarSign,
        title: "Premium Content Monetization",
        description: "Generate revenue by selling premium courses, exclusive study plans, and specialized resources with flexible pricing and subscription models.",
        businessValue: "Create sustainable revenue streams averaging $50k+ annually",
        useCases: ["Premium Courses", "Subscription Content", "Consulting Services", "Corporate Training"],
        metrics: { value: "$50k+", label: "Average Annual Revenue", roi: "Direct Income" },
        demo: "Start Selling Content",
        techSpecs: ["Payment Processing", "Subscription Management", "Revenue Analytics"]
      },
      {
        icon: BarChart3,
        title: "Creator Business Intelligence",
        description: "Comprehensive analytics showing content performance, audience insights, revenue optimization, and market trends to maximize your impact.",
        businessValue: "Optimize content strategy for 300% revenue growth",
        useCases: ["Content Strategy", "Market Analysis", "Revenue Optimization", "Audience Development"],
        metrics: { value: "300%", label: "Revenue Optimization", roi: "Business Growth" },
        demo: "View Creator Dashboard",
        techSpecs: ["Advanced Analytics", "Market Intelligence", "Performance Tracking"]
      }
    ]
  },
  "dual-experience": {
    title: "Dual-Role Intelligence",
    subtitle: "Seamless Teacher-Student Experience in One Platform",
    description: "Effortlessly switch between teaching and learning modes with intelligent context awareness and unified workflow management",
    icon: Users,
    gradient: "from-teal-600 to-cyan-600",
    color: "teal",
    badge: "Unique Feature",
    features: [
      {
        icon: GraduationCap,
        title: "Intelligent Role Switching",
        description: "Seamlessly transition between creator and learner modes with smart UI adaptation and context-aware features that adjust to your current role.",
        businessValue: "Reduce platform learning curve by 70% with unified experience",
        useCases: ["Corporate Trainers", "Subject Matter Experts", "Educational Consultants", "Team Leaders"],
        metrics: { value: "70%", label: "Reduced Complexity", roi: "Time Efficiency" },
        demo: "Try Role Switching",
        techSpecs: ["Context-Aware UI", "Smart Navigation", "Unified Dashboard"]
      },
      {
        icon: Workflow,
        title: "Cross-Role Learning Insights",
        description: "Gain unique perspectives by experiencing both sides of the learning process, improving your teaching through direct learning experience.",
        businessValue: "Improve teaching effectiveness by 90% through dual-perspective insights",
        useCases: ["Professional Development", "Teaching Improvement", "Content Quality Enhancement"],
        metrics: { value: "90%", label: "Teaching Effectiveness", roi: "Quality Improvement" },
        demo: "Explore Insights",
        techSpecs: ["Learning Analytics", "Teaching Metrics", "Performance Correlation"]
      },
      {
        icon: Network,
        title: "Dynamic Community Engagement",
        description: "Build deeper relationships by engaging as both mentor and learner, creating rich professional networks across industry domains.",
        businessValue: "Expand professional network by 300% through dual engagement",
        useCases: ["Professional Networking", "Mentorship Programs", "Peer Learning Communities"],
        metrics: { value: "300%", label: "Network Expansion", roi: "Career Growth" },
        demo: "Join Community",
        techSpecs: ["Social Learning", "Mentorship Matching", "Community Features"]
      }
    ]
  },
  "enterprise-ai": {
    title: "Enterprise AI & Security",
    subtitle: "Advanced Intelligence with Enterprise-Grade Security",
    description: "Comprehensive AI-powered analytics, predictive insights, and bank-grade security infrastructure designed for large-scale organizational learning",
    icon: Shield,
    gradient: "from-slate-600 to-gray-600",
    color: "slate",
    badge: "Enterprise Ready",
    features: [
      {
        icon: Brain,
        title: "Predictive Learning Intelligence",
        description: "Advanced AI algorithms analyze learning patterns, predict skill gaps, and recommend strategic learning investments before they impact business performance.",
        businessValue: "Prevent skill shortages and reduce training costs by 85%",
        useCases: ["Workforce Planning", "Strategic Learning", "Talent Development", "Skills Forecasting"],
        metrics: { value: "85%", label: "Gap Prediction Accuracy", roi: "Strategic Advantage" },
        demo: "View AI Dashboard",
        techSpecs: ["Machine Learning", "Predictive Analytics", "Strategic Intelligence"]
      },
      {
        icon: Lock,
        title: "Enterprise Security & Compliance",
        description: "Bank-grade security infrastructure with SOC 2 Type II, GDPR compliance, SSO integration, and comprehensive audit trails for enterprise peace of mind.",
        businessValue: "Ensure 100% compliance with enterprise security standards",
        useCases: ["Enterprise Security", "Regulatory Compliance", "Data Protection", "Risk Management"],
        metrics: { value: "99.9%", label: "Security Uptime", roi: "Risk Mitigation" },
        demo: "Security Overview",
        techSpecs: ["SOC 2 Type II", "GDPR Compliant", "SSO Integration", "Audit Trails"]
      },
      {
        icon: BarChart3,
        title: "Organizational Learning Analytics",
        description: "Comprehensive business intelligence platform providing real-time insights into learning effectiveness, ROI tracking, and organizational capability development.",
        businessValue: "Measure and optimize learning ROI with 250% improvement",
        useCases: ["ROI Measurement", "Performance Analytics", "Strategic Planning", "Investment Optimization"],
        metrics: { value: "250%", label: "Learning ROI", roi: "Measurable Impact" },
        demo: "Analytics Platform",
        techSpecs: ["Business Intelligence", "ROI Tracking", "Performance Metrics", "Strategic Insights"]
      }
    ]
  }
};

// Enhanced business-focused stats
const businessStats = [
  { icon: Users, value: "1M+", label: "Global Learners", sublabel: "Fortune 500 Companies", progress: 90, color: "blue" },
  { icon: Briefcase, value: "50K+", label: "Enterprise Users", sublabel: "Professional Organizations", progress: 85, color: "emerald" },
  { icon: DollarSign, value: "$100M+", label: "Creator Revenue", sublabel: "Generated This Year", progress: 88, color: "orange" },
  { icon: TrendingUp, value: "400%", label: "Learning ROI", sublabel: "Enterprise Average", progress: 95, color: "purple" },
  { icon: Clock, value: "60hrs", label: "Weekly Time Saved", sublabel: "Per Knowledge Worker", progress: 78, color: "teal" },
  { icon: Shield, value: "99.9%", label: "Security Uptime", sublabel: "Enterprise SLA", progress: 99, color: "slate" }
];

// Enhanced progress bar with business styling
const BusinessProgressBar = ({ progress, color }: { progress: number; color: string }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 500);
    return () => clearTimeout(timer);
  }, [progress]);

  const colorClasses = {
    blue: "from-blue-500 to-indigo-500",
    emerald: "from-emerald-500 to-teal-500",
    orange: "from-orange-500 to-red-500",
    purple: "from-purple-500 to-pink-500",
    teal: "from-teal-500 to-cyan-500",
    slate: "from-slate-500 to-gray-500"
  };

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700/30 rounded-full h-2 mt-2 overflow-hidden">
      <motion.div
        className={`h-full bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${animatedProgress}%` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
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
    scale: 1
  }
};

export default function ProfessionalFeaturesPage() {
  const [activeCategory, setActiveCategory] = useState("content-studio");
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  const currentCategory = enterpriseFeatures[activeCategory as keyof typeof enterpriseFeatures];

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-white overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 bg-[url('/circuit-pattern.svg')] bg-center opacity-5"></div>
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-full blur-3xl"></div>

      {/* Professional Hero Section */}
      <motion.div
        ref={heroRef}
        className="relative pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate={heroInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto text-center">
          {/* Enterprise Badge */}
          <motion.div
            className="inline-flex items-center space-x-2 bg-blue-500/10 rounded-full px-3 sm:px-6 py-2 border border-blue-500/20 mb-6 sm:mb-8"
            variants={featureVariants}
          >
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm sm:text-base text-blue-700 dark:text-blue-300 font-semibold">Enterprise-Grade Learning Platform</span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
            variants={featureVariants}
          >
            <span className="text-slate-900 dark:text-white block mb-2 sm:mb-0 sm:inline">Build Learning Ecosystems</span>
            <span className="hidden sm:inline"> </span>
            <span className="block sm:inline text-slate-900 dark:text-white">That</span>
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent block mt-2 sm:mt-0">
              Drive Real Business Results
            </span>
          </motion.h1>

          {/* Professional subtitle */}
          <motion.p
            className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed mb-12 sm:mb-16 px-4 sm:px-0"
            variants={featureVariants}
          >
            Create intelligent courses, curate resources from across the web, build personalized study plans, 
            and seamlessly switch between teaching and learning—all while monetizing your expertise or sharing knowledge freely.
          </motion.p>

          {/* Business Stats Grid */}
          <motion.div
            ref={statsRef}
            className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 max-w-7xl mx-auto mb-12 sm:mb-16"
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
            variants={containerVariants}
          >
            {businessStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={featureVariants}
                className="text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 group shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${stat.color === 'blue' ? 'from-blue-500 to-indigo-500' : stat.color === 'emerald' ? 'from-emerald-500 to-teal-500' : stat.color === 'orange' ? 'from-orange-500 to-red-500' : stat.color === 'purple' ? 'from-purple-500 to-pink-500' : stat.color === 'teal' ? 'from-teal-500 to-cyan-500' : 'from-slate-500 to-gray-500'} rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-white bg-clip-text text-transparent mb-1 sm:mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">
                  {stat.sublabel}
                </div>
                <BusinessProgressBar progress={stat.progress} color={stat.color} />
              </motion.div>
            ))}
          </motion.div>

          {/* Professional CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-4 sm:px-0"
            variants={featureVariants}
          >
            <motion.a
              href="/auth/register"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 border-0"
              >
                <span className="flex items-center justify-center text-base sm:text-lg">
                  Start Enterprise Trial
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </span>
              </Button>
            </motion.a>
            
            <motion.a
              href="/demo"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-blue-500 backdrop-blur-sm transition-all duration-300"
              >
                <span className="flex items-center justify-center text-base sm:text-lg">
                  <Play className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  Watch Demo
                </span>
              </Button>
            </motion.a>
          </motion.div>
        </div>
      </motion.div>

      {/* Professional Features Section */}
      <motion.div
        ref={featuresRef}
        className="relative py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/50 dark:bg-slate-900/50"
        initial="hidden"
        animate={featuresInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            className="text-center mb-12 sm:mb-16"
            variants={featureVariants}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              <span className="text-slate-900 dark:text-white">Enterprise-Grade</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Learning Solutions
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto px-4 sm:px-0">
              Comprehensive platform features designed for modern organizations and learning professionals
            </p>
          </motion.div>

          {/* Professional Category Navigation */}
          <motion.div
            className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-2 sm:px-0"
            variants={featureVariants}
          >
            {Object.entries(enterpriseFeatures).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`group relative px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 w-full sm:w-auto ${
                  activeCategory === key
                    ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg scale-105`
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3">
                  <category.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <div className="text-left">
                    <div className="flex flex-col sm:block">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-semibold">{category.title}</span>
                        {(category as any).badge && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            activeCategory === key 
                              ? 'bg-white/20 text-white' 
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}>
                            {(category as any).badge}
                          </span>
                        )}
                      </div>
                      <div className={`text-xs hidden sm:block ${activeCategory === key ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'}`}>
                        {category.subtitle}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>

          {/* Feature Details */}
          <motion.div
            key={activeCategory}
            className="max-w-7xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Category Header */}
            <div className="text-center mb-8 sm:mb-12">
              <div className={`inline-flex items-center space-x-3 sm:space-x-4 bg-gradient-to-r ${currentCategory.gradient} rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg mx-4 sm:mx-0`}>
                <currentCategory.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white flex-shrink-0" />
                <div className="text-left">
                  <h3 className="text-lg sm:text-2xl font-bold text-white">{currentCategory.title}</h3>
                  <p className="text-sm sm:text-base text-white/90 font-medium">{currentCategory.subtitle}</p>
                </div>
              </div>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto px-4 sm:px-0">
                {currentCategory.description}
              </p>
            </div>

            {/* Professional Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {currentCategory.features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="group relative"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div className={`absolute -inset-1 bg-gradient-to-r ${currentCategory.gradient} rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-300`}></div>
                  
                  <div className="relative rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl border border-slate-200/50 dark:border-slate-700/50 group-hover:border-blue-500/30 transition-all duration-300 h-full">
                    {/* Feature Icon & Metrics */}
                    <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 gap-4 sm:gap-0">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${currentCategory.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-white bg-clip-text text-transparent">
                          {feature.metrics.value}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{feature.metrics.label}</div>
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{feature.metrics.roi}</div>
                      </div>
                    </div>

                    {/* Feature Content */}
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h4>
                    
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {feature.description}
                    </p>

                    {/* Business Value */}
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                      <div className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Business Impact</div>
                      <div className="text-sm text-blue-700 dark:text-blue-200">{feature.businessValue}</div>
                    </div>

                    {/* Use Cases */}
                    <div className="space-y-2 mb-6">
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Enterprise Use Cases:</div>
                      {feature.useCases.map((useCase, i) => (
                        <div key={i} className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />
                          <span>{useCase}</span>
                        </div>
                      ))}
                    </div>

                    {/* Technical Specifications */}
                    {(feature as any).techSpecs && (
                      <div className="mb-4 sm:mb-6 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border">
                        <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                          <Cpu className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Technical Features
                        </div>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {(feature as any).techSpecs.map((spec: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Elements */}
                    <div className="pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                      <button className="flex items-center text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group">
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        {(feature as any).demo || "Learn More"}
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </button>
                      
                      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                        <Star className="w-3 h-3 mr-1 text-yellow-500" />
                        Enterprise Ready
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Professional CTA Section */}
          <motion.div
            className="text-center mt-12 sm:mt-16 lg:mt-20 px-4 sm:px-0"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <div className="max-w-5xl mx-auto p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border border-blue-200/50 dark:border-slate-700/50 shadow-xl">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full px-3 sm:px-4 py-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm sm:text-base text-emerald-700 dark:text-emerald-300 font-semibold">Trusted by Fortune 500 Companies</span>
                </div>
              </div>
              
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 text-center">
                Ready to Build Your Learning Ecosystem?
              </h3>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-6 sm:mb-8 max-w-3xl mx-auto text-center">
                Join industry leaders who are transforming their organizations with intelligent learning solutions. 
                Start creating, curating, and monetizing knowledge while building a thriving learning community.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="text-center p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">14-Day</div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Free Enterprise Trial</div>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">24/7</div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Enterprise Support</div>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">ROI</div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Guaranteed Results</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <motion.a
                  href="/auth/register"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 border-0"
                  >
                    <span className="flex items-center justify-center text-base sm:text-lg">
                      <Rocket className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                      Start Building Today
                    </span>
                  </Button>
                </motion.a>
                
                <motion.a
                  href="/contact"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-blue-500 backdrop-blur-sm transition-all duration-300"
                  >
                    <span className="flex items-center justify-center text-base sm:text-lg">
                      <MessageSquare className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                      Schedule Demo
                    </span>
                  </Button>
                </motion.a>
              </div>
              
              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  No credit card required • Enterprise security • 99.9% uptime SLA
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}