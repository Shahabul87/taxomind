"use client";

import { Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Newsletter Subscription Component
 * Allows users to subscribe to blog updates
 */
export function NewsletterSection() {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-slate-200/50 dark:border-slate-700/50 shadow-sm rounded-xl">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 mb-3">
            <Rocket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Get the latest articles and insights delivered to your inbox weekly.
          </p>
        </div>
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Enter your email"
            className="bg-white dark:bg-slate-800"
          />
          <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Subscribe Now
          </Button>
        </div>
        <p className="text-xs text-center mt-3 text-slate-500">
          Join 10,000+ subscribers. No spam, unsubscribe anytime.
        </p>
      </CardContent>
    </Card>
  );
}
