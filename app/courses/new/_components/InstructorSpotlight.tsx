"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Star, Users, BookOpen, Award, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Instructor {
  id: string;
  name: string;
  avatar?: string;
  coursesCount: number;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
}

interface InstructorSpotlightProps {
  instructors: Instructor[];
}

export function InstructorSpotlight({ instructors }: InstructorSpotlightProps) {
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
          <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 px-4 py-2">
            <Award className="w-4 h-4 mr-2" />
            Expert Instructors
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Learn From Industry Leaders
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            World-class instructors with real-world experience teaching on our platform
          </p>
        </motion.div>

        {/* Instructors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {instructors.slice(0, 8).map((instructor, index) => (
            <motion.div
              key={instructor.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Card className="group border-0 bg-white dark:bg-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden hover:-translate-y-2">
                <CardContent className="p-6 text-center">
                  {/* Avatar */}
                  <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg group-hover:scale-110 transition-transform">
                    {instructor.avatar ? (
                      <Image
                        src={instructor.avatar.replace(/^http:\/\//i, 'https://')}
                        alt={instructor.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                        {instructor.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    {instructor.name}
                  </h3>

                  {/* Rating */}
                  {instructor.rating > 0 && (
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {instructor.rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({instructor.reviewsCount})
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <BookOpen className="w-4 h-4" />
                      <span>{instructor.coursesCount} courses</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>{instructor.studentsCount.toLocaleString()} students</span>
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors"
                    asChild
                  >
                    <Link href={`/instructors/${instructor.id}`}>
                      View Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Become Instructor CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <Card className="inline-block border-0 bg-gradient-to-r from-purple-600 to-pink-600 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Share Your Expertise</h3>
              <p className="text-purple-100 mb-4">Join our community of world-class instructors</p>
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50"
              >
                Become an Instructor
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
