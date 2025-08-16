interface Course {
  id: string;
  title: string;
  category?: {
    name: string;
  };
}

interface CoursesTabProps {
  courses: Course[];
}

export function CoursesTab({ courses }: CoursesTabProps) {
  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-4 sm:p-6 w-full">
      <h2 className="text-xl font-semibold mb-4 text-white">My Courses</h2>
      
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 w-full">
          {courses.slice(0, 8).map((course) => (
            <div key={course.id} className="border border-slate-700 rounded-lg overflow-hidden transition-shadow hover:shadow-md bg-slate-900">
              <div className="h-32 bg-gradient-to-r from-blue-500/30 to-purple-500/30"></div>
              <div className="p-4">
                <h3 className="font-medium truncate text-white">{course.title}</h3>
                <p className="text-xs text-slate-400">{course.category?.name || 'Uncategorized'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 rounded-lg p-8 text-center w-full">
          <p className="text-purple-400">No courses yet</p>
        </div>
      )}
    </div>
  );
} 