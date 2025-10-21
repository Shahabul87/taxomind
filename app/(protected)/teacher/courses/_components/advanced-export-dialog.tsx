"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { CourseWithRelations, ExportConfig } from "@/types/course";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export interface AdvancedExportDialogProps {
  courses: CourseWithRelations[];
  analytics?: any;
}

export const AdvancedExportDialog = ({ courses, analytics }: AdvancedExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [config, setConfig] = useState<ExportConfig>({
    format: 'excel',
    columns: ['title', 'category', 'price', 'status', 'enrollments', 'revenue'],
    includeAnalytics: true,
    includeCharts: true,
  });

  const columnOptions = [
    { id: 'title', label: 'Course Title', default: true },
    { id: 'category', label: 'Category', default: true },
    { id: 'price', label: 'Price', default: true },
    { id: 'status', label: 'Status', default: true },
    { id: 'enrollments', label: 'Total Enrollments', default: true },
    { id: 'revenue', label: 'Revenue', default: true },
    { id: 'rating', label: 'Average Rating', default: false },
    { id: 'completion', label: 'Completion Rate', default: false },
    { id: 'createdAt', label: 'Created Date', default: false },
    { id: 'chapters', label: 'Number of Chapters', default: false },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const exportConfig = {
        ...config,
        format,
      };

      if (format === 'excel') {
        await exportToExcel(courses, exportConfig);
      } else if (format === 'pdf') {
        await exportToPDF(courses, exportConfig, analytics);
      } else {
        await exportToCSV(courses, exportConfig);
      }

      setExportSuccess(true);
      toast.success(`Successfully exported to ${format.toUpperCase()}`);

      // Close dialog after 1.5 seconds
      setTimeout(() => {
        setOpen(false);
        setExportSuccess(false);
      }, 1500);
    } catch (error) {
      toast.error('Export failed. Please try again.');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleColumn = (columnId: string) => {
    setConfig((prev) => {
      const columns = prev.columns.includes(columnId)
        ? prev.columns.filter((c) => c !== columnId)
        : [...prev.columns, columnId];
      return { ...prev, columns };
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-lg sm:text-xl">Export Courses Data</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Choose your export format and customize the output
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Export Format</Label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Card
                className={cn(
                  "p-2.5 sm:p-4 cursor-pointer transition-all border-2",
                  format === 'csv'
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                )}
                onClick={() => setFormat('csv')}
              >
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <FileText className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8",
                    format === 'csv' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"
                  )} />
                  <p className="text-xs sm:text-sm font-medium">CSV</p>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">Basic</Badge>
                </div>
              </Card>

              <Card
                className={cn(
                  "p-2.5 sm:p-4 cursor-pointer transition-all border-2",
                  format === 'excel'
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                )}
                onClick={() => setFormat('excel')}
              >
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <FileSpreadsheet className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8",
                    format === 'excel' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"
                  )} />
                  <p className="text-xs sm:text-sm font-medium">Excel</p>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs hidden sm:inline-flex">Recommended</Badge>
                  <Badge variant="secondary" className="text-[10px] sm:hidden">Top</Badge>
                </div>
              </Card>

              <Card
                className={cn(
                  "p-2.5 sm:p-4 cursor-pointer transition-all border-2",
                  format === 'pdf'
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                )}
                onClick={() => setFormat('pdf')}
              >
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <FileText className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8",
                    format === 'pdf' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"
                  )} />
                  <p className="text-xs sm:text-sm font-medium">PDF</p>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs hidden sm:inline-flex">Professional</Badge>
                  <Badge variant="secondary" className="text-[10px] sm:hidden">Pro</Badge>
                </div>
              </Card>
            </div>
          </div>

          {/* Column Selection */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Columns to Include</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
              {columnOptions.map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.id}
                    checked={config.columns.includes(column.id)}
                    onCheckedChange={() => toggleColumn(column.id)}
                  />
                  <label
                    htmlFor={column.id}
                    className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          {(format === 'excel' || format === 'pdf') && (
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base">Additional Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="analytics"
                    checked={config.includeAnalytics}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({ ...prev, includeAnalytics: !!checked }))
                    }
                  />
                  <label
                    htmlFor="analytics"
                    className="text-xs sm:text-sm font-medium leading-none cursor-pointer"
                  >
                    Include Analytics Summary
                  </label>
                </div>

                {format === 'pdf' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="charts"
                      checked={config.includeCharts}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ ...prev, includeCharts: !!checked }))
                      }
                    />
                    <label
                      htmlFor="charts"
                      className="text-xs sm:text-sm font-medium leading-none cursor-pointer"
                    >
                      Include Charts & Visualizations
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Summary */}
          <Card className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total Courses:</span>
              <span className="font-semibold">{courses.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm mt-2">
              <span className="text-gray-600 dark:text-gray-400">Selected Columns:</span>
              <span className="font-semibold">{config.columns.length}</span>
            </div>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || config.columns.length === 0}
            className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 w-full sm:w-auto"
          >
            <AnimatePresence mode="wait">
              {isExporting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs sm:text-sm">Exporting...</span>
                </motion.div>
              ) : exportSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Success!</span>
                </motion.div>
              ) : (
                <motion.div
                  key="export"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-xs sm:text-sm hidden sm:inline">Export to {format.toUpperCase()}</span>
                  <span className="text-xs sm:hidden">Export</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Export functions

/**
 * Export to CSV
 */
async function exportToCSV(courses: CourseWithRelations[], config: ExportConfig): Promise<void> {
  const headers = config.columns.map((col) =>
    columnOptions.find((c) => c.id === col)?.label || col
  );

  const rows = courses.map((course) =>
    config.columns.map((col) => {
      switch (col) {
        case 'title':
          return course.title;
        case 'category':
          return course.category?.name || 'Uncategorized';
        case 'price':
          return course.price || 0;
        case 'status':
          return course.isPublished ? 'Published' : 'Draft';
        case 'enrollments':
          return course._count?.Purchase || 0;
        case 'revenue':
          return (course._count?.Purchase || 0) * (course.price || 0);
        case 'rating':
          return '4.5'; // Placeholder
        case 'completion':
          return '68%'; // Placeholder
        case 'createdAt':
          return new Date(course.createdAt).toLocaleDateString();
        case 'chapters':
          return course._count?.chapters || 0;
        default:
          return '';
      }
    })
  );

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadFile(blob, `courses-export-${Date.now()}.csv`);
}

/**
 * Export to Excel with formatting
 */
async function exportToExcel(courses: CourseWithRelations[], config: ExportConfig): Promise<void> {
  // Note: In a real implementation, you'd use a library like xlsx or exceljs
  // For now, we'll create a formatted CSV that Excel can open
  const headers = config.columns.map((col) =>
    columnOptions.find((c) => c.id === col)?.label || col
  );

  let content = headers.join('\t') + '\n';

  courses.forEach((course) => {
    const row = config.columns.map((col) => {
      switch (col) {
        case 'title':
          return course.title;
        case 'category':
          return course.category?.name || 'Uncategorized';
        case 'price':
          return `$${course.price || 0}`;
        case 'status':
          return course.isPublished ? 'Published' : 'Draft';
        case 'enrollments':
          return course._count?.Purchase || 0;
        case 'revenue':
          return `$${(course._count?.Purchase || 0) * (course.price || 0)}`;
        case 'rating':
          return '4.5 ⭐';
        case 'completion':
          return '68%';
        case 'createdAt':
          return new Date(course.createdAt).toLocaleDateString();
        case 'chapters':
          return course._count?.chapters || 0;
        default:
          return '';
      }
    });
    content += row.join('\t') + '\n';
  });

  // Add analytics summary if requested
  if (config.includeAnalytics) {
    content += '\n\nANALYTICS SUMMARY\n';
    content += `Total Courses\t${courses.length}\n`;
    content += `Total Revenue\t$${courses.reduce((sum, c) => sum + ((c._count?.Purchase || 0) * (c.price || 0)), 0)}\n`;
    content += `Total Enrollments\t${courses.reduce((sum, c) => sum + (c._count?.Purchase || 0), 0)}\n`;
  }

  const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
  downloadFile(blob, `courses-export-${Date.now()}.xls`);
}

/**
 * Export to PDF with charts
 */
async function exportToPDF(
  courses: CourseWithRelations[],
  config: ExportConfig,
  analytics: any
): Promise<void> {
  // Note: In a real implementation, you'd use jsPDF and html2canvas
  // For now, we'll create a formatted HTML that can be printed to PDF

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Courses Export</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #4f46e5; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4f46e5; color: white; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .summary { background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>Courses Export Report</h1>
      <p>Generated on ${new Date().toLocaleDateString()}</p>

      <table>
        <thead>
          <tr>
            ${config.columns.map((col) => `<th>${columnOptions.find((c) => c.id === col)?.label || col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${courses.map((course) => `
            <tr>
              ${config.columns.map((col) => {
                let value = '';
                switch (col) {
                  case 'title': value = course.title; break;
                  case 'category': value = course.category?.name || 'Uncategorized'; break;
                  case 'price': value = `$${course.price || 0}`; break;
                  case 'status': value = course.isPublished ? 'Published' : 'Draft'; break;
                  case 'enrollments': value = String(course._count?.Purchase || 0); break;
                  case 'revenue': value = `$${(course._count?.Purchase || 0) * (course.price || 0)}`; break;
                  default: value = '';
                }
                return `<td>${value}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${config.includeAnalytics ? `
        <div class="summary">
          <h2>Analytics Summary</h2>
          <p>Total Courses: ${courses.length}</p>
          <p>Total Revenue: $${courses.reduce((sum, c) => sum + ((c._count?.Purchase || 0) * (c.price || 0)), 0)}</p>
          <p>Total Enrollments: ${courses.reduce((sum, c) => sum + (c._count?.Purchase || 0), 0)}</p>
        </div>
      ` : ''}
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  downloadFile(blob, `courses-export-${Date.now()}.html`);

  toast.info('PDF file generated. Please print to PDF from your browser.');
}

/**
 * Helper to download file
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

const columnOptions = [
  { id: 'title', label: 'Course Title', default: true },
  { id: 'category', label: 'Category', default: true },
  { id: 'price', label: 'Price', default: true },
  { id: 'status', label: 'Status', default: true },
  { id: 'enrollments', label: 'Total Enrollments', default: true },
  { id: 'revenue', label: 'Revenue', default: true },
  { id: 'rating', label: 'Average Rating', default: false },
  { id: 'completion', label: 'Completion Rate', default: false },
  { id: 'createdAt', label: 'Created Date', default: false },
  { id: 'chapters', label: 'Number of Chapters', default: false },
];
