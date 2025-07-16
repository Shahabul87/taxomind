"use client"

import { motion, useInView } from "framer-motion";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Zap,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Users,
  Lightbulb,
  Cpu,
  BookOpen
} from "lucide-react";
import { useRef } from "react";

const steps = [
  {
    step: "01",
    icon: Brain,
    title: "AI Assessment",
    description: "Our intelligent system analyzes your current knowledge level, learning style, and goals to create your unique learning profile.",
    features: ["Knowledge gap analysis", "Learning style detection", "Goal identification"],
    color: "purple",
    gradient: "from-purple-500 to-indigo-500"
  },
  {
    step: "02", 
    icon: Target,
    title: "Adaptive Pathways",
    description: "AI generates personalized learning paths with content that adapts in real-time based on your progress and comprehension.",
    features: ["Dynamic content selection", "Difficulty adjustment", "Pace optimization"],
    color: "blue",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    step: "03",
    icon: TrendingUp,
    title: "Intelligent Feedback",
    description: "Receive instant, contextual feedback and recommendations powered by advanced analytics and machine learning.",
    features: ["Real-time insights", "Predictive analytics", "Performance optimization"],
    color: "emerald",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    step: "04",
    icon: BarChart3,
    title: "Continuous Growth",
    description: "Track your progress with detailed analytics while the AI continuously refines your learning experience.",
    features: ["Progress tracking", "Skill mapping", "Achievement recognition"],
    color: "orange",
    gradient: "from-orange-500 to-red-500"
  }
];

const benefits = [
  {
    icon: Zap,
    title: "3x Faster Learning",
    description: "AI-optimized content delivery accelerates comprehension",
    stat: "300%"
  },
  {
    icon: Target,
    title: "95% Retention Rate",
    description: "Adaptive reinforcement ensures long-term knowledge retention",
    stat: "95%"
  },
  {
    icon: Users,
    title: "Personalized for All",
    description: "Every learner gets a unique, tailored experience",
    stat: "100%"
  },
  {
    icon: TrendingUp,
    title: "Real-time Progress",
    description: "Instant feedback and continuous improvement tracking",
    stat: "24/7"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const stepVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6
    }
  }
};

const benefitVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5
    }
  }
};

export default function HowItWorksSection() {
  const sectionRef = useRef(null);
  const benefitsRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const benefitsInView = useInView(benefitsRef, { once: true, margin: "-100px" });

  return (
    <div className="relative py-24 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center space-x-2 bg-purple-500/10 rounded-full px-6 py-2 border border-purple-500/20 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Cpu className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-medium">AI-Powered Process</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              How TaxoMind
            </span>
            <br />
            <span className="text-white">Transforms Learning</span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Our intelligent platform uses advanced AI algorithms to create personalized learning experiences 
            that adapt in real-time to optimize your educational journey.
          </p>
        </motion.div>

        {/* Steps process */}
        <motion.div
          ref={sectionRef}
          className="relative max-w-7xl mx-auto"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-emerald-500/20 transform -translate-y-1/2"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                variants={stepVariants}
                className="relative group"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step number indicator */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <div className={`w-12 h-12 bg-gradient-to-r ${step.gradient} rounded-full flex items-center justify-center shadow-xl border-4 border-slate-800 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-white font-bold text-lg">{step.step}</span>
                  </div>
                </div>

                {/* Card */}
                <div className="relative pt-8 p-8 rounded-3xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 group-hover:border-purple-500/30 transition-all duration-300 shadow-xl hover:shadow-2xl">
                  <div className={`absolute -inset-1 bg-gradient-to-r ${step.gradient} rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-300`}></div>
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-16 h-16 bg-gradient-to-r ${step.gradient} rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-white mb-4 text-center group-hover:text-purple-300 transition-colors">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-300 text-center leading-relaxed mb-6">
                      {step.description}
                    </p>

                    {/* Features list */}
                    <div className="space-y-2">
                      {step.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm text-gray-400">
                          <CheckCircle className="w-4 h-4 text-purple-400 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom accent */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.gradient} rounded-b-3xl opacity-0 group-hover:opacity-100 transition-all duration-300`}></div>
                </div>

                {/* Arrow connector for larger screens */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-purple-400/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits section */}
        <motion.div
          ref={benefitsRef}
          className="mt-24"
          initial="hidden"
          animate={benefitsInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          <motion.div
            className="text-center mb-12"
            variants={stepVariants}
          >
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Proven Results with AI
            </h3>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our intelligent learning approach delivers measurable improvements in learning outcomes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                variants={benefitVariants}
                className="group text-center p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/30 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                  {benefit.stat}
                </div>
                
                <h4 className="text-lg font-semibold text-white mb-2">
                  {benefit.title}
                </h4>
                
                <p className="text-gray-400 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.a
            href="/auth/register"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-purple-500/25 transition-all duration-300 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-lg">Experience AI-Powered Learning</span>
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}