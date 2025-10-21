"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Route,
  Plus,
  X,
  GripVertical,
  Clock,
  Target,
  TrendingUp,
  Award,
  ChevronRight,
  BookOpen,
  Users,
  Star,
  Sparkles,
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar,
  BarChart3
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

interface PathCourse {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: number; // hours
  difficulty: string;
  price: number;
  isCompleted?: boolean;
  isEnrolled?: boolean;
  progress?: number;
  position: number;
  isRequired: boolean;
  estimatedWeeks: number;
  skills: string[];
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  slug: string;
  imageUrl?: string;
  difficulty: string;
  estimatedWeeks: number;
  courses: PathCourse[];
  completedCourses: number;
  totalDuration: number;
  totalPrice: number;
  skills: string[];
  targetAudience: string;
  prerequisites: string[];
  learningGoals: string[];
  isFeatured?: boolean;
}

interface LearningPathsBuilderProps {
  userId?: string;
  existingPaths?: LearningPath[];
  enrolledPaths?: string[];
  className?: string;
}

export function LearningPathsBuilder({
  userId,
  existingPaths = [],
  enrolledPaths = [],
  className
}: LearningPathsBuilderProps) {
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [customPath, setCustomPath] = useState<PathCourse[]>([]);
  const [activeTab, setActiveTab] = useState("explore");

  // Mock predefined learning paths
  const predefinedPaths: LearningPath[] = existingPaths.length > 0 ? existingPaths : [
    {
      id: "frontend-master",
      title: "Frontend Development Mastery",
      description: "Complete path from HTML/CSS basics to React expert",
      slug: "frontend-mastery",
      difficulty: "Beginner to Advanced",
      estimatedWeeks: 24,
      completedCourses: 2,
      totalDuration: 120,
      totalPrice: 497,
      skills: ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Next.js"],
      targetAudience: "Aspiring frontend developers",
      prerequisites: ["Basic computer skills"],
      learningGoals: [
        "Build responsive websites",
        "Master React ecosystem",
        "Deploy production applications"
      ],
      isFeatured: true,
      courses: [
        {
          id: "html-css",
          title: "HTML & CSS Fundamentals",
          description: "Learn the basics of web development",
          imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjRjU5RTBCIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCI+SFRNTCBDU1M8L3RleHQ+PC9zdmc+",
          duration: 20,
          difficulty: "Beginner",
          price: 49,
          isCompleted: true,
          progress: 100,
          position: 1,
          isRequired: true,
          estimatedWeeks: 3,
          skills: ["HTML5", "CSS3", "Responsive Design"]
        },
        {
          id: "javascript",
          title: "JavaScript Complete Guide",
          description: "Master JavaScript from basics to advanced",
          imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjRjdERjFFIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJibGFjayIgZm9udC1zaXplPSIyMCI+SmF2YVNjcmlwdDwvdGV4dD48L3N2Zz4=",
          duration: 35,
          difficulty: "Beginner",
          price: 79,
          isCompleted: true,
          isEnrolled: true,
          progress: 100,
          position: 2,
          isRequired: true,
          estimatedWeeks: 5,
          skills: ["ES6+", "DOM Manipulation", "Async Programming"]
        },
        {
          id: "react",
          title: "React - The Complete Guide",
          description: "Build powerful web apps with React",
          imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjNjFEQUZCIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJibGFjayIgZm9udC1zaXplPSIyMCI+UmVhY3Q8L3RleHQ+PC9zdmc+",
          duration: 40,
          difficulty: "Intermediate",
          price: 99,
          isEnrolled: true,
          progress: 65,
          position: 3,
          isRequired: true,
          estimatedWeeks: 6,
          skills: ["React", "Hooks", "Context API", "Redux"]
        },
        {
          id: "typescript",
          title: "TypeScript for React Developers",
          description: "Add type safety to your React apps",
          imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjMzE3OEM2IiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCI+VHlwZVNjcmlwdDwvdGV4dD48L3N2Zz4=",
          duration: 15,
          difficulty: "Intermediate",
          price: 69,
          position: 4,
          isRequired: false,
          estimatedWeeks: 2,
          skills: ["TypeScript", "Type Safety", "Generics"]
        },
        {
          id: "nextjs",
          title: "Next.js & Full-Stack Development",
          description: "Build production-ready full-stack apps",
          imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjMDAwMDAwIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCI+TmV4dC5qczwvdGV4dD48L3N2Zz4=",
          duration: 30,
          difficulty: "Advanced",
          price: 129,
          position: 5,
          isRequired: true,
          estimatedWeeks: 4,
          skills: ["Next.js", "SSR/SSG", "API Routes", "Deployment"]
        }
      ]
    },
    {
      id: "backend-master",
      title: "Backend Development Path",
      description: "From Node.js basics to microservices architecture",
      slug: "backend-mastery",
      difficulty: "Intermediate to Advanced",
      estimatedWeeks: 20,
      completedCourses: 0,
      totalDuration: 100,
      totalPrice: 397,
      skills: ["Node.js", "Express", "MongoDB", "PostgreSQL", "Docker", "AWS"],
      targetAudience: "Backend engineers",
      prerequisites: ["JavaScript knowledge"],
      learningGoals: [
        "Build RESTful APIs",
        "Implement authentication",
        "Deploy to cloud"
      ],
      courses: []
    }
  ];

  const calculatePathProgress = (path: LearningPath): number => {
    if (path.courses.length === 0) return 0;
    const completedCourses = path.courses.filter(c => c.isCompleted).length;
    return Math.round((completedCourses / path.courses.length) * 100);
  };

  const getNextCourse = (path: LearningPath): PathCourse | null => {
    return path.courses.find(c => !c.isCompleted) || null;
  };

  const addCourseToCustomPath = (course: PathCourse) => {
    setCustomPath([...customPath, { ...course, position: customPath.length + 1 }]);
  };

  const removeCourseFromCustomPath = (courseId: string) => {
    setCustomPath(customPath.filter(c => c.id !== courseId));
  };

  const reorderCustomPath = (newOrder: PathCourse[]) => {
    setCustomPath(newOrder.map((course, index) => ({ ...course, position: index + 1 })));
  };

  const PathCard = ({ path }: { path: LearningPath }) => {
    const progress = calculatePathProgress(path);
    const nextCourse = getNextCourse(path);
    const isEnrolled = enrolledPaths.includes(path.id);

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {path.title}
                {path.isFeatured && (
                  <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">{path.description}</CardDescription>
            </div>
            {isEnrolled && (
              <Badge variant="secondary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Enrolled
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress */}
          {isEnrolled && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {nextCourse && (
                <p className="text-xs text-muted-foreground mt-2">
                  Next: {nextCourse.title}
                </p>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{path.totalDuration}h total</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{path.estimatedWeeks} weeks</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{path.courses.length} courses</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>{path.difficulty}</span>
            </div>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1">
            {path.skills.slice(0, 4).map(skill => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {path.skills.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{path.skills.length - 4} more
              </Badge>
            )}
          </div>

          {/* Price */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Total value</span>
                <p className="text-lg font-bold">{formatPrice(path.totalPrice)}</p>
              </div>
              <Button
                variant={isEnrolled ? "outline" : "default"}
                onClick={() => setSelectedPath(path)}
              >
                {isEnrolled ? "Continue" : "View Path"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const PathDetails = ({ path }: { path: LearningPath }) => {
    const progress = calculatePathProgress(path);
    const isEnrolled = enrolledPaths.includes(path.id);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" onClick={() => setSelectedPath(null)} className="mb-4">
            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
            Back to paths
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{path.title}</h2>
              <p className="text-muted-foreground mt-1">{path.description}</p>
            </div>
            {isEnrolled ? (
              <Badge variant="default" className="text-sm">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Enrolled
              </Badge>
            ) : (
              <Button>
                Enroll in Path
                <Route className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              Duration
            </div>
            <p className="text-xl font-bold">{path.totalDuration} hours</p>
            <p className="text-xs text-muted-foreground">{path.estimatedWeeks} weeks</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <BookOpen className="h-4 w-4" />
              Courses
            </div>
            <p className="text-xl font-bold">{path.courses.length}</p>
            <p className="text-xs text-muted-foreground">{path.completedCourses} completed</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              Difficulty
            </div>
            <p className="text-xl font-bold">{path.difficulty}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Progress
            </div>
            <p className="text-xl font-bold">{progress}%</p>
            <Progress value={progress} className="h-1 mt-2" />
          </Card>
        </div>

        {/* Learning Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What you&apos;ll achieve</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {path.learningGoals.map((goal, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">{goal}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Course List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Course Curriculum</CardTitle>
            <CardDescription>
              Complete these courses in order for the best learning experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {path.courses.map((course, index) => (
                <div key={course.id} className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="mt-1">
                    {course.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : course.isEnrolled ? (
                      <div className="relative">
                        <Circle className="h-5 w-5 text-blue-500" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        </div>
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          Course {index + 1}: {course.title}
                          {course.isRequired && (
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {course.description}
                        </p>
                      </div>
                      <Link href={`/courses/${course.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{course.duration} hours</span>
                      <span>•</span>
                      <span>{course.difficulty}</span>
                      <span>•</span>
                      <span>{course.estimatedWeeks} weeks</span>
                      {course.progress !== undefined && (
                        <>
                          <span>•</span>
                          <span>{course.progress}% complete</span>
                        </>
                      )}
                    </div>

                    {course.isEnrolled && course.progress !== undefined && (
                      <Progress value={course.progress} className="h-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
            <Route className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Learning Paths</h2>
            <p className="text-sm text-muted-foreground">
              Structured course sequences for your learning goals
            </p>
          </div>
        </div>
        <Button
          variant={isBuilding ? "secondary" : "default"}
          onClick={() => setIsBuilding(!isBuilding)}
        >
          {isBuilding ? "Cancel" : "Build Custom Path"}
          <Plus className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Content */}
      {selectedPath ? (
        <PathDetails path={selectedPath} />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="enrolled">My Paths</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predefinedPaths.map(path => (
                <PathCard key={path.id} path={path} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="enrolled" className="mt-6">
            {enrolledPaths.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predefinedPaths
                  .filter(p => enrolledPaths.includes(p.id))
                  .map(path => (
                    <PathCard key={path.id} path={path} />
                  ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Route className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No enrolled paths yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your learning journey by enrolling in a structured path
                </p>
                <Button onClick={() => setActiveTab("explore")}>
                  Explore Paths
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="custom" className="mt-6">
            {isBuilding ? (
              <Card>
                <CardHeader>
                  <CardTitle>Build Your Custom Path</CardTitle>
                  <CardDescription>
                    Drag and drop courses to create your personalized learning journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Custom paths are saved to your account and can be shared with others
                    </AlertDescription>
                  </Alert>

                  {customPath.length > 0 ? (
                    <ScrollArea className="h-96">
                      <Reorder.Group
                        axis="y"
                        values={customPath}
                        onReorder={reorderCustomPath}
                        className="space-y-2"
                      >
                        {customPath.map((course) => (
                          <Reorder.Item key={course.id} value={course}>
                            <div className="flex items-center gap-2 p-3 border rounded-lg bg-card">
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{course.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {course.duration}h • {course.difficulty}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCourseFromCustomPath(course.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Add courses to build your custom path
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button className="w-full" disabled={customPath.length === 0}>
                    Save Custom Path
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Route className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Create your own path</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Build a personalized learning journey with courses you choose
                </p>
                <Button onClick={() => setIsBuilding(true)}>
                  Start Building
                  <Plus className="h-4 w-4 ml-2" />
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}