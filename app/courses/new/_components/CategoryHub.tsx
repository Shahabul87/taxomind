"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Code2,
  Brain,
  Briefcase,
  Palette,
  TrendingUp,
  User,
  Languages,
  Shield,
  Database,
  Laptop,
  Smartphone,
  Cloud,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategoryHubProps {
  categories: Category[];
}

export function CategoryHub({ categories }: CategoryHubProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Map categories to icons and colors
  const categoryConfig: Record<string, { icon: React.ElementType; gradient: string; subcategories: string[] }> = {
    "Programming": {
      icon: Code2,
      gradient: "from-blue-500 to-indigo-600",
      subcategories: ["Web Development", "Mobile Apps", "Game Development"]
    },
    "Data Science": {
      icon: Database,
      gradient: "from-purple-500 to-pink-600",
      subcategories: ["Machine Learning", "Data Analysis", "Big Data"]
    },
    "Business": {
      icon: Briefcase,
      gradient: "from-emerald-500 to-teal-600",
      subcategories: ["Management", "Entrepreneurship", "Finance"]
    },
    "Design": {
      icon: Palette,
      gradient: "from-pink-500 to-rose-600",
      subcategories: ["UI/UX Design", "Graphic Design", "3D Modeling"]
    },
    "Marketing": {
      icon: TrendingUp,
      gradient: "from-orange-500 to-amber-600",
      subcategories: ["Digital Marketing", "SEO", "Social Media"]
    },
    "Personal Development": {
      icon: User,
      gradient: "from-cyan-500 to-blue-600",
      subcategories: ["Leadership", "Productivity", "Communication"]
    },
    "Language": {
      icon: Languages,
      gradient: "from-green-500 to-emerald-600",
      subcategories: ["English", "Spanish", "Mandarin"]
    },
    "IT & Security": {
      icon: Shield,
      gradient: "from-red-500 to-orange-600",
      subcategories: ["Cybersecurity", "Cloud Computing", "DevOps"]
    },
    "Artificial Intelligence": {
      icon: Brain,
      gradient: "from-indigo-500 to-purple-600",
      subcategories: ["Deep Learning", "NLP", "Computer Vision"]
    },
    "Web Development": {
      icon: Laptop,
      gradient: "from-teal-500 to-cyan-600",
      subcategories: ["Frontend", "Backend", "Full Stack"]
    },
    "Mobile Development": {
      icon: Smartphone,
      gradient: "from-violet-500 to-purple-600",
      subcategories: ["iOS Development", "Android", "React Native"]
    },
    "Cloud Computing": {
      icon: Cloud,
      gradient: "from-sky-500 to-blue-600",
      subcategories: ["AWS", "Azure", "Google Cloud"]
    }
  };

  // Get configured category or use default
  const getCategoryConfig = (categoryName: string) => {
    // Try exact match first
    if (categoryConfig[categoryName]) {
      return categoryConfig[categoryName];
    }

    // Try partial match
    const matchedKey = Object.keys(categoryConfig).find(key =>
      categoryName.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(categoryName.toLowerCase())
    );

    if (matchedKey) {
      return categoryConfig[matchedKey];
    }

    // Default fallback
    return {
      icon: Code2,
      gradient: "from-slate-500 to-slate-600",
      subcategories: ["Beginner", "Intermediate", "Advanced"]
    };
  };

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
          <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Explore by Category
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Find Your Perfect Learning Path
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Discover courses across diverse categories, taught by industry experts
          </p>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {categories.slice(0, 12).map((category, index) => {
            const config = getCategoryConfig(category.name);
            const IconComponent = config.icon;
            const isHovered = hoveredCategory === category.id;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Link href={`/courses?categories=${category.id}`}>
                  <Card
                    className="group relative border-0 bg-white dark:bg-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer h-full"
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    {/* Background Gradient Overlay */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                      config.gradient
                    )} />

                    <CardContent className="p-6 relative">
                      {/* Icon */}
                      <div className={cn(
                        "w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300",
                        config.gradient
                      )}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>

                      {/* Category Name */}
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {category.name}
                      </h3>

                      {/* Course Count */}
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {category.count} {category.count === 1 ? 'course' : 'courses'}
                      </p>

                      {/* Subcategories (show on hover) */}
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={isHovered ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                          {config.subcategories.map((sub, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {sub}
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Arrow Icon */}
                      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* View All Categories CTA */}
        {categories.length > 12 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <Button
              size="lg"
              variant="outline"
              className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-900 dark:text-white shadow-lg px-8 py-6 text-lg group"
              asChild
            >
              <Link href="/courses">
                View All {categories.length} Categories
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        )}

        {/* Popular Learning Paths */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 pt-12 border-t border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            Popular Learning Paths
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Full Stack Developer",
                courses: 8,
                duration: "6 months",
                level: "Intermediate",
                gradient: "from-blue-500 to-indigo-600"
              },
              {
                title: "Data Scientist",
                courses: 10,
                duration: "8 months",
                level: "Advanced",
                gradient: "from-purple-500 to-pink-600"
              },
              {
                title: "UX/UI Designer",
                courses: 6,
                duration: "4 months",
                level: "Beginner",
                gradient: "from-pink-500 to-rose-600"
              }
            ].map((path, index) => (
              <Card
                key={index}
                className={cn(
                  "border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group cursor-pointer",
                  "bg-gradient-to-br",
                  path.gradient
                )}
              >
                <CardContent className="p-6 text-white">
                  <h4 className="text-2xl font-bold mb-3 group-hover:scale-105 transition-transform">
                    {path.title}
                  </h4>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                        {path.courses} courses
                      </Badge>
                      <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                        {path.duration}
                      </Badge>
                    </div>
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                      {path.level}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    Start Learning Path
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
