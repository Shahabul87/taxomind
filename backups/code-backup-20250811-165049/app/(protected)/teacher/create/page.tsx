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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
            <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
                {/* Compact Header */}
                <div className="relative mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
                                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 dark:from-slate-100 dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">
                                    Course Creator
                                </h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">Enterprise-grade course creation</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Instructor</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Compact Feature Pills */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 dark:bg-gray-800/40 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/20">
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Analytics</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 dark:bg-gray-800/40 backdrop-blur-sm border border-indigo-200/30 dark:border-indigo-700/20">
                        <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Global Reach</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 dark:bg-gray-800/40 backdrop-blur-sm border border-purple-200/30 dark:border-purple-700/20">
                        <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">AI-Powered</span>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className={cn(
                    "rounded-xl sm:rounded-2xl bg-white/90 dark:bg-gray-800/60 shadow-xl backdrop-blur-sm",
                    "border border-white/60 dark:border-gray-700/40 p-4 sm:p-6 lg:p-8"
                )}>
                    <CreateNewCoursePage />
                </div>
            </div>
        </div>
    );
}

export default CourseCreationPage;
