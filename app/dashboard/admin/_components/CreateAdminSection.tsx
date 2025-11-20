"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Copy, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateAdminSectionProps {
  isSuperAdmin: boolean;
}

export function CreateAdminSection({ isSuperAdmin }: CreateAdminSectionProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isSuperAdmin) {
    return null; // Don&apos;t show to non-superadmins
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/superadmin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create admin");
      }

      setSuccess({
        email: data.data.credentials.email,
        password: data.data.credentials.password,
      });
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!success) return;

    const credentials = `Email: ${success.email}\nPassword: ${success.password}`;
    navigator.clipboard.writeText(credentials);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
        <h2 className="text-lg sm:text-xl font-semibold">Create New Admin</h2>
      </div>

      <form onSubmit={handleCreateAdmin} className="space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-email" className="text-sm sm:text-base">Admin Email</Label>
          <Input
            id="admin-email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            className="min-h-[44px] text-base sm:text-sm"
          />
          <p className="text-xs sm:text-sm text-muted-foreground">
            A secure password will be auto-generated
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600 shrink-0" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-semibold text-sm sm:text-base">Admin created successfully!</p>
                <div className="bg-white p-2.5 sm:p-3 rounded border border-green-200 font-mono text-xs sm:text-sm space-y-1 break-words">
                  <div className="break-all">
                    <span className="text-gray-600">Email:</span> {success.email}
                  </div>
                  <div className="break-all">
                    <span className="text-gray-600">Password:</span> {success.password}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCredentials}
                  className="w-full min-h-[44px] text-sm sm:text-base"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 shrink-0" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2 shrink-0" />
                      Copy Credentials
                    </>
                  )}
                </Button>
                <p className="text-xs text-amber-600 font-normal">
                  ⚠️ Save these credentials now - the password cannot be retrieved later!
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isLoading} className="w-full min-h-[44px] text-sm sm:text-base">
          {isLoading ? "Creating Admin..." : "Create Admin"}
        </Button>
      </form>
    </Card>
  );
}
