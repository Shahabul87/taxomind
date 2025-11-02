import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateNewCoursePage } from "./create-course";
import { cn } from "@/lib/utils";
import { BookOpen, TrendingUp, Users, Zap } from "lucide-react";
import { DashboardLayout } from "@/app/dashboard/_components/DashboardLayout";

const CourseCreationPage = async() => {
    const user = await currentUser();

    if(!user?.id){
        return redirect("/");
    }

    return (
        <DashboardLayout user={user}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
                <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
                    {/* Header glass shell */}
                    <div className="mb-6 sm:mb-8 rounded-3xl border bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg ring-1 ring-white/20 dark:ring-white/10">
                                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                                    Course Creator
                                </h1>
                                <p className="text-sm text-slate-600 dark:text-slate-300 hidden sm:block">Enterprise-grade course creation</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Instructor</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Feature Pills */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-all duration-200">
                        <div className="p-1.5 rounded-md text-white bg-gradient-to-br from-blue-500 to-indigo-500">
                            <TrendingUp className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Analytics</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-all duration-200">
                        <div className="p-1.5 rounded-md text-white bg-gradient-to-br from-blue-500 to-indigo-500">
                            <Users className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Global Reach</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-all duration-200">
                        <div className="p-1.5 rounded-md text-white bg-gradient-to-br from-blue-500 to-indigo-500">
                            <Zap className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Fast Authoring</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className={cn(
                    "rounded-3xl bg-white/80 dark:bg-slate-800/80 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300",
                    "border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 lg:p-8"
                )}>
                    <CreateNewCoursePage />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default CourseCreationPage;
