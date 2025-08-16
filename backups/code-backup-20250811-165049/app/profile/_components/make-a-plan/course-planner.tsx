"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  BookOpen,
  FileText,
  Video,
  CheckCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  MoreVertical,
  Play
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ContentType = 'video' | 'text' | 'exercise' | 'quiz';

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  duration: number; // Minutes
  status: 'draft' | 'ready' | 'published';
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  isExpanded: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  estimatedCompletion: Date;
}

interface CoursePlannerProps {
  userId: string;
}

export function CoursePlanner({ userId }: CoursePlannerProps) {
  // Demo course data
  const [course, setCourse] = useState<Course>({
    id: "1",
    title: "Complete Web Development Bootcamp",
    description: "A comprehensive course covering HTML, CSS, JavaScript, React, and Node.js",
    estimatedCompletion: new Date(Date.now() + 86400000 * 60), // 60 days
    modules: [
      {
        id: "m1",
        title: "HTML Fundamentals",
        description: "Learn the basics of HTML structure and elements",
        isExpanded: true,
        lessons: [
          {
            id: "l1",
            title: "Introduction to HTML",
            description: "Overview of HTML and its role in web development",
            type: "video",
            duration: 15,
            status: 'published'
          },
          {
            id: "l2",
            title: "HTML Document Structure",
            description: "Understanding the basic structure of HTML documents",
            type: "text",
            duration: 20,
            status: 'published'
          },
          {
            id: "l3",
            title: "Working with HTML Forms",
            description: "Learn to create and handle form elements",
            type: "exercise",
            duration: 30,
            status: 'draft'
          }
        ]
      },
      {
        id: "m2",
        title: "CSS Styling",
        description: "Master CSS to create beautiful layouts",
        isExpanded: false,
        lessons: [
          {
            id: "l4",
            title: "CSS Selectors",
            description: "Understanding different types of CSS selectors",
            type: "video",
            duration: 25,
            status: 'ready'
          },
          {
            id: "l5",
            title: "Box Model Explained",
            description: "Learn the CSS box model and layouts",
            type: "text",
            duration: 20,
            status: 'draft'
          }
        ]
      }
    ]
  });
  
  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setCourse({
      ...course,
      modules: course.modules.map(module => 
        module.id === moduleId 
          ? { ...module, isExpanded: !module.isExpanded } 
          : module
      )
    });
  };
  
  // Add new module
  const addModule = () => {
    const newModule: Module = {
      id: `m${Date.now()}`,
      title: "New Module",
      description: "Module description",
      lessons: [],
      isExpanded: true
    };
    
    setCourse({
      ...course,
      modules: [...course.modules, newModule]
    });
  };
  
  // Add new lesson to a module
  const addLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: `l${Date.now()}`,
      title: "New Lesson",
      description: "Lesson description",
      type: "video",
      duration: 15,
      status: 'draft'
    };
    
    setCourse({
      ...course,
      modules: course.modules.map(module => 
        module.id === moduleId 
          ? { ...module, lessons: [...module.lessons, newLesson] } 
          : module
      )
    });
  };
  
  // Get color based on lesson type
  const getLessonTypeColor = (type: ContentType) => {
    switch (type) {
      case 'video':
        return "bg-blue-500 text-white";
      case 'text':
        return "bg-green-500 text-white";
      case 'exercise':
        return "bg-amber-500 text-white";
      case 'quiz':
        return "bg-purple-500 text-white";
    }
  };
  
  // Get icon based on lesson type
  const getLessonTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'exercise':
        return <Play className="h-4 w-4" />;
      case 'quiz':
        return <CheckCircle className="h-4 w-4" />;
    }
  };
  
  // Get color based on lesson status
  const getLessonStatusColor = (status: 'draft' | 'ready' | 'published') => {
    switch (status) {
      case 'draft':
        return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case 'ready':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case 'published':
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card className="bg-gradient-to-r from-amber-500/90 to-orange-600/90 text-white border-none shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{course.title}</h2>
              <p className="text-amber-100 mt-1">{course.description}</p>
            </div>
            <Button 
              variant="secondary" 
              className="bg-white/20 text-white hover:bg-white/30 border-none"
            >
              Edit Course
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-amber-100 text-sm mb-1">Modules</div>
              <div className="text-xl font-semibold">{course.modules.length}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-amber-100 text-sm mb-1">Lessons</div>
              <div className="text-xl font-semibold">
                {course.modules.reduce((sum, module) => sum + module.lessons.length, 0)}
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-amber-100 text-sm mb-1">Est. Duration</div>
              <div className="text-xl font-semibold">
                {Math.round(course.modules.reduce(
                  (sum, module) => sum + module.lessons.reduce(
                    (sum, lesson) => sum + lesson.duration, 0
                  ), 0
                ) / 60)} hours
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Modules */}
      <div className="space-y-4">
        {course.modules.map((module) => (
          <Card 
            key={module.id} 
            className="bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div 
              className={cn(
                "flex items-center justify-between p-4 cursor-pointer",
                "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              )}
              onClick={() => toggleModule(module.id)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 h-8 w-8 rounded-full flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{module.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{module.lessons.length} lessons</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {module.isExpanded ? (
                  <ArrowUpCircle className="h-5 w-5 text-gray-400" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
            
            {module.isExpanded && (
              <div className="px-4 pb-4">
                <div className="mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{module.description}</p>
                </div>
                
                {/* Lessons */}
                <div className="space-y-2 mb-4">
                  {module.lessons.map((lesson) => (
                    <div 
                      key={lesson.id} 
                      className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center",
                            getLessonTypeColor(lesson.type)
                          )}>
                            {getLessonTypeIcon(lesson.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-800 dark:text-gray-200">{lesson.title}</h4>
                              <Badge className={getLessonStatusColor(lesson.status)}>
                                {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{lesson.description}</p>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                              <Play className="h-3 w-3 mr-1" />
                              <span>{lesson.duration} minutes</span>
                            </div>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Edit Lesson</DropdownMenuItem>
                            <DropdownMenuItem>Change Status</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                  onClick={() => addLesson(module.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      {/* Add Module Button */}
      <Button 
        variant="outline" 
        className="w-full h-16 border-dashed border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 text-amber-800 dark:text-amber-300"
        onClick={addModule}
      >
        <Plus className="h-5 w-5 mr-2" />
        Add New Module
      </Button>
    </div>
  );
} 