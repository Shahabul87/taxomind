"use client";

/**
 * Enhanced Unified Dashboard with Google-style Context Switching
 * 
 * This dashboard implements the clean authentication system where:
 * - Users have one role (ADMIN or USER)
 * - Users can switch between different capability contexts
 * - Similar to Google Workspace context switching
 */

import { useState, useEffect, useCallback } from "react";
import { User } from "next-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  BookOpen, 
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Settings,
  ChevronRight,
  Plus,
  Play,
  Award,
  BarChart3,
  Package,
  Target,
  Zap,
  Star,
  ArrowUpRight,
  RefreshCw,
  Shield,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import axios from "axios";

// Import individual dashboard components
import { LearnerDashboard } from "./LearnerDashboard";
import { TeacherDashboard } from "./TeacherDashboard";
import { AffiliateDashboard } from "./AffiliateDashboard";
import { AdminDashboard } from "./AdminDashboard";

// Types
interface UserCapabilityInfo {
  capability: string;
  label: string;
  icon: any;
  isActive: boolean;
  activatedAt?: string;
}

interface UserContextInfo {
  capability: string;
  capabilities: string[];
}

interface ContextSwitch {
  capability: string;
  label: string;
  icon: string;
  isActive: boolean;
}

interface UnifiedDashboardProps {
  user: User & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
    teacherActivatedAt?: Date;
    affiliateActivatedAt?: Date;
    affiliateCode?: string;
  };
}

export function UnifiedDashboard({ user }: UnifiedDashboardProps) {
  // State management
  const [currentContext, setCurrentContext] = useState<UserContextInfo | null>(null);
  const [availableSwitches, setAvailableSwitches] = useState<ContextSwitch[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showCapabilityModal, setShowCapabilityModal] = useState(false);
  const [requestedCapability, setRequestedCapability] = useState<string | null>(null);

  // Determine if user is admin
  const isAdmin = user.role === "ADMIN";

  // Capability icon mapping
  const capabilityIcons: Record<string, any> = {
    STUDENT: GraduationCap,
    TEACHER: BookOpen,
    AFFILIATE: DollarSign,
    CONTENT_CREATOR: Package,
    MODERATOR: Shield,
    REVIEWER: Star,
  };

  // Fetch current context and available switches
  const fetchContext = useCallback(async () => {
    try {
      const response = await axios.get("/api/auth/context");
      if (response.data.success) {
        setCurrentContext(response.data.data.currentContext);
        setAvailableSwitches(response.data.data.availableSwitches);
        setDashboardData(response.data.data.dashboardData);
      }
    } catch (error) {
      console.error("Failed to fetch context:", error);
      // Fallback to default context
      setCurrentContext({
        capability: "STUDENT",
        capabilities: ["STUDENT"],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // Handle context switching
  const handleContextSwitch = async (newContext: string) => {
    setIsSwitching(true);
    try {
      const response = await axios.post("/api/auth/context", {
        context: newContext,
      });

      if (response.data.success) {
        setCurrentContext(response.data.data.newContext);
        setAvailableSwitches(response.data.data.availableSwitches);
        setDashboardData(response.data.data.dashboardData);
        toast.success(`Switched to ${newContext.toLowerCase()} view`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to switch context");
    } finally {
      setIsSwitching(false);
    }
  };

  // Handle capability request (become teacher/affiliate)
  const handleCapabilityRequest = async (capability: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/capabilities", {
        capability,
      });

      if (response.data.success) {
        toast.success(`You now have ${capability.toLowerCase()} capabilities!`);
        // Refresh context to show new capability
        await fetchContext();
        // Switch to the new context
        await handleContextSwitch(capability);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to activate capability");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render admin dashboard if admin
  if (isAdmin) {
    return <AdminDashboard user={user} />;
  }

  // Context header component
  const ContextHeader = () => (
    <div className="mb-6 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Current context icon */}
          <div className="p-3 bg-primary/20 rounded-lg">
            {currentContext && capabilityIcons[currentContext.capability] && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {(() => {
                  const Icon = capabilityIcons[currentContext.capability];
                  return <Icon className="h-6 w-6 text-primary" />;
                })()}
              </motion.div>
            )}
          </div>

          {/* Context info */}
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {currentContext?.capability === "STUDENT" && "Student Dashboard"}
              {currentContext?.capability === "TEACHER" && "Instructor Dashboard"}
              {currentContext?.capability === "AFFILIATE" && "Affiliate Dashboard"}
              <Badge variant="secondary" className="ml-2">
                {currentContext?.capability}
              </Badge>
            </h2>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user.name || user.email}
            </p>
          </div>
        </div>

        {/* Context switcher */}
        <div className="flex items-center gap-3">
          {/* Quick context switches */}
          {availableSwitches.length > 0 && (
            <div className="flex gap-2">
              {availableSwitches.map((switchOption) => (
                <Button
                  key={switchOption.capability}
                  variant="outline"
                  size="sm"
                  disabled={isSwitching}
                  onClick={() => handleContextSwitch(switchOption.capability)}
                  className="flex items-center gap-2"
                >
                  {isSwitching ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                  {switchOption.label}
                </Button>
              ))}
            </div>
          )}

          {/* Capability dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Capability
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Available Capabilities</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {!currentContext?.capabilities.includes("TEACHER") && (
                <DropdownMenuItem
                  onClick={() => handleCapabilityRequest("TEACHER")}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Become an Instructor</div>
                    <div className="text-xs text-muted-foreground">
                      Create and sell courses
                    </div>
                  </div>
                </DropdownMenuItem>
              )}
              
              {!currentContext?.capabilities.includes("AFFILIATE") && (
                <DropdownMenuItem
                  onClick={() => handleCapabilityRequest("AFFILIATE")}
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Become an Affiliate</div>
                    <div className="text-xs text-muted-foreground">
                      Earn by promoting courses
                    </div>
                  </div>
                </DropdownMenuItem>
              )}

              {!currentContext?.capabilities.includes("REVIEWER") && (
                <DropdownMenuItem
                  onClick={() => handleCapabilityRequest("REVIEWER")}
                  className="flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Become a Reviewer</div>
                    <div className="text-xs text-muted-foreground">
                      Review and rate courses
                    </div>
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Capability badges */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Your capabilities:</span>
        {currentContext?.capabilities.map((cap) => (
          <Badge key={cap} variant={cap === currentContext.capability ? "default" : "secondary"}>
            {cap.toLowerCase()}
          </Badge>
        ))}
      </div>
    </div>
  );

  // Render appropriate dashboard based on current context
  const renderDashboard = () => {
    switch (currentContext?.capability) {
      case "TEACHER":
        return <TeacherDashboard user={user} />;
      case "AFFILIATE":
        return <AffiliateDashboard user={user} />;
      case "STUDENT":
      default:
        return <LearnerDashboard user={user} />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentContext?.capability}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ContextHeader />
          {renderDashboard()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}