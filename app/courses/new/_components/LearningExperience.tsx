"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Smartphone,
  Target,
  BarChart3,
  MessageSquare,
  Award,
  RefreshCw,
  Users2,
  Sparkles,
  Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LearningExperience() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning Paths",
      description: "Personalized course recommendations based on your goals, skills, and learning pace",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: Smartphone,
      title: "Learn Anywhere, Anytime",
      description: "Access courses on mobile, tablet, or desktop with offline download capability",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: Target,
      title: "Personalized Recommendations",
      description: "Smart algorithms suggest courses that match your career goals and interests",
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      icon: BarChart3,
      title: "Progress Analytics Dashboard",
      description: "Track your learning journey with detailed insights and performance metrics",
      gradient: "from-amber-500 to-orange-600"
    },
    {
      icon: MessageSquare,
      title: "Live Discussion Forums",
      description: "Connect with peers, ask questions, and learn from the community",
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      icon: Award,
      title: "Certificates & Badges",
      description: "Earn industry-recognized certificates and showcase your achievements",
      gradient: "from-rose-500 to-pink-600"
    },
    {
      icon: RefreshCw,
      title: "Lifetime Access",
      description: "Once enrolled, access course materials forever with free updates",
      gradient: "from-teal-500 to-cyan-600"
    },
    {
      icon: Users2,
      title: "Peer Collaboration Tools",
      description: "Work on group projects and learn from fellow students worldwide",
      gradient: "from-violet-500 to-purple-600"
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Platform Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            A Complete Learning Experience
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Everything you need to learn, grow, and succeed in one powerful platform
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Card className="group h-full border-0 bg-white dark:bg-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden hover:-translate-y-2">
                  <CardContent className="p-6">
                    <div className={cn(
                      "w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform",
                      feature.gradient
                    )}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile App Promo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20"
        >
          <Card className="border-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-white">
                  <Badge className="mb-4 bg-white/20 backdrop-blur-sm text-white border-0">
                    <Zap className="w-4 h-4 mr-2" />
                    Mobile App
                  </Badge>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">
                    Learn On The Go
                  </h3>
                  <p className="text-xl text-blue-100 mb-6">
                    Download our mobile app and take your learning anywhere. Access courses offline, track progress, and never miss a lesson.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 hover:bg-white/20 transition-colors cursor-pointer">
                      <p className="text-sm font-medium">📱 App Store</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 hover:bg-white/20 transition-colors cursor-pointer">
                      <p className="text-sm font-medium">🤖 Google Play</p>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="aspect-square bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                    <Smartphone className="w-32 h-32 text-white/50" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
