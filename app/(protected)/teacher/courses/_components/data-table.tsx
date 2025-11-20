"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import Link from "next/link"
import { PlusCircle, Search, Loader2, Filter, ChevronLeft, ChevronRight, Calendar, DollarSign, MoreVertical, Trash2, Eye, Download } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"
import { APIResponse } from "@/types/api"
import {
  trackBulkOperation,
  trackExport,
  trackFilterApplied,
  trackSearch,
  trackPageView,
  trackTimeOnPage,
  trackFeatureUsage,
} from "@/lib/analytics/course-analytics"
// TODO: Implement keyboard shortcuts feature
// import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
// import { KeyboardShortcutsHelp } from "@/components/ui/keyboard-shortcuts-help"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data?: TData[]
  serverMode?: boolean
}

export function DataTable<TData, TValue>({columns, data = [], serverMode = true}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [isLoading, setIsLoading] = React.useState(false);
  const [priceRange, setPriceRange] = React.useState([0, 1000]);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dateRange, setDateRange] = React.useState<{from?: Date; to?: Date}>({});
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [announcement, setAnnouncement] = React.useState<string>('');
  const [serverData, setServerData] = React.useState<any[]>(Array.isArray(data) ? data : []);
  const [total, setTotal] = React.useState<number>(Array.isArray(data) ? data.length : 0);

  // Helper function for ARIA announcements
  const announce = React.useCallback((message: string) => {
    setAnnouncement(message);
    // Clear announcement after it's been read
    setTimeout(() => setAnnouncement(''), 100);
  }, []);

  // Track page view and time on page
  React.useEffect(() => {
    trackPageView('teacher_courses_dashboard');

    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      trackTimeOnPage('teacher_courses_dashboard', duration);
    };
  }, []);

  // TODO: Re-enable keyboard shortcuts when hook is implemented
  // Keyboard shortcuts
  // useKeyboardShortcuts({
  //   shortcuts: [
  //     {
  //       key: '/',
  //       description: 'Focus search',
  //       handler: () => {
  //         searchInputRef.current?.focus();
  //         announce('Search input focused');
  //         trackFeatureUsage('keyboard_shortcut_search', {
  //           source: 'teacher_dashboard',
  //         });
  //       },
  //     },
  //     {
  //       key: 'n',
  //       ctrlKey: true,
  //       description: 'Create new course',
  //       handler: () => {
  //         router.push('/teacher/create');
  //         trackFeatureUsage('keyboard_shortcut_new_course', {
  //           source: 'teacher_dashboard',
  //         });
  //       },
  //     },
  //     {
  //       key: 'e',
  //       ctrlKey: true,
  //       description: 'Export courses',
  //       handler: () => {
  //         handleExport();
  //         trackFeatureUsage('keyboard_shortcut_export', {
  //           source: 'teacher_dashboard',
  //         });
  //       },
  //     },
  //     {
  //       key: 'Escape',
  //       description: 'Clear selection',
  //       handler: () => {
  //         if (table.getFilteredSelectedRowModel().rows.length > 0) {
  //           const count = table.getFilteredSelectedRowModel().rows.length;
  //           table.resetRowSelection();
  //           announce(`Cleared selection of ${count} course${count > 1 ? 's' : ''}`);
  //           toast.success('Selection cleared');
  //           trackFeatureUsage('keyboard_shortcut_clear_selection', {
  //             source: 'teacher_dashboard',
  //           });
  //         }
  //       },
  //     },
  //     {
  //       key: 'a',
  //       ctrlKey: true,
  //       description: 'Select all visible',
  //       handler: () => {
  //         const count = table.getRowModel().rows.length;
  //         table.toggleAllPageRowsSelected(true);
  //         announce(`Selected all ${count} visible course${count > 1 ? 's' : ''}`);
  //         trackFeatureUsage('keyboard_shortcut_select_all', {
  //           source: 'teacher_dashboard',
  //         });
  //       },
  //     },
  //   ],
  //   enabled: true,
  // });

  const table = useReactTable({
    data: serverMode ? (serverData as any[]) : (data as any[]),
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    ...(serverMode ? { manualPagination: true } : {}),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  // Get unique categories and handle empty/null cases
  const uniqueCategories = React.useMemo(() => {
    const source = serverMode ? serverData : data;
    return Array.from(new Set((source as any[]).map((item: any) => item?.category?.name || 'Uncategorized'))).filter(Boolean);
  }, [serverMode, serverData, data]);

  const handleCategoryChange = (value: string) => {
    if (value === "all") {
      table.getColumn("category")?.setFilterValue(undefined);
    } else {
      table.getColumn("category")?.setFilterValue(value);

      // Track filter usage
      trackFilterApplied('category', value, {
        source: 'teacher_dashboard',
      });
    }
  };

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  // Server data loader (debounced)
  React.useEffect(() => {
    if (!serverMode) return;

    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setIsLoading(true);
        const pageIndex = table.getState().pagination.pageIndex;
        const pageSize = table.getState().pagination.pageSize;
        const titleFilter = (table.getColumn("title")?.getFilterValue() as string) || '';
        const categoryFilter = (table.getColumn("category")?.getFilterValue() as string) || '';
        const sort = sorting[0];
        const params = new URLSearchParams({
          page: String(pageIndex + 1),
          pageSize: String(pageSize),
          search: titleFilter,
          category: categoryFilter,
          status: statusFilter,
          priceMin: String(priceRange[0] ?? 0),
          priceMax: String(priceRange[1] ?? 1000),
          sortBy: sort?.id || 'createdAt',
          sortOrder: (sort?.desc ? 'desc' : 'asc'),
        });
        const res = await fetch(`/api/teacher/courses?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to load courses');
        const json = await res.json();
        if (json?.success) {
          setServerData(json.data.courses);
          setTotal(json.data.pagination.total);
        }
      } catch (e:any) {
        if (e?.name !== 'AbortError') {
          // soft-fail
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverMode, sorting, statusFilter, priceRange, table.getState().pagination, table.getState().columnFilters]);

  // Bulk operation handlers
  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const courseIds = selectedRows.map((row) => (row.original as { id: string }).id);

    if (courseIds.length === 0) {
      toast.error('No courses selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${courseIds.length} course${courseIds.length > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await axios.post<APIResponse>('/api/teacher/courses/bulk-delete', {
        courseIds,
        confirmDelete: true,
      });

      if (response.data.success) {
        const successMessage = `Successfully deleted ${courseIds.length} course${courseIds.length > 1 ? 's' : ''}`;
        toast.success(successMessage);
        announce(successMessage);

        // Track bulk delete
        trackBulkOperation('delete', courseIds.length, {
          source: 'teacher_dashboard',
        });

        table.resetRowSelection();
        router.refresh();
      } else {
        toast.error(response.data.error || 'Failed to delete courses');
      }
    } catch (error) {
      toast.error('An error occurred while deleting courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkPublish = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const courseIds = selectedRows.map((row) => (row.original as { id: string }).id);

    if (courseIds.length === 0) {
      toast.error('No courses selected');
      return;
    }

    try {
      setIsLoading(true);

      const response = await axios.patch<APIResponse>('/api/teacher/courses/bulk-update', {
        courseIds,
        isPublished: true,
      });

      if (response.data.success) {
        const successMessage = `Successfully published ${courseIds.length} course${courseIds.length > 1 ? 's' : ''}`;
        toast.success(successMessage);
        announce(successMessage);

        // Track bulk publish
        trackBulkOperation('publish', courseIds.length, {
          source: 'teacher_dashboard',
        });

        table.resetRowSelection();
        router.refresh();
      } else {
        toast.error(response.data.error || 'Failed to publish courses');
      }
    } catch (error) {
      toast.error('An error occurred while publishing courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const courses = selectedRows.length > 0
      ? selectedRows.map((row) => row.original as any)
      : (serverMode ? serverData : data);

    // Convert to CSV
    const csv = convertToCSV(courses);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `courses-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Track export
    trackExport('csv', courses.length, {
      source: 'teacher_dashboard',
      metadata: { hasSelection: selectedRows.length > 0 },
    });

    toast.success(`Exported ${courses.length} course${courses.length > 1 ? 's' : ''}`);
  };

  const convertToCSV = (courses: TData[]): string => {
    const headers = ['Title', 'Category', 'Price', 'Status', 'Created At'];
    const rows = courses.map((course: any) => [
      course.title || '',
      course.category?.name || 'Uncategorized',
      course.price || '0',
      course.isPublished ? 'Published' : 'Draft',
      new Date(course.createdAt).toLocaleDateString(),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  };

  // TODO: Re-enable keyboard shortcuts when feature is implemented
  // Define shortcuts for help dialog
  // const shortcutsForHelp = [
  //   { keys: ['/'], description: 'Focus search', category: 'Navigation' },
  //   { keys: ['Ctrl', 'N'], description: 'Create new course', category: 'Actions' },
  //   { keys: ['Ctrl', 'E'], description: 'Export courses', category: 'Actions' },
  //   { keys: ['Ctrl', 'A'], description: 'Select all visible courses', category: 'Selection' },
  //   { keys: ['Escape'], description: 'Clear selection', category: 'Selection' },
  // ];

  return (
    <div className="space-y-4">
      {/* ARIA Live Region for announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Bulk Actions Bar */}
      {selectedRowCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
            "bg-white/60 dark:bg-gray-900/60",
            "border border-gray-200/70 dark:border-gray-800/70",
            "backdrop-blur-md",
            "rounded-lg p-3 sm:p-4 shadow-sm"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedRowCount} course{selectedRowCount > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/30 h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
              onClick={handleBulkPublish}
              disabled={isLoading}
            >
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">Bulk Publish</span>
              <span className="xs:hidden">Publish</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/30 h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
              onClick={handleExport}
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white dark:bg-gray-800 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
              onClick={handleBulkDelete}
              disabled={isLoading}
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">Delete Selected</span>
              <span className="xs:hidden">Delete</span>
            </Button>
          </div>
        </motion.div>
      )}
      {/* Search and Filter Section */}
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-2 sm:p-3 md:p-4">
          <div className={cn(
            "flex flex-col gap-3 sm:gap-4",
            "p-3 sm:p-4 rounded-lg",
            "bg-white/70 dark:bg-gray-900/70",
            "border border-gray-200/70 dark:border-gray-800/70",
            "backdrop-blur-md shadow-sm"
          )}>
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <Input
                ref={searchInputRef}
                placeholder="Search courses..."
                value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  table.getColumn("title")?.setFilterValue(value);

                  // Track search with debounce
                  if (value.length > 2) {
                    const timeoutId = setTimeout(() => {
                      const resultsCount = table.getFilteredRowModel().rows.length;
                      trackSearch(value, resultsCount, {
                        source: 'teacher_dashboard',
                      });
                    }, 500);

                    return () => clearTimeout(timeoutId);
                  }
                }}
                className={cn(
                  "pl-8 sm:pl-9 w-full h-9 sm:h-10 text-xs sm:text-sm",
                  "bg-white dark:bg-gray-800",
                  "border-gray-200 dark:border-gray-700",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                  "focus:ring-purple-500",
                  "transition-all duration-200"
                )}
                aria-label="Search courses"
                aria-describedby="search-hint"
              />
              <span id="search-hint" className="sr-only">
                Use forward slash (/) to quickly focus the search field
              </span>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 sm:gap-3">
              {/* Category Filter */}
              <div className="w-full sm:w-auto">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                  <Select
                    value={(table.getColumn("category")?.getFilterValue() as string) ?? "all"}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger className={cn(
                    "w-full sm:w-[160px] md:w-[180px] h-9 sm:h-10 text-xs sm:text-sm",
                    "bg-white dark:bg-gray-800",
                    "border-gray-200 dark:border-gray-700",
                    "text-gray-900 dark:text-white",
                    "transition-all duration-200"
                    )}>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="all" className="text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs sm:text-sm">
                        All Categories
                      </SelectItem>
                      {uniqueCategories.map((category) => (
                        <SelectItem 
                          key={category} 
                          value={category}
                          className="text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs sm:text-sm"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-auto">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    if (value === "all") {
                      table.getColumn("isPublished")?.setFilterValue(undefined);
                    } else {
                      table.getColumn("isPublished")?.setFilterValue(value === "published");
                    }
                  }}
                >
                  <SelectTrigger className={cn(
                    "w-full sm:w-[120px] md:w-[140px] h-9 sm:h-10 text-xs sm:text-sm",
                    "bg-white dark:bg-gray-800",
                    "border-gray-200 dark:border-gray-700"
                  )}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs sm:text-sm">All Status</SelectItem>
                    <SelectItem value="published" className="text-xs sm:text-sm">Published</SelectItem>
                    <SelectItem value="draft" className="text-xs sm:text-sm">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm",
                      "bg-white dark:bg-gray-800",
                      "border-gray-200 dark:border-gray-700",
                      "hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                  >
                    <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden xs:inline">More Filters</span>
                    <span className="xs:hidden">Filters</span>
                    {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                      <Badge variant="secondary" className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 p-0 text-[9px] sm:text-xs">
                        1
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80" align="end">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={1000}
                        step={10}
                        className="mt-2"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPriceRange([0, 1000]);
                          setStatusFilter("all");
                          setDateRange({});
                        }}
                        className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <div className="rounded-lg overflow-hidden border border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-gray-200/70 dark:border-gray-800/70 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md sticky top-0 z-10">
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id} 
                      className="text-gray-700 dark:text-gray-300 font-medium py-4"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={cn(
                      "border-gray-200 dark:border-gray-700",
                      "transition-colors duration-150",
                      "hover:bg-gray-50 dark:hover:bg-gray-700",
                      "data-[state=selected]:bg-gray-100 dark:data-[state=selected]:bg-gray-800/40"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id} 
                        className="text-gray-700 dark:text-gray-300 py-4"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-3">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <p>No courses found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-3 sm:pt-4 gap-3 sm:gap-4">
        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1 text-center sm:text-left">
          {serverMode ? (
            <>Showing {total === 0 ? 0 : (table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1)}-{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, total)} of {total} courses</>
          ) : (
            <>Showing {table.getFilteredRowModel().rows.length} courses</>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 order-1 sm:order-2 w-full sm:w-auto justify-center sm:justify-end">
          <Button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            variant="outline"
            size="sm"
            className={cn(
              "px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 h-8 sm:h-9",
              !table.getCanPreviousPage()
                ? "bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
            <span className="hidden xs:inline">Previous</span>
          </Button>
          
          <div className="flex items-center justify-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            Page {table.getState().pagination.pageIndex + 1} of {serverMode ? Math.max(1, Math.ceil(total / table.getState().pagination.pageSize)) : table.getPageCount()}
          </div>
          
          <Button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            variant="outline"
            size="sm"
            className={cn(
              "px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 h-8 sm:h-9",
              !table.getCanNextPage()
                ? "bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            <span className="hidden xs:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
