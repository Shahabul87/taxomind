"use client";

import { motion } from "framer-motion";
import { 
  Brain, 
  Sparkles, 
  MessageSquare, 
  BookOpen, 
  Users, 
  Target, 
  Zap,
  CheckCircle2,
  ArrowRight,
  FileText,
  PenTool,
  BarChart3,
  Lightbulb,
  Code,
  Palette,
  Shield,
  Clock,
  Award,
  GitBranch,
  Layers,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const samCapabilities = [
  {
    category: "For Teachers",
    icon: Users,
    color: "from-purple-500 to-indigo-500",
    capabilities: [
      {
        title: "Intelligent Course Creation",
        description: "Generate complete course structures with AI-optimized content",
        features: ["Course outline generation", "Learning objective creation", "Assessment design", "Content recommendations"]
      },
      {
        title: "Real-time Teaching Assistant",
        description: "Get instant help with lesson planning and student queries",
        features: ["Lesson plan suggestions", "Activity recommendations", "Question bank creation", "Grading assistance"]
      },
      {
        title: "Student Analytics",
        description: "Deep insights into student performance and engagement",
        features: ["Performance predictions", "Engagement tracking", "Learning gap analysis", "Personalized interventions"]
      }
    ]
  },
  {
    category: "For Students",
    icon: BookOpen,
    color: "from-blue-500 to-cyan-500",
    capabilities: [
      {
        title: "Personalized Learning Guide",
        description: "24/7 AI tutor that adapts to your learning style",
        features: ["Concept explanations", "Practice problem generation", "Study schedule optimization", "Exam preparation"]
      },
      {
        title: "Interactive Study Support",
        description: "Get help exactly when and where you need it",
        features: ["Instant doubt resolution", "Step-by-step solutions", "Visual explanations", "Code debugging help"]
      },
      {
        title: "Progress Tracking",
        description: "Understand your learning journey with AI insights",
        features: ["Skill assessment", "Learning path optimization", "Achievement tracking", "Goal setting support"]
      }
    ]
  }
];

const contextualFeatures = [
  {
    context: "Course Creation",
    description: "SAM understands when you're building a course and provides",
    features: ["Structure suggestions", "Content templates", "Quality checks", "Market insights"]
  },
  {
    context: "Content Editing",
    description: "While editing lessons, SAM offers",
    features: ["Writing assistance", "Clarity improvements", "Example generation", "Media recommendations"]
  },
  {
    context: "Assessment Design",
    description: "During test creation, SAM helps with",
    features: ["Question generation", "Difficulty balancing", "Rubric creation", "Answer key generation"]
  },
  {
    context: "Learning Sessions",
    description: "When students are learning, SAM provides",
    features: ["Concept clarification", "Practice problems", "Memory techniques", "Progress encouragement"]
  }
];

const samEngines = [
  {
    name: "Contextual Intelligence Engine",
    icon: Brain,
    description: "Understands your current task across 100+ page types"
  },
  {
    name: "Content Generation Engine",
    icon: PenTool,
    description: "Creates high-quality educational content instantly"
  },
  {
    name: "Analytics Engine",
    icon: BarChart3,
    description: "Provides deep insights and predictive analytics"
  },
  {
    name: "Personalization Engine",
    icon: Sparkles,
    description: "Adapts to individual learning styles and preferences"
  },
  {
    name: "Memory Engine",
    icon: Clock,
    description: "Remembers your context and preferences over time"
  },
  {
    name: "Achievement Engine",
    icon: Award,
    description: "Gamifies learning with intelligent challenges"
  }
];

export default function SamAIAssistantPage() {
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
              <div className="relative">
                <div className="p-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl backdrop-blur-sm border border-purple-500/30">
                  <Brain className="w-12 h-12 text-purple-400" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Badge className="bg-green-500 text-white border-0">LIVE</Badge>
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Meet SAM: Your AI Teaching & Learning Companion
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              SAM (Smart Academic Mentor) is not just another chatbot. It&apos;s a revolutionary AI assistant that 
              understands your context, adapts to your needs, and helps you achieve educational excellence.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500">
                  Experience SAM Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-gray-600 hover:border-gray-500">
                <MessageSquare className="w-5 h-5 mr-2" />
                Watch SAM in Action
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </section>

      {/* How SAM Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              SAM Adapts to Your Every Need
            </h2>
            <p className="text-xl text-gray-400">
              Intelligent assistance for teachers and students at every step
            </p>
          </motion.div>

          <div className="space-y-12">
            {samCapabilities.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, x: categoryIndex % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} bg-opacity-20`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{category.category}</h3>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {category.capabilities.map((capability, index) => (
                    <Card key={capability.title} className="p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700">
                      <h4 className="text-xl font-semibold text-white mb-2">{capability.title}</h4>
                      <p className="text-gray-400 mb-4">{capability.description}</p>
                      <ul className="space-y-2">
                        {capability.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contextual Intelligence */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Contextual Intelligence: SAM Knows Where You Are
            </h2>
            <p className="text-xl text-gray-400">
              SAM understands your current context and provides relevant assistance automatically
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {contextualFeatures.map((context, index) => (
              <motion.div
                key={context.context}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Activity className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{context.context}</h3>
                  </div>
                  <p className="text-gray-400 mb-4">{context.description}:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {context.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SAM's Engines */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Powered by 6 Intelligent Engines
            </h2>
            <p className="text-xl text-gray-400">
              Each engine works together to create a seamless AI experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {samEngines.map((engine, index) => (
              <motion.div
                key={engine.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-purple-500/50 transition-all duration-300">
                  <engine.icon className="w-8 h-8 text-purple-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">{engine.name}</h3>
                  <p className="text-gray-400 text-sm">{engine.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Examples */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              See SAM in Action
            </h2>
            <p className="text-xl text-gray-400">
              Real examples of how SAM helps users every day
            </p>
          </motion.div>

          <div className="space-y-6">
            <Card className="p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-400">Teacher</span>
                    <Badge variant="outline" className="text-xs">Course Creation</Badge>
                  </div>
                  <p className="text-gray-300 mb-3">&ldquo;Help me create a course on Machine Learning for beginners&rdquo;</p>
                  <div className="pl-4 border-l-2 border-purple-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-400">SAM</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      &ldquo;I&apos;ll help you create a comprehensive ML course! Based on current market demand and Bloom&apos;s Taxonomy, 
                      here&apos;s a structured outline with 8 modules, starting with fundamentals and progressing to hands-on projects. 
                      I&apos;ve included interactive exercises, assessments aligned with learning objectives, and suggested prerequisites...&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-400">Student</span>
                    <Badge variant="outline" className="text-xs">Learning Session</Badge>
                  </div>
                  <p className="text-gray-300 mb-3">&ldquo;I don&apos;t understand how neural networks work&rdquo;</p>
                  <div className="pl-4 border-l-2 border-purple-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-400">SAM</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      &ldquo;Let me explain neural networks using a simple analogy! Think of it like a team making decisions. 
                      I&apos;ll break it down into 3 parts: 1) Input layer (your eyes seeing), 2) Hidden layers (your brain processing), 
                      3) Output layer (your decision). Here&apos;s an interactive visualization...&rdquo;
                    </p>
                  </div>
                </div>
              </div>
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
            className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-12"
          >
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4 text-white">
              Ready to Meet SAM?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of teachers and students already benefiting from AI-powered education
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500">
                  Start Using SAM Free
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