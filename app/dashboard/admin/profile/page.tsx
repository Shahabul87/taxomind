"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Key,
  Bell,
  Activity,
  Clock,
  Camera,
  Save,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Settings,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface AdminProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
  socialLinks: {
    website?: string | null;
    github?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
  } | null;
  joinDate: string;
  lastLogin: string;
  totalActions: number;
  emailVerified: Date | null;
  isTwoFactorEnabled: boolean;
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    image: "",
    socialLinks: {
      website: "",
      github: "",
      linkedin: "",
      twitter: "",
    },
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[Profile] Fetching from /api/admin/profile...");
      const response = await fetch("/api/admin/profile");

      console.log("[Profile] Response status:", response.status);
      console.log("[Profile] Response headers:", Object.fromEntries(response.headers.entries()));

      let data;
      try {
        data = await response.json();
        console.log("[Profile] Parsed JSON data:", data);
      } catch (parseError) {
        console.error("[Profile] Failed to parse JSON:", parseError);
        const text = await response.text();
        console.error("[Profile] Response text:", text);
        throw new Error("Server returned invalid JSON");
      }

      if (!response.ok || !data.success) {
        const errorMsg = data.error || data.details || "Failed to fetch profile";
        console.error("[Profile] API Error:", {
          errorMsg,
          status: response.status,
          data
        });
        throw new Error(errorMsg);
      }

      setProfile(data.data);

      // Set form data
      setFormData({
        name: data.data.name || "",
        email: data.data.email || "",
        phone: data.data.phone || "",
        location: data.data.location || "",
        bio: data.data.bio || "",
        image: data.data.image || "",
        socialLinks: {
          website: data.data.socialLinks?.website || "",
          github: data.data.socialLinks?.github || "",
          linkedin: data.data.socialLinks?.linkedin || "",
          twitter: data.data.socialLinks?.twitter || "",
        },
      });
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
      toast({
        title: "Error",
        description: "Failed to load admin profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch admin profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Handle validation errors with details
        if (data.details && Array.isArray(data.details)) {
          const validationErrors = data.details
            .map((detail: { field: string; message: string }) => `${detail.field}: ${detail.message}`)
            .join(", ");
          throw new Error(`${data.error || "Validation error"}: ${validationErrors}`);
        }
        throw new Error(data.error || "Failed to update profile");
      }

      // Update local profile state
      await fetchProfile();

      toast({
        title: "Success!",
        description: "Profile updated successfully",
      });

      setIsEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to profile data
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        bio: profile.bio || "",
        image: profile.image || "",
        socialLinks: {
          website: profile.socialLinks?.website || "",
          github: profile.socialLinks?.github || "",
          linkedin: profile.socialLinks?.linkedin || "",
          twitter: profile.socialLinks?.twitter || "",
        },
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex h-full w-full flex-1 flex-col items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500 dark:text-slate-400" />
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex h-full w-full flex-1 flex-col items-center justify-center p-10">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchProfile} className="mt-4" variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-1 flex-col gap-4 sm:gap-6 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-10 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Page Header */}
      <motion.div
        className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent truncate">
            Admin Profile
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Manage your admin account and preferences
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 w-full sm:w-auto min-h-[44px] text-sm sm:text-base order-2 sm:order-1"
              >
                <X className="mr-2 h-4 w-4 shrink-0" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto min-h-[44px] text-sm sm:text-base order-1 sm:order-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Save Changes</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
            >
              <User className="mr-2 h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          )}
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="bg-red-50/80 dark:bg-red-950/20 backdrop-blur-sm border-red-200/50 dark:border-red-800/50 shadow-sm rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Overview */}
      <motion.div
        className="grid gap-4 sm:gap-6 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Profile Card */}
        <Card className="md:col-span-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl">
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              <div className="relative">
                <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                    <AvatarImage src={formData.image || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-300 text-lg sm:text-xl">
                      {formData.name
                        ? formData.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "A"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {isEditing && (
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all duration-300 min-h-[44px] min-w-[44px] touch-manipulation"
                  >
                    <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                )}
              </div>
              <div className="text-center w-full">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate px-2">
                  {formData.name || "Admin User"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate px-2 mt-1">{formData.email}</p>
                <Badge className="mt-2 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                  <Shield className="mr-1 h-3 w-3 shrink-0" />
                  {profile.role}
                </Badge>
              </div>
              <div className="w-full space-y-2 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{formData.location || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{formData.phone || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">Joined {profile.joinDate}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">Last login {profile.lastLogin}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="personal" className="space-y-3 sm:space-y-4">
            <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
              <TabsList className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm inline-flex min-w-full sm:min-w-0">
                <TabsTrigger
                  value="personal"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-2 min-h-[44px] flex-1 sm:flex-initial"
                >
                  <span className="truncate">Personal Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-2 min-h-[44px] flex-1 sm:flex-initial"
                >
                  <span className="truncate">Security</span>
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-2 min-h-[44px] flex-1 sm:flex-initial"
                >
                  <span className="truncate">Activity</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Personal Information */}
            <TabsContent value="personal" className="space-y-3 sm:space-y-4">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Update your personal details and bio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">Full Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 min-h-[44px] text-base sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 min-h-[44px] text-base sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 min-h-[44px] text-base sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">Location</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        disabled={!isEditing}
                        className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 min-h-[44px] text-base sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">Bio</Label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 text-base sm:text-sm min-h-[100px]"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">Social Links</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Add your social media profiles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        Website
                      </Label>
                      <Input
                        value={formData.socialLinks.website}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, website: e.target.value },
                          })
                        }
                        disabled={!isEditing}
                        className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 min-h-[44px] text-base sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        GitHub
                      </Label>
                      <Input
                        value={formData.socialLinks.github}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, github: e.target.value },
                          })
                        }
                        disabled={!isEditing}
                        className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 min-h-[44px] text-base sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        LinkedIn
                      </Label>
                      <Input
                        value={formData.socialLinks.linkedin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, linkedin: e.target.value },
                          })
                        }
                        disabled={!isEditing}
                        className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 min-h-[44px] text-base sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Twitter className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        Twitter
                      </Label>
                      <Input
                        value={formData.socialLinks.twitter}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, twitter: e.target.value },
                          })
                        }
                        disabled={!isEditing}
                        className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 min-h-[44px] text-base sm:text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-3 sm:space-y-4">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">
                    Security Settings
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Manage your account security and authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">Password</p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                          Secure your account with a strong password
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:text-white hover:border-transparent transition-all duration-300 w-full sm:w-auto min-h-[44px] text-sm sm:text-base shrink-0"
                        onClick={() => router.push("/dashboard/admin/settings")}
                      >
                        <Key className="mr-2 h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">Change Password</span>
                        <span className="sm:hidden">Change</span>
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">
                          Two-Factor Authentication
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                          <Badge
                            className={
                              profile.isTwoFactorEnabled
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 text-xs"
                            }
                          >
                            {profile.isTwoFactorEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </p>
                      </div>
                      <Button variant="outline" className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:text-white hover:border-transparent transition-all duration-300 w-full sm:w-auto min-h-[44px] text-sm sm:text-base shrink-0">
                        <Shield className="mr-2 h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">Manage 2FA</span>
                        <span className="sm:hidden">Manage</span>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">
                          Email Verification
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                          <Badge
                            className={
                              profile.emailVerified
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs"
                            }
                          >
                            {profile.emailVerified ? "Verified" : "Not Verified"}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert className="border-yellow-200/50 dark:border-yellow-900/50 bg-yellow-50/80 dark:bg-yellow-900/20 backdrop-blur-sm shadow-sm rounded-xl">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <AlertDescription className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  As an admin, your account has elevated privileges. Ensure your security settings are
                  always up to date.
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Activity */}
            <TabsContent value="activity" className="space-y-3 sm:space-y-4">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-slate-100">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shrink-0">
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-base sm:text-lg font-semibold">Activity Stats</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Your administrative activity overview
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-xl p-4 sm:p-5">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg shrink-0">
                            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-white/90 truncate">Total Actions</span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-white">{profile.totalActions}</div>
                        <div className="text-[10px] sm:text-xs text-white/80 mt-1">Administrative activities logged</div>
                      </div>
                    </div>

                    <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-xl p-4 sm:p-5">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-emerald-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg shrink-0">
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-white/90 truncate">Account Status</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-white">Active</div>
                        <div className="text-[10px] sm:text-xs text-white/80 mt-1">All systems operational</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
