"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
// Use local enums matching service instead of Prisma enums
enum VersionStatus { DRAFT = 'DRAFT', UNDER_REVIEW = 'UNDER_REVIEW', PUBLISHED = 'PUBLISHED', ARCHIVED = 'ARCHIVED', SCHEDULED = 'SCHEDULED' }
enum VersionType { MAJOR = 'MAJOR', MINOR = 'MINOR', PATCH = 'PATCH', HOTFIX = 'HOTFIX' }
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { useContentVersioning, VersionInfo } from "@/hooks/use-content-versioning";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Clock,
  Eye,
  GitBranch,
  Play,
  RotateCcw,
  FileText,
  User,
  Calendar,
  AlertTriangle
} from "lucide-react";

interface VersionHistoryProps {
  contentType: string;
  contentId: string;
  onVersionSelect?: (version: VersionInfo) => void;
}

const statusConfig = {
  [VersionStatus.DRAFT]: {
    label: "Draft",
    color: "bg-gray-100 text-gray-800",
    icon: FileText
  },
  [VersionStatus.UNDER_REVIEW]: {
    label: "Under Review",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock
  },
  [VersionStatus.PUBLISHED]: {
    label: "Published",
    color: "bg-green-100 text-green-800",
    icon: Play
  },
  [VersionStatus.ARCHIVED]: {
    label: "Archived",
    color: "bg-gray-100 text-gray-600",
    icon: FileText
  },
  [VersionStatus.SCHEDULED]: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-800",
    icon: Calendar
  }
};

const versionTypeConfig = {
  [VersionType.MAJOR]: { label: "Major", color: "text-red-600" },
  [VersionType.MINOR]: { label: "Minor", color: "text-orange-600" },
  [VersionType.PATCH]: { label: "Patch", color: "text-green-600" },
  [VersionType.HOTFIX]: { label: "Hotfix", color: "text-purple-600" }
};

export function VersionHistory({ contentType, contentId, onVersionSelect }: VersionHistoryProps) {
  const { 
    versions, 
    currentVersion, 
    loading, 
    publishVersion, 
    rollbackToVersion,
    getContentAtVersion 
  } = useContentVersioning(contentType, contentId);
  
  const { canManageUsers, isTeacherOrAdmin } = usePermissions();
  
  const [rollbackDialog, setRollbackDialog] = useState<{
    open: boolean;
    version: VersionInfo | null;
  }>({ open: false, version: null });
  
  const [rollbackReason, setRollbackReason] = useState("");

  const handleViewVersion = async (version: VersionInfo) => {
    const content = await getContentAtVersion(version.id);
    if (content && onVersionSelect) {
      onVersionSelect({ ...version, content } as any);
    }
  };

  const handlePublish = async (versionId: string) => {
    await publishVersion(versionId);
  };

  const handleRollback = async () => {
    if (!rollbackDialog.version) return;
    
    const success = await rollbackToVersion(rollbackDialog.version.id, rollbackReason);
    if (success) {
      setRollbackDialog({ open: false, version: null });
      setRollbackReason("");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading version history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Version History
          </CardTitle>
          {currentVersion && (
            <p className="text-sm text-muted-foreground">
              Current published version: {currentVersion.versionNumber}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No versions found
              </div>
            ) : (
              versions.map((version) => {
                const statusInfo = statusConfig[version.status];
                const StatusIcon = statusInfo.icon;
                const isPublished = version.status === VersionStatus.PUBLISHED;
                
                return (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      isPublished ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-lg font-semibold">
                            v{version.versionNumber}
                          </span>
                          
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          
                          {isPublished && (
                            <Badge variant="outline" className="border-green-200">
                              Current
                            </Badge>
                          )}
                        </div>
                        
                        {version.title && (
                          <h4 className="font-medium">{version.title}</h4>
                        )}
                        
                        {version.description && (
                          <p className="text-sm text-muted-foreground">
                            {version.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {version.author.name || version.author.email}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                          </div>
                          
                          {version.publishedAt && (
                            <div className="flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              Published {formatDistanceToNow(new Date(version.publishedAt), { addSuffix: true })}
                            </div>
                          )}
                        </div>
                        
                        {version.changeLog.length > 0 && (
                          <div className="text-xs">
                            <div className="font-medium text-muted-foreground mb-1">Changes:</div>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {version.changeLog.map((change, index) => (
                                <li key={index}>{change}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewVersion(version)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        
                        {isTeacherOrAdmin() && version.status === VersionStatus.DRAFT && (
                          <Button
                            size="sm"
                            onClick={() => handlePublish(version.id)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Publish
                          </Button>
                        )}
                        
                        {isTeacherOrAdmin() && !isPublished && currentVersion && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRollbackDialog({ open: true, version })}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Rollback
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rollback Confirmation Dialog */}
      <Dialog 
        open={rollbackDialog.open} 
        onOpenChange={(open) => setRollbackDialog({ open, version: rollbackDialog.version })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Rollback
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to rollback to version {rollbackDialog.version?.versionNumber}?
              This will create a new version with the content from the selected version.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for rollback (optional)</label>
              <Textarea
                placeholder="Explain why you're rolling back..."
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRollbackDialog({ open: false, version: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleRollback}>
              Confirm Rollback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}