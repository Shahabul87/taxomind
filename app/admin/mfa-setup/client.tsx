"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { setupTOTP, verifyTOTP, getTOTPStatus } from "@/actions/mfa-totp";
import { AdminMFAInfo, getMFAEnforcementMessage } from "@/lib/auth/mfa-enforcement";
import { CheckCircle2, AlertTriangle, Shield, Clock, Copy, Eye, EyeOff } from "lucide-react";

interface MFASetupClientProps {
  mfaInfo: AdminMFAInfo;
  userEmail: string;
}

type SetupStep = "status" | "setup" | "verify" | "complete";

export function MFASetupClient({ mfaInfo, userEmail }: MFASetupClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SetupStep>("status");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Setup data
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationToken, setVerificationToken] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  
  // Enforcement status
  const enforcementMessage = getMFAEnforcementMessage(mfaInfo.mfaEnforcementStatus);

  useEffect(() => {
    // Determine initial step based on MFA status
    if (mfaInfo.isTwoFactorEnabled && mfaInfo.totpEnabled && mfaInfo.totpVerified) {
      setCurrentStep("complete");
    } else if (mfaInfo.totpEnabled && !mfaInfo.totpVerified) {
      setCurrentStep("verify");
    } else {
      setCurrentStep("status");
    }
  }, [mfaInfo]);

  const handleStartSetup = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await setupTOTP({});
      
      if (result.error) {
        setError(result.error);
      } else if (result.success && result.data) {
        setQrCodeUrl(result.data.qrCodeUrl);
        setBackupCodes(result.data.backupCodes);
        setSuccess(result.data.message);
        setCurrentStep("setup");
      }
    } catch (err) {
      setError("Failed to initialize MFA setup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError("Please enter a valid 6-digit code from your authenticator app.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyTOTP({ token: verificationToken });
      
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(result.message);
        setCurrentStep("complete");
        
        // Redirect to dashboard after a delay
        setTimeout(() => {
          router.push("/dashboard/admin");
          router.refresh();
        }, 2000);
      }
    } catch (err) {
      setError("Failed to verify MFA setup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard!");
    setTimeout(() => setSuccess(null), 2000);
  };

  const copyAllBackupCodes = () => {
    const codesText = backupCodes.join("\\n");
    copyToClipboard(codesText);
  };

  const renderEnforcementStatus = () => {
    const { enforcementLevel, daysUntilEnforcement, warningPeriodActive } = mfaInfo.mfaEnforcementStatus;
    
    let badgeColor = "secondary";
    let icon = <Shield className="w-4 h-4" />;
    
    if (enforcementLevel === "hard") {
      badgeColor = "destructive";
      icon = <AlertTriangle className="w-4 h-4" />;
    } else if (enforcementLevel === "warning") {
      badgeColor = "warning";
      icon = <Clock className="w-4 h-4" />;
    }

    return (
      <Alert className={`mb-6 ${enforcementLevel === "hard" ? "border-red-200 bg-red-50" : enforcementLevel === "warning" ? "border-yellow-200 bg-yellow-50" : ""}`}>
        <div className="flex items-center gap-2">
          {icon}
          <AlertDescription className="font-medium">
            {enforcementMessage.title}
          </AlertDescription>
        </div>
        <AlertDescription className="mt-2">
          {enforcementMessage.message}
          {daysUntilEnforcement > 0 && (
            <div className="mt-2 text-sm">
              <Badge variant={badgeColor as any} className="text-xs">
                {daysUntilEnforcement} day{daysUntilEnforcement !== 1 ? "s" : ""} remaining
              </Badge>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  const renderStatusStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          MFA Setup Required
        </CardTitle>
        <CardDescription>
          Set up Multi-Factor Authentication to secure your admin account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderEnforcementStatus()}
        
        <div className="space-y-3">
          <h4 className="font-medium">Current Status:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${mfaInfo.isTwoFactorEnabled ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="text-sm">Two-Factor Auth</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${mfaInfo.totpEnabled ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="text-sm">TOTP Enabled</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${mfaInfo.totpVerified ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="text-sm">Verified</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleStartSetup} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Setting up..." : "Start MFA Setup"}
        </Button>
      </CardFooter>
    </Card>
  );

  const renderSetupStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Scan QR Code</CardTitle>
        <CardDescription>
          Use your authenticator app to scan this QR code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {qrCodeUrl && (
          <div className="flex justify-center">
            <div className="p-4 bg-white border-2 border-slate-200 rounded-lg">
              <Image 
                src={qrCodeUrl} 
                alt="QR Code for MFA setup" 
                width={192}
                height={192}
                className="w-48 h-48"
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-medium">Setup Instructions:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
            <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
            <li>Tap &apos;Add Account&apos; or &apos;Scan QR Code&apos;</li>
            <li>Scan the QR code above with your device camera</li>
            <li>Enter the 6-digit code from your app below to verify</li>
          </ol>
        </div>

        {backupCodes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Backup Recovery Codes</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBackupCodes(!showBackupCodes)}
              >
                {showBackupCodes ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide Codes
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show Codes
                  </>
                )}
              </Button>
            </div>
            
            {showBackupCodes && (
              <div className="p-4 bg-slate-50 rounded-lg border">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-slate-600">
                    Save these codes in a secure location. Each code can only be used once.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllBackupCodes}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code) => (
                    <div
                      key={code}
                      className="flex items-center justify-between p-2 bg-white border rounded font-mono text-sm"
                    >
                      <span>{code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={() => setCurrentStep("verify")} className="w-full">
          Continue to Verification
        </Button>
      </CardFooter>
    </Card>
  );

  const renderVerifyStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Verify Setup</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verification-code">Verification Code</Label>
          <Input
            id="verification-code"
            type="text"
            placeholder="123456"
            value={verificationToken}
            onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-lg tracking-widest font-mono"
            maxLength={6}
          />
          <p className="text-sm text-slate-500">
            Enter the current 6-digit code displayed in your authenticator app
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep("setup")}
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          onClick={handleVerifySetup} 
          disabled={isLoading || verificationToken.length !== 6}
          className="flex-1"
        >
          {isLoading ? "Verifying..." : "Verify & Complete"}
        </Button>
      </CardFooter>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          MFA Setup Complete
        </CardTitle>
        <CardDescription>
          Your admin account is now secured with Multi-Factor Authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ Multi-Factor Authentication has been successfully enabled for your admin account.
            You will now be required to enter a code from your authenticator app when signing in.
          </p>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium">Next Steps:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
            <li>Keep your authenticator app installed and accessible</li>
            <li>Store your backup recovery codes in a secure location</li>
            <li>You can manage your MFA settings in your admin dashboard</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => router.push("/dashboard/admin")} 
          className="w-full"
        >
          Continue to Admin Dashboard
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {["Status", "Setup", "Verify", "Complete"].map((step, index) => {
            const stepKey = step.toLowerCase() as SetupStep;
            const isActive = currentStep === stepKey;
            const isCompleted = 
              (currentStep === "setup" && index < 1) ||
              (currentStep === "verify" && index < 2) ||
              (currentStep === "complete" && index < 3) ||
              (currentStep === "complete" && index === 3);
            
            return (
              <div key={step} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
                  ${isActive ? "border-blue-600 bg-blue-600 text-white" : ""}
                  ${isCompleted ? "border-green-600 bg-green-600 text-white" : ""}
                  ${!isActive && !isCompleted ? "border-slate-300 text-slate-500" : ""}
                `}>
                  {isCompleted ? "✓" : index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-8 h-0.5 mx-2 ${isCompleted ? "bg-green-600" : "bg-slate-300"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && !error && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="w-4 h-4" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      {currentStep === "status" && renderStatusStep()}
      {currentStep === "setup" && renderSetupStep()}
      {currentStep === "verify" && renderVerifyStep()}
      {currentStep === "complete" && renderCompleteStep()}
    </div>
  );
}