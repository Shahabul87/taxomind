import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Users, BookOpen, BarChart3, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard - Taxomind",
  description: "Admin dashboard for managing the learning platform",
};

export default async function AdminPage() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Welcome back, Admin! Here&apos;s your overview.
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Users",
            value: "1,234",
            change: "+12%",
            icon: Users,
          },
          {
            title: "Total Courses",
            value: "56",
            change: "+3 new",
            icon: BookOpen,
          },
          {
            title: "Active Sessions",
            value: "89",
            change: "+23",
            icon: BarChart3,
          },
          {
            title: "Reports",
            value: "24",
            change: "+5 pending",
            icon: FileText,
          },
        ].map((stat, idx) => (
          <Card key={idx} className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Sections */}
      <div className="grid flex-1 gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card className="flex flex-col bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {[
                {
                  title: "New user registered",
                  time: "2 minutes ago",
                  color: "bg-blue-500",
                },
                {
                  title: "Course published",
                  time: "15 minutes ago",
                  color: "bg-green-500",
                },
                {
                  title: "Report submitted",
                  time: "1 hour ago",
                  color: "bg-yellow-500",
                },
                {
                  title: "System update",
                  time: "3 hours ago",
                  color: "bg-purple-500",
                },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={cn("mt-1 h-2 w-2 rounded-full", activity.color)} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="flex flex-col bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Add User", icon: Users },
                { label: "Create Course", icon: BookOpen },
                { label: "View Reports", icon: FileText },
                { label: "System Settings", icon: Settings },
              ].map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="h-20 flex-col gap-2 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300"
                >
                  <action.icon className="h-5 w-5" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 
