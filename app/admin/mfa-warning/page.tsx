import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAdminMFAInfo, getMFAEnforcementMessage } from "@/lib/auth/mfa-enforcement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MFA Setup Required - Admin Warning",
  description: "Multi-Factor Authentication setup is required for admin accounts",
};

export default async function AdminMFAWarningPage() {
  const session = await auth();
  
  // Redirect if not logged in or not an admin
  if (!session || !session.user) {
    redirect("/auth/login");
  }
  
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard/user");
  }

  // Get MFA status information
  const mfaInfo = await getAdminMFAInfo(session.user.id);
  
  if (!mfaInfo) {
    redirect("/auth/login");
  }

  // If MFA is already properly configured, redirect to dashboard
  if (mfaInfo.isTwoFactorEnabled && mfaInfo.totpEnabled && mfaInfo.totpVerified) {
    redirect("/dashboard/admin");
  }

  // If hard enforcement is active, redirect to setup
  if (mfaInfo.mfaEnforcementStatus.enforcementLevel === "hard") {
    redirect("/admin/mfa-setup");
  }

  const enforcementMessage = getMFAEnforcementMessage(mfaInfo.mfaEnforcementStatus);
  const { daysUntilEnforcement, warningPeriodActive } = mfaInfo.mfaEnforcementStatus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Action Required: MFA Setup
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Your admin account requires Multi-Factor Authentication setup to maintain access.
            </p>
          </div>

          {/* Warning Alert */}
          <Alert className="mb-8 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="font-medium text-yellow-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{enforcementMessage.title}</div>
                  <div className="mt-1">{enforcementMessage.message}</div>
                </div>
                {daysUntilEnforcement > 0 && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    <Clock className="w-3 h-3 mr-1" />
                    {daysUntilEnforcement} day{daysUntilEnforcement !== 1 ? "s" : ""} left
                  </Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Main Warning Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Shield className="w-5 h-5" />
                Secure Your Admin Account
              </CardTitle>
              <CardDescription>
                Complete MFA setup to maintain uninterrupted access to admin features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">What happens next:</h3>
                <div className="space-y-3">
                  {daysUntilEnforcement > 3 && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">Grace Period Active</div>
                        <div className="text-sm text-slate-600">
                          You can continue using admin features normally while setting up MFA
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {daysUntilEnforcement <= 3 && daysUntilEnforcement > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center mt-0.5">
                        <AlertTriangle className="w-3 h-3 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">Warning Period</div>
                        <div className="text-sm text-slate-600">
                          MFA setup is strongly recommended. Admin access may be restricted soon.
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">
                        After {daysUntilEnforcement > 0 ? `${daysUntilEnforcement} days` : "Today"}
                      </div>
                      <div className="text-sm text-slate-600">
                        Admin access will be restricted until MFA is properly configured
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Why MFA is Important:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div className="text-sm text-slate-600">
                      <div className="font-medium">Enhanced Security</div>
                      <div>Protects against unauthorized access</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div className="text-sm text-slate-600">
                      <div className="font-medium">Compliance</div>
                      <div>Meets security best practices</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div className="text-sm text-slate-600">
                      <div className="font-medium">Data Protection</div>
                      <div>Safeguards sensitive information</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div className="text-sm text-slate-600">
                      <div className="font-medium">Peace of Mind</div>
                      <div>Reduces security risks</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Setup Time */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-slate-900">Quick Setup</span>
                </div>
                <p className="text-sm text-slate-600">
                  MFA setup takes less than 5 minutes. You&apos;ll need your smartphone and an authenticator app.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Link href="/admin/mfa-setup" className="flex-1">
                <Button className="w-full">
                  Set Up MFA Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard/admin" className="flex-1">
                <Button variant="outline" className="w-full">
                  Continue to Dashboard
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Account Information */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-slate-700">Account Created</div>
                  <div className="text-slate-600">{mfaInfo.createdAt.toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="font-medium text-slate-700">Role</div>
                  <div className="text-slate-600">Administrator</div>
                </div>
                <div>
                  <div className="font-medium text-slate-700">Current MFA Status</div>
                  <div className="text-slate-600">
                    {mfaInfo.isTwoFactorEnabled ? "Partially Configured" : "Not Configured"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-slate-700">Enforcement Level</div>
                  <div className="text-slate-600 capitalize">
                    {mfaInfo.mfaEnforcementStatus.enforcementLevel}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}