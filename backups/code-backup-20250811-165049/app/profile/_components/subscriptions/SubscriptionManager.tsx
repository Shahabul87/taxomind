"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  DollarSign,
  CreditCard,
  Calendar,
  AlertTriangle,
  Clock,
  BarChart3,
  PieChart,
  Settings,
  Bell,
  Pause,
  Trash2
} from "lucide-react";

interface SubscriptionManagerProps {
  userId: string;
}

export function SubscriptionManager({ userId }: SubscriptionManagerProps) {
  const [isAddingSubscription, setIsAddingSubscription] = useState(false);

  // Mock data for demonstration
  const mockSubscriptions = [
    {
      id: "1",
      serviceName: "Netflix",
      planName: "Premium",
      cost: 15.99,
      currency: "USD",
      billingCycle: "MONTHLY",
      nextBillingDate: new Date("2024-02-15"),
      isActive: true,
      category: "STREAMING",
      logo: "🎬"
    },
    {
      id: "2",
      serviceName: "Spotify",
      planName: "Premium",
      cost: 9.99,
      currency: "USD",
      billingCycle: "MONTHLY",
      nextBillingDate: new Date("2024-02-20"),
      isActive: true,
      category: "MUSIC",
      logo: "🎵"
    }
  ];

  const totalMonthlySpending = mockSubscriptions
    .filter(sub => sub.isActive)
    .reduce((sum, sub) => sum + sub.cost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Subscription Manager</h2>
          <p className="text-slate-400">Track and manage all your subscriptions in one place</p>
        </div>
        
        <Dialog open={isAddingSubscription} onOpenChange={setIsAddingSubscription}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Subscription
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add Subscription</DialogTitle>
              <DialogDescription className="text-slate-400">
                Add a new subscription to track your spending
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="serviceName" className="text-white">Service Name</Label>
                <Input
                  id="serviceName"
                  placeholder="Netflix, Spotify, etc."
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setIsAddingSubscription(false)}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  Add Subscription
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingSubscription(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-900/50 to-emerald-800/30 border-green-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">Monthly Spending</p>
                <p className="text-2xl font-bold text-white">${totalMonthlySpending.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-cyan-800/30 border-blue-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Active Subscriptions</p>
                <p className="text-2xl font-bold text-white">{mockSubscriptions.filter(s => s.isActive).length}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/50 to-amber-800/30 border-orange-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-200 text-sm font-medium">Next Payment</p>
                <p className="text-2xl font-bold text-white">Feb 15</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <DollarSign className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">Subscription Manager Coming Soon</h3>
          <p className="text-slate-400">
            This comprehensive subscription management system will help you track spending, manage renewals, and optimize your subscriptions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 