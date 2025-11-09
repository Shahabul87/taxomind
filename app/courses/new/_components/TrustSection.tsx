"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Star,
  Quote,
  PlayCircle,
  Award,
  TrendingUp,
  Users,
  CheckCircle,
  Trophy,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrustSectionProps {
  statistics: {
    totalEnrollments: number;
    averageRating: number;
  };
}

export function TrustSection({ statistics }: TrustSectionProps) {
  const [selectedTestimonial, setSelectedTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Senior Software Engineer at Google",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      rating: 5,
      quote: "Taxomind transformed my career. The AI-powered learning paths helped me transition from junior to senior developer in just 18 months. The practical projects were invaluable.",
      achievement: "Promoted to Senior Engineer",
      salaryIncrease: "$35K increase",
      coursesCompleted: 12,
      video: false
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Data Scientist at Amazon",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      rating: 5,
      quote: "The machine learning courses here are top-notch. Real instructors with industry experience, not just theorists. I landed my dream job at Amazon thanks to the skills I gained.",
      achievement: "Career Switch to Data Science",
      salaryIncrease: "$45K increase",
      coursesCompleted: 15,
      video: true
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      role: "UX Designer at Meta",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
      rating: 5,
      quote: "The design courses are incredibly comprehensive. From UI fundamentals to advanced prototyping, everything is covered. The certificate helped me get interviews at top companies.",
      achievement: "Transitioned to Tech from Marketing",
      salaryIncrease: "$28K increase",
      coursesCompleted: 9,
      video: false
    }
  ];

  const achievements = [
    {
      icon: Trophy,
      title: "Best Online Learning Platform 2024",
      organization: "EdTech Awards",
      gradient: "from-amber-500 to-orange-600"
    },
    {
      icon: Award,
      title: "Excellence in Digital Education",
      organization: "Global Education Forum",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      icon: Star,
      title: "4.8 Average Rating",
      organization: "50,000+ Student Reviews",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: Users,
      title: "Trusted by 500+ Companies",
      organization: "Fortune 500 Partners",
      gradient: "from-emerald-500 to-teal-600"
    }
  ];

  const successMetrics = [
    {
      icon: TrendingUp,
      value: "85%",
      label: "Career Advancement",
      description: "of learners report career growth within 6 months"
    },
    {
      icon: Briefcase,
      value: "$42K",
      label: "Avg. Salary Increase",
      description: "reported by our graduates"
    },
    {
      icon: CheckCircle,
      value: "94%",
      label: "Completion Rate",
      description: "significantly higher than industry average"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-4 py-2">
            <Star className="w-4 h-4 mr-2" />
            Trusted by Professionals Worldwide
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Join Thousands of Success Stories
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Our learners are landing jobs at top companies, getting promoted, and transforming their careers every day
          </p>
        </motion.div>

        {/* Success Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
        >
          {successMetrics.map((metric, index) => (
            <Card key={index} className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <metric.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-5xl font-bold text-slate-900 dark:text-white mb-2">
                  {metric.value}
                </h3>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {metric.label}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Testimonials Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <Card className="border-0 bg-gradient-to-br from-blue-600 to-indigo-600 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Left - Testimonial */}
                <div className="text-white">
                  <Quote className="w-12 h-12 mb-6 opacity-50" />
                  <p className="text-2xl md:text-3xl font-medium leading-relaxed mb-8">
                    &quot;{testimonials[selectedTestimonial].quote}&quot;
                  </p>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-white/20">
                      <Image
                        src={testimonials[selectedTestimonial].avatar}
                        alt={testimonials[selectedTestimonial].name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold">{testimonials[selectedTestimonial].name}</h4>
                      <p className="text-blue-100">{testimonials[selectedTestimonial].role}</p>
                    </div>
                    {testimonials[selectedTestimonial].video && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="ml-auto bg-white/10 hover:bg-white/20 text-white"
                      >
                        <PlayCircle className="w-6 h-6" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <p className="text-sm opacity-80 mb-1">Achievement</p>
                      <p className="font-semibold text-sm">{testimonials[selectedTestimonial].achievement}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <p className="text-sm opacity-80 mb-1">Salary</p>
                      <p className="font-semibold text-sm">{testimonials[selectedTestimonial].salaryIncrease}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <p className="text-sm opacity-80 mb-1">Courses</p>
                      <p className="font-semibold text-sm">{testimonials[selectedTestimonial].coursesCompleted} completed</p>
                    </div>
                  </div>
                </div>

                {/* Right - Thumbnails */}
                <div className="space-y-4">
                  {testimonials.map((testimonial, index) => (
                    <button
                      key={testimonial.id}
                      onClick={() => setSelectedTestimonial(index)}
                      className={cn(
                        "w-full p-4 rounded-2xl transition-all duration-300 text-left",
                        index === selectedTestimonial
                          ? "bg-white text-slate-900 shadow-xl scale-105"
                          : "bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold truncate">{testimonial.name}</h5>
                          <p className={cn(
                            "text-sm truncate",
                            index === selectedTestimonial ? "text-slate-600" : "text-blue-100"
                          )}>
                            {testimonial.role}
                          </p>
                        </div>
                        {testimonial.video && (
                          <PlayCircle className="w-5 h-5 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievement Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-8">
            Industry Recognition & Awards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <Card
                key={index}
                className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group hover:-translate-y-2"
              >
                <CardContent className="p-6 text-center">
                  <div className={cn(
                    "w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform",
                    achievement.gradient
                  )}>
                    <achievement.icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                    {achievement.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {achievement.organization}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Real-time Enrollment Ticker */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Card className="inline-block border-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl rounded-full px-8 py-4">
            <p className="text-lg font-medium">
              🎉 <span className="font-bold">{Math.floor(Math.random() * 50) + 10}</span> students enrolled in the last hour!
            </p>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
