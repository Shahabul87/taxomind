"use client"

import { motion, useInView } from "framer-motion";
import { 
  GraduationCap,
  Users,
  Building2,
  Brain,
  BarChart3,
  Target,
  Zap,
  BookOpen,
  Award,
  Shield,
  Globe,
  Clock,
  TrendingUp,
  ArrowRight,
  Check,
  Sparkles,
  Lightbulb,
  Database,
  Settings,
  MessageSquare,
  Video,
  FileText,
  Download,
  ChevronRight,
  Play,
  Rocket,
  Heart,
  Star,
  Eye,
  Layers,
  Puzzle,
  CloudUpload,
  Search,
  Calendar,
  Bell,
  Lock,
  Wifi,
  PieChart,
  BarChart4,
  Cpu
} from "lucide-react";
import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Solution categories with detailed information
const solutionCategories = {
  students: {
    title: "For Students",
    subtitle: "Personalized Learning Journeys",
    description: "Transform your learning experience with AI-powered tools that adapt to your unique learning style, pace, and goals.",
    icon: GraduationCap,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-500",
    heroImage: "/student-hero.svg",
    stats: [
      { value: "3x", label: "Faster Learning", description: "Average speed improvement" },
      { value: "95%", label: "Retention Rate", description: "Knowledge retention" },
      { value: "24/7", label: "AI Support", description: "Always available" },
      { value: "98%", label: "Success Rate", description: "Goal achievement" }
    ],
    features: [
      {
        icon: Brain,
        title: "AI Personal Tutor",
        description: "Your dedicated AI learning companion that understands your strengths, weaknesses, and learning preferences",
        benefits: [
          "Personalized explanations tailored to your learning style",
          "Instant answers to questions 24/7",
          "Adaptive difficulty that grows with you",
          "Multi-language support for global learners"
        ],
        demo: "Try asking our AI tutor any question!"
      },
      {
        icon: Target,
        title: "Adaptive Assessments",
        description: "Smart tests that adjust difficulty in real-time based on your performance",
        benefits: [
          "Questions that match your current skill level",
          "Immediate feedback with detailed explanations",
          "Progress tracking across all subjects",
          "Certification preparation and practice"
        ],
        demo: "Experience adaptive testing"
      },
      {
        icon: TrendingUp,
        title: "Progress Analytics",
        description: "Comprehensive insights into your learning journey with actionable recommendations",
        benefits: [
          "Visual progress tracking dashboards",
          "Skill gap identification and recommendations",
          "Study time optimization suggestions",
          "Goal setting and achievement tracking"
        ],
        demo: "View your learning analytics"
      },
      {
        icon: Calendar,
        title: "Smart Study Planner",
        description: "AI-powered scheduling that optimizes your study sessions for maximum effectiveness",
        benefits: [
          "Optimal timing based on your energy levels",
          "Deadline management and reminders",
          "Workload balancing across subjects",
          "Break recommendations for better retention"
        ],
        demo: "Create your study schedule"
      }
    ],
    testimonials: [
      {
        name: "Sarah Chen",
        role: "Medical Student",
        university: "Johns Hopkins",
        quote: "TaxoMind's AI tutor helped me master complex anatomy concepts 3x faster than traditional methods.",
        improvement: "85% grade improvement"
      },
      {
        name: "Alex Rodriguez",
        role: "Computer Science Major",
        university: "MIT",
        quote: "The adaptive assessments identified my knowledge gaps and helped me focus my study time efficiently.",
        improvement: "40% time savings"
      }
    ]
  },
  teachers: {
    title: "For Teachers",
    subtitle: "AI-Powered Teaching Excellence",
    description: "Enhance your teaching effectiveness with intelligent content creation, student analytics, and automated assessment tools.",
    icon: Users,
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
    heroImage: "/teacher-hero.svg",
    stats: [
      { value: "80%", label: "Time Saved", description: "On content creation" },
      { value: "60%", label: "Better Engagement", description: "Student participation" },
      { value: "90%", label: "Assessment Accuracy", description: "AI-generated tests" },
      { value: "95%", label: "Teacher Satisfaction", description: "Platform rating" }
    ],
    features: [
      {
        icon: FileText,
        title: "AI Content Creator",
        description: "Generate high-quality educational content, quizzes, and assessments with AI assistance",
        benefits: [
          "Curriculum-aligned content generation",
          "Multiple content formats (text, video, interactive)",
          "Automatic quiz and test creation",
          "Content optimization for different learning styles"
        ],
        demo: "Generate course content now"
      },
      {
        icon: BarChart3,
        title: "Student Analytics Dashboard",
        description: "Deep insights into student performance, engagement, and learning patterns",
        benefits: [
          "Real-time student progress tracking",
          "Early intervention alerts for struggling students",
          "Class performance comparisons",
          "Personalized teaching recommendations"
        ],
        demo: "Explore analytics dashboard"
      },
      {
        icon: Target,
        title: "Intelligent Assessment Builder",
        description: "Create sophisticated assessments that adapt to individual student needs",
        benefits: [
          "Bloom's taxonomy-aligned question generation",
          "Automatic grading with detailed feedback",
          "Plagiarism detection and prevention",
          "Multiple assessment formats support"
        ],
        demo: "Build an assessment"
      },
      {
        icon: MessageSquare,
        title: "Classroom Management Suite",
        description: "Streamline classroom operations with AI-powered tools and automation",
        benefits: [
          "Automated attendance tracking",
          "Parent-teacher communication tools",
          "Assignment distribution and collection",
          "Grade book management with analytics"
        ],
        demo: "Manage your classroom"
      }
    ],
    testimonials: [
      {
        name: "Dr. Maria Rodriguez",
        role: "Mathematics Professor",
        university: "Stanford University",
        quote: "TaxoMind's AI content creator reduced my lesson preparation time by 80% while improving student engagement.",
        improvement: "80% time reduction"
      },
      {
        name: "Prof. James Wilson",
        role: "Physics Department Head",
        university: "UC Berkeley",
        quote: "The student analytics helped me identify at-risk students early and provide targeted support.",
        improvement: "50% fewer dropouts"
      }
    ]
  },
  enterprise: {
    title: "For Enterprise",
    subtitle: "Scalable Learning Solutions",
    description: "Transform your organization's learning and development with enterprise-grade AI-powered education platform.",
    icon: Building2,
    color: "purple",
    gradient: "from-purple-500 to-indigo-500",
    heroImage: "/enterprise-hero.svg",
    stats: [
      { value: "10K+", label: "Users Supported", description: "Per organization" },
      { value: "99.9%", label: "Uptime", description: "Service reliability" },
      { value: "60%", label: "Training ROI", description: "Average improvement" },
      { value: "24/7", label: "Enterprise Support", description: "Dedicated assistance" }
    ],
    features: [
      {
        icon: Shield,
        title: "Enterprise Security",
        description: "Bank-grade security with comprehensive compliance and data protection",
        benefits: [
          "SOC 2 Type II compliance",
          "GDPR and CCPA compliant",
          "Single Sign-On (SSO) integration",
          "Advanced audit trails and monitoring"
        ],
        demo: "Security compliance overview"
      },
      {
        icon: Database,
        title: "Advanced Integrations",
        description: "Seamless integration with your existing enterprise systems and workflows",
        benefits: [
          "LMS and HRIS system integration",
          "Custom API development",
          "Bulk user management and provisioning",
          "Legacy system data migration"
        ],
        demo: "Integration capabilities"
      },
      {
        icon: BarChart4,
        title: "Enterprise Analytics",
        description: "Organization-wide insights, ROI tracking, and comprehensive learning metrics",
        benefits: [
          "Learning ROI calculation and tracking",
          "Skills gap analysis across teams",
          "Custom reporting and dashboards",
          "Predictive analytics for workforce planning"
        ],
        demo: "Enterprise dashboard"
      },
      {
        icon: Globe,
        title: "Global Deployment",
        description: "Multi-region deployment with localization and cultural adaptation",
        benefits: [
          "Multi-language content support",
          "Regional data residency compliance",
          "Cultural learning style adaptation",
          "Global support team coverage"
        ],
        demo: "Global deployment options"
      }
    ],
    testimonials: [
      {
        name: "David Kim",
        role: "Chief Learning Officer",
        company: "Fortune 500 Technology Company",
        quote: "TaxoMind transformed our corporate training, improving employee engagement by 70% and reducing training costs by 40%.",
        improvement: "70% engagement increase"
      },
      {
        name: "Lisa Zhang",
        role: "VP of Human Resources",
        company: "Global Consulting Firm",
        quote: "The enterprise analytics gave us unprecedented insights into our workforce capabilities and training effectiveness.",
        improvement: "60% ROI improvement"
      }
    ]
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.25, 0, 1] }
  }
};

export default function SolutionsPage() {
  const [activeSolution, setActiveSolution] = useState("students");
  const heroRef = useRef(null);
  const solutionsRef = useRef(null);
  const featuresRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const solutionsInView = useInView(solutionsRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });

  const currentSolution = solutionCategories[activeSolution as keyof typeof solutionCategories];

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/solution-bg.svg')] bg-center opacity-5"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>

      {/* Hero Section */}
      <motion.div
        ref={heroRef}
        className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate={heroInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center space-x-2 bg-blue-500/10 rounded-full px-6 py-2 border border-blue-500/20 mb-8"
            variants={itemVariants}
          >
            <Rocket className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 font-medium">Tailored Solutions</span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8"
            variants={itemVariants}
          >
            <span className="text-white">Solutions Built for</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Every Learning Journey
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8 sm:mb-12 px-2"
            variants={itemVariants}
          >
            Whether you're a student seeking personalized learning, an educator enhancing teaching effectiveness, 
            or an organization transforming workforce development, TaxoMind has the perfect solution for you.
          </motion.p>

          {/* Solution selector buttons */}
          <motion.div
            className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 mb-12 sm:mb-16"
            variants={itemVariants}
          >
            {Object.entries(solutionCategories).map(([key, solution]) => (
              <button
                key={key}
                onClick={() => setActiveSolution(key)}
                className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                  activeSolution === key ? 'scale-105' : 'hover:scale-102'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${solution.gradient} opacity-${activeSolution === key ? '100' : '0'} group-hover:opacity-75 transition-opacity duration-300`}></div>
                
                <div className={`relative px-4 sm:px-6 md:px-8 py-4 sm:py-6 rounded-2xl border-2 transition-all duration-300 ${
                  activeSolution === key 
                    ? 'border-transparent bg-white/10 backdrop-blur-sm' 
                    : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50'
                }`}>
                  <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      activeSolution === key 
                        ? 'bg-white/20' 
                        : `bg-gradient-to-r ${solution.gradient}`
                    }`}>
                      <solution.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg sm:text-xl font-bold text-white">{solution.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-300">{solution.subtitle}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Active Solution Section */}
      <motion.div
        ref={solutionsRef}
        className="relative py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
        key={activeSolution}
        initial="hidden"
        animate={solutionsInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          {/* Solution hero */}
          <motion.div
            className="text-center mb-12 sm:mb-16 lg:mb-20"
            variants={itemVariants}
          >
            <div className={`inline-flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 bg-gradient-to-r ${currentSolution.gradient} rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8`}>
              <currentSolution.icon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{currentSolution.title}</h2>
                <p className="text-lg sm:text-xl text-white/90">{currentSolution.subtitle}</p>
              </div>
            </div>
            
            <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-2">
              {currentSolution.description}
            </p>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 lg:mb-20 max-w-5xl mx-auto"
            variants={containerVariants}
          >
            {currentSolution.stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="text-center p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/30 hover:border-blue-500/30 transition-all duration-300 group"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${currentSolution.gradient} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-white mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-400">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Features grid */}
          <motion.div
            ref={featuresRef}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16 lg:mb-20"
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={containerVariants}
          >
            {currentSolution.features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative"
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className={`absolute -inset-1 bg-gradient-to-r ${currentSolution.gradient} rounded-3xl blur opacity-0 group-hover:opacity-25 transition duration-300`}></div>
                
                <div className="relative rounded-3xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl border border-slate-700/50 group-hover:border-blue-500/30 transition-all duration-300 h-full">
                  {/* Feature icon */}
                  <div className={`inline-block rounded-2xl bg-gradient-to-r ${currentSolution.gradient} p-4 shadow-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  {/* Feature content */}
                  <h4 className="text-xl sm:text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">
                    {feature.title}
                  </h4>
                  
                  <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  
                  {/* Benefits list */}
                  <div className="mb-6">
                    <h5 className="text-lg font-semibold text-white mb-4">Key Benefits:</h5>
                    <div className="space-y-3">
                      {feature.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Demo button */}
                  <button className={`w-full py-3 px-6 rounded-xl bg-gradient-to-r ${currentSolution.gradient} text-white font-semibold hover:shadow-lg transition-all duration-300 group-hover:scale-105`}>
                    {feature.demo}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonials */}
          <motion.div
            className="mb-12 sm:mb-16 lg:mb-20"
            variants={itemVariants}
          >
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-white mb-8 sm:mb-12">
              Success Stories
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {currentSolution.testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  className="group relative"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className={`absolute -inset-1 bg-gradient-to-r ${currentSolution.gradient} rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-300`}></div>
                  
                  <div className="relative rounded-3xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl border border-slate-700/50 group-hover:border-blue-500/30 transition-all duration-300">
                    {/* Quote */}
                    <div className="mb-6">
                      <div className="flex items-center mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-300 text-lg leading-relaxed italic">
                        "{testimonial.quote}"
                      </p>
                    </div>
                    
                    {/* Author info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{testimonial.name}</div>
                        <div className="text-sm text-gray-400">{testimonial.role}</div>
                        <div className="text-sm text-blue-400">
                          {(testimonial as any).university || (testimonial as any).company}
                        </div>
                      </div>
                      
                      <div className={`text-right p-3 rounded-xl bg-gradient-to-r ${currentSolution.gradient}`}>
                        <div className="text-white font-bold text-sm">
                          {testimonial.improvement}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA section */}
          <motion.div
            className="text-center"
            variants={itemVariants}
          >
            <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 px-2">
                Join thousands of learners, educators, and organizations who have transformed 
                their educational journey with TaxoMind's intelligent solutions.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <Link href="/auth/register" className="group w-full sm:w-auto">
                  <Button size="lg" className={`w-full sm:w-auto bg-gradient-to-r ${currentSolution.gradient} hover:shadow-lg text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-xl transition-all duration-300`}>
                    <span className="flex items-center text-base sm:text-lg">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
                
                <Link href="/contact" className="group w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-blue-400/50 text-blue-300 hover:bg-blue-900/30 hover:border-blue-400 font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl backdrop-blur-sm transition-all duration-300">
                    <MessageSquare className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-base sm:text-lg">Contact Sales</span>
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