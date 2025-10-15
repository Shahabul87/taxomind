"use client";

import { motion } from "framer-motion";
import { 
  Zap, 
  Brain, 
  Target, 
  BarChart3, 
  Users, 
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Activity,
  Lightbulb,
  TrendingUp,
  Settings,
  RefreshCw,
  GitBranch,
  Layers,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const adaptiveFeatures = [
  {
    title: "Real-Time Difficulty Adjustment",
    icon: Settings,
    description: "Content difficulty adapts based on student performance",
    details: [
      "Dynamic question difficulty",
      "Adaptive pacing",
      "Personalized challenges",
      "Performance-based progression"
    ]
  },
  {
    title: "Learning Style Recognition",
    icon: Brain,
    description: "Identifies and adapts to individual learning preferences",
    details: [
      "Visual, auditory, kinesthetic detection",
      "Content format optimization",
      "Preferred study time analysis",
      "Engagement pattern recognition"
    ]
  },
  {
    title: "Predictive Analytics",
    icon: TrendingUp,
    description: "Forecasts learning outcomes and intervenes proactively",
    details: [
      "Success probability prediction",
      "Risk identification",
      "Early warning system",
      "Intervention recommendations"
    ]
  },
  {
    title: "Intelligent Content Recommendations",
    icon: Lightbulb,
    description: "Suggests the most relevant content at the right time",
    details: [
      "Knowledge gap filling",
      "Prerequisite checking",
      "Interest-based suggestions",
      "Cross-subject connections"
    ]
  }
];

const learningPathExample = {
  student: "Sarah Chen",
  course: "Data Science Fundamentals",
  currentLevel: 65,
  adaptations: [
    { week: 1, action: "Started with basic statistics review", impact: "+10% comprehension" },
    { week: 2, action: "Adjusted to visual learning style", impact: "+15% engagement" },
    { week: 3, action: "Increased practice problems", impact: "+20% retention" },
    { week: 4, action: "Introduced advanced topics earlier", impact: "+25% confidence" }
  ]
};

const adaptiveMetrics = [
  { metric: "Learning Efficiency", improvement: "40%", baseline: "Traditional LMS" },
  { metric: "Completion Rate", improvement: "85%", baseline: "Industry Average 30%" },
  { metric: "Knowledge Retention", improvement: "3x", baseline: "After 6 months" },
  { metric: "Student Satisfaction", improvement: "92%", baseline: "Platform Rating" }
];

const adaptationProcess = [
  {
    phase: "Monitor",
    description: "Track every interaction and learning behavior",
    icon: Activity
  },
  {
    phase: "Analyze",
    description: "AI processes patterns and identifies needs",
    icon: BarChart3
  },
  {
    phase: "Adapt",
    description: "Adjust content, difficulty, and recommendations",
    icon: RefreshCw
  },
  {
    phase: "Optimize",
    description: "Continuously improve learning outcomes",
    icon: Target
  }
];

export default function AdaptiveLearningPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 -mt-14 sm:-mt-16 pt-14 sm:pt-16">
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 rounded-2xl backdrop-blur-sm border border-yellow-300/40 dark:border-yellow-500/30">
                <Zap className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Learning That Adapts to You
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Every student is unique. Taxomind&apos;s adaptive learning engine creates personalized 
              learning experiences that evolve in real-time based on individual needs, preferences, and progress.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500">
                  Experience Adaptive Learning
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:border-slate-400 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-500">
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {adaptiveMetrics.map((item, index) => (
              <motion.div
                key={item.metric}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {item.improvement}
                </div>
                <div className="text-sm text-gray-300 font-medium mt-1">{item.metric}</div>
                <div className="text-xs text-gray-500 mt-1">{item.baseline}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Adaptive Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              How Adaptive Learning Works
            </h2>
            <p className="text-xl text-slate-500 dark:text-gray-400">
              AI-powered personalization at every step of the learning journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {adaptiveFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 h-full shadow-sm dark:shadow-none">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-r from-yellow-500/15 to-orange-500/15 dark:from-yellow-500/20 dark:to-orange-500/20 rounded-lg">
                      <feature.icon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                      <p className="text-slate-600 dark:text-gray-400 mb-4">{feature.description}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {feature.details.map((detail) => (
                          <div key={detail} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700 dark:text-gray-300">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Example */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              See Adaptive Learning in Action
            </h2>
            <p className="text-xl text-slate-500 dark:text-gray-400">
              Real example of how our system adapts to a student&apos;s journey
            </p>
          </motion.div>

          <Card className="p-8 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{learningPathExample.student}</h3>
                <p className="text-slate-600 dark:text-gray-400">Course: {learningPathExample.course}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{learningPathExample.currentLevel}%</div>
                <p className="text-sm text-slate-500 dark:text-gray-400">Current Progress</p>
              </div>
            </div>

            <Progress value={learningPathExample.currentLevel} className="mb-8 h-3" />

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Adaptive Journey Timeline</h4>
              {learningPathExample.adaptations.map((adaptation, index) => (
                <motion.div
                  key={adaptation.week}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                    <div className="flex items-center justify-center w-10 h-10 bg-yellow-500/15 dark:bg-yellow-500/20 rounded-full flex-shrink-0">
                      <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">W{adaptation.week}</span>
                    </div>
                    <div className="flex-1">
                    <p className="text-slate-700 dark:text-gray-300">{adaptation.action}</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">Impact: {adaptation.impact}</p>
                    </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Adaptation Process */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Continuous Adaptation Cycle
            </h2>
            <p className="text-xl text-slate-500 dark:text-gray-400">
              Our AI never stops learning about how you learn
            </p>
          </motion.div>

          <div className="relative">
            <div className="grid md:grid-cols-4 gap-6">
              {adaptationProcess.map((phase, index) => (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {index < adaptationProcess.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  
                  <Card className="p-6 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-center h-full shadow-sm dark:shadow-none">
                    <phase.icon className="w-10 h-10 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{phase.phase}</h3>
                    <p className="text-sm text-slate-600 dark:text-gray-400">{phase.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {/* Circular arrow for continuous cycle */}
            <div className="hidden md:block absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin-slow" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Different Users */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Benefits for Everyone
            </h2>
            <p className="text-xl text-slate-500 dark:text-gray-400">
              Adaptive learning transforms education for all stakeholders
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
              <Users className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">For Students</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-gray-300 text-sm">Learn at your perfect pace</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-gray-300 text-sm">Get help exactly when needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-gray-300 text-sm">Stay motivated with personalized challenges</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
              <Brain className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">For Teachers</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-gray-300 text-sm">Identify struggling students early</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-gray-300 text-sm">Personalize instruction at scale</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-gray-300 text-sm">Data-driven teaching decisions</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
              <Target className="w-8 h-8 text-red-600 dark:text-red-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">For Institutions</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-gray-300 text-sm">Improve completion rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-gray-300 text-sm">Reduce dropout rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-gray-300 text-sm">Better learning outcomes</span>
                </li>
              </ul>
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
            className="bg-gradient-to-r from-yellow-600/10 to-orange-600/10 dark:from-yellow-600/20 dark:to-orange-600/20 backdrop-blur-sm border border-yellow-300/40 dark:border-yellow-500/30 rounded-2xl p-12"
          >
            <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Ready for Personalized Learning?
            </h2>
            <p className="text-xl text-slate-600 dark:text-gray-300 mb-8">
              Join thousands experiencing the future of adaptive education
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500">
                  Start Your Adaptive Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/intelligent-lms/course-intelligence">
                <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:border-slate-400 dark:border-gray-500 dark:text-gray-200">
                  Explore Course Intelligence
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
