"use client";

import { useState } from "react";
import { User } from "next-auth";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Users,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  BarChart3,
  Calendar,
  Target,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
  Package,
  Eye,
  MousePointer,
  ShoppingCart,
  ChevronRight,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AffiliateDashboardProps {
  user: User & {
    affiliateCode?: string;
  };
}

export function AffiliateDashboard({ user }: AffiliateDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const affiliateCode = user.affiliateCode || "AFFILIATE123";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  
  // Mock data for demonstration
  const stats = {
    totalEarnings: 2456.78,
    monthlyEarnings: 567.89,
    pendingEarnings: 234.56,
    totalClicks: 1234,
    totalConversions: 45,
    conversionRate: 3.65,
    activeLinks: 12,
    totalReferrals: 156
  };

  const topPerformingLinks = [
    {
      id: "1",
      course: "Advanced React Patterns",
      clicks: 234,
      conversions: 12,
      earnings: 456.78,
      conversionRate: 5.13
    },
    {
      id: "2",
      course: "Node.js Microservices",
      clicks: 189,
      conversions: 8,
      earnings: 312.45,
      conversionRate: 4.23
    },
    {
      id: "3",
      course: "TypeScript Fundamentals",
      clicks: 156,
      conversions: 6,
      earnings: 234.56,
      conversionRate: 3.85
    }
  ];

  const recentConversions = [
    { course: "Advanced React Patterns", customer: "J***e", amount: 39.99, time: "2 hours ago", status: "confirmed" },
    { course: "Node.js Microservices", customer: "M***k", amount: 49.99, time: "5 hours ago", status: "confirmed" },
    { course: "TypeScript Fundamentals", customer: "S***h", amount: 29.99, time: "1 day ago", status: "pending" },
    { course: "Advanced React Patterns", customer: "A***e", amount: 39.99, time: "2 days ago", status: "confirmed" }
  ];

  const payoutHistory = [
    { id: "PAY001", date: "2024-01-15", amount: 567.89, status: "completed", method: "PayPal" },
    { id: "PAY002", date: "2023-12-15", amount: 489.23, status: "completed", method: "Bank Transfer" },
    { id: "PAY003", date: "2023-11-15", amount: 612.45, status: "completed", method: "PayPal" }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const generateAffiliateLink = (courseId: string) => {
    return `${baseUrl}/courses/${courseId}?ref=${affiliateCode}`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Affiliate Dashboard</h2>
            <p className="text-green-100 mb-4">
              Your affiliate code: <span className="font-mono font-bold">{affiliateCode}</span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-2 text-white hover:bg-white/20"
                onClick={() => copyToClipboard(affiliateCode)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </p>
            <div className="flex gap-4">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/affiliate/links">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Generate Links
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/20" asChild>
                <Link href="/affiliate/materials">
                  <Package className="h-4 w-4 mr-2" />
                  Marketing Materials
                </Link>
              </Button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            <div className="text-sm text-green-100">Total Earnings</div>
            <Badge className="mt-2 bg-white/20 text-white">
              ${stats.pendingEarnings.toFixed(2)} pending
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Earnings</p>
                <p className="text-2xl font-bold">${stats.monthlyEarnings.toFixed(2)}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{stats.totalClicks}</p>
                <p className="text-xs text-muted-foreground">{stats.activeLinks} active links</p>
              </div>
              <MousePointer className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{stats.totalConversions}</p>
                <p className="text-xs text-muted-foreground">{stats.conversionRate}% rate</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                <p className="text-xs text-green-600">Active customers</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Links */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Links</CardTitle>
                <CardDescription>Your best converting affiliate links</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformingLinks.map((link) => (
                    <div key={link.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{link.course}</p>
                          <p className="text-xs text-muted-foreground">
                            {link.clicks} clicks • {link.conversions} conversions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${link.earnings.toFixed(2)}</p>
                          <Badge variant="secondary" className="text-xs">
                            {link.conversionRate}% CR
                          </Badge>
                        </div>
                      </div>
                      <Progress value={(link.conversions / stats.totalConversions) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Conversions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Conversions</CardTitle>
                <CardDescription>Latest successful referrals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentConversions.map((conversion, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          conversion.status === "confirmed" 
                            ? "bg-green-100 dark:bg-green-900/30" 
                            : "bg-yellow-100 dark:bg-yellow-900/30"
                        )}>
                          <DollarSign className={cn(
                            "h-4 w-4",
                            conversion.status === "confirmed" ? "text-green-600" : "text-yellow-600"
                          )} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{conversion.course}</p>
                          <p className="text-xs text-muted-foreground">
                            {conversion.customer} • {conversion.time}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">${conversion.amount}</p>
                        <Badge 
                          variant={conversion.status === "confirmed" ? "success" : "secondary"}
                          className="text-xs"
                        >
                          {conversion.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your affiliate performance over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Performance chart visualization</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Affiliate Links</CardTitle>
              <CardDescription>Create trackable links for courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter course URL or search courses..." 
                    className="flex-1"
                  />
                  <Button>Generate Link</Button>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Popular Courses</h4>
                  {topPerformingLinks.map((link) => {
                    const affiliateLink = generateAffiliateLink(link.id);
                    return (
                      <div key={link.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{link.course}</p>
                            <p className="text-xs text-muted-foreground">Commission: 30%</p>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/courses/${link.id}`} target="_blank">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Link>
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Input 
                            value={affiliateLink} 
                            readOnly 
                            className="text-xs"
                          />
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => copyToClipboard(affiliateLink)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="secondary">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentConversions.map((conversion, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm">{conversion.time}</TableCell>
                      <TableCell className="font-medium">{conversion.course}</TableCell>
                      <TableCell>{conversion.customer}</TableCell>
                      <TableCell>${conversion.amount}</TableCell>
                      <TableCell className="font-bold">
                        ${(conversion.amount * 0.3).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={conversion.status === "confirmed" ? "success" : "secondary"}
                        >
                          {conversion.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                <Button className="w-full mt-4" size="sm">Request Payout</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Pending Payout</p>
                <p className="text-2xl font-bold">${stats.pendingEarnings.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-2">Processing...</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Next Payout</p>
                <p className="text-2xl font-bold">Feb 15</p>
                <p className="text-xs text-muted-foreground mt-2">Monthly schedule</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>Your past earnings and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutHistory.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono text-sm">{payout.id}</TableCell>
                      <TableCell>{payout.date}</TableCell>
                      <TableCell className="font-bold">${payout.amount.toFixed(2)}</TableCell>
                      <TableCell>{payout.method}</TableCell>
                      <TableCell>
                        <Badge variant="success">{payout.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Materials</CardTitle>
                <CardDescription>Download banners and promotional content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Banner Pack (728x90, 300x250)
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Email Templates
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Social Media Posts
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Tools</CardTitle>
                <CardDescription>Useful tools for affiliates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Link Shortener
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics Dashboard
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Campaign Tracker
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add this import at the top
import { FileText } from "lucide-react";