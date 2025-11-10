"use client";

import React, { useState, useEffect } from "react";
import type { User as NextAuthUser } from "next-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SmartHeader } from "@/components/dashboard/smart-header";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";
import { Loader2 } from "lucide-react";
import { CoursePlansTab } from "./CoursePlansTab";
import { BlogPlansTab } from "./BlogPlansTab";
import { StudyPlansTab } from "./StudyPlansTab";

interface MyPlansClientProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
}

export function MyPlansClient({ user }: MyPlansClientProps) {
  const [activeTab, setActiveTab] = useState("course-plans");

  return (
    <>
      <SmartSidebar user={user} />
      <div className="ml-[72px]">
        <SmartHeader user={user} />
        <div className="min-h-screen pt-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            My Plans
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your learning and content creation plans in one place
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-white dark:bg-slate-800 shadow-sm">
            <TabsTrigger value="course-plans">Course Plans</TabsTrigger>
            <TabsTrigger value="blog-plans">Blog Plans</TabsTrigger>
            <TabsTrigger value="study-plans">Study Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="course-plans">
            <CoursePlansTab />
          </TabsContent>

          <TabsContent value="blog-plans">
            <BlogPlansTab />
          </TabsContent>

          <TabsContent value="study-plans">
            <StudyPlansTab />
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
