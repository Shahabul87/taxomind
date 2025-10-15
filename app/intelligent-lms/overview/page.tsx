"use client";

import { motion } from "framer-motion";
import { 
  Brain, 
  Shield, 
  Zap, 
  Activity, 
  Award, 
  Users, 
  Target, 
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  BarChart3,
  Globe,
  Layers,
  Cpu,
  GitBranch,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

const features = [
  {
    icon: Brain,
    title: "SAM AI Assistant",
    description: "Revolutionary AI teaching and learning companion that adapts to every user's needs",
    highlights: [
      "Contextual intelligence across 100+ page types",
      "Real-time teaching assistance",
      "Personalized learning recommendations",
      "Multi-modal content generation"
    ],
    link: "/intelligent-lms/sam-ai-assistant",
    color: "from-purple-500 to-indigo-500"
  },
  {
    icon: Shield,
    title: "12+ International Standards",
    description: "The only LMS aligned with major global educational frameworks",
    highlights: [
      "Bloom's Taxonomy integration",
      "Quality Matters compliance",
      "UNESCO Education 2030 alignment",
      "ISO 21001:2018 standards"
    ],
    link: "/intelligent-lms/evaluation-standards",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Zap,
    title: "Adaptive Learning Engine",
    description: "Personalized learning paths that evolve with each student",
    highlights: [
      "Real-time difficulty adjustment",
      "Learning style adaptation",
      "Predictive performance analytics",
      "Intelligent content recommendations"
    ],
    link: "/intelligent-lms/adaptive-learning",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Activity,
    title: "Course Intelligence",
    description: "AI-powered course creation and optimization tools",
    highlights: [
      "Automated course structure generation",
      "Content depth analysis",
      "Market positioning insights",
      "Quality score optimization"
    ],
    link: "/intelligent-lms/course-intelligence",
    color: "from-cyan-500 to-blue-500"
  }
];

const comparisons = [
  {
    feature: "AI Integration",
    traditional: "Basic chatbots or no AI",
    taxomind: "Full AI assistant with contextual intelligence"
  },
  {
    feature: "Standards Compliance",
    traditional: "Limited or no standards",
    taxomind: "12+ international educational standards"
  },
  {
    feature: "Content Creation",
    traditional: "Manual creation only",
    taxomind: "AI-powered generation and optimization"
  },
  {
    feature: "Learning Paths",
    traditional: "Fixed, one-size-fits-all",
    taxomind: "Dynamic, personalized adaptation"
  },
  {
    feature: "Analytics",
    traditional: "Basic reporting",
    taxomind: "Predictive analytics with AI insights"
  },
  {
    feature: "Course Evaluation",
    traditional: "Simple metrics",
    taxomind: "Multi-dimensional analysis with Bloom's"
  }
];

const stats = [
  { value: "85%", label: "Learning Retention Improvement" },
  { value: "3x", label: "Faster Course Creation" },
  { value: "92%", label: "Student Satisfaction Rate" },
  { value: "40%", label: "Reduced Teaching Workload" }
];

export default function IntelligentLMSOverview() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 -mt-14 sm:-mt-16 pt-14 sm:pt-16">
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 rounded-2xl backdrop-blur-sm border border-purple-300/40 dark:border-purple-500/30">
                <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              The World&apos;s Most Intelligent LMS
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Taxomind isn&apos;t just another learning platform. It&apos;s the first LMS built from the ground up 
              with AI intelligence, international standards compliance, and adaptive learning at its core.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#comparison">
                <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:border-slate-400 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-500">
                  See How We Compare
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              What Makes Taxomind Unique
            </h2>
            <p className="text-xl text-slate-500 dark:text-gray-400">
              Four revolutionary pillars that set us apart from every other LMS
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 h-full shadow-sm dark:shadow-none">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} bg-opacity-20`}>
                      <feature.icon className="w-6 h-6 text-slate-900 dark:text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-gray-400 mb-4">
                        {feature.description}
                      </p>
                      <ul className="space-y-2 mb-6">
                        {feature.highlights.map((highlight) => (
                          <li key={highlight} className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700 dark:text-gray-300 text-sm">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href={feature.link}>
                        <Button variant="outline" className="w-full group">
                          Learn More
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-20 px-4 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Taxomind vs Traditional LMS
            </h2>
            <p className="text-xl text-slate-500 dark:text-gray-400">
              See why educators and learners are switching to intelligent learning
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
          >
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-left text-slate-600 dark:text-gray-400 font-medium">Feature</th>
                  <th className="px-6 py-4 text-left text-slate-600 dark:text-gray-400 font-medium">Traditional LMS</th>
                  <th className="px-6 py-4 text-left text-slate-900 dark:text-white font-medium bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-600/20 dark:to-indigo-600/20">
                    Taxomind
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((item, index) => (
                  <tr key={item.feature} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-6 py-4 text-slate-700 dark:text-gray-300 font-medium">{item.feature}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-gray-500">
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-red-500 dark:text-red-400" />
                        {item.traditional}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-600/10 dark:to-indigo-600/10">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        {item.taxomind}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Built with Cutting-Edge Technology
            </h2>
            <p className="text-xl text-slate-500 dark:text-gray-400">
              Enterprise-grade infrastructure meets innovative AI
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
              <Cpu className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">AI Foundation</h3>
              <p className="text-slate-600 dark:text-gray-400">
                Powered by Claude 3.5 Sonnet and GPT-4 for unmatched intelligence
              </p>
            </Card>
            
            <Card className="p-6 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
              <GitBranch className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Modern Architecture</h3>
              <p className="text-slate-600 dark:text-gray-400">
                Next.js 15, TypeScript, and Prisma for blazing-fast performance
              </p>
            </Card>
            
            <Card className="p-6 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
              <Globe className="w-8 h-8 text-green-600 dark:text-green-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Global Scale</h3>
              <p className="text-slate-600 dark:text-gray-400">
                Cloud-native infrastructure supporting millions of learners worldwide
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-600/10 to-indigo-600/10 dark:from-purple-600/20 dark:to-indigo-600/20 backdrop-blur-sm border border-purple-300/40 dark:border-purple-500/30 rounded-2xl p-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Ready to Experience Intelligent Learning?
            </h2>
            <p className="text-xl text-slate-600 dark:text-gray-300 mb-8">
              Join thousands of educators and learners already using the future of education
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500">
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:border-slate-400 dark:border-gray-500 dark:text-gray-200">
                  Request a Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
