"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

interface CreateAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateAdminDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAdminDialogProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    role: "ADMIN" as "ADMIN" | "USER",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          setValidationErrors(data.details);
        } else {
          setError(data.error || "Failed to create user");
        }
        return;
      }

      // Success
      toast({
        title: "Success!",
        description: data.message || "User created successfully",
      });

      // Reset form
      setFormData({
        email: "",
        name: "",
        password: "",
        confirmPassword: "",
        role: "ADMIN",
      });

      // Close dialog
      onOpenChange(false);

      // Refresh the page to show new user
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Create user error:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[500px] bg-white dark:bg-slate-800 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl text-slate-900 dark:text-slate-100">
            Create New Admin User
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Add a new admin or regular user to the platform
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 py-4 px-1">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@taxomind.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={loading}
              required
              className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 min-h-[44px] text-base sm:text-sm"
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={loading}
              required
              className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 min-h-[44px] text-base sm:text-sm"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-slate-700 dark:text-slate-300">
              Role
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value: "ADMIN" | "USER") =>
                setFormData({ ...formData, role: value })
              }
              disabled={loading}
            >
              <SelectTrigger className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 min-h-[44px] text-base sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="USER">Regular User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                disabled={loading}
                required
                className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Minimum 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              disabled={loading}
              required
              className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-slate-200 dark:border-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
