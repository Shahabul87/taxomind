'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Eye,
  FileEdit,
  Database,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ToolApprovalDialog,
  useToolApproval,
  type ToolApprovalRequest,
  type RiskLevel,
  type ToolCategory,
} from '@/components/sam/ToolApprovalDialog';

// ============================================================================
// SAMPLE TOOL REQUESTS
// ============================================================================

const sampleRequests: Record<string, ToolApprovalRequest> = {
  generateExplanation: {
    id: 'req_001',
    toolId: 'generate_explanation',
    toolName: 'Generate Explanation',
    description:
      "Creates clear, pedagogically-sound explanations of concepts tailored to the student's level and learning style.",
    category: 'content',
    riskLevel: 'low',
    reason:
      'The student asked about quantum entanglement. I want to generate a clear explanation tailored to their intermediate physics background.',
    parameters: {
      concept: 'quantum entanglement',
      targetLevel: 'intermediate',
      style: 'visual_learner',
      includeExamples: true,
    },
    estimatedDuration: 2000,
    permissions: {
      reads: ['Student learning profile', 'Course context'],
    },
  },
  createAssessment: {
    id: 'req_002',
    toolId: 'create_practice_questions',
    toolName: 'Create Practice Questions',
    description:
      "Generates assessment questions at various cognitive levels following Bloom's Taxonomy.",
    category: 'assessment',
    riskLevel: 'low',
    reason:
      'The student has completed the chapter on machine learning basics. I want to create practice questions to test their understanding.',
    parameters: {
      topic: 'Machine Learning Fundamentals',
      questionCount: 5,
      bloomLevels: ['understand', 'apply', 'analyze'],
      format: 'multiple_choice',
    },
    estimatedDuration: 3000,
    permissions: {
      reads: ['Course curriculum', 'Student progress data'],
      writes: ['Practice question bank'],
    },
  },
  sendNotification: {
    id: 'req_003',
    toolId: 'send_notification',
    toolName: 'Send Notification',
    description:
      'Sends push notifications or emails to students for reminders, encouragement, or important updates.',
    category: 'communication',
    riskLevel: 'medium',
    reason:
      "The student hasn't logged in for 3 days. I want to send a gentle reminder about their learning goals and upcoming deadlines.",
    parameters: {
      type: 'push_notification',
      title: 'We miss you! 📚',
      message: 'Your Python course is waiting. Just 15 minutes today?',
      actionUrl: '/courses/python-basics',
    },
    estimatedDuration: 500,
    permissions: {
      reads: ['Student contact preferences'],
      external: ['Push notification service'],
    },
  },
  updateProgress: {
    id: 'req_004',
    toolId: 'update_learning_path',
    toolName: 'Update Learning Path',
    description:
      "Modifies the student's personalized learning path based on performance and goals.",
    category: 'course',
    riskLevel: 'medium',
    reason:
      "Based on the student's recent quiz performance showing strong understanding of basics, I want to accelerate their path and skip remedial content.",
    parameters: {
      action: 'skip_sections',
      sections: ['section_101', 'section_102'],
      reason: 'demonstrated_mastery',
    },
    estimatedDuration: 1000,
    permissions: {
      reads: ['Student assessment history', 'Learning path configuration'],
      writes: ['Learning path', 'Progress tracking'],
    },
  },
  accessExternalApi: {
    id: 'req_005',
    toolId: 'fetch_external_resource',
    toolName: 'Fetch External Resource',
    description:
      'Retrieves supplementary learning materials from external educational APIs and databases.',
    category: 'external',
    riskLevel: 'high',
    reason:
      'The student is struggling with calculus. I want to fetch additional practice problems and video explanations from Khan Academy API.',
    parameters: {
      source: 'khan_academy',
      topic: 'calculus_derivatives',
      resourceTypes: ['video', 'practice_problems'],
      limit: 5,
    },
    estimatedDuration: 5000,
    permissions: {
      reads: ['Student learning history'],
      external: ['Khan Academy API', 'YouTube Educational API'],
    },
  },
  adminAction: {
    id: 'req_006',
    toolId: 'modify_course_settings',
    toolName: 'Modify Course Settings',
    description:
      'Makes administrative changes to course configuration, access controls, or content settings.',
    category: 'admin',
    riskLevel: 'high',
    reason:
      'Multiple students have reported the deadline for Assignment 3 is too tight. I want to extend the deadline by 48 hours.',
    parameters: {
      courseId: 'course_python_101',
      assignmentId: 'assignment_003',
      change: 'extend_deadline',
      newDeadline: '2024-02-15T23:59:59Z',
    },
    estimatedDuration: 1000,
    permissions: {
      reads: ['Course settings', 'Assignment configuration'],
      writes: ['Assignment deadlines', 'Course audit log'],
    },
  },
};

// ============================================================================
// MAIN DEMO COMPONENT
// ============================================================================

export function ToolApprovalDemo() {
  const [selectedRequest, setSelectedRequest] = useState<string>('generateExplanation');
  const [approvalHistory, setApprovalHistory] = useState<
    Array<{ id: string; toolName: string; approved: boolean; timestamp: Date }>
  >([]);

  const {
    pendingRequest,
    isOpen,
    isProcessing,
    requestApproval,
    handleApprove,
    handleDeny,
    setIsOpen,
    autoApprovedTools,
  } = useToolApproval({
    onApproved: (requestId, toolId) => {
      const request = Object.values(sampleRequests).find((r) => r.id === requestId);
      if (request) {
        setApprovalHistory((prev) => [
          { id: requestId, toolName: request.toolName, approved: true, timestamp: new Date() },
          ...prev,
        ]);
      }
    },
    onDenied: (requestId, toolId) => {
      const request = Object.values(sampleRequests).find((r) => r.id === requestId);
      if (request) {
        setApprovalHistory((prev) => [
          { id: requestId, toolName: request.toolName, approved: false, timestamp: new Date() },
          ...prev,
        ]);
      }
    },
  });

  const handleTriggerApproval = () => {
    const request = sampleRequests[selectedRequest];
    if (request) {
      requestApproval(request);
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case 'low':
        return ShieldCheck;
      case 'medium':
        return Shield;
      case 'high':
        return ShieldAlert;
    }
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'low':
        return 'text-emerald-600';
      case 'medium':
        return 'text-amber-600';
      case 'high':
        return 'text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20">
            <Sparkles className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Tool Approval Dialog Preview
            </h3>
            <p className="text-xs text-slate-500">
              Test the user-facing approval experience
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-violet-600 border-violet-200">
          Interactive Demo
        </Badge>
      </div>

      {/* Demo Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool Selection */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-slate-700">
              Select a Tool Request
            </span>
          </div>

          <Select value={selectedRequest} onValueChange={setSelectedRequest}>
            <SelectTrigger className="w-full bg-white border-slate-200">
              <SelectValue placeholder="Choose a tool request" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sampleRequests).map(([key, request]) => {
                const RiskIcon = getRiskIcon(request.riskLevel);
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <RiskIcon
                        className={cn('w-4 h-4', getRiskColor(request.riskLevel))}
                      />
                      <span>{request.toolName}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Selected Tool Preview */}
          {selectedRequest && sampleRequests[selectedRequest] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {sampleRequests[selectedRequest].toolName}
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      getRiskColor(sampleRequests[selectedRequest].riskLevel)
                    )}
                  >
                    {sampleRequests[selectedRequest].riskLevel} risk
                  </Badge>
                  <Badge variant="outline" className="text-xs text-slate-500">
                    {sampleRequests[selectedRequest].category}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {sampleRequests[selectedRequest].reason}
              </p>
            </motion.div>
          )}

          <Button
            onClick={handleTriggerApproval}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            Trigger Approval Dialog
          </Button>
        </div>

        {/* Approval History */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                Approval History
              </span>
            </div>
            {approvalHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setApprovalHistory([])}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Clear
              </Button>
            )}
          </div>

          {approvalHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 rounded-full bg-slate-100 mb-3">
                <Shield className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">No approval history yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Trigger an approval dialog to see results here
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {approvalHistory.map((item, index) => (
                <motion.div
                  key={`${item.id}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    item.approved
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-red-50 border-red-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {item.approved ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {item.toolName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      item.approved
                        ? 'text-emerald-600 border-emerald-300'
                        : 'text-red-600 border-red-300'
                    )}
                  >
                    {item.approved ? 'Approved' : 'Denied'}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Auto-Approved Tools */}
      {autoApprovedTools.length > 0 && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              Auto-Approved Tools
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {autoApprovedTools.map((toolId) => (
              <Badge
                key={toolId}
                variant="outline"
                className="text-emerald-600 border-emerald-300 bg-white"
              >
                {toolId}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tool Approval Dialog */}
      <ToolApprovalDialog
        request={pendingRequest}
        open={isOpen}
        onOpenChange={setIsOpen}
        onApprove={handleApprove}
        onDeny={handleDeny}
        isProcessing={isProcessing}
      />
    </div>
  );
}

export default ToolApprovalDemo;
