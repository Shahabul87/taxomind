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
      <section className="relative py-24 overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
        {/* Angled divider at top */}
        <div className="absolute top-0 left-0 w-full h-16 bg-slate-800" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 0)" }}></div>
        
        {/* Glowing orbs */}
        <div className="absolute -top-40 -right-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute top-[30%] -left-20 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-10"></div>
        
        <div className="container mx-auto px-4 relative">
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
              className="mb-6 inline-block"
            >
              <span className="inline-block py-2 px-4 bg-slate-800/60 rounded-full text-sm font-medium text-cyan-400 border border-cyan-500/20">
                Join Our Community
              </span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-6">
              Start Your Learning Journey Today
            </h2>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Join thousands of learners who have already transformed their careers through our platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 items-center relative z-20 mt-8">
              <Link href="/get-started" className="relative z-20 w-full sm:w-auto">
                <motion.button
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(120,0,255,0.3)] transition-all duration-300"
                  whileHover={{ y: -5 }}
                  whileTap={{ y: 0 }}
                >
                  <div className="flex items-center justify-center">
                    <span className="mr-2">Get Started Free</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </motion.button>
              </Link>
              <Link href="/courses" className="relative z-20 w-full sm:w-auto">
                <motion.button
                  className="w-full sm:w-auto bg-transparent border-2 border-cyan-500 text-cyan-400 font-bold py-4 px-8 rounded-lg hover:bg-cyan-500/10 transition-colors duration-300"
                  whileHover={{ y: -5 }}
                  whileTap={{ y: 0 }}
                >
                  View Courses
                </motion.button>
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
      <footer className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-gray-300 pt-20 pb-10 relative overflow-hidden">
        {/* Subtle background effects */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[150px] opacity-10"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[150px] opacity-10"></div>
        
        <div className="container mx-auto px-4 relative">
          {/* Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-16">
            {/* Brand Section */}
            <div className="space-y-6">
              <Link href="/" className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-purple-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  TaxoMind
                </span>
              </Link>
              <p className="text-sm leading-relaxed">
                Transform your learning journey with AI-powered education. Where minds are forged through intelligent, adaptive learning experiences.
              </p>
              <div className="flex flex-wrap gap-3">
                <motion.a
                  whileHover={{ y: -3, backgroundColor: "#1DA1F2", color: "#ffffff" }}
                  href="#"
                  className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-purple-400 transition-all duration-300"
                >
                  <Twitter className="w-5 h-5" />
                </motion.a>
                <motion.a
                  whileHover={{ y: -3, backgroundColor: "#333", color: "#ffffff" }}
                  href="#"
                  className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-cyan-400 transition-all duration-300"
                >
                  <Github className="w-5 h-5" />
                </motion.a>
                <motion.a
                  whileHover={{ y: -3, backgroundColor: "#0A66C2", color: "#ffffff" }}
                  href="#"
                  className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-blue-400 transition-all duration-300"
                >
                  <Linkedin className="w-5 h-5" />
                </motion.a>
                <motion.a
                  whileHover={{ y: -3, backgroundColor: "#8B5CF6", color: "#ffffff" }}
                  href="#"
                  className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-purple-400 transition-all duration-300"
                >
                  <MessageCircle className="w-5 h-5" />
                </motion.a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-6 pl-2 border-l-2 border-cyan-400">Quick Links</h3>
              <ul className="space-y-4">
                {['Courses', 'About Us', 'Contact', 'Blog', 'Enterprise', 'API'].map((item) => (
                  <motion.li key={item} whileHover={{ x: 3 }}>
                    <Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center group">
                      <span className="w-1 h-1 bg-cyan-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {item}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-semibold mb-6 pl-2 border-l-2 border-purple-400">Resources</h3>
              <ul className="space-y-4">
                {['Documentation', 'Support', 'Terms of Service', 'Privacy Policy', 'Security', 'Status'].map((item) => (
                  <motion.li key={item} whileHover={{ x: 3 }}>
                    <Link href="#" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center group">
                      <span className="w-1 h-1 bg-purple-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {item}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
              <h3 className="text-white font-semibold mb-6 pl-2 border-l-2 border-gradient-to-r from-cyan-400 to-purple-400">Stay Updated</h3>
              <p className="text-sm mb-4">Subscribe to our newsletter for the latest updates.</p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-slate-800/50 border border-slate-700 text-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all duration-300">
                  Subscribe
                </button>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                By subscribing, you agree to our Privacy Policy and consent to receive updates.
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-700 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm space-y-2 md:space-y-0 text-center md:text-left">
                <p>© 2024 TaxoMind. All rights reserved.</p>
                <div className="flex flex-wrap gap-4 text-gray-400 justify-center md:justify-start">
                  <Link href="/terms" className="hover:text-purple-400 transition-colors">Terms</Link>
                  <Link href="/privacy" className="hover:text-purple-400 transition-colors">Privacy</Link>
                  <Link href="/cookies" className="hover:text-purple-400 transition-colors">Cookies</Link>
                  <Link href="/security" className="hover:text-purple-400 transition-colors">Security</Link>
                </div>
              </div>
              <p className="text-sm flex items-center">
                Made with <Heart className="w-4 h-4 text-red-500 mx-1" /> by the TaxoMind Team
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}; 