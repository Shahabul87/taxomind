"use client";

import { MessageCircle, Mail, Phone, Video, BookOpen, Zap } from "lucide-react";
import Link from "next/link";

const actions = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our support team in real-time",
    action: "Start Chat",
    href: "#contact",
    gradient: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Get help via email within 24 hours",
    action: "Send Email",
    href: "#contact",
    gradient: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Speak directly with our team",
    action: "Call Now",
    href: "tel:+1234567890",
    gradient: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  {
    icon: Video,
    title: "Video Call",
    description: "Schedule a screen-sharing session",
    action: "Book Session",
    href: "#contact",
    gradient: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Browse our comprehensive guides",
    action: "Explore Docs",
    href: "#resources",
    gradient: "from-indigo-500 to-blue-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
  },
  {
    icon: Zap,
    title: "Quick Fixes",
    description: "Common solutions to popular issues",
    action: "View Fixes",
    href: "#faq",
    gradient: "from-yellow-500 to-amber-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  },
];

export const QuickActions = () => {
  return (
    <div className="relative -mt-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={index}
              href={action.href}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-800 hover:border-transparent overflow-hidden"
            >
              {/* Gradient Border on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`}></div>
              <div className="absolute inset-[1px] bg-white dark:bg-slate-900 rounded-2xl -z-10"></div>

              {/* Icon */}
              <div className={`${action.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 bg-gradient-to-r ${action.gradient} bg-clip-text text-transparent`} />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {action.description}
              </p>

              {/* Action */}
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className={`bg-gradient-to-r ${action.gradient} bg-clip-text text-transparent`}>
                  {action.action}
                </span>
                <svg
                  className={`w-4 h-4 group-hover:translate-x-1 transition-transform bg-gradient-to-r ${action.gradient} bg-clip-text text-transparent`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
