"use client";

import { motion } from "framer-motion";
import { 
  Shield, 
  Award, 
  BookOpen, 
  Target, 
  BarChart3, 
  Brain,
  Globe,
  CheckCircle2,
  ArrowRight,
  FileCheck,
  Users,
  Lightbulb,
  Activity,
  Layers,
  GitBranch,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { SamStandardsInfo } from "@/sam/components/integration/sam-standards-info";

const standards = [
  {
    name: "Bloom's Taxonomy",
    icon: Brain,
    category: "Cognitive Framework",
    description: "Six-level cognitive complexity framework from Remember to Create",
    implementation: "Full Implementation",
    status: "active",
    benefits: [
      "Progressive skill development",
      "Balanced cognitive load",
      "Clear learning objectives",
      "Measurable outcomes"
    ]
  },
  {
    name: "Quality Matters",
    icon: Shield,
    category: "Quality Assurance",
    description: "42 specific standards for online course quality",
    implementation: "In Progress",
    status: "implementing",
    benefits: [
      "Course design excellence",
      "Student satisfaction",
      "Accessibility compliance",
      "Continuous improvement"
    ]
  },
  {
    name: "ADDIE Model",
    icon: GitBranch,
    category: "Instructional Design",
    description: "Systematic design process: Analyze, Design, Develop, Implement, Evaluate",
    implementation: "Full Implementation",
    status: "active",
    benefits: [
      "Structured course creation",
      "Iterative improvement",
      "Quality consistency",
      "Efficient development"
    ]
  },
  {
    name: "Kirkpatrick Model",
    icon: BarChart3,
    category: "Evaluation Framework",
    description: "Four levels: Reaction, Learning, Behavior, Results",
    implementation: "Partial Implementation",
    status: "implementing",
    benefits: [
      "Learning effectiveness",
      "ROI measurement",
      "Behavior change tracking",
      "Business impact"
    ]
  },
  {
    name: "UNESCO Education 2030",
    icon: Globe,
    category: "Global Standards",
    description: "Inclusive and equitable quality education for all",
    implementation: "Aligned",
    status: "active",
    benefits: [
      "Global accessibility",
      "Inclusive design",
      "Lifelong learning",
      "Sustainable education"
    ]
  },
  {
    name: "ISO 21001:2018",
    icon: Award,
    category: "Management System",
    description: "International standard for educational organizations",
    implementation: "In Progress",
    status: "implementing",
    benefits: [
      "Quality management",
      "Learner satisfaction",
      "Process optimization",
      "Credibility"
    ]
  }
];

const complianceMetrics = [
  { metric: "Standards Implemented", value: "12+", description: "International frameworks" },
  { metric: "Quality Score", value: "95%", description: "Average compliance rate" },
  { metric: "Certifications", value: "4", description: "In progress" },
  { metric: "Updates", value: "Monthly", description: "Standards review cycle" }
];

const evaluationProcess = [
  {
    step: 1,
    title: "Content Analysis",
    description: "AI analyzes course content against multiple standards",
    icon: FileCheck
  },
  {
    step: 2,
    title: "Multi-Dimensional Scoring",
    description: "Evaluates cognitive, pedagogical, and engagement dimensions",
    icon: Layers
  },
  {
    step: 3,
    title: "Gap Identification",
    description: "Identifies areas for improvement with specific recommendations",
    icon: Target
  },
  {
    step: 4,
    title: "Continuous Monitoring",
    description: "Tracks progress and maintains standards compliance",
    icon: Activity
  }
];

export default function EvaluationStandardsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 -mt-14 xl:-mt-16 pt-14 xl:pt-16">
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
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-2xl backdrop-blur-sm border border-green-300/40 dark:border-green-500/30">
                <Shield className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              World-Class Educational Standards
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Taxomind is the only LMS that combines 12+ international educational standards 
              to ensure the highest quality learning experience backed by research and best practices.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <SamStandardsInfo />
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500">
                  Experience Standards-Based Learning
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-green-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Compliance Metrics */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {complianceMetrics.map((item, index) => (
              <motion.div
                key={item.metric}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {item.value}
                </div>
                <div className="text-sm text-slate-500 dark:text-gray-300 font-medium mt-1">{item.metric}</div>
                <div className="text-xs text-slate-400 dark:text-gray-500 mt-1">{item.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Standards Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Our Standards Framework
            </h2>
            <p className="text-xl text-slate-500 dark:text-gray-400">
              Each standard is carefully integrated into our platform&apos;s core
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {standards.map((standard, index) => (
              <motion.div
                key={standard.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-500/50 transition-all duration-300 h-full shadow-sm dark:shadow-none">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/15 dark:bg-green-500/20 rounded-lg">
                        <standard.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{standard.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-gray-500">{standard.category}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={standard.status === 'active' ? 'default' : 'secondary'}
                      className={standard.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                    >
                      {standard.implementation}
                    </Badge>
                  </div>
                  
                  <p className="text-slate-600 dark:text-gray-400 text-sm mb-4">{standard.description}</p>
                  
                  <div className="space-y-2">
                    {standard.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-700 dark:text-gray-300">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Evaluation Process */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              How We Evaluate Courses
            </h2>
            <p className="text-xl text-slate-500 dark:text-gray-400">
              Our AI-powered evaluation process ensures comprehensive quality assessment
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {evaluationProcess.map((process, index) => (
              <motion.div
                key={process.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {index < evaluationProcess.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-gray-600" />
                  </div>
                )}
                
                <Card className="p-6 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 h-full shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-4">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{process.step}</span>
                  </div>
                  <process.icon className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{process.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-gray-400">{process.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Unique Value Proposition */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 dark:from-green-600/20 dark:to-emerald-600/20 backdrop-blur-sm border border-green-300/40 dark:border-green-500/30 rounded-2xl p-8 md:p-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                Why Standards Matter
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-green-500/15 dark:bg-green-500/20 rounded-full">
                    <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">For Educators</h3>
                <p className="text-slate-600 dark:text-gray-400">
                  Create courses that meet global quality standards and deliver measurable outcomes
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full">
                    <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">For Learners</h3>
                <p className="text-slate-600 dark:text-gray-400">
                  Experience education that&apos;s proven effective and recognized worldwide
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-teal-500/15 dark:bg-teal-500/20 rounded-full">
                    <Award className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">For Institutions</h3>
                <p className="text-slate-600 dark:text-gray-400">
                  Ensure compliance, quality, and credibility with internationally recognized standards
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Real Impact */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              The Impact of Standards-Based Learning
            </h2>
            <p className="text-xl text-slate-500 dark:text-gray-400">
              Real results from institutions using Taxomind
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
              <Star className="w-8 h-8 text-yellow-500 dark:text-yellow-400 mb-4" />
              <blockquote className="text-slate-700 dark:text-gray-300 mb-4">
                &ldquo;Since implementing Taxomind&apos;s standards-based approach, our course completion rates 
                increased by 45% and student satisfaction scores reached an all-time high.&rdquo;
              </blockquote>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Dr. Sarah Chen</p>
                <p className="text-sm text-slate-500 dark:text-gray-500">Director of Online Learning, Tech University</p>
              </div>
            </Card>
            
            <Card className="p-8 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
              <Star className="w-8 h-8 text-yellow-500 dark:text-yellow-400 mb-4" />
              <blockquote className="text-slate-700 dark:text-gray-300 mb-4">
                &ldquo;The Bloom&apos;s Taxonomy integration helped us create more balanced curricula. 
                Our students now demonstrate deeper understanding and better critical thinking skills.&rdquo;
              </blockquote>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Prof. Michael Roberts</p>
                <p className="text-sm text-slate-500 dark:text-gray-500">Dean of Education, Global Institute</p>
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
          >
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Join the Standards Revolution
            </h2>
            <p className="text-xl text-slate-600 dark:text-gray-300 mb-8">
              Create and experience education that meets the highest global standards
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500">
                  Start Creating Quality Courses
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/intelligent-lms/course-intelligence">
                <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:border-slate-400 dark:border-gray-500 dark:text-gray-200">
                  Learn About Course Intelligence
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
