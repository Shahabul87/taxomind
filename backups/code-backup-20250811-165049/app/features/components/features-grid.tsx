"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { features } from "../data/features";
import Link from "next/link";
import { useState, useEffect } from "react";

const SimpleTimeline = () => {
  const { scrollYProgress } = useScroll();

  return (
    <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[120px] pointer-events-none">
      {/* Curved SVG Timeline */}
      <svg
        className="absolute h-full w-full"
        viewBox="0 0 120 1000"
        fill="none"
        preserveAspectRatio="none"
      >
        {/* Background curved line */}
        <path
          d="M 60,0 Q 90,200 40,400 Q 10,600 80,800 Q 110,900 60,1000"
          stroke="url(#backgroundGradient)"
          strokeWidth="4"
          fill="none"
          opacity="0.3"
        />
        
        {/* Animated progress curved line */}
        <motion.path
          d="M 60,0 Q 90,200 40,400 Q 10,600 80,800 Q 110,900 60,1000"
          stroke="url(#progressGradient)"
          strokeWidth="6"
          fill="none"
          style={{
            pathLength: useTransform(scrollYProgress, [0.1, 0.9], [0, 1]),
          }}
          strokeLinecap="round"
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="backgroundGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A855F7" opacity="0.2" />
            <stop offset="25%" stopColor="#6366F1" opacity="0.2" />
            <stop offset="50%" stopColor="#3B82F6" opacity="0.2" />
            <stop offset="75%" stopColor="#6366F1" opacity="0.2" />
            <stop offset="100%" stopColor="#A855F7" opacity="0.2" />
          </linearGradient>
          
          <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="25%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="75%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      {/* Animated glowing dot that follows the curve */}
      <motion.div
        className="absolute w-5 h-5 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full shadow-lg"
        style={{
          // Calculate position along the curve based on scroll progress
          left: useTransform(scrollYProgress, 
            [0.1, 0.3, 0.5, 0.7, 0.9], 
            ["calc(50% + 0px)", "calc(50% + 30px)", "calc(50% - 40px)", "calc(50% + 20px)", "calc(50% + 10px)"]
          ),
          top: useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]),
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 25px rgba(147, 51, 234, 0.8), 0 0 50px rgba(147, 51, 234, 0.4)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Inner glowing core */}
        <div className="absolute inset-1 bg-white rounded-full opacity-60" />
      </motion.div>
      
      {/* Additional floating particles along the curve */}
      <motion.div
        className="absolute w-2 h-2 bg-purple-300 rounded-full opacity-40"
        style={{
          left: useTransform(scrollYProgress, 
            [0.1, 0.3, 0.5, 0.7, 0.9], 
            ["calc(50% + 5px)", "calc(50% + 35px)", "calc(50% - 35px)", "calc(50% + 25px)", "calc(50% + 15px)"]
          ),
          top: useTransform(scrollYProgress, [0.1, 0.9], ["10%", "90%"]),
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          scale: [0.5, 1, 0.5],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      <motion.div
        className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full opacity-50"
        style={{
          left: useTransform(scrollYProgress, 
            [0.1, 0.3, 0.5, 0.7, 0.9], 
            ["calc(50% - 8px)", "calc(50% + 22px)", "calc(50% - 28px)", "calc(50% + 18px)", "calc(50% + 8px)"]
          ),
          top: useTransform(scrollYProgress, [0.1, 0.9], ["15%", "85%"]),
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          scale: [0.3, 0.8, 0.3],
          opacity: [0.1, 0.5, 0.1],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.2
        }}
      />
    </div>
  );
};

const FeatureItem = ({ 
  feature, 
  index, 
  onInView 
}: { 
  feature: typeof features[0], 
  index: number,
  onInView: (index: number) => void
}) => {
  const isEven = index % 2 === 0;
  const [itemRef, itemInView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
    onChange: (inView) => {
      if (inView) {
        onInView(index);
      }
    }
  });
  
  return (
    <motion.div
      ref={itemRef}
      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
      animate={itemInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isEven ? -50 : 50 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: Math.min(index * 0.05, 0.3) }}
      className={`flex items-center gap-8 w-full ${isEven ? 'flex-row' : 'flex-row-reverse'} my-16 relative`}
    >
      {/* Curved Arrow */}
      <motion.svg
        className={`absolute ${isEven ? 'right-[45%]' : 'left-[45%]'} top-1/2 -translate-y-1/2 w-24 h-24`}
        viewBox="0 0 100 100"
        fill="none"
        initial={{ opacity: 0, scale: 0 }}
        animate={itemInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.15) }}
      >
        <motion.path
          d={isEven 
            ? "M10,50 Q40,50 60,30 T90,40 L85,35 M85,35 L90,40 L85,45"
            : "M90,50 Q60,50 40,30 T10,40 L15,35 M15,35 L10,40 L15,45"
          }
          stroke="url(#arrowGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={itemInView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.2) }}
          className="dark:opacity-100 opacity-70"
        />
        <defs>
          <linearGradient id="arrowGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Feature Content with Curved SVG Background */}
      <div className={`flex-1 ${isEven ? 'text-right pr-8' : 'text-left pl-8'} relative`}>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 600 200"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d={isEven 
              ? "M40,0 C20,0 0,20 0,40 C0,60 0,140 0,160 C0,180 20,200 40,200 L560,200 C580,200 600,180 600,160 C600,140 600,60 600,40 C600,20 580,0 560,0 L40,0 Z"
              : "M560,0 C580,0 600,20 600,40 C600,60 600,140 600,160 C600,180 580,200 560,200 L40,200 C20,200 0,180 0,160 C0,140 0,60 0,40 C0,20 20,0 40,0 L560,0 Z"
            }
            className="fill-gray-900/50 backdrop-blur-xl"
            stroke="url(#featureGradient)"
            strokeWidth="1"
          />
          <defs>
            <linearGradient id="featureGradient" gradientTransform={isEven ? "rotate(0)" : "rotate(180)"}>
              <stop offset="0%" stopColor="#9333EA" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#4F46E5" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#9333EA" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative space-y-4 p-8">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            animate={itemInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ 
              duration: 0.25, 
              delay: Math.min(index * 0.02, 0.1),
              type: "spring",
              stiffness: 300 
            }}
            className="text-2xl lg:text-3xl font-bold"
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 } 
            }}
          >
            <span className="bg-gradient-to-r from-purple-700 via-purple-800 to-purple-700 dark:from-purple-300 dark:via-white dark:to-purple-300 bg-clip-text text-transparent
              drop-shadow-[0_2px_2px_rgba(147,51,234,0.2)]">
              {feature.title}
            </span>
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={itemInView ? { 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.25,
                delay: Math.min(index * 0.03, 0.15),
                type: "spring",
                stiffness: 300
              }
            } : { opacity: 0, y: 20 }}
            whileHover={{ 
              scale: 1.01,
              transition: { duration: 0.2 } 
            }}
            className="text-base lg:text-lg text-gray-200 leading-relaxed font-light tracking-wide"
          >
            {feature.description}
          </motion.p>
        </div>
      </div>

      {/* Icon Container */}
      <motion.div 
        className="relative z-10"
        initial={{ scale: 0 }}
        animate={itemInView ? { scale: 1 } : { scale: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 25,
          delay: Math.min(index * 0.02, 0.1)
        }}
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 
          p-[2px] backdrop-blur-lg">
          <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center
            hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
            <feature.icon className="w-10 h-10 text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 
              bg-clip-text stroke-purple-600 dark:stroke-purple-400" />
          </div>
        </div>
      </motion.div>

      {/* Empty div for layout balance */}
      <div className="flex-1" />
    </motion.div>
  );
};

export const FeaturesGrid = () => {
  const [headerRef, headerInView] = useInView({
    triggerOnce: true,
    threshold: 0.05
  });

  const [ctaRef, ctaInView] = useInView({
    triggerOnce: true,
    threshold: 0.05
  });

  const [featuresInView, setFeaturesInView] = useState<Set<number>>(new Set());

  const handleFeatureInView = (index: number) => {
    setFeaturesInView(prev => {
      if (!prev.has(index)) {
        return new Set([...Array.from(prev), index]);
      }
      return prev;
    });
  };

  return (
    <div className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-950/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] 
        from-purple-100/20 dark:from-purple-900/20 via-transparent to-transparent" />
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-32">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-purple-700 via-purple-800 to-purple-700 dark:from-purple-300 dark:via-white dark:to-purple-300 bg-clip-text text-transparent
              drop-shadow-[0_2px_2px_rgba(147,51,234,0.2)]">
              Everything You Need to Master Any Skill
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto font-light leading-relaxed mb-8"
          >
            From planning your learning journey to mastering skills with AI assistance - experience the world&apos;s first 
            comprehensive skill-building ecosystem designed for the modern learner.
          </motion.p>
          
          {/* Key Platform Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-5xl mx-auto"
          >
            <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="text-sm font-semibold text-purple-300 mb-1">Plan</div>
              <div className="text-xs text-gray-400">Course Creation</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-sm font-semibold text-blue-300 mb-1">Collect</div>
              <div className="text-xs text-gray-400">Resource Curation</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-sm font-semibold text-green-300 mb-1">Learn</div>
              <div className="text-xs text-gray-400">AI Tutoring</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="text-sm font-semibold text-yellow-300 mb-1">Track</div>
              <div className="text-xs text-gray-400">Analytics</div>
            </div>
            <div className="text-center p-4 bg-pink-500/10 rounded-lg border border-pink-500/20">
              <div className="text-sm font-semibold text-pink-300 mb-1">Test</div>
              <div className="text-xs text-gray-400">Examinations</div>
            </div>
            <div className="text-center p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <div className="text-sm font-semibold text-indigo-300 mb-1">Share</div>
              <div className="text-xs text-gray-400">Community</div>
            </div>
          </motion.div>
        </div>

        {/* Features Timeline */}
        <div className="relative max-w-5xl mx-auto">
          <SimpleTimeline />
          {features.map((feature, index) => (
            <FeatureItem
              key={feature.title}
              feature={feature}
              index={index}
              onInView={(i) => {
                handleFeatureInView(i);
              }}
            />
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 30 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-center relative mt-32"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 
            blur-3xl opacity-50" />
          <div className="relative bg-gray-900/50 backdrop-blur-xl rounded-2xl p-12 border border-purple-500/10
            shadow-[0_0_50px_-12px] shadow-purple-500/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-300 via-white to-purple-300 bg-clip-text text-transparent
                drop-shadow-[0_2px_2px_rgba(168,85,247,0.2)]">
                Ready to Build Your Skill Mastery Platform?
              </span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-3xl mx-auto text-lg font-light leading-relaxed">
              Join innovators who are transforming how they learn, teach, and share knowledge. Create your personalized 
              learning ecosystem and accelerate your skill development like never before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/register">
                <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white 
                  rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105 
                  transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 
                  focus:ring-offset-2 focus:ring-offset-gray-900">
                  Start Building Your Skills
                </button>
              </Link>
              <Link href="/discover">
                <button className="px-8 py-4 bg-white/10 text-white rounded-full font-semibold 
                  hover:bg-white/20 transition-all duration-300 border border-white/20">
                  Explore the Platform
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}; 