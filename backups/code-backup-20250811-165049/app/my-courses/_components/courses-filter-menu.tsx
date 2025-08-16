import { motion } from "framer-motion";
import { X, CheckCircle } from "lucide-react";

interface CoursesFilterMenuProps {
  filters: {
    category: string;
    progress: string;
    sortBy: string;
  };
  setFilters: (filters: any) => void;
  onClose: () => void;
  activeTab: "enrolled" | "created";
}

export const CoursesFilterMenu = ({
  filters,
  setFilters,
  onClose,
  activeTab,
}: CoursesFilterMenuProps) => {
  // Sample category options (you may want to fetch these from your API)
  const categories = [
    { value: "all", label: "All Categories" },
    { value: "development", label: "Development" },
    { value: "business", label: "Business" },
    { value: "design", label: "Design" },
    { value: "marketing", label: "Marketing" },
  ];

  // Progress filter options (only applicable for enrolled courses)
  const progressOptions = [
    { value: "all", label: "All Progress" },
    { value: "not-started", label: "Not Started" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  // Sort options
  const sortOptions = activeTab === "enrolled"
    ? [
        { value: "recent", label: "Recently Enrolled" },
        { value: "title", label: "Title (A-Z)" },
        { value: "progress", label: "Progress" },
        { value: "rating", label: "Highest Rated" },
      ]
    : [
        { value: "recent", label: "Recently Created" },
        { value: "title", label: "Title (A-Z)" },
        { value: "students", label: "Most Students" },
        { value: "rating", label: "Highest Rated" },
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
      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
        activeValue === value
          ? "bg-indigo-600/20 text-indigo-400"
          : "text-gray-400 hover:bg-gray-800/40 hover:text-white"
      }`}
    >
      {activeValue === value && <CheckCircle className="h-3.5 w-3.5 mr-2 text-indigo-500" />}
      {label}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="p-5 bg-gray-850 border-t border-b border-gray-800/50"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-medium">Filter Courses</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-800/50 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Categories Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Category</h4>
          <div className="space-y-1">
            {categories.map((category) => (
              <div key={category.value}>
                {renderFilterOption("category", category.value, category.label, filters.category)}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Filter - Only for enrolled courses */}
        {activeTab === "enrolled" && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Progress</h4>
            <div className="space-y-1">
              {progressOptions.map((option) => (
                <div key={option.value}>
                  {renderFilterOption("progress", option.value, option.label, filters.progress)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sort By */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Sort By</h4>
          <div className="space-y-1">
            {sortOptions.map((option) => (
              <div key={option.value}>
                {renderFilterOption("sortBy", option.value, option.label, filters.sortBy)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 