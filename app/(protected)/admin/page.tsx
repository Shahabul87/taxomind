"use client";

import Link from "next/link";
import { admin } from "@/actions/admin";
import { RoleGate } from "@/components/auth/role-gate";
import { FormSuccess } from "@/components/form-success";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AdminRole } from "@/types/admin-role";
import { toast } from "sonner";
import { Activity, Brain, Wrench, BarChart3 } from "lucide-react";

const AdminPage = () => {
  const onServerActionClick = () => {
    admin()
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
        }

        if (data.success) {
          toast.success(data.success);
        }
      })
  }
  
  const onApiRouteClick = () => {
    fetch("/api/admin")
      .then((response) => {
        if (response.ok) {
          toast.success("Allowed API Route!");
        } else {
          toast.error("Forbidden API Route!");
        }
      })
  }

  return (
    <Card className="w-full h-full rounded-none">
      <CardHeader>
        <p className="text-2xl font-semibold text-center">
          🔑 Admin
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <RoleGate allowedRole={AdminRole.ADMIN}>
          <FormSuccess
            message="You are allowed to see this content!"
          />
        </RoleGate>
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-md">
          <p className="text-sm font-medium">
            Admin-only API Route
          </p>
          <Button onClick={onApiRouteClick}>
            Click to test
          </Button>
        </div>

        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-md">
          <p className="text-sm font-medium">
            Admin-only Server Action
          </p>
          <Button onClick={onServerActionClick}>
            Click to test
          </Button>
        </div>

        {/* SAM AI Management Section */}
        <div className="pt-4 border-t">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            SAM AI Management
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/admin/sam-health">
              <div className="flex items-center gap-3 rounded-lg border p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">System Health</p>
                  <p className="text-xs text-muted-foreground">
                    Monitor SAM AI health and services
                  </p>
                </div>
              </div>
            </Link>
            <Link href="/admin/sam-health">
              <div className="flex items-center gap-3 rounded-lg border p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="p-2 rounded-full bg-green-50 dark:bg-green-950">
                  <Wrench className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tool Executions</p>
                  <p className="text-xs text-muted-foreground">
                    View AI tool call history and logs
                  </p>
                </div>
              </div>
            </Link>
            <Link href="/admin/sam-health">
              <div className="flex items-center gap-3 rounded-lg border p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-950">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Quality Metrics</p>
                  <p className="text-xs text-muted-foreground">
                    Track response quality and trends
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPage;