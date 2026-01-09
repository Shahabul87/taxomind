"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Sparkles,
  BookOpen,
  BarChart3,
  Code,
  Check,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Provider types matching our registry
type AIProviderType = "anthropic" | "deepseek" | "openai" | "gemini" | "mistral";

interface ProviderInfo {
  id: AIProviderType;
  name: string;
  description: string;
  models: string[];
  defaultModel: string;
  isConfigured: boolean;
  icon: string;
}

interface AIPreferences {
  preferredChatProvider: AIProviderType | null;
  preferredCourseProvider: AIProviderType | null;
  preferredAnalysisProvider: AIProviderType | null;
  preferredCodeProvider: AIProviderType | null;
}

const PROVIDER_ICONS: Record<AIProviderType, string> = {
  anthropic: "🧠",
  deepseek: "🔍",
  openai: "🤖",
  gemini: "✨",
  mistral: "🌬️",
};

const CAPABILITY_ICONS = {
  chat: Sparkles,
  "course-creation": BookOpen,
  analysis: BarChart3,
  code: Code,
};

const CAPABILITY_LABELS = {
  chat: "Chat & Conversations",
  "course-creation": "Course Creation",
  analysis: "Analysis & Insights",
  code: "Code Assistance",
};

const CAPABILITY_DESCRIPTIONS = {
  chat: "General conversations and Q&A with SAM AI tutor",
  "course-creation": "AI-powered course generation and content creation",
  analysis: "Learning analytics, progress insights, and recommendations",
  code: "Code explanations, debugging, and programming assistance",
};

export function AIProvidersTab() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [preferences, setPreferences] = useState<AIPreferences>({
    preferredChatProvider: null,
    preferredCourseProvider: null,
    preferredAnalysisProvider: null,
    preferredCodeProvider: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch available providers and user preferences
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [providersRes, prefsRes] = await Promise.all([
          fetch("/api/settings/ai-providers", { credentials: "include" }),
          fetch("/api/settings/ai-preferences", { credentials: "include" }),
        ]);

        if (providersRes.ok) {
          const data = await providersRes.json();
          setProviders(data.providers || []);
        }

        if (prefsRes.ok) {
          const data = await prefsRes.json();
          setPreferences({
            preferredChatProvider: data.preferredChatProvider || "anthropic",
            preferredCourseProvider: data.preferredCourseProvider || "anthropic",
            preferredAnalysisProvider: data.preferredAnalysisProvider || "anthropic",
            preferredCodeProvider: data.preferredCodeProvider || "anthropic",
          });
        }
      } catch (error) {
        console.error("Failed to fetch AI settings:", error);
        toast.error("Failed to load AI provider settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleProviderChange = (
    capability: keyof AIPreferences,
    provider: AIProviderType
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [capability]: provider,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/ai-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Save preferences error:", {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.details || errorData.error || `Failed to save preferences (${response.status})`);
      }

      toast.success("AI provider preferences saved!");
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save AI provider preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const configuredProviders = providers.filter((p) => p.isConfigured);
  const unconfiguredProviders = providers.filter((p) => !p.isConfigured);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div
        className={cn(
          "p-6 rounded-3xl",
          "bg-white/80 dark:bg-slate-800/80",
          "backdrop-blur-sm",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-lg"
        )}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              AI Provider Preferences
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Choose which AI provider to use for different tasks
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Multi-Provider AI System</p>
              <p>
                You can choose different AI providers for different tasks. Each provider
                has its own strengths - experiment to find what works best for you!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Providers Status */}
      <div
        className={cn(
          "p-6 rounded-3xl",
          "bg-white/80 dark:bg-slate-800/80",
          "backdrop-blur-sm",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-lg"
        )}
      >
        <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-4">
          Available Providers
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={cn(
                "p-4 rounded-xl border transition-all",
                provider.isConfigured
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{PROVIDER_ICONS[provider.id]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white truncate">
                      {provider.name}
                    </span>
                    {provider.isConfigured ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {provider.isConfigured ? "Connected" : "Not configured"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {unconfiguredProviders.length > 0 && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            💡 Configure more providers by adding their API keys in your environment settings.
          </p>
        )}
      </div>

      {/* Provider Selection by Capability */}
      <div
        className={cn(
          "p-6 rounded-3xl",
          "bg-white/80 dark:bg-slate-800/80",
          "backdrop-blur-sm",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-lg"
        )}
      >
        <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-6">
          Provider by Task
        </h4>

        <div className="space-y-6">
          {(
            [
              { key: "preferredChatProvider", capability: "chat" },
              { key: "preferredCourseProvider", capability: "course-creation" },
              { key: "preferredAnalysisProvider", capability: "analysis" },
              { key: "preferredCodeProvider", capability: "code" },
            ] as const
          ).map(({ key, capability }) => {
            const Icon = CAPABILITY_ICONS[capability];
            return (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {CAPABILITY_LABELS[capability]}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {CAPABILITY_DESCRIPTIONS[capability]}
                    </p>
                  </div>
                </div>

                <Select
                  value={preferences[key] || "anthropic"}
                  onValueChange={(value) =>
                    handleProviderChange(key, value as AIProviderType)
                  }
                >
                  <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-slate-800">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {configuredProviders.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center gap-2">
                          <span>{PROVIDER_ICONS[provider.id]}</span>
                          <span>{provider.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                    {configuredProviders.length === 0 && (
                      <SelectItem value="anthropic" disabled>
                        No providers configured
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
