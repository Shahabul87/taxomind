"use client"

import { motion, useInView } from "framer-motion";
import { 
  Star, 
  Quote, 
  TrendingUp, 
  Users,
  Award,
  Building2,
  GraduationCap,
  BookOpen,
  Target,
  Zap
} from "lucide-react";
import { useRef } from "react";
import Image from "next/image";

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "Chief Learning Officer",
    company: "TechCorp University",
    avatar: "/api/placeholder/64/64",
    rating: 5,
    text: "TaxoMind's AI-powered assessment system has revolutionized how we evaluate student progress. The adaptive questioning has improved our completion rates by 85%.",
    results: "85% improvement in completion rates",
    category: "enterprise"
  },
  {
    name: "Marcus Rodriguez",
    role: "Computer Science Professor",
    company: "State University",
    avatar: "/api/placeholder/64/64",
    rating: 5,
    text: "The real-time analytics provide incredible insights into student learning patterns. I can now identify struggling students early and provide targeted support.",
    results: "40% reduction in dropout rates",
    category: "educator"
  },
  {
    name: "Emily Johnson",
    role: "Medical Student",
    company: "Johns Hopkins",
    avatar: "/api/placeholder/64/64",
    rating: 5,
    text: "The AI tutor feels like having a personal learning assistant available 24/7. It adapts to my learning style and helps me master complex concepts faster.",
    results: "3x faster concept mastery",
    category: "student"
  },
  {
    name: "David Kim",
    role: "VP of Learning & Development",
    company: "Fortune 500 Company",
    avatar: "/api/placeholder/64/64",
    rating: 5,
    text: "Implementing TaxoMind for our 10,000+ employees has streamlined our training programs. The predictive analytics help us optimize learning paths for maximum ROI.",
    results: "60% training efficiency increase",
    category: "enterprise"
  },
  {
    name: "Prof. Lisa Wang",
    role: "Mathematics Department Head",
    company: "MIT",
    avatar: "/api/placeholder/64/64",
    rating: 5,
    text: "The adaptive content generation creates personalized problem sets that challenge each student appropriately. Our student engagement has never been higher.",
    results: "90% student engagement rate",
    category: "educator"
  },
  {
    name: "Alex Thompson",
    role: "Graduate Student",
    company: "Stanford University",
    avatar: "/api/placeholder/64/64",
    rating: 5,
    text: "TaxoMind's intelligent feedback system helped me identify knowledge gaps I didn't even know existed. My research productivity has increased dramatically.",
    results: "2x research productivity boost",
    category: "student"
  }
];

const stats = [
  {
    icon: Users,
    value: "1M+",
    label: "Active Learners",
    description: "Students and professionals worldwide"
  },
  {
    icon: Building2,
    value: "500+",
    label: "Enterprise Clients",
    description: "Fortune 500 companies trust us"
  },
  {
    icon: Award,
    value: "98%",
    label: "Satisfaction Rate",
    description: "Based on user feedback surveys"
  },
  {
    icon: TrendingUp,
    value: "3x",
    label: "Learning Speed",
    description: "Average improvement in learning velocity"
  }
];

const logos = [
  { name: "Harvard", width: 120, height: 40 },
  { name: "MIT", width: 100, height: 40 },
  { name: "Stanford", width: 140, height: 40 },
  { name: "Google", width: 100, height: 40 },
  { name: "Microsoft", width: 120, height: 40 },
  { name: "Amazon", width: 100, height: 40 }
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

const testimonialVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5
    }
  }
};

const statVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5
    }
  }
};

export default function TestimonialsSection() {
  const sectionRef = useRef(null);
  const statsRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  return (
    <div className="relative py-24 overflow-hidden bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/testimonial-bg.svg')] bg-center opacity-5"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center space-x-2 rounded-full px-6 py-2 mb-6 border bg-emerald-100/50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Star className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">Trusted by Millions</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-slate-900 dark:text-white">Transforming Education</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Worldwide
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            See how students, educators, and organizations are achieving remarkable 
            results with TaxoMind&apos;s intelligent learning platform.
          </p>
        </motion.div>

        {/* Stats section */}
        <motion.div
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 max-w-4xl mx-auto"
          initial="hidden"
          animate={statsInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={statVariants}
              className="text-center p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 group bg-white/70 border-slate-200 dark:bg-gradient-to-br dark:from-slate-800/50 dark:to-slate-900/50 dark:border-slate-700/30 hover:border-emerald-500/30"
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-slate-500 dark:text-gray-400">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials grid */}
        <motion.div
          ref={sectionRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={`${testimonial.name}-${index}`}
              variants={testimonialVariants}
              className="group relative"
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl blur opacity-0 group-hover:opacity-25 transition duration-300"></div>
              
              <div className="relative rounded-3xl p-8 shadow-2xl border transition-all duration-300 h-full bg-white border-slate-200 dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 dark:border-slate-700/50 group-hover:border-emerald-500/30 backdrop-blur-xl">
                {/* Quote icon */}
                <div className="absolute top-6 right-6 w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center opacity-20">
                  <Quote className="w-4 h-4 text-white" />
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Testimonial text */}
                <p className="text-slate-600 dark:text-gray-300 leading-relaxed mb-6 text-lg">
                  &quot;{testimonial.text}&quot;
                </p>

                {/* Results highlight */}
                <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold text-sm">
                      {testimonial.results}
                    </span>
                  </div>
                </div>

                {/* Author info */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                    <div className="text-xs text-emerald-400">{testimonial.company}</div>
                  </div>
                </div>

                {/* Category indicator */}
                <div className="absolute bottom-4 right-4">
                  <div className={`w-3 h-3 rounded-full ${
                    testimonial.category === 'enterprise' ? 'bg-purple-500' :
                    testimonial.category === 'educator' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}></div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trusted by section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Trusted by Leading Institutions
          </h3>
          
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-100 dark:opacity-60">
            {logos.map((logo, index) => (
              <motion.div
                key={logo.name}
                className="p-4 rounded-xl backdrop-blur-sm border transition-all duration-300 group bg-white/70 border-slate-200 dark:bg-slate-800/30 dark:border-slate-700/30 hover:border-emerald-500/30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.6, scale: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, opacity: 1 }}
              >
                <div className="w-24 h-8 bg-gradient-to-r from-slate-300 to-slate-500 dark:from-gray-400 dark:to-gray-600 rounded flex items-center justify-center">
                  <span className="text-slate-700 dark:text-white text-xs font-semibold">{logo.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA section */}
        <motion.div
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 backdrop-blur-sm">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Join the Future of Learning
            </h3>
            <p className="text-lg text-slate-600 dark:text-gray-300 mb-8">
              Experience the same transformative results that millions of learners 
              and thousands of organizations already enjoy.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="/auth/register"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-lg">Start Your Free Trial</span>
                <Zap className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              </motion.a>
              
              <motion.a
                href="/case-studies"
                className="inline-flex items-center px-8 py-4 border-2 font-semibold rounded-2xl backdrop-blur-sm transition-all duration-300 group text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 dark:text-emerald-300 dark:border-emerald-400/50 dark:hover:bg-emerald-900/30 dark:hover:border-emerald-400"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BookOpen className="mr-2 w-5 h-5" />
                <span className="text-lg">View Case Studies</span>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
