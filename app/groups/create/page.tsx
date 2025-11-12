import { CreateGroupForm } from "./_components/create-group-form";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BookOpen, Users, PenLine, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";
import { SmartHeader } from "@/components/dashboard/smart-header";

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
      Course: {
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

  const courses = enrolledCourses.map(enrollment => enrollment.Course);

  return (
    <>
      <SmartSidebar user={user} />
      <SmartHeader user={user} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <main className="pl-[88px] pb-16">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-violet-700 to-indigo-800 px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <Link
                href="/groups"
                className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Groups
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Create Your Study Community
              </h1>
              <p className="text-white/90 text-lg max-w-2xl">
                Connect with like-minded learners and create a space for collaboration
              </p>
            </div>
          </div>

          {/* Main content */}
          <div className="max-w-7xl mx-auto px-6 py-8">
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
    </>
  );
} 