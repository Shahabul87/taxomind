"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Zap, X } from "lucide-react";

interface UpgradePromptProps {
  feature: string;
  description?: string;
  remainingUsage?: number;
  onClose?: () => void;
  variant?: "inline" | "modal" | "banner";
}

export function UpgradePrompt({
  feature,
  description,
  remainingUsage,
  onClose,
  variant = "inline",
}: UpgradePromptProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = () => {
    setIsLoading(true);
    router.push("/pricing");
  };

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-full">
            <Crown className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {feature} is a Premium Feature
            </p>
            <p className="text-xs text-muted-foreground">
              {description || "Upgrade to unlock unlimited access"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleUpgrade}
            disabled={isLoading}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
          {onClose && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Premium Feature</CardTitle>
              <CardDescription>{feature}</CardDescription>
            </div>
          </div>
          {onClose && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {description ||
            "This feature requires a premium subscription. Upgrade to unlock unlimited access to all SAM AI features."}
        </p>

        {remainingUsage !== undefined && remainingUsage > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm">
              <strong>{remainingUsage}</strong> free uses remaining today
            </span>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Premium Benefits:
          </p>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            <li className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Unlimited AI queries
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-500" />
              AI Course Creation
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-500" />
              AI Content Generation
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-500" />
              AI Quiz & Exam Creation
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          <Crown className="h-4 w-4 mr-2" />
          {isLoading ? "Loading..." : "Upgrade to Premium"}
        </Button>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

interface PremiumBadgeProps {
  className?: string;
}

export function PremiumBadge({ className }: PremiumBadgeProps) {
  return (
    <Badge
      className={`bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 ${className}`}
    >
      <Crown className="h-3 w-3 mr-1" />
      Premium
    </Badge>
  );
}

interface PremiumFeatureGateProps {
  children: React.ReactNode;
  isPremium: boolean;
  feature: string;
  description?: string;
  remainingUsage?: number;
  showUpgradePrompt?: boolean;
}

export function PremiumFeatureGate({
  children,
  isPremium,
  feature,
  description,
  remainingUsage,
  showUpgradePrompt = true,
}: PremiumFeatureGateProps) {
  if (isPremium) {
    return <>{children}</>;
  }

  // Allow if there's remaining free usage
  if (remainingUsage && remainingUsage > 0) {
    return <>{children}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <UpgradePrompt
      feature={feature}
      description={description}
      remainingUsage={remainingUsage}
    />
  );
}
