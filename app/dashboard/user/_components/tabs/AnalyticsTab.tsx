"use client";

import { useState } from "react";
import { User } from "next-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImprovedUnifiedAnalytics } from '@/components/analytics/ImprovedUnifiedAnalytics';
import { AnalyticsErrorBoundary } from '@/components/analytics/ErrorBoundary';
import { PostAnalyticsTab } from '@/components/analytics/tabs/PostAnalyticsTab';

interface AnalyticsTabProps {
  user: User;
}

export function AnalyticsTab({ user }: AnalyticsTabProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <AnalyticsErrorBoundary>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm mb-6">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
            >
              Learning Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="posts" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
            >
              Content Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <ImprovedUnifiedAnalytics 
              user={user} 
              variant="dashboard"
              className="min-h-[600px]"
            />
          </TabsContent>
          
          <TabsContent value="posts">
            <PostAnalyticsTab />
          </TabsContent>
        </Tabs>
      </AnalyticsErrorBoundary>
    </div>
  );
}