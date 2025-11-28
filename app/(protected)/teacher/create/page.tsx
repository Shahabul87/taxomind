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
        <div className="w-full px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
                {/* Header glass shell */}
                <div className="mb-4 sm:mb-6 md:mb-8 rounded-xl sm:rounded-2xl md:rounded-3xl border bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-5 lg:p-6">
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg ring-1 ring-white/20 dark:ring-white/10 flex-shrink-0">
                                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                                    Course Creator
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 hidden sm:block">Enterprise-grade course creation</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                                <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">Instructor</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Feature Pills */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-all duration-200">
                        <div className="p-1 sm:p-1.5 rounded-md text-white bg-gradient-to-br from-blue-500 to-indigo-500 flex-shrink-0">
                            <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">Analytics</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-all duration-200">
                        <div className="p-1 sm:p-1.5 rounded-md text-white bg-gradient-to-br from-blue-500 to-indigo-500 flex-shrink-0">
                            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">Global Reach</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-all duration-200">
                        <div className="p-1 sm:p-1.5 rounded-md text-white bg-gradient-to-br from-blue-500 to-indigo-500 flex-shrink-0">
                            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">Fast Authoring</span>
                    </div>
                </div>

            {/* Main Content */}
            <div className={cn(
                "rounded-xl sm:rounded-2xl md:rounded-3xl bg-white/80 dark:bg-slate-800/80 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300",
                "border border-slate-200/50 dark:border-slate-700/50 p-3 sm:p-4 md:p-6 lg:p-8"
            )}>
                <CreateNewCoursePage />
            </div>
        </div>
    );
}

export default CourseCreationPage;
