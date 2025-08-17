"use client";

import { useState } from "react";
// Use local enum matching service instead of Prisma enum
enum VersionType { MAJOR = 'MAJOR', MINOR = 'MINOR', PATCH = 'PATCH', HOTFIX = 'HOTFIX' }
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useContentVersioning, ContentSnapshot } from "@/hooks/use-content-versioning";
import { usePermissions } from "@/hooks/use-permissions";
import { Plus, GitBranch, Save, Calendar } from "lucide-react";
import { DateTimePicker } from "@/components/ui/date-time-picker";

interface VersionCreatorProps {
  contentType: string;
  contentId: string;
  currentContent: ContentSnapshot;
  onVersionCreated?: () => void;
}

const versionTypeOptions = [
  {
    value: VersionType.PATCH,
    label: "Patch",
    description: "Bug fixes and small corrections",
    color: "bg-green-100 text-green-800"
  },
  {
    value: VersionType.MINOR,
    label: "Minor",
    description: "New features and updates",
    color: "bg-blue-100 text-blue-800"
  },
  {
    value: VersionType.MAJOR,
    label: "Major",
    description: "Breaking changes and restructuring",
    color: "bg-red-100 text-red-800"
  },
  {
    value: VersionType.HOTFIX,
    label: "Hotfix",
    description: "Urgent fixes for published content",
    color: "bg-purple-100 text-purple-800"
  }
];

export function VersionCreator({ 
  contentType, 
  contentId, 
  currentContent, 
  onVersionCreated 
}: VersionCreatorProps) {
  const { createVersion, creating, hasUnpublishedChanges } = useContentVersioning(contentType, contentId);
  const { isTeacherOrAdmin } = usePermissions();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    versionType: VersionType.PATCH,
    title: "",
    description: "",
    changeLog: "",
    scheduledAt: null as Date | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const changeLogArray = formData.changeLog
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const success = await createVersion({
      contentSnapshot: currentContent,
      versionType: formData.versionType,
      title: formData.title || undefined,
      description: formData.description || undefined,
      changeLog: changeLogArray,
      scheduledAt: formData.scheduledAt || undefined
    });

    if (success) {
      setOpen(false);
      setFormData({
        versionType: VersionType.PATCH,
        title: "",
        description: "",
        changeLog: "",
        scheduledAt: null
      });
      onVersionCreated?.();
    }
  };

  const resetForm = () => {
    setFormData({
      versionType: VersionType.PATCH,
      title: "",
      description: "",
      changeLog: "",
      scheduledAt: null
    });
  };

  if (!isTeacherOrAdmin) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Version
          {hasUnpublishedChanges() && (
            <Badge variant="secondary" className="ml-1">
              Changes
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Create New Version
          </DialogTitle>
          <DialogDescription>
            Create a new version of this content with your current changes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="versionType">Version Type</Label>
              <Select
                value={formData.versionType}
                onValueChange={(value: VersionType) => 
                  setFormData(prev => ({ ...prev, versionType: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select version type" />
                </SelectTrigger>
                <SelectContent>
                  {versionTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={option.color}>
                          {option.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Version Title (Optional)</Label>
              <Input
                id="title"
                placeholder="Brief title for this version"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what changed in this version"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="changeLog">Change Log</Label>
              <Textarea
                id="changeLog"
                placeholder="List changes, one per line:&#10;- Fixed typo in introduction&#10;- Added new section on advanced topics&#10;- Updated examples"
                value={formData.changeLog}
                onChange={(e) => setFormData(prev => ({ ...prev, changeLog: e.target.value }))}
                className="mt-1 font-mono text-sm"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter each change on a new line
              </p>
            </div>

            <div>
              <Label htmlFor="scheduledAt">Schedule Publishing (Optional)</Label>
              <div className="mt-1">
                <DateTimePicker
                  value={formData.scheduledAt}
                  onChange={(date) => setFormData(prev => ({ ...prev, scheduledAt: date }))}
                  placeholder="Select date and time"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to create as draft
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {formData.scheduledAt ? 'Schedule Version' : 'Create Version'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}