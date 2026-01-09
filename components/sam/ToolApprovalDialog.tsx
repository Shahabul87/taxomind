'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lock,
  Eye,
  FileEdit,
  Database,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high';
export type ToolCategory =
  | 'content'
  | 'assessment'
  | 'memory'
  | 'communication'
  | 'analysis'
  | 'course'
  | 'external'
  | 'admin';

export interface ToolApprovalRequest {
  id: string;
  toolId: string;
  toolName: string;
  description: string;
  category: ToolCategory;
  riskLevel: RiskLevel;
  reason: string;
  parameters?: Record<string, unknown>;
  estimatedDuration?: number;
  permissions: {
    reads?: string[];
    writes?: string[];
    external?: string[];
  };
  context?: {
    conversationId?: string;
    previousToolUse?: string[];
    userPreferences?: Record<string, unknown>;
  };
}

export interface ToolApprovalDialogProps {
  request: ToolApprovalRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (requestId: string, rememberChoice: boolean) => void;
  onDeny: (requestId: string, reason?: string) => void;
  isProcessing?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getRiskConfig = (level: RiskLevel) => {
  switch (level) {
    case 'low':
      return {
        icon: ShieldCheck,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        label: 'Low Risk',
        description: 'This action is safe and reversible',
      };
    case 'medium':
      return {
        icon: Shield,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        label: 'Medium Risk',
        description: 'This action may modify data',
      };
    case 'high':
      return {
        icon: ShieldAlert,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        label: 'High Risk',
        description: 'This action requires careful consideration',
      };
  }
};

const getCategoryConfig = (category: ToolCategory) => {
  const configs: Record<
    ToolCategory,
    { icon: React.ElementType; color: string; bg: string; label: string }
  > = {
    content: {
      icon: FileEdit,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      label: 'Content Generation',
    },
    assessment: {
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      label: 'Assessment',
    },
    memory: {
      icon: Database,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      label: 'Memory & Context',
    },
    communication: {
      icon: Send,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      label: 'Communication',
    },
    analysis: {
      icon: Eye,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      label: 'Analysis',
    },
    course: {
      icon: Sparkles,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      label: 'Course Management',
    },
    external: {
      icon: Lock,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      label: 'External Service',
    },
    admin: {
      icon: Shield,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      label: 'Administration',
    },
  };
  return configs[category] || configs.content;
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}m`;
};

// ============================================================================
// PERMISSION ITEM COMPONENT
// ============================================================================

interface PermissionItemProps {
  type: 'read' | 'write' | 'external';
  items: string[];
}

function PermissionItem({ type, items }: PermissionItemProps) {
  if (!items || items.length === 0) return null;

  const config = {
    read: {
      icon: Eye,
      label: 'Will Read',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    write: {
      icon: FileEdit,
      label: 'Will Modify',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    external: {
      icon: Lock,
      label: 'External Access',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  };

  const { icon: Icon, label, color, bg } = config[type];

  return (
    <div className={cn('rounded-lg p-3', bg)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4', color)} />
        <span className={cn('text-sm font-medium', color)}>{label}</span>
      </div>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-sm text-slate-600 pl-6 relative">
            <span className="absolute left-2 top-2 w-1 h-1 rounded-full bg-slate-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// PARAMETERS PREVIEW COMPONENT
// ============================================================================

interface ParametersPreviewProps {
  parameters: Record<string, unknown>;
}

function ParametersPreview({ parameters }: ParametersPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  if (!parameters || Object.keys(parameters).length === 0) return null;

  const entries = Object.entries(parameters);
  const displayEntries = expanded ? entries : entries.slice(0, 3);

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700">
          Parameters ({entries.length})
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {(expanded || entries.length <= 3) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2 bg-white">
              {displayEntries.map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-xs font-mono text-slate-500 min-w-[100px]">
                    {key}:
                  </span>
                  <span className="text-xs font-mono text-slate-700 break-all">
                    {typeof value === 'string'
                      ? value.length > 100
                        ? `${value.slice(0, 100)}...`
                        : value
                      : JSON.stringify(value, null, 2).slice(0, 100)}
                  </span>
                </div>
              ))}
              {!expanded && entries.length > 3 && (
                <p className="text-xs text-slate-500 italic">
                  +{entries.length - 3} more parameters
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ToolApprovalDialog({
  request,
  open,
  onOpenChange,
  onApprove,
  onDeny,
  isProcessing = false,
}: ToolApprovalDialogProps) {
  const [rememberChoice, setRememberChoice] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Reset state when dialog opens with new request
  useEffect(() => {
    if (open && request) {
      setRememberChoice(false);
      setShowDetails(false);
    }
  }, [open, request]);

  const handleApprove = useCallback(() => {
    if (request) {
      onApprove(request.id, rememberChoice);
    }
  }, [request, rememberChoice, onApprove]);

  const handleDeny = useCallback(() => {
    if (request) {
      onDeny(request.id);
    }
  }, [request, onDeny]);

  if (!request) return null;

  const riskConfig = getRiskConfig(request.riskLevel);
  const categoryConfig = getCategoryConfig(request.category);
  const RiskIcon = riskConfig.icon;
  const CategoryIcon = categoryConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-white border-slate-200">
        {/* Header with gradient */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
          <div className="absolute inset-0 opacity-50">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)`,
              }}
            />
          </div>

          <DialogHeader className="relative">
            <div className="flex items-start gap-4">
              {/* Tool Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className={cn(
                  'p-3 rounded-xl border shadow-sm',
                  categoryConfig.bg,
                  'border-white/50'
                )}
              >
                <CategoryIcon className={cn('w-6 h-6', categoryConfig.color)} />
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-medium',
                      categoryConfig.color,
                      'border-current/30'
                    )}
                  >
                    {categoryConfig.label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-medium',
                      riskConfig.color,
                      'border-current/30'
                    )}
                  >
                    <RiskIcon className="w-3 h-3 mr-1" />
                    {riskConfig.label}
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-semibold text-slate-800">
                  {request.toolName}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-1">
                  SAM wants to use this tool
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[400px]">
          <div className="px-6 py-4 space-y-4">
            {/* Reason */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium text-slate-700">
                  Why SAM wants to use this tool
                </span>
              </div>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">
                {request.reason}
              </p>
            </div>

            {/* Tool Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-700">
                  What this tool does
                </span>
              </div>
              <p className="text-sm text-slate-600">{request.description}</p>
            </div>

            {/* Risk Notice */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border',
                riskConfig.bg,
                riskConfig.border
              )}
            >
              <RiskIcon className={cn('w-5 h-5 mt-0.5', riskConfig.color)} />
              <div>
                <p className={cn('text-sm font-medium', riskConfig.color)}>
                  {riskConfig.label}
                </p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {riskConfig.description}
                </p>
              </div>
            </motion.div>

            {/* Permissions */}
            {(request.permissions.reads?.length ||
              request.permissions.writes?.length ||
              request.permissions.external?.length) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">
                    Permissions Required
                  </span>
                </div>
                <div className="space-y-2">
                  <PermissionItem type="read" items={request.permissions.reads || []} />
                  <PermissionItem type="write" items={request.permissions.writes || []} />
                  <PermissionItem
                    type="external"
                    items={request.permissions.external || []}
                  />
                </div>
              </div>
            )}

            {/* Parameters Preview */}
            {request.parameters && Object.keys(request.parameters).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">
                    Execution Parameters
                  </span>
                </div>
                <ParametersPreview parameters={request.parameters} />
              </div>
            )}

            {/* Estimated Duration */}
            {request.estimatedDuration && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>
                  Estimated time: {formatDuration(request.estimatedDuration)}
                </span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="w-full space-y-4">
            {/* Remember Choice */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-choice"
                checked={rememberChoice}
                onCheckedChange={(checked) => setRememberChoice(checked === true)}
              />
              <label
                htmlFor="remember-choice"
                className="text-sm text-slate-600 cursor-pointer select-none"
              >
                Always allow this tool (you can change this in settings)
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleDeny}
                disabled={isProcessing}
                className="border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Deny
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className={cn(
                  'text-white shadow-sm',
                  request.riskLevel === 'high'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 mr-2"
                    >
                      <Cpu className="w-4 h-4" />
                    </motion.div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// HOOK FOR MANAGING TOOL APPROVALS
// ============================================================================

export interface UseToolApprovalOptions {
  onApproved?: (requestId: string, toolId: string) => void;
  onDenied?: (requestId: string, toolId: string) => void;
  autoApproveTools?: string[];
}

export function useToolApproval(options: UseToolApprovalOptions = {}) {
  const [pendingRequest, setPendingRequest] = useState<ToolApprovalRequest | null>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoApprovedTools, setAutoApprovedTools] = useState<Set<string>>(
    new Set(options.autoApproveTools || [])
  );

  const requestApproval = useCallback(
    (request: ToolApprovalRequest): Promise<boolean> => {
      return new Promise((resolve) => {
        // Check if tool is auto-approved
        if (autoApprovedTools.has(request.toolId)) {
          options.onApproved?.(request.id, request.toolId);
          resolve(true);
          return;
        }

        // Store resolve function for later
        const handleApprove = (requestId: string, remember: boolean) => {
          setIsProcessing(true);
          if (remember) {
            setAutoApprovedTools((prev) => new Set([...prev, request.toolId]));
          }
          setTimeout(() => {
            setIsProcessing(false);
            setIsOpen(false);
            setPendingRequest(null);
            options.onApproved?.(requestId, request.toolId);
            resolve(true);
          }, 500);
        };

        const handleDeny = (requestId: string) => {
          setIsOpen(false);
          setPendingRequest(null);
          options.onDenied?.(requestId, request.toolId);
          resolve(false);
        };

        // Store handlers in request for the dialog
        setPendingRequest({
          ...request,
          context: {
            ...request.context,
            _handlers: { approve: handleApprove, deny: handleDeny },
          },
        } as ToolApprovalRequest & {
          context: { _handlers: { approve: typeof handleApprove; deny: typeof handleDeny } };
        });
        setIsOpen(true);
      });
    },
    [autoApprovedTools, options]
  );

  const handleApprove = useCallback(
    (requestId: string, remember: boolean) => {
      const handlers = (
        pendingRequest as ToolApprovalRequest & {
          context?: { _handlers?: { approve: (id: string, r: boolean) => void } };
        }
      )?.context?._handlers;
      handlers?.approve?.(requestId, remember);
    },
    [pendingRequest]
  );

  const handleDeny = useCallback(
    (requestId: string) => {
      const handlers = (
        pendingRequest as ToolApprovalRequest & {
          context?: { _handlers?: { deny: (id: string) => void } };
        }
      )?.context?._handlers;
      handlers?.deny?.(requestId);
    },
    [pendingRequest]
  );

  const addAutoApprovedTool = useCallback((toolId: string) => {
    setAutoApprovedTools((prev) => new Set([...prev, toolId]));
  }, []);

  const removeAutoApprovedTool = useCallback((toolId: string) => {
    setAutoApprovedTools((prev) => {
      const next = new Set(prev);
      next.delete(toolId);
      return next;
    });
  }, []);

  return {
    pendingRequest,
    isOpen,
    isProcessing,
    requestApproval,
    handleApprove,
    handleDeny,
    setIsOpen,
    autoApprovedTools: Array.from(autoApprovedTools),
    addAutoApprovedTool,
    removeAutoApprovedTool,
  };
}

export default ToolApprovalDialog;
