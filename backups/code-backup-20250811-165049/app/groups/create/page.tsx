import { CreateGroupForm } from "./_components/create-group-form";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ConditionalHeader from "@/app/(homepage)/user-header";
import { db } from "@/lib/db";
import { BookOpen, Users, PenLine, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CreateGroupPage() {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  // Fetch user's enrolled courses
  const enrolledCourses = await db.enrollment.findMany({
    where: {
      userId: user.id,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
        },
      },
    },
  });

  // Fetch categories for suggestions
  const categories = await db.category.findMany({
    take: 5,
    orderBy: {
      name: 'asc'
    }
  });

  const courses = enrolledCourses.map(enrollment => enrollment.course);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ConditionalHeader user={user} />

      <main className="pt-20 pb-16">
        {/* Page Header with waves background */}
        <div className="relative bg-gradient-to-r from-violet-700 to-indigo-800 h-64 overflow-hidden">
          <svg className="absolute bottom-0 left-0 right-0 text-violet-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="currentColor" fillOpacity="0.1" d="M0,32L48,58.7C96,85,192,139,288,144C384,149,480,107,576,90.7C672,75,768,85,864,101.3C960,117,1056,139,1152,138.7C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
          <svg className="absolute bottom-0 left-0 right-0 text-gray-50 dark:text-gray-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="currentColor" fillOpacity="1" d="M0,128L60,138.7C120,149,240,171,360,186.7C480,203,600,213,720,186.7C840,160,960,96,1080,90.7C1200,85,1320,139,1380,165.3L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center px-4 z-20">
            <div className="text-center bg-gradient-to-r from-indigo-900/30 to-violet-900/30 px-8 py-6 rounded-lg backdrop-blur-sm">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                Create Your Study Community
              </h1>
              <p className="max-w-2xl mx-auto text-white text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                Connect with like-minded learners and create a space for collaboration
              </p>
            </div>
          </div>
        </div>
        
        {/* Breadcrumb navigation */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/groups" className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Groups
            </Link>
          </div>
        </div>
        
        {/* Main content */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Info Sidebar */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Group Benefits</h3>
                  <ul className="space-y-4">
                    <li className="flex">
                      <Users className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Connect with peers who share your interests</span>
                    </li>
                    <li className="flex">
                      <BookOpen className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Share resources and valuable materials</span>
                    </li>
                    <li className="flex">
                      <PenLine className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Discuss complex topics and solve problems together</span>
                    </li>
                  </ul>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Popular Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <span 
                        key={category.id} 
                        className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
                
                {courses.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Your Courses</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      You can link your group to one of your enrolled courses:
                    </p>
                    <ul className="space-y-2">
                      {courses.slice(0, 3).map(course => (
                        <li key={course.id} className="text-sm text-indigo-600 dark:text-indigo-400">
                          • {course.title}
                        </li>
                      ))}
                      {courses.length > 3 && (
                        <li className="text-xs text-gray-500 dark:text-gray-400">
                          +{courses.length - 3} more courses
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {/* Form */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <CreateGroupForm 
                userId={user.id!} 
                enrolledCourses={courses}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 