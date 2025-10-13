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

  return (
    <div className="flex h-full w-full flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-10">

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Reports Center</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Generate and manage platform reports and analytics
            </p>
          </div>
          <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600">
            <FileText className="mr-2 h-4 w-4" />
            Generate New Report
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Revenue Report
                </CardTitle>
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generate monthly revenue analysis</p>
              <Button size="sm" className="mt-3 w-full bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500">
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  User Analytics
                </CardTitle>
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 dark:text-slate-400">Analyze user engagement metrics</p>
              <Button size="sm" className="mt-3 w-full bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500">
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Course Report
                </CardTitle>
                <FileBarChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 dark:text-slate-400">Course performance metrics</p>
              <Button size="sm" className="mt-3 w-full bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500">
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  System Health
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 dark:text-slate-400">Platform performance report</p>
              <Button size="sm" className="mt-3 w-full bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500">
                Generate
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Recent Reports</CardTitle>
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full md:w-[250px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-[150px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600">
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
                  <SelectTrigger className="w-full md:w-[150px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600">
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
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-700">
                    <TableHead className="text-slate-600 dark:text-slate-300">Report Name</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Generated By</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Size</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id} className="border-slate-200 dark:border-slate-700">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <report.icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                          </div>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{report.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-300 dark:border-slate-600">
                          {report.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">{report.generatedBy}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">{report.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(report.status)}
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">{report.size}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {report.status === "Completed" && (
                            <>
                              <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                                <Send className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}