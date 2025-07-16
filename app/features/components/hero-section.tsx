"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Brain, Users, Sparkles, Target, BookOpen, BarChart3 } from "lucide-react";
import Link from "next/link";

const FloatingIcon = ({ 
  icon: Icon, 
  className, 
  delay = 0 
}: { 
  icon: any; 
  className: string; 
  delay?: number; 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ 
      duration: 0.6, 
      delay: delay,
      repeat: Infinity,
      repeatType: "reverse",
      repeatDelay: 3
    }}
    className={`absolute ${className}`}
  >
    <div className="p-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 
      shadow-lg group-hover:bg-white/20 transition-all duration-300">
      <Icon className="w-6 h-6 text-white" />
    </div>
  </motion.div>
);

export const HeroSection = () => {
  const firstText = "The Complete Learning ";
  const secondText = "Ecosystem";
  
  const [ref, inView] = useInView({
    threshold: 0.3,
    triggerOnce: false,
  });

  const stats = [
    { number: "∞", label: "Courses to Create" },
    { number: "∞", label: "Resources to Collect" }, 
    { number: "24/7", label: "AI Tutor Available" },
    { number: "100%", label: "Your Own Platform" }
  ];

  return (
    <div 
      ref={ref}
      className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Enhanced Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/90 via-gray-800/95 to-gray-900/98" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        {/* Floating Feature Icons */}
        <div className="group">
          <FloatingIcon icon={Brain} className="top-1/4 left-1/4" delay={0.5} />
          <FloatingIcon icon={Users} className="top-1/3 right-1/4" delay={1} />
          <FloatingIcon icon={Sparkles} className="bottom-1/3 left-1/5" delay={1.5} />
          <FloatingIcon icon={Target} className="bottom-1/4 right-1/3" delay={2} />
          <FloatingIcon icon={BookOpen} className="top-1/2 left-1/6" delay={2.5} />
          <FloatingIcon icon={BarChart3} className="top-2/3 right-1/5" delay={3} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
        className="relative text-center max-w-6xl mx-auto"
      >
        <motion.h1 
          className="text-4xl md:text-7xl font-bold text-white mb-8 leading-tight"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.span
            initial={{ display: "inline-block" }}
            animate={{ display: "inline-block" }}
          >
            {Array.from(firstText).map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{
                  duration: 0.2,
                  delay: inView ? index * 0.05 : 0
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.span>
          <br />
          <motion.span 
            className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"
            initial={{ display: "inline-block" }}
            animate={{ display: "inline-block" }}
          >
            {Array.from(secondText).map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{
                  duration: 0.2,
                  delay: inView ? (index + firstText.length) * 0.05 : 0
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: inView ? 1.2 : 0 }}
          className="text-gray-200 text-lg md:text-xl max-w-4xl mx-auto mb-8 leading-relaxed"
        >
          <p className="mb-4">
            <span className="text-purple-300 font-semibold">Plan your skills</span> → 
            <span className="text-blue-300 font-semibold"> Collect resources</span> → 
            <span className="text-pink-300 font-semibold"> Take notes</span> → 
            <span className="text-green-300 font-semibold"> Get AI tutoring</span> → 
            <span className="text-yellow-300 font-semibold"> Track progress</span> → 
            <span className="text-purple-300 font-semibold"> Share with others</span>
          </p>
          <p className="text-base md:text-lg">
            The first-ever platform that combines <strong>course planning</strong>, <strong>resource curation</strong>, 
            <strong> collaborative learning</strong>, <strong>AI tutoring</strong>, <strong>advanced analytics</strong>, 
            and <strong>community sharing</strong> in one seamless experience.
          </p>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: inView ? 1.5 : 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, delay: inView ? 1.7 + index * 0.1 : 0 }}
              className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
            >
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.number}</div>
              <div className="text-sm text-gray-300">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: inView ? 2.2 : 0 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/auth/register">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-full 
                font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 
                border border-white/20 backdrop-blur-sm"
            >
              Start Building Your Skills
            </motion.button>
          </Link>
          <Link href="/discover">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/10 text-white rounded-full font-semibold text-lg 
                hover:bg-white/20 transition-all duration-300 border border-white/20 backdrop-blur-sm"
            >
              Explore Platform
            </motion.button>
          </Link>
        </motion.div>

        {/* Platform Uniqueness Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: inView ? 2.5 : 0 }}
          className="mt-12 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 
            rounded-full border border-yellow-400/30 backdrop-blur-sm"
        >
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-100 font-medium">
            World&apos;s First Comprehensive Skill-Building Ecosystem
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}; 