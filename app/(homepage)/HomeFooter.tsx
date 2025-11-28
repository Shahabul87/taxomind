"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";
import { Heart, MessageCircle, Github, Twitter, Linkedin, BookOpen, ArrowRight } from "lucide-react";

export const HomeFooter = () => {
  return (
    <>
      {/* Call to Action Section with Angled Design */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden bg-white dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-900">
        {/* Angled divider at top */}
        <div className="absolute top-0 left-0 w-full h-12 sm:h-16 bg-slate-800" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 0)" }}></div>
        
        {/* Glowing orbs */}
        <div className="absolute -top-40 -right-20 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-[64px] sm:blur-[96px] md:blur-[128px] opacity-15 sm:opacity-20"></div>
        <div className="absolute top-[30%] -left-20 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-[64px] sm:blur-[96px] md:blur-[128px] opacity-15 sm:opacity-20"></div>

        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-4 sm:mb-6 inline-block"
            >
              <span className="inline-block py-1.5 px-3 sm:py-2 sm:px-4 rounded-full text-xs sm:text-sm font-medium border dark:bg-slate-800/60 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/20">
                Join Our Community
              </span>
            </motion.div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4 sm:mb-6 px-2 sm:px-0">
              Start Your Learning Journey Today
            </h2>
            <p className="text-slate-600 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
              Join thousands of learners who have already transformed their careers through our platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 items-stretch sm:items-center relative z-20 mt-6 sm:mt-8">
              <Link href="/get-started" className="relative z-20 w-full sm:w-auto" aria-label="Get started for free">
                <motion.span
                  className="inline-flex w-full sm:w-auto items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(120,0,255,0.3)] transition-all duration-300 text-sm sm:text-base"
                  whileHover={{ y: -5 }}
                  whileTap={{ y: 0 }}
                >
                  <span className="mr-2">Get Started Free</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.span>
              </Link>
              <Link href="/courses" className="relative z-20 w-full sm:w-auto" aria-label="Explore courses">
                <motion.span
                  className="inline-flex w-full sm:w-auto items-center justify-center bg-transparent border-2 font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-lg transition-colors duration-300 text-cyan-700 border-cyan-300 hover:bg-cyan-50 dark:text-cyan-400 dark:border-cyan-500 dark:hover:bg-cyan-500/10 text-sm sm:text-base"
                  whileHover={{ y: -5 }}
                  whileTap={{ y: 0 }}
                >
                  View Courses
                </motion.span>
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Wave pattern at bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg className="fill-slate-900" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* Main Footer Section */}
      <footer className="bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-600 dark:text-gray-300 pt-12 sm:pt-16 md:pt-20 pb-6 sm:pb-8 md:pb-10 relative overflow-hidden">
        {/* Subtle background effects */}
        <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[80px] sm:blur-[120px] md:blur-[150px] opacity-10"></div>
        <div className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[80px] sm:blur-[120px] md:blur-[150px] opacity-10"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative">
          {/* Footer Grid */}
          <div className="space-y-6 sm:space-y-0 mb-10 sm:mb-12 md:mb-16">
            {/* Mobile Layout: Brand, then Quick Links + Resources (2 cols), then Newsletter */}
            {/* Desktop Layout: All in one grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
              {/* Brand Section */}
              <div className="space-y-4 sm:space-y-6">
                <Link href="/" className="flex items-center space-x-2">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
                  <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    TaxoMind
                  </span>
                </Link>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Transform your learning journey with AI-powered education. Where minds are forged through intelligent, adaptive learning experiences.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <motion.a
                    whileHover={{ y: -3, backgroundColor: "#1DA1F2", color: "#ffffff" }}
                    href="#"
                    className="rounded-full bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-purple-400 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Follow us on Twitter"
                  >
                    <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.a>
                  <motion.a
                    whileHover={{ y: -3, backgroundColor: "#333", color: "#ffffff" }}
                    href="#"
                    className="rounded-full bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-cyan-400 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="View our GitHub repository"
                  >
                    <Github className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.a>
                  <motion.a
                    whileHover={{ y: -3, backgroundColor: "#0A66C2", color: "#ffffff" }}
                    href="#"
                    className="rounded-full bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-blue-400 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Connect with us on LinkedIn"
                  >
                    <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.a>
                  <motion.a
                    whileHover={{ y: -3, backgroundColor: "#8B5CF6", color: "#ffffff" }}
                    href="#"
                    className="rounded-full bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-purple-400 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Join our community chat"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.a>
                </div>
              </div>

              {/* Quick Links - Hidden on mobile, shown on sm+ */}
              <div className="hidden sm:block sm:col-span-1 lg:col-span-1">
                <h3 className="font-semibold mb-4 sm:mb-6 pl-2 border-l-2 border-cyan-400 text-slate-900 dark:text-white text-sm sm:text-base">Quick Links</h3>
                <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                  {['Courses', 'About Us', 'Contact', 'Blog', 'Enterprise', 'API'].map((item) => (
                    <motion.li key={item} whileHover={{ x: 3 }}>
                      <Link href="#" className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center group">
                        <span className="w-1 h-1 bg-cyan-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        {item}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Resources - Hidden on mobile, shown on sm+ */}
              <div className="hidden sm:block sm:col-span-1 lg:col-span-1">
                <h3 className="font-semibold mb-4 sm:mb-6 pl-2 border-l-2 border-purple-400 text-slate-900 dark:text-white text-sm sm:text-base">Resources</h3>
                <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                  {['Documentation', 'Support', 'Terms of Service', 'Privacy Policy', 'Security', 'Status'].map((item) => (
                    <motion.li key={item} whileHover={{ x: 3 }}>
                      <Link href="#" className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center group">
                        <span className="w-1 h-1 bg-purple-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        {item}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Newsletter */}
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border shadow-xl bg-white/70 border-slate-200 dark:bg-slate-800/30 dark:border-slate-700/50 sm:col-span-2 lg:col-span-1 order-last sm:order-none">
              <h3 className="font-semibold mb-4 sm:mb-6 pl-2 border-l-2 border-gradient-to-r from-cyan-400 to-purple-400 text-slate-900 dark:text-white text-sm sm:text-base">Stay Updated</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 mb-3 sm:mb-4">Subscribe to our newsletter for the latest updates.</p>
              <div className="space-y-2 sm:space-y-3">
                <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  aria-label="Email address"
                  className="w-full bg-white/60 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-gray-300 px-3 py-2 sm:px-4 sm:py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm sm:text-base"
                />
                <button className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all duration-300 text-sm sm:text-base font-semibold" aria-label="Subscribe to newsletter">
                  Subscribe
                </button>
              </div>
              <div className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-slate-500 dark:text-gray-500">
                By subscribing, you agree to our Privacy Policy and consent to receive updates.
              </div>
            </div>
          </div>

          {/* Mobile: Quick Links and Resources in 2 columns */}
          <div className="grid grid-cols-2 gap-6 sm:hidden mb-6">
            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4 pl-2 border-l-2 border-cyan-400 text-slate-900 dark:text-white text-sm">Quick Links</h3>
              <ul className="space-y-2">
                {['Courses', 'About Us', 'Contact', 'Blog', 'Enterprise', 'API'].map((item) => (
                  <motion.li key={item} whileHover={{ x: 3 }}>
                    <Link href="#" className="text-xs text-slate-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center group">
                      <span className="w-1 h-1 bg-cyan-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {item}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4 pl-2 border-l-2 border-purple-400 text-slate-900 dark:text-white text-sm">Resources</h3>
              <ul className="space-y-2">
                {['Documentation', 'Support', 'Terms of Service', 'Privacy Policy', 'Security', 'Status'].map((item) => (
                  <motion.li key={item} whileHover={{ x: 3 }}>
                    <Link href="#" className="text-xs text-slate-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center group">
                      <span className="w-1 h-1 bg-purple-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {item}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 sm:pt-8 mt-6 sm:mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-3 sm:space-y-4 md:space-y-0">
              <div className="text-xs sm:text-sm space-y-2 md:space-y-0 text-center md:text-left">
                <p>© 2024 TaxoMind. All rights reserved.</p>
                <div className="flex flex-wrap gap-3 sm:gap-4 text-slate-500 dark:text-gray-400 justify-center md:justify-start text-xs sm:text-sm">
                  <Link href="/terms" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Terms</Link>
                  <Link href="/privacy" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Privacy</Link>
                  <Link href="/cookies" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Cookies</Link>
                  <Link href="/security" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Security</Link>
                </div>
              </div>
              <p className="text-xs sm:text-sm flex items-center justify-center md:justify-start">
                Made with <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mx-1" /> by the TaxoMind Team
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}; 
