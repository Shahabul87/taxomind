"use client";

import { User } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Shield,
  Users,
  Settings,
  FileText,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Database,
  Lock,
  Activity
} from "lucide-react";

interface AdminDashboardProps {
  user: User;
  dashboardData?: any;
}

export function AdminDashboard({ user, dashboardData }: AdminDashboardProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-white/90 mt-1">
                Platform administration and management
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white text-red-600">
            ADMIN ACCESS
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 inline mr-1" />
              5 pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              Uptime: 99.98%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              <Lock className="h-3 w-3 inline mr-1" />
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/users">
                View All Users
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/users/roles">
                Manage Roles
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/users/capabilities">
                Manage Capabilities
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/settings">
                General Settings
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/settings/security">
                Security Settings
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/settings/database">
                Database Management
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics & Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/analytics">
                Platform Analytics
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/audit">
                Audit Logs
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/reports">
                Generate Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-xs text-muted-foreground">john.doe@example.com</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">2 minutes ago</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Course approved</p>
                  <p className="text-xs text-muted-foreground">Advanced React Patterns</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">15 minutes ago</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Security alert</p>
                  <p className="text-xs text-muted-foreground">Multiple failed login attempts</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">1 hour ago</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Database className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Database backup completed</p>
                  <p className="text-xs text-muted-foreground">Automatic daily backup</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">3 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium">Admin Mode Active</p>
            <p className="text-sm text-muted-foreground">
              You have full access to all platform features. Please use admin privileges responsibly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}