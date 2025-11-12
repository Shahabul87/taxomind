"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const faqs = [
  {
    category: "Account & Login",
    questions: [
      {
        question: "How do I reset my password?",
        answer: "To reset your password, click on the 'Forgot Password' link on the login page. You'll receive an email with instructions to create a new password within 5 minutes."
      },
      {
        question: "How do I update my profile information?",
        answer: "Navigate to your Profile Settings from the dashboard menu. You can update your name, email, profile picture, and other personal details there."
      },
    ]
  },
  {
    category: "Courses",
    questions: [
      {
        question: "How do I create a new course?",
        answer: "Navigate to the Teacher Dashboard, click on 'Create Course', and follow the step-by-step guide to set up your course content, pricing, and materials."
      },
      {
        question: "Can I download course materials?",
        answer: "Yes, most course materials are available for download. Look for the download icon next to downloadable resources in your course content."
      },
      {
        question: "How do I contact my instructor?",
        answer: "You can message your instructor directly through the course dashboard using the 'Message Instructor' button or through the messaging system."
      },
    ]
  },
  {
    category: "Billing & Payments",
    questions: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for course purchases and subscriptions."
      },
      {
        question: "Can I get a refund?",
        answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with a course, you can request a full refund within 30 days of purchase."
      },
    ]
  },
];

export const FAQSection = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
          <HelpCircle className="w-4 h-4" />
          Frequently Asked Questions
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Find Quick Answers
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Search our FAQ database for instant solutions to common questions
        </p>

        {/* Search */}
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-white dark:bg-slate-900 border-gray-300 dark:border-gray-700 rounded-xl"
          />
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="max-w-4xl mx-auto space-y-8">
        {filteredFaqs.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {category.category}
            </h3>
            <Accordion type="single" collapsible className="space-y-3">
              {category.questions.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${categoryIndex}-${index}`}
                  className={cn(
                    "rounded-xl",
                    "bg-white dark:bg-slate-900",
                    "border border-gray-200 dark:border-gray-800",
                    "px-6",
                    "shadow-sm hover:shadow-md",
                    "transition-all duration-200"
                  )}
                >
                  <AccordionTrigger
                    className={cn(
                      "text-base font-medium",
                      "text-gray-900 dark:text-gray-100",
                      "hover:text-blue-600 dark:hover:text-blue-400",
                      "py-5",
                      "[&[data-state=open]>svg]:text-blue-600 dark:[&[data-state=open]>svg]:text-blue-400"
                    )}
                  >
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent
                    className={cn(
                      "text-sm",
                      "text-gray-600 dark:text-gray-300",
                      "pb-5",
                      "leading-relaxed"
                    )}
                  >
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No FAQs found matching your search. Try different keywords or{" "}
              <a href="#contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                contact support
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 