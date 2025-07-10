"use client";

import { useState, useEffect } from "react";
import { VersionType, VersionStatus } from "@prisma/client";
import { toast } from "sonner";

export interface ContentSnapshot {
  id: string;
  title?: string;
  description?: string;
  content?: string;
  metadata?: any;
  [key: string]: any;
}

export interface VersionInfo {
  id: string;
  versionNumber: string;
  status: VersionStatus;
  title?: string;
  description?: string;
  author: {
    id: string;
    name?: string;
    email?: string;
  };
  createdAt: Date;
  publishedAt?: Date;
  changeLog: string[];
}

export function useContentVersioning(contentType: string, contentId: string) {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch version history
  const fetchVersions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/content/versions?contentType=${contentType}&contentId=${contentId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions);
        
        // Set current published version
        const published = data.versions.find((v: VersionInfo) => v.status === VersionStatus.PUBLISHED);
        setCurrentVersion(published || null);
      } else {
        toast.error("Failed to fetch version history");
      }
    } catch (error) {
      toast.error("Error fetching version history");
    } finally {
      setLoading(false);
    }
  };

  // Create new version
  const createVersion = async ({
    contentSnapshot,
    versionType = VersionType.PATCH,
    title,
    description,
    changeLog = [],
    scheduledAt
  }: {
    contentSnapshot: ContentSnapshot;
    versionType?: VersionType;
    title?: string;
    description?: string;
    changeLog?: string[];
    scheduledAt?: Date;
  }) => {
    setCreating(true);
    try {
      const response = await fetch("/api/content/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          contentId,
          contentSnapshot,
          versionType,
          title,
          description,
          changeLog,
          scheduledAt: scheduledAt?.toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Version created successfully");
        await fetchVersions(); // Refresh list
        return data.version;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create version");
        return null;
      }
    } catch (error) {
      toast.error("Error creating version");
      return null;
    } finally {
      setCreating(false);
    }
  };

  // Publish version
  const publishVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/content/versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" })
      });

      if (response.ok) {
        toast.success("Version published successfully");
        await fetchVersions();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to publish version");
        return false;
      }
    } catch (error) {
      toast.error("Error publishing version");
      return false;
    }
  };

  // Submit for review
  const submitForReview = async (versionId: string, reviewerIds: string[]) => {
    try {
      const response = await fetch(`/api/content/versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "submit_for_review",
          reviewerIds 
        })
      });

      if (response.ok) {
        toast.success("Submitted for review");
        await fetchVersions();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to submit for review");
        return false;
      }
    } catch (error) {
      toast.error("Error submitting for review");
      return false;
    }
  };

  // Review version
  const reviewVersion = async (versionId: string, approved: boolean, comments?: string) => {
    try {
      const response = await fetch(`/api/content/versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "review",
          approved,
          comments 
        })
      });

      if (response.ok) {
        toast.success(approved ? "Version approved" : "Version rejected");
        await fetchVersions();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to review version");
        return false;
      }
    } catch (error) {
      toast.error("Error reviewing version");
      return false;
    }
  };

  // Rollback to version
  const rollbackToVersion = async (targetVersionId: string, reason?: string) => {
    try {
      const response = await fetch("/api/content/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          contentId,
          targetVersionId,
          reason
        })
      });

      if (response.ok) {
        toast.success("Successfully rolled back to previous version");
        await fetchVersions();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to rollback");
        return false;
      }
    } catch (error) {
      toast.error("Error rolling back");
      return false;
    }
  };

  // Get content at specific version
  const getContentAtVersion = async (versionId: string): Promise<ContentSnapshot | null> => {
    try {
      const response = await fetch(`/api/content/versions/${versionId}/content`);
      
      if (response.ok) {
        const data = await response.json();
        return data.content;
      } else {
        toast.error("Failed to fetch content");
        return null;
      }
    } catch (error) {
      toast.error("Error fetching content");
      return null;
    }
  };

  // Load versions on mount
  useEffect(() => {
    if (contentType && contentId) {
      fetchVersions();
    }
  }, [contentType, contentId]);

  // Get version by status
  const getVersionByStatus = (status: VersionStatus) => {
    return versions.find(v => v.status === status) || null;
  };

  // Get latest version
  const getLatestVersion = () => {
    return versions[0] || null;
  };

  // Check if content has unpublished changes
  const hasUnpublishedChanges = () => {
    const publishedVersion = getVersionByStatus(VersionStatus.PUBLISHED);
    const latestVersion = getLatestVersion();
    
    if (!publishedVersion || !latestVersion) return false;
    
    return publishedVersion.id !== latestVersion.id;
  };

  return {
    // State
    versions,
    currentVersion,
    loading,
    creating,
    
    // Actions
    createVersion,
    publishVersion,
    submitForReview,
    reviewVersion,
    rollbackToVersion,
    getContentAtVersion,
    fetchVersions,
    
    // Utilities
    getVersionByStatus,
    getLatestVersion,
    hasUnpublishedChanges
  };
}