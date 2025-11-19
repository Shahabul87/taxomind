"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Bell,
  Shield,
  Globe,
  Mail,
  Database,
  Key,
  Save,
  AlertTriangle,
  Info,
  CheckCircle,
  User,
  CreditCard,
  Palette,
  Code
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordChangeCard } from "./password-change-card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Platform Settings
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Configure platform settings and preferences
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <Save className="mr-2 h-4 w-4" />
            Save All Changes
          </Button>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <TabsTrigger
                value="general"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                <Settings className="mr-2 h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                <Shield className="mr-2 h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger
                value="advanced"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                <Code className="mr-2 h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-4">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Platform Information</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Basic platform configuration and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="platform-name" className="text-slate-700 dark:text-slate-300">Platform Name</Label>
                    <Input
                      id="platform-name"
                      defaultValue="Taxomind"
                      className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform-url" className="text-slate-700 dark:text-slate-300">Platform URL</Label>
                    <Input
                      id="platform-url"
                      defaultValue="https://taxomind.com"
                      className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-email" className="text-slate-700 dark:text-slate-300">Support Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      defaultValue="support@taxomind.com"
                      className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-slate-700 dark:text-slate-300">Timezone</Label>
                    <Select defaultValue="utc">
                      <SelectTrigger className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc">UTC</SelectItem>
                        <SelectItem value="est">EST</SelectItem>
                        <SelectItem value="pst">PST</SelectItem>
                        <SelectItem value="gmt">GMT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-description" className="text-slate-700 dark:text-slate-300">Platform Description</Label>
                  <Textarea
                    id="platform-description"
                    defaultValue="Intelligent learning management system with AI-powered adaptive learning"
                    className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Appearance</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Customize platform appearance and theme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Dark Mode</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Enable dark mode by default</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Custom Branding</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Use custom logo and colors</p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      defaultValue="#1e293b"
                      className="w-20 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                    />
                    <Input
                      defaultValue="#1e293b"
                      className="flex-1 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-4">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Security Settings</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Configure security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Two-Factor Authentication</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Session Timeout</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Auto logout after inactivity</p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-[100px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">IP Whitelisting</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Restrict access to specific IPs</p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Password Policy</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Minimum 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Require uppercase and lowercase</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Require numbers and symbols</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <PasswordChangeCard />

            <Alert className="border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-slate-700 dark:text-slate-300">
                Changing security settings may affect user access. Make sure to notify users before applying changes.
              </AlertDescription>
            </Alert>
          </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-4">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Notification Preferences</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Configure how you receive platform notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Email Notifications</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Receive notifications via email</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Push Notifications</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Browser push notifications</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Notification Types</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">New user registrations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Course enrollments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">System alerts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-slate-300" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Marketing updates</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

            {/* Billing Settings */}
            <TabsContent value="billing" className="space-y-4">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Billing Configuration</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Manage billing and payment settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Payment Gateway</Label>
                    <Select defaultValue="stripe">
                      <SelectTrigger className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Currency</Label>
                    <Select defaultValue="usd">
                      <SelectTrigger className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="eur">EUR</SelectItem>
                        <SelectItem value="gbp">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Auto-renewal</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Enable automatic subscription renewal</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Tax Calculation</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Automatically calculate taxes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

            {/* Advanced Settings */}
            <TabsContent value="advanced" className="space-y-4">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Advanced Configuration</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Technical and system-level settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Maintenance Mode</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Take platform offline for maintenance</p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Auto Backup</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Daily automatic database backup</p>
                  </div>
                  <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Debug Mode</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Enable detailed error logging</p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">API Rate Limiting</Label>
                  <Select defaultValue="1000">
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 requests/hour</SelectItem>
                      <SelectItem value="500">500 requests/hour</SelectItem>
                      <SelectItem value="1000">1000 requests/hour</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {maintenanceMode && (
              <Alert className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-slate-700 dark:text-slate-300">
                  Maintenance mode is enabled. The platform is not accessible to regular users.
                </AlertDescription>
              </Alert>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}