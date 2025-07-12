import { redirect } from "next/navigation";
import { CheckCircle, Play, BookOpen, Clock, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

interface CourseSuccessPageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const CourseSuccessPage = async ({ params, searchParams }: CourseSuccessPageProps) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/auth/login");
  }

  // Check if this is a success page (from checkout)
  const isSuccess = resolvedSearchParams.success === '1';
  
  if (!isSuccess) {
    return redirect(`/courses/${resolvedParams.courseId}`);
  }

  // Verify enrollment exists with retry logic for webhook delays
  let enrollment = null;
  let retryCount = 0;
  const maxRetries = 10; // Wait up to 30 seconds for webhook

  while (!enrollment && retryCount < maxRetries) {
    enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: resolvedParams.courseId,
        },
      },
      include: {
        course: {
          include: {
            chapters: {
              include: {
                userProgress: {
                  where: {
                    userId: user.id,
                  },
                },
              },
              orderBy: {
                position: 'asc',
              },
            },
            user: true,
            _count: {
              select: {
                Enrollment: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      retryCount++;
      if (retryCount < maxRetries) {
        // Wait 3 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  if (!enrollment) {
    console.log(`Enrollment not found after ${maxRetries} retries for user ${user.id} and course ${resolvedParams.courseId}`);
    return redirect(`/courses/${resolvedParams.courseId}?error=enrollment_not_found&debug=1`);
  }

  const { course } = enrollment;
  const firstChapter = course.chapters[0];
  const totalChapters = course.chapters.length;
  const estimatedHours = totalChapters * 0.5; // Rough estimate

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎉 Enrollment Successful!
          </h1>
          <p className="text-xl text-gray-600">
            Welcome to your new learning journey
          </p>
        </div>

        {/* Course Info Card */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                {course.title.charAt(0)}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl text-gray-900 mb-2">
                  {course.title}
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  by {course.user.name}
                </CardDescription>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <Users className="w-3 h-3 mr-1" />
                    {course._count.Enrollment} students
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {totalChapters} chapters
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    <Clock className="w-3 h-3 mr-1" />
                    ~{estimatedHours}h total
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Start Learning Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-blue-600 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-600/20" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Play className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Start Learning</h3>
                  <p className="text-white/80">Begin your first chapter</p>
                </div>
              </div>
              <p className="text-white/90 mb-4">
                {firstChapter ? `Ready to start with "${firstChapter.title}"?` : 'Your course is ready to begin!'}
              </p>
              <Link href={firstChapter ? `/courses/${course.id}/learn` : `/courses/${course.id}`}>
                <Button 
                  className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Course
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Course Dashboard Card */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Course Dashboard</h3>
                  <p className="text-gray-600">Track your progress</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                View all your enrolled courses and track your learning progress.
              </p>
              <Link href="/dashboard/student">
                <Button 
                  variant="outline" 
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                  size="lg"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* What's Next Section */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">What's Next?</CardTitle>
            <CardDescription>Here's how to get the most out of your course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Set Your Learning Schedule</h4>
                <p className="text-gray-600">Dedicate regular time for learning to stay consistent and motivated.</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Take Notes & Practice</h4>
                <p className="text-gray-600">Active learning helps retention. Take notes and practice what you learn.</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Connect & Share</h4>
                <p className="text-gray-600">Join our community and share your progress with fellow learners.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p>Need help? <Link href="/support" className="text-purple-600 hover:underline">Contact Support</Link></p>
        </div>
      </div>
    </div>
  );
};

export default CourseSuccessPage; 