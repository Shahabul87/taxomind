'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Settings,
  Shield,
  Clock,
  Tag,
  AlertTriangle,
  Save,
  Loader2,
  Code,
  Lock,
  Users,
  Zap,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tool } from '@/app/dashboard/admin/tools/_components/ToolsClient';

interface ToolConfigSheetProps {
  tool: Tool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (toolId: string, updates: Partial<Tool>) => Promise<boolean>;
}

const confirmationTypes = [
  { value: 'none', label: 'None', description: 'Execute without confirmation' },
  { value: 'implicit', label: 'Implicit', description: 'Notify user but proceed' },
  { value: 'explicit', label: 'Explicit', description: 'Require user approval' },
  { value: 'strict', label: 'Strict', description: 'Require approval + reason' },
];

const permissionLevels = [
  { value: 'read', label: 'Read', description: 'View data only' },
  { value: 'write', label: 'Write', description: 'Create/modify data' },
  { value: 'execute', label: 'Execute', description: 'Run tool actions' },
  { value: 'admin', label: 'Admin', description: 'Full control' },
];

export function ToolConfigSheet({ tool, open, onOpenChange, onUpdate }: ToolConfigSheetProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [deprecated, setDeprecated] = useState(false);
  const [deprecationMessage, setDeprecationMessage] = useState('');
  const [confirmationType, setConfirmationType] = useState('explicit');
  const [requiredPermissions, setRequiredPermissions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (tool) {
      setEnabled(tool.enabled);
      setDeprecated(tool.deprecated);
      setDeprecationMessage(tool.deprecationMessage || '');
      setConfirmationType(tool.confirmationType);
      setRequiredPermissions(tool.requiredPermissions);
    }
  }, [tool]);

  const handleSave = async () => {
    if (!tool) return;

    setIsSaving(true);
    try {
      const success = await onUpdate(tool.id, {
        enabled,
        deprecated,
        deprecationMessage: deprecated ? deprecationMessage : null,
        confirmationType,
        requiredPermissions,
      } as Partial<Tool>);

      if (success) {
        toast.success('Tool configuration updated successfully');
        onOpenChange(false);
      } else {
        toast.error('Failed to update tool configuration');
      }
    } catch {
      toast.error('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (permission: string) => {
    setRequiredPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  if (!tool) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[600px] bg-white border-slate-200 p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-600/5 to-violet-600/5" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.1) 1px, transparent 0)`,
              backgroundSize: '20px 20px',
            }}
          />
          <SheetHeader className="relative p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold text-slate-900">
                    {tool.name}
                  </SheetTitle>
                  <SheetDescription className="text-slate-500 flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="border-slate-200 text-slate-500 font-mono text-xs"
                    >
                      v{tool.version}
                    </Badge>
                    <span className="text-slate-300">|</span>
                    <span>{tool.category}</span>
                  </SheetDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-2 mt-4">
              {enabled && !deprecated && (
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
                  <Zap className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
              {!enabled && (
                <Badge className="bg-slate-100 text-slate-500 border-slate-200">
                  Disabled
                </Badge>
              )}
              {deprecated && (
                <Badge className="bg-amber-50 text-amber-600 border-amber-200">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Deprecated
                </Badge>
              )}
            </div>
          </SheetHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-slate-50 border border-slate-200 p-1 rounded-lg w-full">
              <TabsTrigger
                value="general"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <Info className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <Shield className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="schema"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <Code className="w-4 h-4 mr-2" />
                Schema
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="general" className="space-y-6 mt-0">
                <motion.div
                  key="general"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Description</Label>
                    <p className="text-sm text-slate-600 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      {tool.description}
                    </p>
                  </div>

                  {/* Enable/Disable */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        enabled ? 'bg-emerald-50' : 'bg-slate-100'
                      )}>
                        <Zap className={cn(
                          'w-5 h-5',
                          enabled ? 'text-emerald-500' : 'text-slate-400'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Tool Status</p>
                        <p className="text-sm text-slate-500">
                          {enabled ? 'Tool is active and available' : 'Tool is disabled'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={setEnabled}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>

                  {/* Deprecation */}
                  <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          deprecated ? 'bg-amber-50' : 'bg-slate-100'
                        )}>
                          <AlertTriangle className={cn(
                            'w-5 h-5',
                            deprecated ? 'text-amber-500' : 'text-slate-400'
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">Deprecation Status</p>
                          <p className="text-sm text-slate-500">
                            Mark tool as deprecated for removal
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={deprecated}
                        onCheckedChange={setDeprecated}
                        className="data-[state=checked]:bg-amber-500"
                      />
                    </div>

                    {deprecated && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-4 border-t border-slate-200"
                      >
                        <Label className="text-sm font-medium text-slate-700">
                          Deprecation Message
                        </Label>
                        <Textarea
                          value={deprecationMessage}
                          onChange={(e) => setDeprecationMessage(e.target.value)}
                          placeholder="Explain why this tool is deprecated and suggest alternatives..."
                          className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {tool.tags.length > 0 ? (
                        tool.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="border-slate-200 text-slate-600 bg-slate-50"
                          >
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No tags assigned</p>
                      )}
                    </div>
                  </div>

                  {/* Timeout */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Execution Timeout
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={tool.timeoutMs || 'No limit'}
                        disabled
                        className="bg-slate-50 border-slate-200 text-slate-700 font-mono"
                      />
                      <span className="text-sm text-slate-500">milliseconds</span>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="security" className="space-y-6 mt-0">
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  {/* Confirmation Type */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Confirmation Type
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {confirmationTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setConfirmationType(type.value)}
                          className={cn(
                            'p-3 rounded-xl border text-left transition-all',
                            confirmationType === type.value
                              ? 'bg-blue-50 border-blue-200 text-blue-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                          )}
                        >
                          <p className="font-medium">{type.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Required Permissions */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Required Permissions
                    </Label>
                    <div className="space-y-2">
                      {permissionLevels.map((level) => (
                        <div
                          key={level.value}
                          onClick={() => togglePermission(level.value)}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                            requiredPermissions.includes(level.value)
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          )}
                        >
                          <div>
                            <p className={cn(
                              'font-medium',
                              requiredPermissions.includes(level.value) ? 'text-blue-600' : 'text-slate-700'
                            )}>
                              {level.label}
                            </p>
                            <p className="text-xs text-slate-500">{level.description}</p>
                          </div>
                          <div className={cn(
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                            requiredPermissions.includes(level.value)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-slate-300'
                          )}>
                            {requiredPermissions.includes(level.value) && (
                              <motion.svg
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </motion.svg>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="schema" className="space-y-6 mt-0">
                <motion.div
                  key="schema"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  {/* Input Schema Placeholder */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Input Schema</Label>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm text-slate-600">
                      <pre className="overflow-x-auto">
                        {`{
  "type": "object",
  "properties": {
    // Schema loaded from database
  }
}`}
                      </pre>
                    </div>
                  </div>

                  {/* Output Schema Placeholder */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Output Schema</Label>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm text-slate-600">
                      <pre className="overflow-x-auto">
                        {`{
  "type": "object",
  "properties": {
    // Schema loaded from database
  }
}`}
                      </pre>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
