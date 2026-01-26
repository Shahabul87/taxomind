"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Bot,
  Settings,
  BarChart3,
  Shield,
  DollarSign,
  Users,
  Zap,
  AlertTriangle,
  Check,
  X,
  Save,
  RefreshCw,
  TrendingUp,
  Activity,
  Cpu,
  Cloud,
  Sparkles,
  BookOpen,
  Code,
  Info,
} from "lucide-react";

// Types
interface Provider {
  id: string;
  name: string;
  description: string;
  models: string[];
  defaultModel: string;
  capabilities: string[];
  isConfigured: boolean;
  isEnabled: boolean;
}

interface PlatformSettings {
  id: string;
  defaultProvider: string;
  fallbackProvider: string | null;
  anthropicEnabled: boolean;
  deepseekEnabled: boolean;
  openaiEnabled: boolean;
  geminiEnabled: boolean;
  mistralEnabled: boolean;
  freeMonthlyLimit: number;
  starterMonthlyLimit: number;
  proMonthlyLimit: number;
  enterpriseMonthlyLimit: number;
  freeDailyChatLimit: number;
  starterDailyChatLimit: number;
  proDailyChatLimit: number;
  enterpriseDailyChatLimit: number;
  monthlyBudget: number | null;
  alertThreshold: number;
  costAlertEmail: string | null;
  allowUserProviderSelection: boolean;
  allowUserModelSelection: boolean;
  requireApprovalForCourses: boolean;
  defaultAnthropicModel: string;
  defaultDeepseekModel: string;
  defaultOpenaiModel: string;
  defaultGeminiModel: string;
  defaultMistralModel: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

interface UsageSummary {
  totalGenerations: number;
  totalTokens: number;
  totalCost: number;
  avgRating: number;
  avgApprovalRate: number;
  activeUsers: number;
}

interface UsageData {
  period: string;
  summary: UsageSummary;
  generationBreakdown: {
    courses: number;
    chapters: number;
    lessons: number;
    exams: number;
    exercises: number;
  };
  dailyUsage: Array<{
    date: string;
    generations: number;
    tokens: number;
    cost: number;
  }>;
  estimatedCosts: {
    deepseek: number;
    anthropic: number;
    openai: number;
  };
}

const PROVIDER_ICONS: Record<string, string> = {
  anthropic: "🧠",
  deepseek: "🔍",
  openai: "🤖",
  gemini: "✨",
  mistral: "🌬️",
};

export default function AdminAISettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [usagePeriod, setUsagePeriod] = useState("week");

  // Use refs to track stable references
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoadError(null);
      const response = await fetch("/api/admin/ai-settings", {
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok && data.success !== false) {
        setProviders(data.providers || []);
        setSettings(data.settings);
      } else {
        const errorMsg = data.error || "Failed to load AI settings";
        const errorCode = data.code || "UNKNOWN";
        console.error("AI Settings API Error:", { errorMsg, errorCode, details: data.details });

        if (errorCode === "UNAUTHORIZED") {
          setLoadError("Session expired or unauthorized. Please log in again.");
          toast.error("Please log in to access AI settings");
        } else {
          setLoadError(`${errorMsg}${data.details ? `: ${data.details}` : ""}`);
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      console.error("Failed to fetch AI settings:", error);
      setLoadError("Network error: Unable to connect to the server");
      toast.error("Failed to load AI settings - Network error");
    }
  }, []);

  const fetchUsageData = useCallback(async (period: string) => {
    try {
      const response = await fetch(`/api/admin/ai-usage?period=${period}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUsageData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSettings(), fetchUsageData(usagePeriod)]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchSettings, fetchUsageData, usagePeriod]);

  const handleSettingChange = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K]
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("AI settings saved successfully");
        setHasChanges(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <Alert className="max-w-lg border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <AlertDescription className="space-y-3">
            <p className="font-semibold text-red-800 dark:text-red-200">
              Failed to load AI settings
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              {loadError || "Unable to load settings. Please try again."}
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
              {loadError?.includes("unauthorized") || loadError?.includes("Session") ? (
                <Button
                  size="sm"
                  onClick={() => window.location.href = "/admin/auth/login"}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Log In Again
                </Button>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const configuredProviders = providers.filter((p) => p.isConfigured);
  const enabledProviders = providers.filter((p) => p.isEnabled && p.isConfigured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                AI Provider Management
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Configure AI providers, limits, and monitor usage
              </p>
            </div>
          </div>

          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatCard
            icon={<Cloud className="h-5 w-5" />}
            label="Active Providers"
            value={enabledProviders.length}
            subtext={`of ${configuredProviders.length} configured`}
            color="blue"
          />
          <StatCard
            icon={<Zap className="h-5 w-5" />}
            label="Total Generations"
            value={usageData?.summary.totalGenerations || 0}
            subtext={`This ${usagePeriod}`}
            color="purple"
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Active Users"
            value={usageData?.summary.activeUsers || 0}
            subtext="Using AI features"
            color="green"
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Est. Cost"
            value={`$${(usageData?.summary.totalCost || 0).toFixed(2)}`}
            subtext={`This ${usagePeriod}`}
            color="amber"
          />
        </motion.div>

        {/* Maintenance Mode Alert */}
        {settings.maintenanceMode && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>AI Maintenance Mode is ON.</strong> All AI features are
              disabled for users.
              {settings.maintenanceMessage && (
                <span className="block mt-1 text-sm">
                  Message: {settings.maintenanceMessage}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <TabsTrigger
              value="providers"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <Cloud className="mr-2 h-4 w-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger
              value="limits"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Shield className="mr-2 h-4 w-4" />
              Rate Limits
            </TabsTrigger>
            <TabsTrigger
              value="usage"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Usage Analytics
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
            >
              <Settings className="mr-2 h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-6">
            <ProvidersSection
              providers={providers}
              settings={settings}
              onSettingChange={handleSettingChange}
            />
          </TabsContent>

          {/* Rate Limits Tab */}
          <TabsContent value="limits" className="space-y-6">
            <RateLimitsSection
              settings={settings}
              onSettingChange={handleSettingChange}
            />
          </TabsContent>

          {/* Usage Analytics Tab */}
          <TabsContent value="usage" className="space-y-6">
            <UsageAnalyticsSection
              usageData={usageData}
              period={usagePeriod}
              onPeriodChange={(p) => {
                setUsagePeriod(p);
                fetchUsageData(p);
              }}
            />
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <AdvancedSection
              settings={settings}
              onSettingChange={handleSettingChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
  color: "blue" | "purple" | "green" | "amber";
}) {
  const colorClasses = {
    blue: "from-blue-500 to-indigo-500",
    purple: "from-purple-500 to-pink-500",
    green: "from-green-500 to-emerald-500",
    amber: "from-amber-500 to-orange-500",
  };

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-lg bg-gradient-to-r flex items-center justify-center text-white",
              colorClasses[color]
            )}
          >
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {subtext}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Providers Section
function ProvidersSection({
  providers,
  settings,
  onSettingChange,
}: {
  providers: Provider[];
  settings: PlatformSettings;
  onSettingChange: <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K]
  ) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Default Provider Selection */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-500" />
            Default Provider Configuration
          </CardTitle>
          <CardDescription>
            Set the default AI provider for the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Primary Provider</Label>
              <Select
                value={settings.defaultProvider}
                onValueChange={(value) =>
                  onSettingChange("defaultProvider", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers
                    .filter((p) => p.isConfigured)
                    .map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center gap-2">
                          <span>{PROVIDER_ICONS[provider.id]}</span>
                          <span>{provider.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Used by default for all AI operations
              </p>
            </div>

            <div className="space-y-2">
              <Label>Fallback Provider</Label>
              <Select
                value={settings.fallbackProvider || "none"}
                onValueChange={(value) =>
                  onSettingChange(
                    "fallbackProvider",
                    value === "none" ? null : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No fallback</SelectItem>
                  {providers
                    .filter(
                      (p) => p.isConfigured && p.id !== settings.defaultProvider
                    )
                    .map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center gap-2">
                          <span>{PROVIDER_ICONS[provider.id]}</span>
                          <span>{provider.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Used when primary provider fails
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-purple-500" />
            AI Providers
          </CardTitle>
          <CardDescription>
            Enable or disable providers and configure their models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                settings={settings}
                onToggle={(enabled) => {
                  const key =
                    `${provider.id}Enabled` as keyof PlatformSettings;
                  onSettingChange(key, enabled);
                }}
                onModelChange={(model) => {
                  const key =
                    `default${provider.id.charAt(0).toUpperCase() + provider.id.slice(1)}Model` as keyof PlatformSettings;
                  onSettingChange(key, model);
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Provider Card
function ProviderCard({
  provider,
  settings,
  onToggle,
  onModelChange,
}: {
  provider: Provider;
  settings: PlatformSettings;
  onToggle: (enabled: boolean) => void;
  onModelChange: (model: string) => void;
}) {
  const enabledKey = `${provider.id}Enabled` as keyof PlatformSettings;
  const modelKey =
    `default${provider.id.charAt(0).toUpperCase() + provider.id.slice(1)}Model` as keyof PlatformSettings;
  const isEnabled = settings[enabledKey] as boolean;
  const currentModel = settings[modelKey] as string;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all",
        provider.isConfigured
          ? isEnabled
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
          : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{PROVIDER_ICONS[provider.id]}</span>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">
              {provider.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {provider.description.slice(0, 40)}...
            </p>
          </div>
        </div>
        {provider.isConfigured ? (
          <Switch
            checked={isEnabled}
            onCheckedChange={onToggle}
            disabled={!provider.isConfigured}
          />
        ) : (
          <Badge variant="outline" className="text-amber-600">
            Not Configured
          </Badge>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex gap-2 mb-3">
        <Badge
          variant="outline"
          className={cn(
            provider.isConfigured
              ? "text-green-600 border-green-300"
              : "text-amber-600 border-amber-300"
          )}
        >
          {provider.isConfigured ? (
            <Check className="h-3 w-3 mr-1" />
          ) : (
            <X className="h-3 w-3 mr-1" />
          )}
          {provider.isConfigured ? "API Key Set" : "API Key Missing"}
        </Badge>
        {isEnabled && provider.isConfigured && (
          <Badge className="bg-blue-100 text-blue-700">
            <Zap className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )}
      </div>

      {/* Model Selection */}
      {provider.isConfigured && (
        <div className="space-y-2">
          <Label className="text-xs">Default Model</Label>
          <Select value={currentModel} onValueChange={onModelChange}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {provider.models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                  {model === provider.defaultModel && (
                    <span className="text-slate-400 ml-2">(default)</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Capabilities */}
      <div className="mt-3 flex flex-wrap gap-1">
        {provider.capabilities.slice(0, 4).map((cap) => (
          <Badge key={cap} variant="secondary" className="text-xs">
            {cap}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Rate Limits Section
function RateLimitsSection({
  settings,
  onSettingChange,
}: {
  settings: PlatformSettings;
  onSettingChange: <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K]
  ) => void;
}) {
  const tiers = [
    { name: "Free", color: "slate", monthlyKey: "freeMonthlyLimit" as const, dailyKey: "freeDailyChatLimit" as const },
    { name: "Starter", color: "blue", monthlyKey: "starterMonthlyLimit" as const, dailyKey: "starterDailyChatLimit" as const },
    { name: "Professional", color: "purple", monthlyKey: "proMonthlyLimit" as const, dailyKey: "proDailyChatLimit" as const },
    { name: "Enterprise", color: "amber", monthlyKey: "enterpriseMonthlyLimit" as const, dailyKey: "enterpriseDailyChatLimit" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Monthly Generation Limits */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Monthly AI Generation Limits
          </CardTitle>
          <CardDescription>
            Set maximum AI generations per month for each subscription tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 space-y-3"
              >
                <Label className="font-semibold">{tier.name}</Label>
                <Input
                  type="number"
                  value={settings[tier.monthlyKey]}
                  onChange={(e) =>
                    onSettingChange(tier.monthlyKey, parseInt(e.target.value) || 0)
                  }
                  min={0}
                />
                <p className="text-xs text-slate-500">generations/month</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Chat Limits */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Daily SAM AI Chat Limits
          </CardTitle>
          <CardDescription>
            Set maximum chat messages per day with SAM AI tutor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 space-y-3"
              >
                <Label className="font-semibold">{tier.name}</Label>
                <Input
                  type="number"
                  value={settings[tier.dailyKey]}
                  onChange={(e) =>
                    onSettingChange(tier.dailyKey, parseInt(e.target.value) || 0)
                  }
                  min={0}
                />
                <p className="text-xs text-slate-500">messages/day</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Management */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-500" />
            Cost Management
          </CardTitle>
          <CardDescription>
            Set budget alerts and cost controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Monthly Budget (USD)</Label>
              <Input
                type="number"
                placeholder="No limit"
                value={settings.monthlyBudget || ""}
                onChange={(e) =>
                  onSettingChange(
                    "monthlyBudget",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                min={0}
                step={0.01}
              />
              <p className="text-xs text-slate-500">Leave empty for no limit</p>
            </div>

            <div className="space-y-2">
              <Label>Alert Threshold</Label>
              <Select
                value={settings.alertThreshold.toString()}
                onValueChange={(value) =>
                  onSettingChange("alertThreshold", parseFloat(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">50%</SelectItem>
                  <SelectItem value="0.7">70%</SelectItem>
                  <SelectItem value="0.8">80%</SelectItem>
                  <SelectItem value="0.9">90%</SelectItem>
                  <SelectItem value="1">100%</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Alert when budget reaches</p>
            </div>

            <div className="space-y-2">
              <Label>Alert Email</Label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={settings.costAlertEmail || ""}
                onChange={(e) =>
                  onSettingChange("costAlertEmail", e.target.value || null)
                }
              />
              <p className="text-xs text-slate-500">Receive cost alerts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Usage Analytics Section
function UsageAnalyticsSection({
  usageData,
  period,
  onPeriodChange,
}: {
  usageData: UsageData | null;
  period: string;
  onPeriodChange: (period: string) => void;
}) {
  if (!usageData) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80">
        <CardContent className="p-8 text-center">
          <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Loading usage data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Generation Breakdown */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Generation Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <GenerationStat
              icon={<BookOpen className="h-4 w-4" />}
              label="Courses"
              value={usageData.generationBreakdown.courses}
              color="blue"
            />
            <GenerationStat
              icon={<Zap className="h-4 w-4" />}
              label="Chapters"
              value={usageData.generationBreakdown.chapters}
              color="purple"
            />
            <GenerationStat
              icon={<Sparkles className="h-4 w-4" />}
              label="Lessons"
              value={usageData.generationBreakdown.lessons}
              color="green"
            />
            <GenerationStat
              icon={<Shield className="h-4 w-4" />}
              label="Exams"
              value={usageData.generationBreakdown.exams}
              color="amber"
            />
            <GenerationStat
              icon={<Code className="h-4 w-4" />}
              label="Exercises"
              value={usageData.generationBreakdown.exercises}
              color="red"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cost Comparison */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Estimated Cost by Provider
          </CardTitle>
          <CardDescription>
            Based on {usageData.summary.totalTokens.toLocaleString()} total tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <CostCard
              provider="DeepSeek"
              icon="🔍"
              cost={usageData.estimatedCosts.deepseek}
              highlight={true}
            />
            <CostCard
              provider="Anthropic"
              icon="🧠"
              cost={usageData.estimatedCosts.anthropic}
            />
            <CostCard
              provider="OpenAI"
              icon="🤖"
              cost={usageData.estimatedCosts.openai}
            />
          </div>
          <Alert className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Cost Savings:</strong> Using DeepSeek saves approximately $
              {(
                usageData.estimatedCosts.anthropic - usageData.estimatedCosts.deepseek
              ).toFixed(2)}{" "}
              compared to Anthropic ({((1 - usageData.estimatedCosts.deepseek / usageData.estimatedCosts.anthropic) * 100).toFixed(0)}% savings)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Daily Usage Chart (simplified) */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Usage Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {usageData.dailyUsage.slice(-7).map((day, index) => {
              const maxGen = Math.max(...usageData.dailyUsage.map((d) => d.generations));
              const percentage = maxGen > 0 ? (day.generations / maxGen) * 100 : 0;
              return (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 w-20">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="text-xs font-medium w-16 text-right">
                    {day.generations}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GenerationStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
      <div className="flex justify-center mb-2 text-slate-600 dark:text-slate-300">
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function CostCard({
  provider,
  icon,
  cost,
  highlight,
}: {
  provider: string;
  icon: string;
  cost: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl text-center",
        highlight
          ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700"
          : "bg-slate-50 dark:bg-slate-700/50"
      )}
    >
      <span className="text-2xl">{icon}</span>
      <p className="font-semibold mt-2">{provider}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        ${cost.toFixed(2)}
      </p>
      {highlight && (
        <Badge className="mt-2 bg-green-100 text-green-700">
          Best Value
        </Badge>
      )}
    </div>
  );
}

// Advanced Section
function AdvancedSection({
  settings,
  onSettingChange,
}: {
  settings: PlatformSettings;
  onSettingChange: <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K]
  ) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Feature Toggles */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            Feature Toggles
          </CardTitle>
          <CardDescription>
            Control what features users can access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <div>
              <Label>Allow User Provider Selection</Label>
              <p className="text-xs text-slate-500">
                Users can choose their preferred AI provider
              </p>
            </div>
            <Switch
              checked={settings.allowUserProviderSelection}
              onCheckedChange={(checked) =>
                onSettingChange("allowUserProviderSelection", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <div>
              <Label>Allow User Model Selection</Label>
              <p className="text-xs text-slate-500">
                Users can choose specific AI models
              </p>
            </div>
            <Switch
              checked={settings.allowUserModelSelection}
              onCheckedChange={(checked) =>
                onSettingChange("allowUserModelSelection", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <div>
              <Label>Require Approval for AI Courses</Label>
              <p className="text-xs text-slate-500">
                Admin must approve AI-generated courses
              </p>
            </div>
            <Switch
              checked={settings.requireApprovalForCourses}
              onCheckedChange={(checked) =>
                onSettingChange("requireApprovalForCourses", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>
            Temporarily disable all AI features for users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div>
              <Label className="text-red-700 dark:text-red-300">
                Enable Maintenance Mode
              </Label>
              <p className="text-xs text-red-600 dark:text-red-400">
                All AI features will be disabled
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) =>
                onSettingChange("maintenanceMode", checked)
              }
            />
          </div>

          {settings.maintenanceMode && (
            <div className="space-y-2">
              <Label>Maintenance Message</Label>
              <Input
                placeholder="AI features are temporarily unavailable..."
                value={settings.maintenanceMessage || ""}
                onChange={(e) =>
                  onSettingChange("maintenanceMessage", e.target.value || null)
                }
              />
              <p className="text-xs text-slate-500">
                Shown to users when they try to use AI features
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
