"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface BlogPlan {
  id: string;
  title: string;
  description: string | null;
  topics: string[];
  startPublishingDate: string;
  postFrequency: string;
  specificDays: string | null;
  platform: string | null;
  targetAudience: string | null;
  contentGoal: string;
  writingReminders: boolean;
  publishingReminders: boolean;
  deadlineAlerts: boolean;
  syncToGoogleCalendar: boolean;
  status: string;
  createdAt: string;
}

interface UpdateBlogPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: BlogPlan;
  onSuccess: (updatedPlan: BlogPlan) => void;
}

export function UpdateBlogPlanModal({ isOpen, onClose, plan, onSuccess }: UpdateBlogPlanModalProps) {
  const [loading, setLoading] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [formData, setFormData] = useState({
    title: plan.title,
    description: plan.description || "",
    topics: plan.topics,
    startPublishingDate: new Date(plan.startPublishingDate),
    postFrequency: plan.postFrequency,
    specificDays: plan.specificDays || "",
    platform: plan.platform || "",
    targetAudience: plan.targetAudience || "",
    contentGoal: plan.contentGoal,
    status: plan.status,
    notifications: {
      writingReminders: plan.writingReminders,
      publishingReminders: plan.publishingReminders,
      deadlineAlerts: plan.deadlineAlerts,
    },
    syncToGoogleCalendar: plan.syncToGoogleCalendar,
  });

  const handleAddTopic = () => {
    if (newTopic.trim() && !formData.topics.includes(newTopic.trim())) {
      setFormData({ ...formData, topics: [...formData.topics, newTopic.trim()] });
      setNewTopic("");
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setFormData({ ...formData, topics: formData.topics.filter((t) => t !== topic) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/dashboard/blog-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          topics: formData.topics,
          startPublishingDate: formData.startPublishingDate.toISOString(),
          postFrequency: formData.postFrequency,
          specificDays: formData.specificDays || null,
          platform: formData.platform || null,
          targetAudience: formData.targetAudience || null,
          contentGoal: formData.contentGoal,
          status: formData.status,
          writingReminders: formData.notifications.writingReminders,
          publishingReminders: formData.notifications.publishingReminders,
          deadlineAlerts: formData.notifications.deadlineAlerts,
          syncToGoogleCalendar: formData.syncToGoogleCalendar,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(result.data);
      } else {
        toast.error(result.error?.message || "Failed to update blog plan");
      }
    } catch (error) {
      console.error("Error updating blog plan:", error);
      toast.error("Failed to update blog plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Blog Plan</DialogTitle>
          <DialogDescription>
            Modify your content creation plan details and preferences
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Plan Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Tech Blog 2025"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is your blog about?"
                rows={3}
              />
            </div>

            {/* Topics */}
            <div className="space-y-2">
              <Label>Topics</Label>
              <div className="flex gap-2">
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Add a topic"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTopic();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTopic} variant="outline">
                  Add
                </Button>
              </div>
              {formData.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.topics.map((topic, i) => (
                    <Badge key={i} variant="secondary">
                      {topic}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(topic)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Publishing Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startPublishingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startPublishingDate ? (
                      format(formData.startPublishingDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startPublishingDate}
                    onSelect={(date) => date && setFormData({ ...formData, startPublishingDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Frequency & Days */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Post Frequency *</Label>
                <Select
                  value={formData.postFrequency}
                  onValueChange={(value) => setFormData({ ...formData, postFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specificDays">Specific Days</Label>
                <Input
                  id="specificDays"
                  value={formData.specificDays}
                  onChange={(e) => setFormData({ ...formData, specificDays: e.target.value })}
                  placeholder="e.g., Monday, Wednesday"
                />
              </div>
            </div>

            {/* Platform & Goal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Input
                  id="platform"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  placeholder="e.g., Medium, Dev.to"
                />
              </div>

              <div className="space-y-2">
                <Label>Content Goal *</Label>
                <Select
                  value={formData.contentGoal}
                  onValueChange={(value) => setFormData({ ...formData, contentGoal: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRAFFIC">Traffic</SelectItem>
                    <SelectItem value="PORTFOLIO">Portfolio</SelectItem>
                    <SelectItem value="MONETIZATION">Monetization</SelectItem>
                    <SelectItem value="KNOWLEDGE_SHARING">Knowledge Sharing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Textarea
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="Who are you writing for?"
                rows={2}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notifications */}
            <div className="space-y-3 border-t pt-4">
              <Label>Notifications</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="writingReminders" className="cursor-pointer">
                    Writing Reminders
                  </Label>
                  <Switch
                    id="writingReminders"
                    checked={formData.notifications.writingReminders}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, writingReminders: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="publishingReminders" className="cursor-pointer">
                    Publishing Reminders
                  </Label>
                  <Switch
                    id="publishingReminders"
                    checked={formData.notifications.publishingReminders}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, publishingReminders: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="deadlineAlerts" className="cursor-pointer">
                    Deadline Alerts
                  </Label>
                  <Switch
                    id="deadlineAlerts"
                    checked={formData.notifications.deadlineAlerts}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, deadlineAlerts: checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Google Calendar */}
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <Label htmlFor="googleCalendar" className="cursor-pointer">
                  Sync to Google Calendar
                </Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Add writing/publishing deadlines to calendar
                </p>
              </div>
              <Switch
                id="googleCalendar"
                checked={formData.syncToGoogleCalendar}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, syncToGoogleCalendar: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
