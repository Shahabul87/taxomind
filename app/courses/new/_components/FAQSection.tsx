"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, MessageCircle, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How do I enroll in a course?",
      answer: "Simply browse our course catalog, select a course that interests you, and click the 'Enroll Now' button. If it's a paid course, you'll be directed to checkout. For free courses, you'll get instant access."
    },
    {
      question: "What's your refund policy?",
      answer: "We offer a 30-day money-back guarantee for all paid courses. If you're not satisfied with your purchase, contact our support team within 30 days for a full refund, no questions asked."
    },
    {
      question: "Do you offer certificates upon completion?",
      answer: "Yes! Upon completing a course, you'll receive a digital certificate of completion that you can share on LinkedIn, add to your resume, or display on your professional portfolio."
    },
    {
      question: "Can I download course content for offline viewing?",
      answer: "Absolutely! Our mobile app allows you to download video lectures and course materials for offline access. Perfect for learning on the go without an internet connection."
    },
    {
      question: "How does the free trial work?",
      answer: "Many of our courses offer a free preview of selected lessons. You can watch these without creating an account. For full access, you can start with our 7-day free trial on select subscription plans."
    },
    {
      question: "Are courses self-paced or scheduled?",
      answer: "Most of our courses are self-paced, allowing you to learn at your own schedule. Some advanced courses may have cohort-based schedules with live sessions and deadlines."
    },
    {
      question: "Do you offer team or enterprise plans?",
      answer: "Yes! We offer custom enterprise solutions with bulk licensing, team management tools, advanced analytics, and dedicated support. Contact our sales team for more information."
    },
    {
      question: "How often is course content updated?",
      answer: "We regularly update course content to ensure it remains current with industry trends. When enrolled, you'll receive all future updates for free and be notified when new content is added."
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left - Header & Contact */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-4 py-2">
              <HelpCircle className="w-4 h-4 mr-2" />
              Support
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
              Find answers to common questions about our platform and courses
            </p>

            {/* Contact Cards */}
            <div className="space-y-4">
              <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                        Live Chat Support
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        Get instant answers from our support team
                      </p>
                      <Button size="sm" variant="outline">
                        Start Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                        Email Support
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        We typically respond within 24 hours
                      </p>
                      <Button size="sm" variant="outline">
                        Send Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Help Center Link */}
            <div className="mt-8">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Can&apos;t find what you&apos;re looking for?
              </p>
              <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400">
                Visit our Help Center →
              </Button>
            </div>
          </motion.div>

          {/* Right - FAQ Accordion */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="border-0 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden"
              >
                <CardContent className="p-0">
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full p-6 text-left flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform flex-shrink-0 mt-1",
                        openIndex === index && "transform rotate-180"
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-0">
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Card className="inline-block border-0 bg-gradient-to-r from-purple-600 to-pink-600 shadow-2xl rounded-3xl">
            <CardContent className="p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
              <p className="text-purple-100 mb-4">Our support team is here to help you succeed</p>
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50"
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
