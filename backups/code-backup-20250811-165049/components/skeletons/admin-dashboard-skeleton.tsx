"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminDashboardSkeleton() {
  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-9 w-[80px]" />
              </div>
            </div>
            <Skeleton className="absolute bottom-0 left-0 right-0 h-1" />
          </Card>
        ))}
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-11">
          <TabsTrigger value="overview" disabled>Overview</TabsTrigger>
          <TabsTrigger value="users" disabled>Users</TabsTrigger>
          <TabsTrigger value="content" disabled>Content</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <Skeleton className="h-6 w-[150px] mb-6" />
              <Skeleton className="h-[300px] w-full" />
            </Card>
            
            <Card className="p-6">
              <Skeleton className="h-6 w-[180px] mb-6" />
              <Skeleton className="h-[300px] w-full" />
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i} className="flex items-center gap-4 p-6">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-6 w-[60px]" />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 