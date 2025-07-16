"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { TestimonialAvatar } from "./svg-illustrations";

const testimonials = [
  {
    id: 1,
    content: "This platform completely transformed my approach to learning. The courses are practical, engaging, and directly applicable to real-world situations. I've gained skills that have advanced my career in ways I never thought possible.",
    author: "Emily Rodriguez",
    role: "Software Developer",
    company: "TechCorp"
  },
  {
    id: 2,
    content: "As someone who struggled with traditional education, finding this platform was a game-changer. The focus on practical skills and the supportive community helped me transition into a new career field with confidence.",
    author: "Marcus Chen",
    role: "UX Designer",
    company: "Creative Solutions"
  },
  {
    id: 3,
    content: "The quality of instruction is unmatched. Each course is thoughtfully designed with clear explanations and hands-on projects. I've recommended this platform to all my colleagues looking to upskill.",
    author: "Sophia Johnson",
    role: "Marketing Director",
    company: "Growth Strategies"
  }
];

export const AboutTestimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1
  });

  const nextTestimonial = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <section ref={ref} className="py-20 md:py-32 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4">
            Success Stories
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            What Our Students Say
          </h3>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Hear from the people whose lives have been transformed through our educational platform.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto relative">
          {/* Quote icon */}
          <div className="absolute -top-10 -left-10 text-purple-200 dark:text-purple-900 opacity-50 z-0">
            <Quote className="w-20 h-20" />
          </div>
          
          {/* Testimonial */}
          <motion.div
            key={currentTestimonial.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-lg relative z-10"
          >
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                <TestimonialAvatar index={currentIndex} />
              </div>
              
              <div className="flex-1">
                <p className="text-gray-700 dark:text-gray-300 text-lg md:text-xl italic mb-6">
                  &ldquo;{currentTestimonial.content}&rdquo;
                </p>
                
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentTestimonial.author}
                  </h4>
                  <p className="text-purple-600 dark:text-purple-400">
                    {currentTestimonial.role}, {currentTestimonial.company}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Navigation */}
          <div className="flex justify-center mt-8 gap-4">
            <button
              onClick={prevTestimonial}
              className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shadow-sm"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-purple-600 dark:bg-purple-400 w-4"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            
            <button
              onClick={nextTestimonial}
              className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shadow-sm"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}; 