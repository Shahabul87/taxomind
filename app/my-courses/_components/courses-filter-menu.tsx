import { motion } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

interface CoursesFilterMenuProps {
  filters: {
    category: string;
    progress: string;
    sortBy: string;
  };
  setFilters: (filters: any) => void;
  onClose: () => void;
  activeTab: 'enrolled' | 'created';
}

export const CoursesFilterMenu = ({
  filters,
  setFilters,
  onClose,
  activeTab,
}: CoursesFilterMenuProps) => {
  // Sample category options (you may want to fetch these from your API)
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'development', label: 'Development' },
    { value: 'business', label: 'Business' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
  ];

  // Progress filter options (only applicable for enrolled courses)
  const progressOptions = [
    { value: 'all', label: 'All Progress' },
    { value: 'not-started', label: 'Not Started' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  // Sort options
  const sortOptions =
    activeTab === 'enrolled'
      ? [
          { value: 'recent', label: 'Recently Enrolled' },
          { value: 'title', label: 'Title (A-Z)' },
          { value: 'progress', label: 'Progress' },
          { value: 'rating', label: 'Highest Rated' },
        ]
      : [
          { value: 'recent', label: 'Recently Created' },
          { value: 'title', label: 'Title (A-Z)' },
          { value: 'students', label: 'Most Students' },
          { value: 'rating', label: 'Highest Rated' },
        ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  const renderFilterOption = (key: string, value: string, label: string, activeValue: string) => (
    <button
      onClick={() => handleFilterChange(key, value)}
      className={`flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md sm:rounded-lg transition-colors w-full text-left h-9 sm:h-10 ${
        activeValue === value
          ? 'bg-indigo-600/20 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 font-medium'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      {activeValue === value && <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="p-3 sm:p-4 md:p-5 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm border-t border-slate-200/50 dark:border-slate-700/50"
    >
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Filter Courses</h3>
        <button
          onClick={onClose}
          className="p-1.5 sm:p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center"
          aria-label="Close filters"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {/* Categories Filter */}
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">Category</h4>
          <div className="space-y-1">
            {categories.map((category) => (
              <div key={category.value}>
                {renderFilterOption('category', category.value, category.label, filters.category)}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Filter - Only for enrolled courses */}
        {activeTab === 'enrolled' && (
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">Progress</h4>
            <div className="space-y-1">
              {progressOptions.map((option) => (
                <div key={option.value}>
                  {renderFilterOption('progress', option.value, option.label, filters.progress)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sort By */}
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">Sort By</h4>
          <div className="space-y-1">
            {sortOptions.map((option) => (
              <div key={option.value}>
                {renderFilterOption('sortBy', option.value, option.label, filters.sortBy)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
