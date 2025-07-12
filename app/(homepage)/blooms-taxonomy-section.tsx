"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Brain, 
  Lightbulb, 
  Target, 
  Puzzle, 
  FlaskConical, 
  Sparkles,
  ChevronRight,
  GraduationCap
} from "lucide-react";
import Link from "next/link";

const taxonomyLevels = [
  {
    level: 1,
    name: "Remember",
    icon: Brain,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    description: "Recall facts and basic concepts",
    examples: ["Define terms", "List features", "Identify components"],
    platformFeatures: ["Interactive flashcards", "Quick quizzes", "Memory games"],
    percentage: 15
  },
  {
    level: 2,
    name: "Understand",
    icon: Lightbulb,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    description: "Explain ideas and concepts",
    examples: ["Summarize content", "Explain processes", "Give examples"],
    platformFeatures: ["AI-powered explanations", "Concept mapping", "Visual learning"],
    percentage: 20
  },
  {
    level: 3,
    name: "Apply",
    icon: Target,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    description: "Use information in new situations",
    examples: ["Solve problems", "Apply methods", "Implement solutions"],
    platformFeatures: ["Hands-on projects", "Real-world scenarios", "Practice exercises"],
    percentage: 25
  },
  {
    level: 4,
    name: "Analyze",
    icon: Puzzle,
    color: "from-yellow-500 to-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    description: "Draw connections among ideas",
    examples: ["Compare concepts", "Identify patterns", "Break down problems"],
    platformFeatures: ["Case studies", "Data analysis tools", "Comparative assessments"],
    percentage: 20
  },
  {
    level: 5,
    name: "Evaluate",
    icon: FlaskConical,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    description: "Justify decisions and judgments",
    examples: ["Critique work", "Make judgments", "Defend positions"],
    platformFeatures: ["Peer reviews", "Critical thinking exercises", "Debate forums"],
    percentage: 15
  },
  {
    level: 6,
    name: "Create",
    icon: Sparkles,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    description: "Produce original work",
    examples: ["Design solutions", "Build projects", "Generate ideas"],
    platformFeatures: ["Project workspace", "Creative challenges", "Portfolio builder"],
    percentage: 5
  }
];

export default function BloomsTaxonomySection() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

  const activeLevel = selectedLevel || hoveredLevel;

  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mb-4">
            <GraduationCap className="w-4 h-4" />
            <span className="text-sm font-medium">Cognitive Development Framework</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Powered by{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Bloom's Taxonomy
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Our AI-enhanced learning platform uses the scientifically-proven Bloom's Taxonomy 
            to guide learners through progressive cognitive development stages
          </p>
        </motion.div>

        {/* Interactive Pyramid */}
        <div className="relative max-w-5xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pyramid Visualization */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="space-y-3">
                {taxonomyLevels.map((level, index) => {
                  const width = 100 - (index * 15);
                  const isActive = activeLevel === level.level;
                  
                  return (
                    <motion.div
                      key={level.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      onMouseEnter={() => setHoveredLevel(level.level)}
                      onMouseLeave={() => setHoveredLevel(null)}
                      onClick={() => setSelectedLevel(level.level)}
                      style={{ width: `${width}%` }}
                      className={`
                        relative cursor-pointer transition-all duration-300 group
                        ${isActive ? 'scale-105 z-10' : 'hover:scale-102'}
                      `}
                    >
                      <div 
                        className={`
                          relative overflow-hidden rounded-2xl p-4 
                          bg-gradient-to-r ${level.color} 
                          ${isActive ? 'shadow-2xl' : 'shadow-lg hover:shadow-xl'}
                          transform transition-all duration-300
                        `}
                      >
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                              <level.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{level.name}</h3>
                              <p className="text-sm text-white/80">Level {level.level}</p>
                            </div>
                          </div>
                          <ChevronRight className={`
                            w-5 h-5 transition-transform duration-300
                            ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}
                          `} />
                        </div>
                        
                        {/* Progress indicator */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${level.percentage}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className="h-full bg-white/40"
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Pyramid shape indicator */}
              <div className="absolute inset-0 pointer-events-none">
                <svg viewBox="0 0 200 300" className="w-full h-full opacity-10">
                  <path d="M100 0 L200 300 L0 300 Z" fill="currentColor" className="text-purple-600" />
                </svg>
              </div>
            </motion.div>

            {/* Details Panel */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {activeLevel ? (
                <motion.div
                  key={activeLevel}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {taxonomyLevels.map((level) => {
                    if (level.level !== activeLevel) return null;
                    
                    return (
                      <div key={level.name} className="space-y-6">
                        {/* Level Header */}
                        <div className={`p-6 rounded-2xl ${level.bgColor} border ${level.borderColor}`}>
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${level.color} text-white`}>
                              <level.icon className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {level.name}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400">
                                {level.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Examples */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Learning Activities
                          </h4>
                          <ul className="space-y-2">
                            {level.examples.map((example, i) => (
                              <li key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${level.color}`} />
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Platform Features */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                            TaxoMind Features
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {level.platformFeatures.map((feature, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
                      <Brain className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Click on any level to explore how TaxoMind enhances your cognitive development
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/features">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-xl hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300"
            >
              Explore Our Learning Methodology
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}