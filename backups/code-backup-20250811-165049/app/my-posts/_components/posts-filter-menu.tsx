import { motion } from "framer-motion";
import { X, CheckCircle } from "lucide-react";

interface PostsFilterMenuProps {
  filters: {
    category: string;
    sortBy: string;
  };
  setFilters: (filters: any) => void;
  onClose: () => void;
  activeTab: "published" | "drafts" | "analytics";
  availableCategories: string[];
}

export const PostsFilterMenu = ({
  filters,
  setFilters,
  onClose,
  activeTab,
  availableCategories = []
}: PostsFilterMenuProps) => {
  // Build categories for filtering
  const categories = [
    { value: "all", label: "All Topics" },
    ...availableCategories.map(category => ({
      value: category,
      label: category
    }))
  ];

  // Sort options depend on the active tab
  const sortOptions = activeTab === "analytics" 
    ? [
        { value: "recent", label: "Most Recent" },
        { value: "popular", label: "Most Popular" },
        { value: "engagement", label: "Highest Engagement" },
      ]
    : [
        { value: "recent", label: "Most Recent" },
        { value: "title", label: "Title (A-Z)" },
        { value: "popular", label: "Most Viewed" },
        { value: "engagement", label: "Most Engagement" },
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
          ? "bg-emerald-600/20 text-emerald-400"
          : "text-gray-400 hover:bg-gray-800/40 hover:text-white"
      }`}
    >
      {activeValue === value && <CheckCircle className="h-3.5 w-3.5 mr-2 text-emerald-500" />}
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
        <h3 className="text-white font-medium">Filter Posts</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-800/50 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Categories</h4>
          <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {categories.length > 1 ? (
              categories.map((category) => (
                <div key={category.value}>
                  {renderFilterOption("category", category.value, category.label, filters.category)}
                </div>
              ))
            ) : (
              <div className="col-span-2 text-gray-500 text-sm py-2">
                No categories found. Add tags to your posts to enable filtering.
              </div>
            )}
          </div>
        </div>

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
          
          {/* Applied Filters Summary */}
          <div className="mt-5 pt-4 border-t border-gray-800/50">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Applied Filters</h4>
            <div className="flex flex-wrap gap-2">
              <div className="px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded-lg text-xs flex items-center">
                {filters.category === "all" ? "All Topics" : filters.category}
                <button 
                  onClick={() => handleFilterChange("category", "all")} 
                  className="ml-1 text-emerald-400 hover:text-emerald-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="px-2 py-1 bg-teal-900/30 text-teal-400 rounded-lg text-xs flex items-center">
                {sortOptions.find(opt => opt.value === filters.sortBy)?.label || "Most Recent"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 