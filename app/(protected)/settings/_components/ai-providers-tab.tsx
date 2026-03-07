"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Sparkles,
  BookOpen,
  BarChart3,
  Code,
  Map,
  Check,
  AlertCircle,
  Loader2,
  Info,
  Globe,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  preferredGlobalProvider: AIProviderType | null;
  preferredChatProvider: AIProviderType | null;
  preferredCourseProvider: AIProviderType | null;
  preferredAnalysisProvider: AIProviderType | null;
  preferredCodeProvider: AIProviderType | null;
  preferredSkillRoadmapProvider: AIProviderType | null;
  // Per-provider model selection
  anthropicModel: string | null;
  deepseekModel: string | null;
  openaiModel: string | null;
  geminiModel: string | null;
  mistralModel: string | null;
  // Per-capability model overrides
  chatModel: string | null;
  courseModel: string | null;
  analysisModel: string | null;
  codeModel: string | null;
  skillRoadmapModel: string | null;
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
  "skill-roadmap": Map,
};

const CAPABILITY_LABELS = {
  chat: "Chat & Conversations",
  "course-creation": "Course Creation",
  analysis: "Analysis & Insights",
  code: "Code Assistance",
  "skill-roadmap": "Skill Roadmap Builder",
};

const CAPABILITY_DESCRIPTIONS = {
  chat: "General conversations and Q&A with SAM AI tutor",
  "course-creation": "AI-powered course generation and content creation",
  analysis: "Learning analytics, progress insights, and recommendations",
  code: "Code explanations, debugging, and programming assistance",
  "skill-roadmap": "AI-powered skill roadmap and learning path generation",
};

export function AIProvidersTab() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [preferences, setPreferences] = useState<AIPreferences>({
    preferredGlobalProvider: null,
    preferredChatProvider: null,
    preferredCourseProvider: null,
    preferredAnalysisProvider: null,
    preferredCodeProvider: null,
    preferredSkillRoadmapProvider: null,
    // Per-provider model selection
    anthropicModel: null,
    deepseekModel: null,
    openaiModel: null,
    geminiModel: null,
    mistralModel: null,
    // Per-capability model overrides
    chatModel: null,
    courseModel: null,
    analysisModel: null,
    codeModel: null,
    skillRoadmapModel: null,
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
            preferredGlobalProvider: data.preferredGlobalProvider || null,
            preferredChatProvider: data.preferredChatProvider || "anthropic",
            preferredCourseProvider: data.preferredCourseProvider || "anthropic",
            preferredAnalysisProvider: data.preferredAnalysisProvider || "anthropic",
            preferredCodeProvider: data.preferredCodeProvider || "anthropic",
            preferredSkillRoadmapProvider: data.preferredSkillRoadmapProvider || "anthropic",
            // Per-provider model selection
            anthropicModel: data.anthropicModel || "claude-sonnet-4-5-20250929",
            deepseekModel: data.deepseekModel || "deepseek-chat",
            openaiModel: data.openaiModel || "gpt-4o",
            geminiModel: data.geminiModel || "gemini-pro",
            mistralModel: data.mistralModel || "mistral-large",
            // Per-capability model overrides
            chatModel: data.chatModel || null,
            courseModel: data.courseModel || null,
            analysisModel: data.analysisModel || null,
            codeModel: data.codeModel || null,
            skillRoadmapModel: data.skillRoadmapModel || null,
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

  const handleModelChange = (
    providerId: AIProviderType,
    model: string
  ) => {
    const modelKey = `${providerId}Model` as keyof AIPreferences;
    setPreferences((prev) => ({
      ...prev,
      [modelKey]: model,
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
        const rawText = await response.text().catch(() => "");
        let errorData: Record<string, unknown> = {};
        try {
          errorData = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          // Response is not JSON (e.g. HTML error page)
        }
        console.error("Save preferences error:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
          rawBody: rawText.slice(0, 500),
        });
        const msg = typeof errorData.details === "string"
          ? errorData.details
          : typeof errorData.error === "string"
            ? errorData.error
            : `Failed to save preferences (${response.status})`;
        throw new Error(msg);
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
      className="space-y-5"
    >
      {/* Header */}
      <div
        className={cn(
          "p-5 rounded-2xl",
          "bg-white/80 dark:bg-slate-800/80",
          "backdrop-blur-sm",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-sm"
        )}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className={cn(
            "h-9 w-9 rounded-lg",
            "bg-gradient-to-br from-blue-500 to-indigo-500",
            "flex items-center justify-center shadow-sm"
          )}>
            <Bot className="h-4 w-4 text-white" />
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
          "p-5 rounded-2xl",
          "bg-white/80 dark:bg-slate-800/80",
          "backdrop-blur-sm",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-sm"
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

      {/* Model Selection per Provider */}
      {configuredProviders.length > 0 && (
        <div
          className={cn(
            "p-6 rounded-3xl",
            "bg-white/80 dark:bg-slate-800/80",
            "backdrop-blur-sm",
            "border border-slate-200/50 dark:border-slate-700/50",
            "shadow-lg"
          )}
        >
          <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-2">
            Model Selection
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Choose which model to use for each configured provider
          </p>

          <div className="space-y-4">
            {configuredProviders.map((provider) => {
              const modelKey = `${provider.id}Model` as keyof AIPreferences;
              const currentModel = preferences[modelKey] as string | null;

              return (
                <div
                  key={provider.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">{PROVIDER_ICONS[provider.id]}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {provider.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {provider.models.length} model{provider.models.length !== 1 ? "s" : ""} available
                      </p>
                    </div>
                  </div>

                  <Select
                    value={currentModel || provider.defaultModel}
                    onValueChange={(value) => handleModelChange(provider.id, value)}
                  >
                    <SelectTrigger className="w-full sm:w-[240px] bg-white dark:bg-slate-800">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {provider.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          <div className="flex items-center gap-2">
                            <span>{model}</span>
                            {model === provider.defaultModel && (
                              <span className="text-xs text-slate-400">(default)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>

          {/* Model Info Card */}
          <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Model Selection Tips</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>DeepSeek:</strong> Use &quot;deepseek-chat&quot; for general tasks, &quot;deepseek-reasoner&quot; for complex reasoning</li>
                  <li><strong>OpenAI:</strong> &quot;gpt-4o&quot; is the fastest, &quot;o1&quot; for advanced reasoning</li>
                  <li><strong>Anthropic:</strong> Claude Sonnet models offer the best balance of speed and quality</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Provider Toggle */}
      <div
        className={cn(
          "p-5 rounded-2xl",
          "bg-white/80 dark:bg-slate-800/80",
          "backdrop-blur-sm",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-sm"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-9 w-9 rounded-lg",
              "bg-gradient-to-br from-blue-500 to-indigo-500",
              "flex items-center justify-center shadow-sm flex-shrink-0"
            )}>
              <Globe className="h-4 w-4 text-white" />
            </div>
            <div>
              <Label htmlFor="global-provider-toggle" className="text-md font-semibold text-slate-900 dark:text-white cursor-pointer">
                Use Same Provider for All Tasks
              </Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Override per-task settings with a single provider
              </p>
            </div>
          </div>
          <Switch
            id="global-provider-toggle"
            checked={preferences.preferredGlobalProvider !== null}
            onCheckedChange={(checked) => {
              if (checked) {
                // Enable global provider — default to first configured or anthropic
                const defaultGlobal = configuredProviders[0]?.id ?? "anthropic";
                setPreferences((prev) => ({
                  ...prev,
                  preferredGlobalProvider: defaultGlobal as AIProviderType,
                }));
              } else {
                // Disable global provider
                setPreferences((prev) => ({
                  ...prev,
                  preferredGlobalProvider: null,
                }));
              }
              setHasChanges(true);
            }}
          />
        </div>

        {preferences.preferredGlobalProvider !== null && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 flex-1">
                All AI tasks will use:
              </p>
              <Select
                value={preferences.preferredGlobalProvider}
                onValueChange={(value) => {
                  setPreferences((prev) => ({
                    ...prev,
                    preferredGlobalProvider: value as AIProviderType,
                  }));
                  setHasChanges(true);
                }}
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
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Provider Selection by Capability */}
      <div
        className={cn(
          "p-5 rounded-2xl",
          "bg-white/80 dark:bg-slate-800/80",
          "backdrop-blur-sm",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-sm",
          preferences.preferredGlobalProvider !== null && "opacity-50 pointer-events-none"
        )}
      >
        <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-2">
          Provider by Task
        </h4>
        {preferences.preferredGlobalProvider !== null && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
            Per-task settings are overridden by the global provider above.
            Disable &quot;Use Same Provider for All Tasks&quot; to customize individually.
          </p>
        )}
        {preferences.preferredGlobalProvider === null && <div className="mb-6" />}

        <div className="space-y-6">
          {(
            [
              { key: "preferredChatProvider", capability: "chat", modelKey: "chatModel" },
              { key: "preferredCourseProvider", capability: "course-creation", modelKey: "courseModel" },
              { key: "preferredAnalysisProvider", capability: "analysis", modelKey: "analysisModel" },
              { key: "preferredCodeProvider", capability: "code", modelKey: "codeModel" },
              { key: "preferredSkillRoadmapProvider", capability: "skill-roadmap", modelKey: "skillRoadmapModel" },
            ] as const
          ).map(({ key, capability, modelKey }) => {
            const Icon = CAPABILITY_ICONS[capability];
            const selectedProvider = (preferences[key] || "anthropic") as AIProviderType;
            const providerInfo = providers.find((p) => p.id === selectedProvider);
            const availableModels = providerInfo?.models ?? [];
            const currentCapabilityModel = preferences[modelKey];
            return (
              <div
                key={key}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={preferences[key] || "anthropic"}
                      onValueChange={(value) => {
                        handleProviderChange(key, value as AIProviderType);
                        // Reset per-capability model when provider changes
                        setPreferences((prev) => ({
                          ...prev,
                          [modelKey]: null,
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-slate-800">
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

                    {availableModels.length > 0 && (
                      <Select
                        value={currentCapabilityModel || "__default__"}
                        onValueChange={(value) => {
                          setPreferences((prev) => ({
                            ...prev,
                            [modelKey]: value === "__default__" ? null : value,
                          }));
                          setHasChanges(true);
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-slate-800">
                          <SelectValue placeholder="Model (default)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__default__">
                            <span className="text-slate-500">Default model</span>
                          </SelectItem>
                          {availableModels.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
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
