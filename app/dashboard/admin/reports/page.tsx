"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  FileBarChart,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Trash2,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Mock data for reports
const mockReports = [
  {
    id: "1",
    name: "Monthly Revenue Report",
    type: "Financial",
    generatedBy: "System",
    date: "2024-10-01",
    status: "Completed",
    size: "2.4 MB",
    icon: DollarSign,
  },
  {
    id: "2",
    name: "User Engagement Analysis",
    type: "Analytics",
    generatedBy: "Admin",
    date: "2024-10-05",
    status: "Completed",
    size: "1.8 MB",
    icon: Users,
  },
  {
    id: "3",
    name: "Course Performance Q3",
    type: "Performance",
    generatedBy: "System",
    date: "2024-10-08",
    status: "Processing",
    size: "-",
    icon: TrendingUp,
  },
  {
    id: "4",
    name: "Student Progress Report",
    type: "Academic",
    generatedBy: "Instructor",
    date: "2024-10-10",
    status: "Completed",
    size: "3.1 MB",
    icon: FileBarChart,
  },
  {
    id: "5",
    name: "Platform Health Check",
    type: "Technical",
    generatedBy: "System",
    date: "2024-10-11",
    status: "Failed",
    size: "-",
    icon: AlertTriangle,
  },
];

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Filter reports
  const filteredReports = mockReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || report.type === filterType;
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Processing": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Failed": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "Completed": return <CheckCircle className="h-4 w-4" />;
      case "Processing": return <Clock className="h-4 w-4" />;
      case "Failed": return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">

        {/* Page Header */}
        <motion.div
          className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              Reports Center
            </h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Generate and manage platform reports and analytics
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto min-h-[44px] text-sm sm:text-base">
            <FileText className="mr-2 h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Generate New Report</span>
            <span className="sm:hidden">New Report</span>
          </Button>
        </motion.div>

        {/* Stats Grid - Gradient Cards */}
        <motion.div
          className="grid grid-cols-1 gap-2.5 sm:gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {[
            {
              title: "Total Reports",
              value: "248",
              change: "+12 this month",
              trend: "up",
              icon: FileText,
              gradient: "from-blue-500 to-indigo-500",
              hoverGradient: "from-blue-400/20 to-indigo-700/20"
            },
            {
              title: "Completed",
              value: "215",
              change: "86.7% success rate",
              trend: "up",
              icon: CheckCircle,
              gradient: "from-emerald-500 to-teal-500",
              hoverGradient: "from-emerald-400/20 to-teal-700/20"
            },
            {
              title: "Processing",
              value: "18",
              change: "In progress",
              trend: "neutral",
              icon: Clock,
              gradient: "from-yellow-500 to-amber-500",
              hoverGradient: "from-yellow-400/20 to-amber-700/20"
            },
            {
              title: "Failed",
              value: "15",
              change: "Requires attention",
              trend: "down",
              icon: AlertTriangle,
              gradient: "from-orange-500 to-red-500",
              hoverGradient: "from-orange-400/20 to-red-700/20"
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={cn(
                "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
                `bg-gradient-to-br ${stat.gradient}`
              )}>
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  stat.hoverGradient
                )} />
                <div className="relative p-3.5 sm:p-4 md:p-5">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-white/90 truncate">{stat.title}</span>
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-white/80">
                    {stat.trend === "up" && <TrendingUp className="w-3 h-3 shrink-0" />}
                    <span className="truncate">{stat.change}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions - Report Generators */}
        <motion.div
          className="grid grid-cols-1 gap-2.5 sm:gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {[
            {
              label: "Revenue Report",
              description: "Generate monthly revenue analysis",
              icon: DollarSign,
              gradient: "from-emerald-500 to-teal-500"
            },
            {
              label: "User Analytics",
              description: "Analyze user engagement metrics",
              icon: Users,
              gradient: "from-blue-500 to-indigo-500"
            },
            {
              label: "Course Report",
              description: "Course performance metrics",
              icon: FileBarChart,
              gradient: "from-purple-500 to-pink-500"
            },
            {
              label: "System Health",
              description: "Platform performance report",
              icon: TrendingUp,
              gradient: "from-orange-500 to-red-500"
            },
          ].map((action, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
            >
              <Card className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer touch-manipulation">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "p-1.5 sm:p-2 rounded-lg bg-gradient-to-r transition-transform duration-300 group-hover:scale-110 shrink-0",
                      action.gradient
                    )}>
                      <action.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                    {action.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-2 sm:mb-3">{action.description}</p>
                  <Button size="sm" className={cn(
                    "w-full bg-gradient-to-r text-white border-0 shadow-sm hover:shadow-md transition-all duration-300 min-h-[40px] sm:min-h-0 text-xs sm:text-sm",
                    action.gradient
                  )}>
                    Generate
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Reports Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
              <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-white">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold">Recent Reports</span>
                </CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full md:w-[250px] bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50 focus:bg-white dark:focus:bg-slate-900 min-h-[44px] text-base sm:text-sm"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full md:w-[150px] bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50 min-h-[44px] text-base sm:text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Analytics">Analytics</SelectItem>
                      <SelectItem value="Performance">Performance</SelectItem>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[150px] bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50 min-h-[44px] text-base sm:text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              {/* Mobile Card View / Desktop Table View */}
              {filteredReports.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-400 dark:text-slate-600 mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">No reports found</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-3">
                    {filteredReports.map((report, idx) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                          <CardContent className="p-4 space-y-3">
                            {/* Report Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-sm shrink-0">
                                  <report.icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base line-clamp-2 mb-1">
                                    {report.name}
                                  </h3>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] border-slate-300/50 dark:border-slate-600/50 bg-slate-50/50 dark:bg-slate-800/50">
                                      {report.type}
                                    </Badge>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                      by {report.generatedBy}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Report Details Grid */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                              <div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</p>
                                <p className="mt-1 text-xs text-slate-900 dark:text-slate-100">{report.date}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Size</p>
                                <p className="mt-1 text-xs text-slate-900 dark:text-slate-100">{report.size}</p>
                              </div>
                            </div>

                            {/* Status and Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-1.5">
                                {getStatusIcon(report.status)}
                                <Badge className={cn("text-[10px]", getStatusColor(report.status))}>
                                  {report.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                {report.status === "Completed" && (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400">
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto -mx-3 sm:mx-0">
                    <div className="inline-block min-w-full align-middle px-3 sm:px-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-200/50 dark:border-slate-700/50 hover:bg-transparent">
                            <TableHead className="text-slate-700 dark:text-slate-300 font-semibold text-left min-w-[200px]">Report Name</TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300 font-semibold text-center min-w-[100px]">Type</TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300 font-semibold text-center min-w-[120px]">Generated By</TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300 font-semibold text-center min-w-[100px]">Date</TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300 font-semibold text-center min-w-[120px]">Status</TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300 font-semibold text-center min-w-[80px]">Size</TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300 font-semibold text-center min-w-[180px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReports.map((report, idx) => (
                            <motion.tr
                              key={report.id}
                              className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7 + idx * 0.05 }}
                            >
                              <TableCell className="text-left">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-sm shrink-0">
                                    <report.icon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-300" />
                                  </div>
                                  <span className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate max-w-[200px]">{report.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center">
                                  <Badge variant="outline" className="border-slate-300/50 dark:border-slate-600/50 bg-slate-50/50 dark:bg-slate-800/50 text-xs">
                                    {report.type}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-slate-700 dark:text-slate-300 text-sm">{report.generatedBy}</TableCell>
                              <TableCell className="text-center text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">{report.date}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="shrink-0">{getStatusIcon(report.status)}</span>
                                  <Badge className={cn("text-xs", getStatusColor(report.status))}>
                                    {report.status}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">{report.size}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap">
                                  {report.status === "Completed" && (
                                    <>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation">
                                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors touch-manipulation">
                                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-slate-500 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-colors touch-manipulation">
                                        <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                    </>
                                  )}
                                  <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-colors touch-manipulation">
                                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}