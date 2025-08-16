"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const AboutCTA = () => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1
  });

  return (
    <section ref={ref} className="py-20 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 dark:from-purple-900 dark:to-blue-900" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Ready to Start Your Learning Journey?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-white/90 mb-10 max-w-2xl mx-auto"
          >
            Join thousands of students who are already transforming their careers and lives through our platform.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              href="/courses" 
              className="inline-flex items-center justify-center px-6 py-4 border-2 border-white text-base font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 transition-colors duration-200"
            >
              Explore Courses
            </Link>
            
            <Link 
              href="/signup" 
              className="inline-flex items-center justify-center px-6 py-4 border-2 border-white text-base font-medium rounded-lg text-purple-600 dark:text-purple-900 bg-white hover:bg-gray-100 transition-colors duration-200"
            >
              Sign Up for Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 text-white/70 text-sm"
          >
            No credit card required. Start learning today.
          </motion.p>
        </div>
      </div>
    </section>
  );
}; 