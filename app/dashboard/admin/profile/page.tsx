"use client";

import React, { useState } from "react";
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
  Download
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  // Mock admin user data
  const user = {
    id: "admin001",
    name: "Admin User",
    email: "admin@taxomind.com",
    image: null,
    role: "ADMIN",
    phone: "+1 234 567 8900",
    location: "San Francisco, CA",
    joinDate: "January 15, 2024",
    lastLogin: "2 hours ago",
    bio: "Platform administrator with full system access. Managing the Taxomind learning platform and ensuring smooth operations.",
    skills: ["Platform Management", "User Support", "System Administration", "Security"],
    socialLinks: {
      website: "https://taxomind.com",
      github: "taxomind",
      linkedin: "taxomind-admin",
      twitter: "@taxomind"
    }
  };

  // Activity stats
  const activityStats = [
    { label: "Total Logins", value: "1,234", icon: Activity },
    { label: "Actions Performed", value: "8,456", icon: CheckCircle },
    { label: "Reports Generated", value: "234", icon: Activity },
    { label: "Support Tickets", value: "89", icon: Mail },
  ];

  return (
    <div className="flex h-full w-full flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-10">

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Admin Profile</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Manage your admin account and preferences
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="border-slate-200 dark:border-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1 bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-slate-700 hover:bg-slate-600"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{user.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                  <Badge className="mt-2 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    <Shield className="mr-1 h-3 w-3" />
                    {user.role}
                  </Badge>
                </div>
                <div className="w-full space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Phone className="h-4 w-4" />
                    {user.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="h-4 w-4" />
                    Joined {user.joinDate}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="h-4 w-4" />
                    Last login {user.lastLogin}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Tabs */}
          <div className="md:col-span-2">
            <Tabs defaultValue="personal" className="space-y-4">
              <TabsList className="bg-slate-100 dark:bg-slate-900/50">
                <TabsTrigger value="personal" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                  Personal Info
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                  Security
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                  Activity
                </TabsTrigger>
              </TabsList>

              {/* Personal Information */}
              <TabsContent value="personal" className="space-y-4">
                <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Personal Information</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Update your personal details and bio
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">Full Name</Label>
                        <Input
                          defaultValue={user.name}
                          disabled={!isEditing}
                          className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">Email</Label>
                        <Input
                          type="email"
                          defaultValue={user.email}
                          disabled={!isEditing}
                          className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">Phone</Label>
                        <Input
                          defaultValue={user.phone}
                          disabled={!isEditing}
                          className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">Location</Label>
                        <Input
                          defaultValue={user.location}
                          disabled={!isEditing}
                          className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300">Bio</Label>
                      <Textarea
                        defaultValue={user.bio}
                        disabled={!isEditing}
                        className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300">Skills & Expertise</Label>
                      <div className="flex flex-wrap gap-2">
                        {user.skills.map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="border-slate-300 dark:border-slate-600"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {isEditing && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 border-slate-300 dark:border-slate-600"
                          >
                            + Add Skill
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Social Links</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Add your social media profiles
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">
                          <Globe className="inline h-4 w-4 mr-1" />
                          Website
                        </Label>
                        <Input
                          defaultValue={user.socialLinks.website}
                          disabled={!isEditing}
                          className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">
                          <Github className="inline h-4 w-4 mr-1" />
                          GitHub
                        </Label>
                        <Input
                          defaultValue={user.socialLinks.github}
                          disabled={!isEditing}
                          className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">
                          <Linkedin className="inline h-4 w-4 mr-1" />
                          LinkedIn
                        </Label>
                        <Input
                          defaultValue={user.socialLinks.linkedin}
                          disabled={!isEditing}
                          className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">
                          <Twitter className="inline h-4 w-4 mr-1" />
                          Twitter
                        </Label>
                        <Input
                          defaultValue={user.socialLinks.twitter}
                          disabled={!isEditing}
                          className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security" className="space-y-4">
                <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Security Settings</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Manage your account security and authentication
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">Password</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Last changed 30 days ago</p>
                        </div>
                        <Button variant="outline" className="border-slate-200 dark:border-slate-600">
                          <Key className="mr-2 h-4 w-4" />
                          Change Password
                        </Button>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">Two-Factor Authentication</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Enabled
                            </Badge>
                          </p>
                        </div>
                        <Button variant="outline" className="border-slate-200 dark:border-slate-600">
                          <Shield className="mr-2 h-4 w-4" />
                          Manage 2FA
                        </Button>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">Active Sessions</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">3 active sessions</p>
                        </div>
                        <Button variant="outline" className="border-slate-200 dark:border-slate-600">
                          View Sessions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Alert className="border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <AlertDescription className="text-slate-700 dark:text-slate-300">
                    As an admin, your account has elevated privileges. Ensure your security settings are always up to date.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              {/* Activity */}
              <TabsContent value="activity" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {activityStats.map((stat, idx) => (
                    <Card key={idx} className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {stat.label}
                          </CardTitle>
                          <stat.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Recent Activity</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Your recent actions on the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { action: "Updated platform settings", time: "2 hours ago", icon: Settings },
                        { action: "Generated monthly revenue report", time: "5 hours ago", icon: FileText },
                        { action: "Reviewed user registrations", time: "1 day ago", icon: Users },
                        { action: "Modified course permissions", time: "2 days ago", icon: Shield },
                        { action: "Exported analytics data", time: "3 days ago", icon: Download },
                      ].map((activity, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <activity.icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.action}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-100">Danger Zone</CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300">
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">Sign Out from All Devices</p>
                <p className="text-sm text-red-700 dark:text-red-300">This will sign you out from all active sessions</p>
              </div>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out Everywhere
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}