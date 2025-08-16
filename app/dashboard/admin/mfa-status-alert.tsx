"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Settings, 
  X,
  ArrowRight,
  Info
} from "lucide-react";
import Link from "next/link";
import { AdminMFAInfo, getMFAEnforcementMessage } from "@/lib/auth/mfa-enforcement";

interface MFAStatusData {
  mfaInfo: AdminMFAInfo | null;
  error?: string;
}

export function MFAStatusAlert() {
  const { data: session } = useSession();
  const [mfaData, setMfaData] = useState<MFAStatusData>({ mfaInfo: null });
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchMFAStatus = async () => {
      if (!session?.user?.id || session.user.role !== "ADMIN") {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/admin/mfa-status");
        if (response.ok) {
          const data = await response.json();
          setMfaData(data);
        } else {
          setMfaData({ mfaInfo: null, error: "Failed to fetch MFA status" });
        }
      } catch (error) {
        setMfaData({ mfaInfo: null, error: "Failed to fetch MFA status" });
      } finally {
        setLoading(false);
      }
    };

    fetchMFAStatus();
  }, [session]);

  // Don&apos;t show anything if loading or not admin
  if (loading || !session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  // Don&apos;t show if there&apos;s an error fetching data
  if (mfaData.error || !mfaData.mfaInfo) {
    return null;
  }

  const { mfaInfo } = mfaData;
  const { mfaEnforcementStatus } = mfaInfo;
  const enforcementMessage = getMFAEnforcementMessage(mfaEnforcementStatus);

  // If MFA is properly configured, show success state
  if (mfaInfo.isTwoFactorEnabled && mfaInfo.totpEnabled && mfaInfo.totpVerified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800 text-base">
            <Shield className="w-5 h-5" />
            MFA Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Multi-Factor Authentication Active</div>
                <div className="text-sm text-green-700">
                  Your admin account is secured with MFA protection
                </div>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Secured
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If dismissed and not critical, don&apos;t show
  if (dismissed && mfaEnforcementStatus.enforcementLevel !== "hard") {
    return null;
  }

  const getAlertStyling = () => {
    switch (mfaEnforcementStatus.enforcementLevel) {
      case "hard":
        return {
          containerClass: "border-red-200 bg-red-50",
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
          titleClass: "text-red-900",
          descriptionClass: "text-red-800",
          badgeVariant: "destructive" as const,
          badgeClass: "bg-red-100 text-red-800 border-red-300"
        };
      case "warning":
        return {
          containerClass: "border-yellow-200 bg-yellow-50",
          icon: <Clock className="w-5 h-5 text-yellow-600" />,
          titleClass: "text-yellow-900",
          descriptionClass: "text-yellow-800",
          badgeVariant: "outline" as const,
          badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-300"
        };
      default:
        return {
          containerClass: "border-blue-200 bg-blue-50",
          icon: <Info className="w-5 h-5 text-blue-600" />,
          titleClass: "text-blue-900",
          descriptionClass: "text-blue-800",
          badgeVariant: "outline" as const,
          badgeClass: "bg-blue-100 text-blue-800 border-blue-300"
        };
    }
  };

  const styling = getAlertStyling();
  const { daysUntilEnforcement, enforcementLevel } = mfaEnforcementStatus;
  const isUrgent = enforcementLevel === "hard" || daysUntilEnforcement <= 1;

  return (
    <Card className={styling.containerClass}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 ${styling.titleClass} text-base`}>
            {styling.icon}
            {enforcementMessage.title}
          </CardTitle>
          {!isUrgent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className={`flex-1 ${styling.descriptionClass}`}>
              <p className="mb-2">{enforcementMessage.message}</p>
              
              {daysUntilEnforcement > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Grace period remaining</span>
                    <span className="font-medium">
                      {daysUntilEnforcement} day{daysUntilEnforcement !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - (daysUntilEnforcement / 7) * 100)} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
            
            <Badge variant={styling.badgeVariant} className={styling.badgeClass}>
              {enforcementLevel === "hard" && <AlertTriangle className="w-3 h-3 mr-1" />}
              {enforcementLevel === "warning" && <Clock className="w-3 h-3 mr-1" />}
              {enforcementLevel === "soft" && <Info className="w-3 h-3 mr-1" />}
              {enforcementLevel.charAt(0).toUpperCase() + enforcementLevel.slice(1)}
            </Badge>
          </div>

          {/* Current MFA Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-white/50 rounded-lg border">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                mfaInfo.isTwoFactorEnabled ? "bg-green-500" : "bg-gray-300"
              }`} />
              <div className="text-xs font-medium">2FA Setup</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg border">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                mfaInfo.totpEnabled ? "bg-green-500" : "bg-gray-300"
              }`} />
              <div className="text-xs font-medium">TOTP Enabled</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg border">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                mfaInfo.totpVerified ? "bg-green-500" : "bg-gray-300"
              }`} />
              <div className="text-xs font-medium">Verified</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Link href="/admin/mfa-setup" className="flex-1">
              <Button 
                className="w-full"
                variant={isUrgent ? "default" : "outline"}
                size="sm"
              >
                {isUrgent ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Set Up MFA Now
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Configure MFA
                  </>
                )}
              </Button>
            </Link>
            
            {!isUrgent && (
              <Link href="/admin/mfa-warning">
                <Button variant="ghost" size="sm">
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>

          {isUrgent && (
            <div className="text-xs text-center opacity-75">
              Admin access may be restricted until MFA is configured
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}