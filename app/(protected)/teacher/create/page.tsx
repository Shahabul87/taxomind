import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateNewCoursePage } from "./create-course";
import { cn } from "@/lib/utils";
import { BookOpen, TrendingUp, Users, Zap } from "lucide-react";

const CourseCreationPage = async() => {
    const user = await currentUser();

    if(!user?.id){
        return redirect("/");
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
            <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
                {/* Header glass shell */}
                <div className="mb-6 sm:mb-8 rounded-xl border bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-gray-200/70 dark:border-gray-800/70 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg ring-1 ring-white/20 dark:ring-white/10">
                                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                    Course Creator
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Enterprise-grade course creation</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="px-3 py-1.5 rounded-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200/70 dark:border-gray-800/70">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Instructor</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Compact Feature Pills */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200/70 dark:border-gray-800/70">
                        <div className="p-1.5 rounded-md text-white bg-gradient-to-br from-indigo-500 to-purple-500">
                            <TrendingUp className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Analytics</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200/70 dark:border-gray-800/70">
                        <div className="p-1.5 rounded-md text-white bg-gradient-to-br from-indigo-500 to-purple-500">
                            <Users className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Global Reach</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200/70 dark:border-gray-800/70">
                        <div className="p-1.5 rounded-md text-white bg-gradient-to-br from-indigo-500 to-purple-500">
                            <Zap className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Fast Authoring</span>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className={cn(
                    "rounded-xl bg-white/70 dark:bg-gray-900/70 shadow-md backdrop-blur-md",
                    "border border-gray-200/70 dark:border-gray-800/70 p-4 sm:p-6 lg:p-8"
                )}>
                    <CreateNewCoursePage />
                </div>
            </div>
        </div>
    );
}

export default CourseCreationPage;
