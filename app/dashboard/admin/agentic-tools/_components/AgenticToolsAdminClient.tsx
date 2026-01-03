"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  requiredPermissions: string[];
  confirmationType: string;
  timeoutMs?: number | null;
  maxRetries?: number | null;
  tags: string[];
  enabled: boolean;
  deprecated: boolean;
  deprecationMessage?: string | null;
  updatedAt: string;
}

interface PermissionEntry {
  id: string;
  userId: string;
  toolId?: string | null;
  category?: string | null;
  levels: string[];
  grantedBy?: string | null;
  grantedAt: string;
  expiresAt?: string | null;
  conditions?: unknown;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  level: string;
  action: string;
  userId: string;
  sessionId: string;
  toolId?: string | null;
  invocationId?: string | null;
  error?: unknown;
  metadata?: unknown;
}

const PERMISSION_LEVELS = ["read", "write", "execute", "admin"];
const ROLE_OPTIONS = ["student", "mentor", "instructor", "admin"];

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.append(key, value);
  });
  return search.toString();
}

export function AgenticToolsAdminClient() {
  const [activeTab, setActiveTab] = useState("tools");
  const [tools, setTools] = useState<ToolSummary[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);

  const [permissions, setPermissions] = useState<PermissionEntry[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const [permissionForm, setPermissionForm] = useState({
    userId: "",
    toolId: "",
    category: "",
    role: "",
    levels: PERMISSION_LEVELS.reduce((acc, level) => ({ ...acc, [level]: false }), {} as Record<string, boolean>),
  });

  const [permissionQuery, setPermissionQuery] = useState({
    userId: "",
    toolId: "",
    category: "",
  });

  const [auditQuery, setAuditQuery] = useState({
    userId: "",
    toolId: "",
    action: "",
    level: "",
  });

  const fetchTools = useCallback(async () => {
    setToolsLoading(true);
    setToolsError(null);
    try {
      const response = await fetch("/api/admin/agentic/tools?includeDisabled=true");
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to load tools");
      }
      setTools(data.data.tools ?? []);
    } catch (error) {
      setToolsError((error as Error).message);
    } finally {
      setToolsLoading(false);
    }
  }, []);

  const toggleTool = useCallback(async (tool: ToolSummary) => {
    try {
      const response = await fetch(`/api/admin/agentic/tools/${tool.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !tool.enabled }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to update tool");
      }
      setTools((prev) =>
        prev.map((item) => (item.id === tool.id ? { ...item, enabled: !tool.enabled } : item))
      );
    } catch (error) {
      setToolsError((error as Error).message);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    setPermissionsError(null);
    try {
      const query = buildQuery(permissionQuery);
      const response = await fetch(`/api/admin/agentic/tools/permissions?${query}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to load permissions");
      }
      setPermissions(data.data.permissions ?? []);
    } catch (error) {
      setPermissionsError((error as Error).message);
    } finally {
      setPermissionsLoading(false);
    }
  }, [permissionQuery]);

  const grantPermission = useCallback(async () => {
    setPermissionsError(null);
    const levels = PERMISSION_LEVELS.filter((level) => permissionForm.levels[level]);
    const payload: Record<string, unknown> = {
      userId: permissionForm.userId,
    };
    if (permissionForm.role) {
      payload.role = permissionForm.role;
    } else {
      payload.toolId = permissionForm.toolId || undefined;
      payload.category = permissionForm.category || undefined;
      payload.levels = levels;
    }

    try {
      const response = await fetch("/api/admin/agentic/tools/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to grant permissions");
      }
      await fetchPermissions();
    } catch (error) {
      setPermissionsError((error as Error).message);
    }
  }, [fetchPermissions, permissionForm]);

  const revokePermission = useCallback(async () => {
    setPermissionsError(null);
    try {
      const response = await fetch("/api/admin/agentic/tools/permissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: permissionForm.userId,
          toolId: permissionForm.toolId || undefined,
          category: permissionForm.category || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to revoke permissions");
      }
      await fetchPermissions();
    } catch (error) {
      setPermissionsError((error as Error).message);
    }
  }, [fetchPermissions, permissionForm]);

  const fetchAudit = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const query = buildQuery({
        userId: auditQuery.userId || undefined,
        toolId: auditQuery.toolId || undefined,
        action: auditQuery.action || undefined,
        level: auditQuery.level || undefined,
      });
      const response = await fetch(`/api/admin/agentic/tools/audit?${query}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to load audit logs");
      }
      setAuditEntries(data.data.entries ?? []);
    } catch (error) {
      setAuditError((error as Error).message);
    } finally {
      setAuditLoading(false);
    }
  }, [auditQuery]);

  useEffect(() => {
    fetchTools();
    fetchPermissions();
    fetchAudit();
  }, [fetchTools, fetchPermissions, fetchAudit]);

  const permissionLevelBadges = useMemo(() => {
    return PERMISSION_LEVELS.map((level) => (
      <Badge key={level} variant={permissionForm.levels[level] ? "default" : "outline"}>
        {level}
      </Badge>
    ));
  }, [permissionForm.levels]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Agentic Tool Governance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Manage mentor tools, permissions, and audit trails.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle>Registered Tools</CardTitle>
              <CardDescription>Toggle availability and review tool metadata.</CardDescription>
            </CardHeader>
            <CardContent>
              {toolsError && <p className="text-sm text-red-600">{toolsError}</p>}
              {toolsLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading tools...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tools.map((tool) => (
                      <TableRow key={tool.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tool.name}</p>
                            <p className="text-xs text-slate-500">{tool.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>{tool.category}</TableCell>
                        <TableCell className="space-x-1">
                          {tool.requiredPermissions.map((level) => (
                            <Badge key={`${tool.id}-${level}`} variant="secondary">
                              {level}
                            </Badge>
                          ))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tool.enabled ? "default" : "outline"}>
                            {tool.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={tool.enabled ? "outline" : "default"}
                            onClick={() => toggleTool(tool)}
                          >
                            {tool.enabled ? "Disable" : "Enable"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Grant or Revoke Permissions</CardTitle>
                <CardDescription>Assign per-user permissions or bootstrap a role.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-slate-500">User ID</label>
                    <Input
                      value={permissionForm.userId}
                      onChange={(event) => setPermissionForm((prev) => ({ ...prev, userId: event.target.value }))}
                      placeholder="user_123"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Role (optional)</label>
                    <select
                      value={permissionForm.role}
                      onChange={(event) => setPermissionForm((prev) => ({ ...prev, role: event.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Custom</option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Tool ID (optional)</label>
                    <Input
                      value={permissionForm.toolId}
                      onChange={(event) => setPermissionForm((prev) => ({ ...prev, toolId: event.target.value }))}
                      placeholder="mentor.schedule_session"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Category (optional)</label>
                    <Input
                      value={permissionForm.category}
                      onChange={(event) => setPermissionForm((prev) => ({ ...prev, category: event.target.value }))}
                      placeholder="content"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {PERMISSION_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setPermissionForm((prev) => ({
                          ...prev,
                          levels: { ...prev.levels, [level]: !prev.levels[level] },
                        }))
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition",
                        permissionForm.levels[level]
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 text-slate-600 hover:border-slate-400"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={grantPermission} disabled={!permissionForm.userId}>
                    Grant
                  </Button>
                  <Button variant="outline" onClick={revokePermission} disabled={!permissionForm.userId}>
                    Revoke
                  </Button>
                </div>
                {permissionsError && <p className="text-sm text-red-600">{permissionsError}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permission Entries</CardTitle>
                <CardDescription>Filter and review current grants.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={permissionQuery.userId}
                    onChange={(event) => setPermissionQuery((prev) => ({ ...prev, userId: event.target.value }))}
                    placeholder="Filter by userId"
                  />
                  <Input
                    value={permissionQuery.toolId}
                    onChange={(event) => setPermissionQuery((prev) => ({ ...prev, toolId: event.target.value }))}
                    placeholder="Filter by toolId"
                  />
                  <Input
                    value={permissionQuery.category}
                    onChange={(event) => setPermissionQuery((prev) => ({ ...prev, category: event.target.value }))}
                    placeholder="Filter by category"
                  />
                  <Button variant="outline" onClick={fetchPermissions} disabled={permissionsLoading}>
                    Refresh
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1 text-xs text-slate-500">
                  {permissionLevelBadges}
                </div>

                {permissionsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading permissions...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="rounded-lg border border-slate-200 p-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{permission.userId}</span>
                          <Badge variant="outline">{permission.category || permission.toolId || "global"}</Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {permission.levels.map((level) => (
                            <Badge key={`${permission.id}-${level}`} variant="secondary">{level}</Badge>
                          ))}
                        </div>
                        <p className="mt-1 text-slate-500">
                          Granted {new Date(permission.grantedAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Tool Audit Logs</CardTitle>
              <CardDescription>Review tool execution history and security events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  value={auditQuery.userId}
                  onChange={(event) => setAuditQuery((prev) => ({ ...prev, userId: event.target.value }))}
                  placeholder="Filter by userId"
                />
                <Input
                  value={auditQuery.toolId}
                  onChange={(event) => setAuditQuery((prev) => ({ ...prev, toolId: event.target.value }))}
                  placeholder="Filter by toolId"
                />
                <Input
                  value={auditQuery.action}
                  onChange={(event) => setAuditQuery((prev) => ({ ...prev, action: event.target.value }))}
                  placeholder="Action (csv)"
                />
                <Input
                  value={auditQuery.level}
                  onChange={(event) => setAuditQuery((prev) => ({ ...prev, level: event.target.value }))}
                  placeholder="Level (csv)"
                />
              </div>

              <Button variant="outline" onClick={fetchAudit} disabled={auditLoading}>
                Refresh logs
              </Button>

              {auditError && <p className="text-sm text-red-600">{auditError}</p>}
              {auditLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading audit logs...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{entry.action}</TableCell>
                        <TableCell>{entry.toolId ?? "-"}</TableCell>
                        <TableCell className="text-xs">{entry.userId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.level}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
