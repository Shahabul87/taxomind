import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateNewCoursePage } from "./create-course";

const CourseCreationPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid-bg"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#grid-bg)"
            className="text-slate-900 dark:text-white"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        <div className="max-w-6xl mx-auto">
          {/* Main Card */}
          <div className="rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
            <CreateNewCoursePage />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCreationPage;
