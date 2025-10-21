"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  DollarSign,
  Users,
  BookOpen,
  Award,
  Video,
  FileText,
  Globe,
  Zap,
  TrendingUp,
  BarChart3
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  enrolledCount: number;
  duration: number; // in hours
  chaptersCount: number;
  lessonsCount: number;
  difficulty: string;
  language: string;
  lastUpdated: Date;
  instructor: {
    name: string;
    avatar?: string;
    rating: number;
    studentCount: number;
  };
  features: {
    hasCertificate: boolean;
    hasLifetimeAccess: boolean;
    hasExercises: boolean;
    hasDownloadableResources: boolean;
    hasSubtitles: boolean;
    hasMobileAccess: boolean;
  };
  skills: string[];
  prerequisites: string[];
  whatYouWillLearn: string[];
  completionRate: number;
}

interface ComparisonCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: Array<{
    key: keyof CourseDetails | string;
    label: string;
    format?: (value: any) => string;
    highlight?: "higher" | "lower" | "boolean";
  }>;
}

interface CourseComparisonToolProps {
  isOpen: boolean;
  onClose: () => void;
  initialCourses?: CourseDetails[];
  maxCourses?: number;
  onSelectCourse?: (courseId: string) => void;
}

export function CourseComparisonTool({
  isOpen,
  onClose,
  initialCourses = [],
  maxCourses = 3,
  onSelectCourse
}: CourseComparisonToolProps) {
  const [selectedCourses, setSelectedCourses] = useState<CourseDetails[]>(initialCourses);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basic", "pricing"]));

  const comparisonCategories: ComparisonCategory[] = [
    {
      name: "Basic Information",
      icon: BookOpen,
      fields: [
        { key: "title", label: "Course Title" },
        { key: "difficulty", label: "Difficulty Level" },
        { key: "language", label: "Language" },
        { key: "duration", label: "Total Duration", format: (v) => `${v} hours` },
        { key: "chaptersCount", label: "Chapters", highlight: "higher" },
        { key: "lessonsCount", label: "Lessons", highlight: "higher" }
      ]
    },
    {
      name: "Pricing & Value",
      icon: DollarSign,
      fields: [
        { key: "price", label: "Price", format: formatPrice, highlight: "lower" },
        { key: "originalPrice", label: "Original Price", format: formatPrice },
        {
          key: "pricePerHour",
          label: "Price per Hour",
          format: (v) => formatPrice(v),
          highlight: "lower"
        }
      ]
    },
    {
      name: "Ratings & Popularity",
      icon: Star,
      fields: [
        { key: "rating", label: "Rating", format: (v) => `${v.toFixed(1)} ⭐`, highlight: "higher" },
        { key: "reviewsCount", label: "Reviews", format: (v) => v.toLocaleString(), highlight: "higher" },
        { key: "enrolledCount", label: "Students Enrolled", format: (v) => v.toLocaleString(), highlight: "higher" },
        { key: "completionRate", label: "Completion Rate", format: (v) => `${v}%`, highlight: "higher" }
      ]
    },
    {
      name: "Instructor",
      icon: Users,
      fields: [
        { key: "instructor.name", label: "Instructor Name" },
        { key: "instructor.rating", label: "Instructor Rating", format: (v) => `${v.toFixed(1)} ⭐`, highlight: "higher" },
        { key: "instructor.studentCount", label: "Total Students", format: (v) => v.toLocaleString(), highlight: "higher" }
      ]
    },
    {
      name: "Features",
      icon: Award,
      fields: [
        { key: "features.hasCertificate", label: "Certificate", highlight: "boolean" },
        { key: "features.hasLifetimeAccess", label: "Lifetime Access", highlight: "boolean" },
        { key: "features.hasExercises", label: "Practice Exercises", highlight: "boolean" },
        { key: "features.hasDownloadableResources", label: "Downloadable Resources", highlight: "boolean" },
        { key: "features.hasSubtitles", label: "Subtitles", highlight: "boolean" },
        { key: "features.hasMobileAccess", label: "Mobile Access", highlight: "boolean" }
      ]
    }
  ];

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  const addCourse = (course: CourseDetails) => {
    if (selectedCourses.length < maxCourses) {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourses(selectedCourses.filter(c => c.id !== courseId));
  };

  const getFieldValue = (course: CourseDetails, fieldKey: string): any => {
    const keys = fieldKey.split(".");
    let value: any = course;
    for (const key of keys) {
      value = value?.[key];
    }
    return value;
  };

  const getBestValue = (field: any, courses: CourseDetails[]) => {
    if (field.highlight === "boolean") {
      return courses.some(c => getFieldValue(c, field.key) === true);
    }

    // Special handling for calculated fields
    if (field.key === "pricePerHour") {
      const values = courses.map(c => c.price / c.duration).filter(v => v !== undefined && !isNaN(v));
      if (values.length === 0) return null;
      return field.highlight === "lower" ? Math.min(...values) : Math.max(...values);
    }

    const values = courses.map(c => getFieldValue(c, field.key)).filter(v => v !== undefined);
    if (values.length === 0) return null;

    if (field.highlight === "higher") {
      return Math.max(...values);
    } else if (field.highlight === "lower") {
      return Math.min(...values);
    }
    return null;
  };

  const renderFieldValue = (course: CourseDetails, field: any) => {
    // Special handling for calculated fields
    if (field.key === "pricePerHour") {
      const value = course.price / course.duration;
      const formattedValue = formatPrice(value);
      const bestValue = getBestValue(field, selectedCourses);
      const isBest = field.highlight && value === bestValue;

      return (
        <span className={cn(isBest && "font-bold text-green-600 dark:text-green-400")}>
          {formattedValue}
          {isBest && <Zap className="inline h-3 w-3 ml-1" />}
        </span>
      );
    }

    const value = getFieldValue(course, field.key);

    if (value === undefined || value === null) {
      return <span className="text-muted-foreground">-</span>;
    }

    if (field.highlight === "boolean") {
      return value ? (
        <Badge variant="default" className="bg-green-500">
          <Check className="h-3 w-3 mr-1" />
          Yes
        </Badge>
      ) : (
        <Badge variant="secondary">
          <X className="h-3 w-3 mr-1" />
          No
        </Badge>
      );
    }

    const formattedValue = field.format ? field.format(value) : value.toString();
    const bestValue = getBestValue(field, selectedCourses);
    const isBest = field.highlight && value === bestValue;

    return (
      <span className={cn(isBest && "font-bold text-green-600 dark:text-green-400")}>
        {formattedValue}
        {isBest && <Zap className="inline h-3 w-3 ml-1" />}
      </span>
    );
  };

  // Mock course for demo
  const mockAvailableCourse: CourseDetails = {
    id: "mock-1",
    title: "Advanced React Development",
    description: "Master React with advanced patterns",
    imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjMzNCODJGNiIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMjUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjAiPkFkdmFuY2VkIFJlYWN0PC90ZXh0Pjwvc3ZnPg==",
    price: 89,
    originalPrice: 199,
    rating: 4.8,
    reviewsCount: 2341,
    enrolledCount: 15234,
    duration: 24,
    chaptersCount: 12,
    lessonsCount: 156,
    difficulty: "Advanced",
    language: "English",
    lastUpdated: new Date(),
    instructor: {
      name: "Dr. Sarah Johnson",
      rating: 4.9,
      studentCount: 50000
    },
    features: {
      hasCertificate: true,
      hasLifetimeAccess: true,
      hasExercises: true,
      hasDownloadableResources: true,
      hasSubtitles: true,
      hasMobileAccess: true
    },
    skills: ["React", "Redux", "TypeScript"],
    prerequisites: ["Basic React knowledge"],
    whatYouWillLearn: ["Advanced patterns", "Performance optimization"],
    completionRate: 78
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Course Comparison Tool
          </DialogTitle>
          <DialogDescription>
            Compare up to {maxCourses} courses side by side to make an informed decision
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Course Selection Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: maxCourses }).map((_, index) => (
                <div key={index} className="space-y-2">
                  {selectedCourses[index] ? (
                    <Card className="p-3 relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => removeCourse(selectedCourses[index].id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="flex flex-col items-center text-center">
                        <div className="relative w-full h-24 mb-2 rounded overflow-hidden">
                          <Image
                            src={selectedCourses[index].imageUrl}
                            alt={selectedCourses[index].title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <h4 className="font-medium text-sm line-clamp-2">
                          {selectedCourses[index].title}
                        </h4>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-6 border-dashed">
                      <Button
                        variant="ghost"
                        className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground"
                        onClick={() => addCourse(mockAvailableCourse)}
                      >
                        <Plus className="h-8 w-8 mb-2" />
                        <span>Add Course</span>
                      </Button>
                    </Card>
                  )}
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            {selectedCourses.length > 0 && (
              <div className="space-y-4">
                {comparisonCategories.map((category) => {
                  const Icon = category.icon;
                  const isExpanded = expandedSections.has(category.name.toLowerCase().replace(/\s+/g, "-"));

                  return (
                    <div key={category.name} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(category.name.toLowerCase().replace(/\s+/g, "-"))}
                        className="w-full px-4 py-3 bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <span className="font-semibold">{category.name}</span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 space-y-3">
                              {category.fields.map((field) => (
                                <div key={field.label} className="grid grid-cols-4 gap-4 items-center">
                                  <div className="font-medium text-sm">
                                    {field.label}
                                  </div>
                                  {selectedCourses.map((course) => (
                                    <div key={course.id} className="text-sm">
                                      {renderFieldValue(course, field)}
                                    </div>
                                  ))}
                                  {Array.from({ length: maxCourses - selectedCourses.length }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                  ))}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Action Buttons */}
                {selectedCourses.length > 0 && (
                  <div className="flex justify-end gap-3 pt-4">
                    {selectedCourses.map((course) => (
                      <Link key={course.id} href={`/courses/${course.id}`}>
                        <Button variant="outline">
                          View {course.title.split(" ").slice(0, 2).join(" ")}...
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}