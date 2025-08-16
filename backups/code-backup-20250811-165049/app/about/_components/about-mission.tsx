"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useInView } from "react-intersection-observer";
import { ArrowRight } from "lucide-react";
import { MissionIllustration } from "./svg-illustrations";

export const AboutMission = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.2
  });

  return (
    <section ref={containerRef} className="py-20 md:py-32 overflow-hidden bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* SVG Illustration Column */}
          <motion.div 
            ref={ref}
            style={{ y }}
            className="relative"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.7 }}
              className="relative z-10"
            >
              <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl shadow-purple-500/10">
                <MissionIllustration />
              </div>
            </motion.div>
            
            {/* Decorative elements */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/20 z-0"
            />
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900/20 z-0"
            />
          </motion.div>
          
          {/* Content Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h2 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4">
              Our Mission
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Empowering Through Knowledge and Practical Skills
            </h3>
            
            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              <p className="text-lg">
                We believe education should be accessible, engaging, and relevant to real-world challenges. 
                Our mission is to bridge the gap between theoretical knowledge and practical application.
              </p>
              
              <div className="space-y-4">
                {[
                  {
                    title: "Accessible Learning",
                    description: "Creating educational content that's accessible to everyone, regardless of background or circumstances."
                  },
                  {
                    title: "Practical Focus",
                    description: "Emphasizing hands-on skills that translate directly to professional growth and real-world problem solving."
                  },
                  {
                    title: "Community Building",
                    description: "Fostering a supportive community where learners can connect, collaborate, and grow together."
                  }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
                    className="flex gap-4"
                  >
                    <div className="mt-1 flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}; 