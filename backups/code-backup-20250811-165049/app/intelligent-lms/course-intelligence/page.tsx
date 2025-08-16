"use client";

import { motion } from "framer-motion";
import { 
  Activity, 
  Brain, 
  BarChart3, 
  Target, 
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  PenTool,
  TrendingUp,
  GitBranch,
  Layers,
  Zap,
  FileText,
  Award,
  Globe,
  Clock,
  Users,
  ChevronRight,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const courseIntelligenceFeatures = [
  {
    title: "AI-Powered Course Creation",
    icon: PenTool,
    description: "Generate complete course structures in minutes, not weeks",
    capabilities: [
      "Automated outline generation",
      "Learning objective creation",
      "Content recommendations",
      "Assessment design"
    ],
    stats: { time: "3x faster", quality: "95% quality score" }
  },
  {
    title: "Deep Content Analysis",
    icon: Layers,
    description: "Multi-dimensional evaluation of course effectiveness",
    capabilities: [
      "Bloom's Taxonomy mapping",
      "Cognitive load balancing",
      "Learning gap identification",
      "Quality scoring"
    ],
    stats: { accuracy: "98% accurate", insights: "50+ metrics" }
  },
  {
    title: "Market Intelligence",
    icon: TrendingUp,
    description: "Position your courses for maximum impact and success",
    capabilities: [
      "Competitive analysis",
      "Demand forecasting",
      "Pricing optimization",
      "Trend identification"
    ],
    stats: { enrollment: "+85% enrollment", revenue: "+120% revenue" }
  },
  {
    title: "Continuous Optimization",
    icon: Activity,
    description: "Real-time improvements based on learner data",
    capabilities: [
      "Performance tracking",
      "Content effectiveness",
      "Engagement analytics",
      "Automated updates"
    ],
    stats: { improvement: "40% better outcomes", retention: "92% completion" }
  }
];

const creationProcess = [
  {
    step: 1,
    title: "Define Your Vision",
    description: "Tell SAM about your course idea and target audience",
    time: "2 minutes"
  },
  {
    step: 2,
    title: "AI Generation",
    description: "SAM creates comprehensive course structure with modules and lessons",
    time: "30 seconds"
  },
  {
    step: 3,
    title: "Smart Refinement",
    description: "Review and customize AI suggestions to match your style",
    time: "10 minutes"
  },
  {
    step: 4,
    title: "Launch & Optimize",
    description: "Publish your course with continuous AI optimization",
    time: "Instant"
  }
];

const analysisMetrics = [
  { name: "Cognitive Depth", value: 85, optimal: 80 },
  { name: "Content Balance", value: 92, optimal: 85 },
  { name: "Engagement Score", value: 78, optimal: 90 },
  { name: "Market Alignment", value: 95, optimal: 85 }
];

const successStories = [
  {
    author: "Prof. Maria Garcia",
    course: "Advanced Machine Learning",
    results: {
      before: "6 weeks to create, 45% completion",
      after: "2 days to create, 89% completion"
    },
    quote: "The AI suggestions were spot-on. It understood my teaching style and created content that felt authentically mine."
  },
  {
    author: "Dr. James Liu",
    course: "Business Analytics Masterclass",
    results: {
      before: "Low enrollment, generic content",
      after: "300% increase in enrollment, personalized paths"
    },
    quote: "Market intelligence showed me exactly what students wanted. My course became the top seller in its category."
  }
];

export default function CourseIntelligencePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 -mt-14 sm:-mt-16 pt-14 sm:pt-16">
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
              <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-cyan-500/30">
                <Activity className="w-12 h-12 text-cyan-400" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Course Creation Reimagined with AI
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Create world-class courses in minutes, not months. Our Course Intelligence engine combines 
              AI generation, market insights, and continuous optimization to help you build courses that succeed.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/teacher/create">
                <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
                  Create Your First AI Course
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-gray-600 hover:border-gray-500">
                See Live Demo
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Complete Course Intelligence Suite
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to create, analyze, and optimize successful courses
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {courseIntelligenceFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700 h-full">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg">
                      <feature.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-gray-400 mb-4">{feature.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {feature.capabilities.map((capability) => (
                          <div key={capability} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-300">{capability}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-4 pt-4 border-t border-slate-700">
                        {Object.entries(feature.stats).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-lg font-semibold text-cyan-400">{value}</p>
                            <p className="text-xs text-gray-500 capitalize">{key}</p>
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

      {/* Creation Process */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              From Idea to Published Course in Minutes
            </h2>
            <p className="text-xl text-gray-400">
              Our streamlined AI-powered process makes course creation effortless
            </p>
          </motion.div>

          <div className="space-y-6">
            {creationProcess.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full flex-shrink-0">
                      <span className="text-2xl font-bold text-cyan-400">{step.step}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-1">{step.title}</h3>
                      <p className="text-gray-400">{step.description}</p>
                    </div>
                    <div className="text-right">
                      <Clock className="w-5 h-5 text-gray-500 mb-1" />
                      <p className="text-sm font-medium text-cyan-400">{step.time}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <p className="text-lg text-gray-300">
              Total time from idea to published course: <span className="text-2xl font-bold text-cyan-400">Under 15 minutes</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Live Analysis Demo */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Real-Time Course Analysis
            </h2>
            <p className="text-xl text-gray-400">
              See how our AI evaluates and optimizes course quality
            </p>
          </motion.div>

          <Card className="p-8 bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">Sample Course: Data Science Fundamentals</h3>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live Analysis</Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {analysisMetrics.map((metric) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">{metric.name}</span>
                    <span className="text-lg font-semibold text-cyan-400">{metric.value}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={metric.value} className="h-3" />
                    <div 
                      className="absolute top-0 h-3 w-1 bg-white"
                      style={{ left: `${metric.optimal}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Optimal: {metric.optimal}%</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-slate-900/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-400 mb-1">AI Recommendation</p>
                  <p className="text-gray-300 text-sm">
                    Your course shows excellent cognitive depth and market alignment. Consider adding more interactive 
                    elements in Module 3 to boost engagement scores. The current structure supports 89% completion rate.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Educators Achieving Excellence
            </h2>
            <p className="text-xl text-gray-400">
              Real results from educators using Course Intelligence
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {successStories.map((story, index) => (
              <motion.div
                key={story.author}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{story.author}</h3>
                      <p className="text-sm text-gray-400">{story.course}</p>
                    </div>
                    <Award className="w-6 h-6 text-yellow-400" />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Before</p>
                      <p className="text-sm text-red-400">{story.results.before}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">After</p>
                      <p className="text-sm text-green-400">{story.results.after}</p>
                    </div>
                  </div>

                  <blockquote className="text-gray-300 italic">
                    &ldquo;{story.quote}&rdquo;
                  </blockquote>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration with Other Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-8 md:p-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Seamlessly Integrated Intelligence
              </h2>
              <p className="text-xl text-gray-300">
                Course Intelligence works with all Taxomind features
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <Link href="/intelligent-lms/sam-ai-assistant" className="group">
                <Card className="p-4 bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-500/50 transition-all duration-300 h-full">
                  <Brain className="w-6 h-6 text-purple-400 mb-2" />
                  <h4 className="text-sm font-semibold text-white mb-1">SAM AI Assistant</h4>
                  <p className="text-xs text-gray-400">Get help during creation</p>
                  <ChevronRight className="w-4 h-4 text-gray-500 mt-2 group-hover:text-cyan-400 transition-colors" />
                </Card>
              </Link>
              
              <Link href="/intelligent-lms/evaluation-standards" className="group">
                <Card className="p-4 bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-500/50 transition-all duration-300 h-full">
                  <Shield className="w-6 h-6 text-green-400 mb-2" />
                  <h4 className="text-sm font-semibold text-white mb-1">Standards</h4>
                  <p className="text-xs text-gray-400">Ensure compliance</p>
                  <ChevronRight className="w-4 h-4 text-gray-500 mt-2 group-hover:text-cyan-400 transition-colors" />
                </Card>
              </Link>
              
              <Link href="/intelligent-lms/adaptive-learning" className="group">
                <Card className="p-4 bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-500/50 transition-all duration-300 h-full">
                  <Zap className="w-6 h-6 text-yellow-400 mb-2" />
                  <h4 className="text-sm font-semibold text-white mb-1">Adaptive Learning</h4>
                  <p className="text-xs text-gray-400">Personalize delivery</p>
                  <ChevronRight className="w-4 h-4 text-gray-500 mt-2 group-hover:text-cyan-400 transition-colors" />
                </Card>
              </Link>
              
              <Link href="/analytics" className="group">
                <Card className="p-4 bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-500/50 transition-all duration-300 h-full">
                  <BarChart3 className="w-6 h-6 text-cyan-400 mb-2" />
                  <h4 className="text-sm font-semibold text-white mb-1">Analytics</h4>
                  <p className="text-xs text-gray-400">Track performance</p>
                  <ChevronRight className="w-4 h-4 text-gray-500 mt-2 group-hover:text-cyan-400 transition-colors" />
                </Card>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Activity className="w-12 h-12 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4 text-white">
              Create Your First AI-Powered Course
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of educators creating exceptional courses with AI
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/teacher/create">
                <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
                  Start Creating Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/intelligent-lms/overview">
                <Button size="lg" variant="outline" className="border-gray-500 hover:border-gray-400">
                  Learn More About Taxomind
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}