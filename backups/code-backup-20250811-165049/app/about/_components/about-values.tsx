"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { BookOpen, Users, Lightbulb, Zap, Heart, Target } from "lucide-react";

const values = [
  {
    icon: BookOpen,
    title: "Continuous Learning",
    description: "We believe in the power of lifelong learning and constantly evolving our knowledge and skills."
  },
  {
    icon: Users,
    title: "Community First",
    description: "Building and nurturing a supportive community that grows and learns together."
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Embracing new ideas and approaches to create better learning experiences."
  },
  {
    icon: Zap,
    title: "Excellence",
    description: "Striving for the highest quality in everything we create and deliver."
  },
  {
    icon: Heart,
    title: "Passion",
    description: "Bringing enthusiasm and dedication to education and the success of our students."
  },
  {
    icon: Target,
    title: "Impact",
    description: "Making a meaningful difference in people's lives through education."
  }
];

export const AboutValues = () => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1
  });

  return (
    <section ref={ref} className="py-20 md:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4">
            Our Core Values
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Principles That Guide Our Journey
          </h3>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            These values shape our approach to education and define how we interact with our community of learners and educators.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon;
            
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="mb-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {value.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {value.description}
                </p>
              </motion.div>
            );
          })}
        </div>
        
        {/* Decorative element */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-16 flex justify-center"
        >
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
        </motion.div>
      </div>
    </section>
  );
}; 