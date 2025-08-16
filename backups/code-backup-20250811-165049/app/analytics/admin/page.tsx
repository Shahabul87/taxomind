"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { User } from "next-auth";
import { Loader2, AlertCircle, Shield, Building2, Lock, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminGuard } from "@/components/auth/admin-guard";
import { OrganizationOverview } from "@/components/enterprise/OrganizationOverview";
import { ComplianceCenter } from "@/components/enterprise/ComplianceCenter";
import { SecurityDashboard } from "@/components/enterprise/SecurityDashboard";
import { EnterpriseAdminTab } from "@/components/enterprise/EnterpriseAdminTab";

// Stable demo admin user object to prevent unnecessary re-renders
const DEMO_ADMIN_USER: User = {
  id: "demo-admin",
  name: "Demo Admin",
  email: "admin@example.com",
  image: null,
  role: "ADMIN"
} as User;

export default function EnterpriseAdminPage() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Memoize the user to prevent unnecessary re-renders
  const user = useMemo(() => {
    if (status === "loading" || !isInitialized) return null;
    
    if (session?.user && session.user.role === "ADMIN") {
      return session.user as User;
    }
    
    return DEMO_ADMIN_USER;
  }, [session?.user, status, isInitialized]);


  useEffect(() => {
    if (status === "loading") return; // Still loading
    
    if (status === "unauthenticated") {
      setError("User not authenticated - Using demo mode");
      setIsInitialized(true);
      return;
    }

    if (session?.user) {
      if (session.user.role !== "ADMIN") {
        setError("Admin access required - Using demo mode");
        setIsInitialized(true);
        return;
      }
      setError(null);
      setIsInitialized(true);
    } else {
      setError("No user data available - Using demo mode");
      setIsInitialized(true);
    }
  }, [session?.user, status]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading Enterprise Analytics...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Enterprise Header */}
        <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-900 text-white py-8 shadow-xl">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/30 rounded-2xl backdrop-blur-sm border border-blue-400/20">
                  <Shield className="w-10 h-10 text-blue-200" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Enterprise Command Center</h1>
                  <p className="text-blue-200 mt-1">
                    Comprehensive platform oversight and multi-tenant analytics
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-blue-200 text-sm">Welcome back,</p>
                  <p className="text-white font-semibold">{user.name || 'Admin'}</p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="container mx-auto px-4 py-4">
            <div className="bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/50 rounded-2xl p-4 mb-6 shadow-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-amber-700 dark:text-amber-300 text-sm font-medium">
                  {error} — Displaying demo enterprise data
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8 h-14 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md rounded-xl transition-all duration-200"
                >
                  <BarChart3 className="h-4 w-4" />
                  Enterprise Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="organizations" 
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md rounded-xl transition-all duration-200"
                >
                  <Building2 className="h-4 w-4" />
                  Organizations
                </TabsTrigger>
                <TabsTrigger 
                  value="compliance" 
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md rounded-xl transition-all duration-200"
                >
                  <Shield className="h-4 w-4" />
                  Compliance
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md rounded-xl transition-all duration-200"
                >
                  <Lock className="h-4 w-4" />
                  Security
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <EnterpriseAdminTab analytics={{}} performance={{}} />
              </TabsContent>

              <TabsContent value="organizations" className="mt-0">
                <OrganizationOverview />
              </TabsContent>

              <TabsContent value="compliance" className="mt-0">
                <ComplianceCenter />
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <SecurityDashboard />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-t border-slate-200/50 dark:border-slate-700/50 py-6 mt-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>MindForge Enterprise LMS v2.0</span>
              </div>
              <div className="flex items-center gap-6">
                <span>Last updated: {new Date().toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>System Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}