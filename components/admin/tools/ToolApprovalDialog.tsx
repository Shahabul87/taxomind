'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Cpu,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolName: string;
  toolDescription: string;
  confirmationType: 'implicit' | 'explicit' | 'strict';
  inputPreview?: Record<string, unknown>;
  estimatedDuration?: number;
  onApprove: (reason?: string) => Promise<void>;
  onDeny: (reason?: string) => Promise<void>;
}

export function ToolApprovalDialog({
  open,
  onOpenChange,
  toolName,
  toolDescription,
  confirmationType,
  inputPreview,
  estimatedDuration,
  onApprove,
  onDeny,
}: ToolApprovalDialogProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isDenying, setIsDenying] = useState(false);
  const [reason, setReason] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(confirmationType === 'strict' ? reason : undefined);
      onOpenChange(false);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeny = async () => {
    setIsDenying(true);
    try {
      await onDeny(reason || undefined);
      onOpenChange(false);
    } finally {
      setIsDenying(false);
    }
  };

  const isStrict = confirmationType === 'strict';
  const canApprove = !isStrict || reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-950 border-slate-800 p-0 overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-600/10 to-red-600/10" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)`,
              backgroundSize: '16px 16px',
            }}
          />
          <DialogHeader className="relative p-6 pb-4">
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30"
              >
                <Shield className="w-6 h-6 text-amber-400" />
              </motion.div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-slate-100">
                  Tool Approval Required
                </DialogTitle>
                <DialogDescription className="text-slate-400 mt-1">
                  SAM wants to use a tool that requires your permission
                </DialogDescription>
              </div>
            </div>

            {/* Confirmation Level Badge */}
            <div className="mt-4">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  confirmationType === 'strict'
                    ? 'border-red-500/30 text-red-400 bg-red-500/10'
                    : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                )}
              >
                <Lock className="w-3 h-3 mr-1" />
                {confirmationType === 'strict' ? 'Strict Approval' : 'Explicit Approval'}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 pt-2 space-y-4">
          {/* Tool Info */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">{toolName}</h3>
                <p className="text-sm text-slate-400">{toolDescription}</p>
              </div>
            </div>

            {estimatedDuration && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>Estimated duration: {estimatedDuration}ms</span>
              </div>
            )}
          </div>

          {/* Input Preview */}
          {inputPreview && (
            <div className="space-y-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                {showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                View Input Details
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <pre className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/50 text-xs font-mono text-slate-400 overflow-x-auto max-h-[150px]">
                      {JSON.stringify(inputPreview, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Warning Message */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <p className="font-medium text-amber-400 mb-1">Review Before Approving</p>
              <p className="text-slate-400">
                This tool will execute an action on your behalf. Make sure you understand what
                it will do before approving.
              </p>
            </div>
          </div>

          {/* Reason Input (for strict mode) */}
          {isStrict && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500" />
                Reason for Approval (Required)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you're approving this tool execution..."
                className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 min-h-[80px]"
              />
              {!canApprove && (
                <p className="text-xs text-amber-400">
                  A reason is required for strict approval
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-2 border-t border-slate-800/50 bg-slate-900/30">
          <Button
            variant="outline"
            onClick={handleDeny}
            disabled={isDenying || isApproving}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            {isDenying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Denying...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Deny
              </>
            )}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isApproving || isDenying || !canApprove}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white"
          >
            {isApproving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Demo component for testing
export function ToolApprovalDialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Test Approval Dialog</Button>
      <ToolApprovalDialog
        open={open}
        onOpenChange={setOpen}
        toolName="generate_flashcards"
        toolDescription="Generate study flashcards from course content"
        confirmationType="explicit"
        inputPreview={{
          courseId: 'course_123',
          chapterId: 'chapter_456',
          count: 10,
          difficulty: 'intermediate',
        }}
        estimatedDuration={2500}
        onApprove={async (reason) => {
          console.log('Approved:', reason);
          await new Promise((r) => setTimeout(r, 1000));
        }}
        onDeny={async (reason) => {
          console.log('Denied:', reason);
          await new Promise((r) => setTimeout(r, 500));
        }}
      />
    </>
  );
}
