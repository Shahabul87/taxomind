"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const errorMessages = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An error occurred during authentication.",
  OAuthSignin: "Error in constructing an authorization URL.",
  OAuthCallback: "Error in handling the response from an OAuth provider.",
  OAuthCreateAccount: "Could not create OAuth account in the database.",
  EmailCreateAccount: "Could not create email account in the database.",
  Callback: "Error in the OAuth callback handler route.",
  OAuthAccountNotLinked: "The account is not linked. Try signing in with a different account.",
  EmailSignin: "Sending the e-mail with the verification token failed.",
  CredentialsSignin: "The credentials provided are incorrect.",
  SessionRequired: "You must be signed in to access this page.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") as keyof typeof errorMessages;

  const errorMessage = error && errorMessages[error] 
    ? errorMessages[error] 
    : errorMessages.Default;

  const getErrorDetails = (error: string) => {
    switch (error) {
      case "OAuthSignin":
      case "OAuthCallback":
        return "This usually indicates a problem with OAuth provider configuration (Google/GitHub client ID/secret).";
      case "OAuthAccountNotLinked":
        return "You may have previously signed up with a different method. Try using the same method you used to create your account.";
      case "CredentialsSignin":
        return "Please check your email and password. If you have an old account, you may need to reset your password.";
      case "Configuration":
        return "The authentication service is not properly configured. Please contact support.";
      default:
        return "Please try again or contact support if the problem persists.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Authentication Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">
              {errorMessage}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {getErrorDetails(error || "Default")}
            </p>
          </div>

          {error && (
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Error Code: <code className="font-mono">{error}</code>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Link>
            </Button>
            
            {error === "CredentialsSignin" && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/reset">
                  Reset Password
                </Link>
              </Button>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Need help? Contact support with the error code above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 