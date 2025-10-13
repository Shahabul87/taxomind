"use client"

import { motion, useInView } from "framer-motion";
import { 
  Brain, 
  BarChart3,
  Target,
  Users,
  Shield,
  Zap,
  BookOpen,
  Award,
  Cpu,
  TrendingUp,
  Eye,
  Lightbulb,
  Clock,
  Globe,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const featureCategories = [
  {
    id: "ai-learning",
    title: "AI-Powered Learning",
    description: "Intelligent algorithms that adapt to every learner",
    icon: Brain,
    gradient: "from-purple-500 to-indigo-500",
    features: [
      {
        icon: Target,
        title: "Adaptive Question Generation",
        description: "AI creates personalized questions based on your learning progress and knowledge gaps.",
        benefits: ["Difficulty auto-adjustment", "Knowledge gap targeting", "Learning style adaptation"]
      },
      {
        icon: Lightbulb,
        title: "Intelligent Content Curation",
        description: "Smart content recommendations tailored to individual learning preferences and goals.",
        benefits: ["Personalized recommendations", "Learning path optimization", "Content relevance scoring"]
      },
      {
        icon: Brain,
        title: "Context-Aware Tutoring",
        description: "AI tutor that understands learning context and provides targeted assistance.",
        benefits: ["24/7 availability", "Instant help", "Contextual explanations"]
      }
    ]
  },
  {
    id: "analytics",
    title: "Advanced Analytics",
    description: "Real-time insights for optimal learning outcomes",
    icon: BarChart3,
    gradient: "from-blue-500 to-cyan-500",
    features: [
      {
        icon: TrendingUp,
        title: "Predictive Performance Modeling",
        description: "AI-driven predictions for learning outcomes and success probability.",
        benefits: ["Early intervention alerts", "Success probability scoring", "Performance forecasting"]
      },
      {
        icon: Eye,
        title: "Real-time Learning Analytics",
        description: "Live insights into student engagement, progress, and learning patterns.",
        benefits: ["Live engagement tracking", "Progress visualization", "Learning pattern analysis"]
      },
      {
        icon: Clock,
        title: "Learning Velocity Tracking",
        description: "Measure and optimize learning speed and knowledge retention rates.",
        benefits: ["Speed optimization", "Retention analysis", "Efficiency metrics"]
      }
    ]
  },
  {
    id: "enterprise",
    title: "Enterprise Features",
    description: "Scalable solutions for organizations",
    icon: Building2,
    gradient: "from-emerald-500 to-teal-500",
    features: [
      {
        icon: Shield,
        title: "Enterprise Security",
        description: "Bank-grade security with GDPR compliance and comprehensive audit trails.",
        benefits: ["GDPR compliance", "SOC 2 certification", "Advanced encryption"]
      },
      {
        icon: Users,
        title: "Role-Based Access Control",
        description: "Granular permissions for students, teachers, and administrators.",
        benefits: ["Granular permissions", "Multi-tenant support", "Custom role creation"]
      },
      {
        icon: Globe,
        title: "Scalable Infrastructure",
        description: "Cloud-native architecture that scales to millions of concurrent users.",
        benefits: ["Auto-scaling", "Global CDN", "99.9% uptime SLA"]
      }
    ]
  }
];

const stats = [
  { value: "500K+", label: "AI Assessments Generated", icon: Target },
  { value: "95%", label: "Learning Improvement", icon: TrendingUp },
  { value: "24/7", label: "AI Tutor Availability", icon: Clock },
  { value: "Enterprise", label: "Security Standards", icon: Shield }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
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

const tabVariants = {
  inactive: { opacity: 0.6, scale: 0.95 },
  active: { opacity: 1, scale: 1 }
};

import { Building2 } from "lucide-react";

export default function FeaturesShowcaseSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [activeCategory, setActiveCategory] = useState("ai-learning");

  const activeFeatures = featureCategories.find(cat => cat.id === activeCategory);

  return (
    <div ref={sectionRef} className="relative py-24 overflow-hidden bg-white dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-900">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/circuit-pattern.svg')] bg-center opacity-5"></div>
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center space-x-2 bg-indigo-500/10 rounded-full px-6 py-2 border border-indigo-500/20 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-300 font-medium">Platform Features</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-slate-900 dark:text-white">Powerful Features for</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Intelligent Learning
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover the comprehensive suite of AI-powered tools designed to revolutionize 
            how you learn, teach, and manage educational experiences.
          </p>
        </motion.div>

        {/* Stats showcase */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 max-w-4xl mx-auto"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={featureVariants}
              className="text-center p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 group bg-white/70 border-slate-200 dark:bg-gradient-to-br dark:from-slate-800/50 dark:to-slate-900/50 dark:border-slate-700/30 hover:border-indigo-500/30"
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature category tabs */}
        <motion.div
          className="flex flex-col md:flex-row justify-center mb-12 space-y-4 md:space-y-0 md:space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {featureCategories.map((category) => (
            <motion.button
              key={category.id}
              className={`relative px-8 py-4 rounded-2xl transition-all duration-300 border-2 ${
                activeCategory === category.id
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "dark:border-slate-600 dark:hover:border-indigo-400 dark:bg-slate-800/50 border-slate-200 hover:border-indigo-300 bg-white/70"
              }`}
              onClick={() => setActiveCategory(category.id)}
              variants={tabVariants}
              animate={activeCategory === category.id ? "active" : "inactive"}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r ${category.gradient}`}>
                  <category.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-white">{category.title}</div>
                  <div className="text-sm text-slate-600 dark:text-gray-400 hidden md:block">{category.description}</div>
                </div>
              </div>
              
              {activeCategory === category.id && (
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
            {activeFeatures?.features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group relative"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className={`absolute -inset-1 bg-gradient-to-r ${activeFeatures.gradient} rounded-3xl blur opacity-0 group-hover:opacity-25 transition duration-300`}></div>
                
                <div className="relative rounded-3xl p-8 shadow-2xl border transition-all duration-300 h-full bg-white border-slate-200 dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 dark:border-slate-700/50 group-hover:border-indigo-500/30 backdrop-blur-xl">
                  {/* Feature icon */}
                  <div className={`w-16 h-16 bg-gradient-to-r ${activeFeatures.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Feature content */}
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-indigo-300 transition-colors">
                    {feature.title}
                  </h3>
                 
                  <p className="text-slate-600 dark:text-gray-300 leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  {/* Benefits list */}
                  <div className="space-y-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <motion.div
                        key={benefitIndex}
                        className="flex items-center text-sm text-slate-500 dark:text-gray-400"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + benefitIndex * 0.05 }}
                      >
                        <CheckCircle className="w-4 h-4 text-indigo-400 mr-3 flex-shrink-0" />
                        <span>{benefit}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Hover effect accent */}
                  <div className={`absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r ${activeFeatures.gradient} rounded-b-3xl opacity-0 group-hover:opacity-100 transition-all duration-300`}></div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA section */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              Ready to Transform Your Learning Experience?
            </h3>
            <p className="text-lg text-slate-600 dark:text-gray-300 mb-8">
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
                href="/features"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="font-semibold py-4 px-8 rounded-2xl border-2 backdrop-blur-sm transition-all duration-300 text-indigo-700 border-indigo-300 hover:bg-indigo-50 hover:border-indigo-400 dark:text-indigo-300 dark:border-indigo-400/50 dark:hover:bg-indigo-900/30 dark:hover:border-indigo-400"
                >
                  <span className="flex items-center text-lg">
                    <BookOpen className="mr-2 w-5 h-5" />
                    View All Features
                  </span>
                </Button>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
