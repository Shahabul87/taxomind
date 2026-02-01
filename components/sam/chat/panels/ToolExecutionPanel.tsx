"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Wrench,
  Calculator,
  Search,
  BookOpen,
  Globe,
  FileText,
  Calendar,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolSummary, ToolExecutionResult, ToolStatus, PageContext } from '../types';

// =============================================================================
// TOOL INPUT TEMPLATES
// =============================================================================

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'time';
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
  autoPopulate?: 'userId' | 'courseId' | 'chapterId' | 'entityId';
}

const TOOL_TEMPLATES: Record<string, FieldDef[]> = {
  'content-generate': [
    { key: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g. JavaScript closures' },
    { key: 'type', label: 'Type', type: 'select', options: ['explanation', 'example', 'quiz', 'summary', 'hint', 'feedback'], defaultValue: 'explanation' },
    { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['beginner', 'intermediate', 'advanced'], defaultValue: 'intermediate' },
    { key: 'format', label: 'Format', type: 'select', options: ['markdown', 'html', 'plain'], defaultValue: 'markdown' },
  ],
  'content-recommend': [
    { key: 'currentTopic', label: 'Current Topic', type: 'text', placeholder: 'e.g. React hooks' },
    { key: 'maxRecommendations', label: 'Max Results', type: 'number', defaultValue: '5' },
  ],
  'content-summarize': [
    { key: 'topic', label: 'Topic / Title', type: 'text', placeholder: 'e.g. React hooks overview' },
    { key: 'content', label: 'Text to Summarize', type: 'textarea', placeholder: 'Paste text here...' },
    { key: 'maxLength', label: 'Max Length', type: 'number', defaultValue: '200' },
  ],
  'schedule-session': [
    { key: 'duration', label: 'Duration (min)', type: 'number', defaultValue: '45' },
    { key: 'topics', label: 'Topics (comma-separated)', type: 'text', placeholder: 'React, TypeScript' },
    { key: 'breakInterval', label: 'Break Every (min)', type: 'number', defaultValue: '45' },
    { key: 'breakDuration', label: 'Break Length (min)', type: 'number', defaultValue: '10' },
  ],
  'schedule-reminder': [
    { key: 'type', label: 'Type', type: 'select', options: ['study', 'assessment', 'deadline', 'check_in', 'custom'], defaultValue: 'study' },
    { key: 'message', label: 'Reminder Message', type: 'text', placeholder: 'Review chapter 3' },
    { key: 'scheduledFor', label: 'When', type: 'select', options: ['in 30 minutes', 'in 1 hour', 'in 2 hours', 'tomorrow morning', 'tomorrow evening'], defaultValue: 'in 1 hour' },
  ],
  'schedule-optimize': [
    { key: 'goalTitle', label: 'Goal', type: 'text', placeholder: 'e.g. Complete React module' },
    { key: 'estimatedMinutes', label: 'Estimated Time (min)', type: 'number', defaultValue: '120' },
    { key: 'priority', label: 'Priority', type: 'select', options: ['1 - Low', '2 - Medium', '3 - High', '4 - Very High', '5 - Critical'], defaultValue: '3 - High' },
    { key: 'dailyStudyLimit', label: 'Daily Study Limit (min)', type: 'number', defaultValue: '120' },
  ],
  'schedule-get': [
    { key: 'range', label: 'Time Range', type: 'select', options: ['today', 'this week', 'next 7 days', 'this month'], defaultValue: 'next 7 days' },
  ],
  'notification-send': [
    { key: 'type', label: 'Type', type: 'select', options: ['reminder', 'progress_update', 'feedback', 'recommendation', 'alert'], defaultValue: 'reminder' },
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Notification title' },
    { key: 'body', label: 'Message', type: 'textarea', placeholder: 'Notification body...' },
    { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'normal', 'high', 'urgent'], defaultValue: 'normal' },
  ],
  'notification-get': [
    { key: 'status', label: 'Filter', type: 'select', options: ['unread', 'read', 'sent', 'all'], defaultValue: 'unread' },
    { key: 'limit', label: 'Limit', type: 'number', defaultValue: '10' },
  ],
  'notification-mark-read': [
    { key: 'notificationId', label: 'Notification ID (or leave empty)', type: 'text', placeholder: 'Specific ID or leave empty' },
    { key: 'markAll', label: 'Mark All as Read', type: 'select', options: ['false', 'true'], defaultValue: 'false' },
  ],
  'notification-progress-report': [
    { key: 'period', label: 'Period', type: 'select', options: ['daily', 'weekly', 'monthly'], defaultValue: 'weekly' },
    { key: 'includeComparison', label: 'Include Comparison', type: 'select', options: ['false', 'true'], defaultValue: 'true' },
    { key: 'includeGoals', label: 'Include Goals', type: 'select', options: ['false', 'true'], defaultValue: 'true' },
    { key: 'includeRecommendations', label: 'Include Recommendations', type: 'select', options: ['false', 'true'], defaultValue: 'true' },
  ],
  'notification-achievement': [
    { key: 'achievementName', label: 'Achievement Name', type: 'text', placeholder: 'e.g. First Study Session' },
    { key: 'achievementDescription', label: 'Description', type: 'text', placeholder: 'Completed your first study session' },
    { key: 'rarity', label: 'Rarity', type: 'select', options: ['common', 'uncommon', 'rare', 'epic', 'legendary'], defaultValue: 'common' },
  ],
  'external-web-search': [
    { key: 'query', label: 'Search Query', type: 'text', placeholder: 'e.g. React best practices 2025' },
    { key: 'maxResults', label: 'Max Results', type: 'number', defaultValue: '5' },
  ],
  'external-dictionary': [
    { key: 'word', label: 'Word', type: 'text', placeholder: 'e.g. polymorphism' },
  ],
  'external-wikipedia': [
    { key: 'query', label: 'Search Term', type: 'text', placeholder: 'e.g. Machine Learning' },
  ],
  'external-calculator': [
    { key: 'expression', label: 'Expression', type: 'text', placeholder: 'e.g. 2 + 2, sqrt(144), sin(pi/2)' },
  ],
  'external-url-fetch': [
    { key: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com' },
  ],
};

// =============================================================================
// TOOL INPUT TRANSFORMS (flat form → nested backend schema)
// =============================================================================

const TOOL_TRANSFORMS: Record<string, (values: Record<string, string>) => Record<string, unknown>> = {
  'content-recommend': (v) => ({
    currentContext: { currentTopic: v.currentTopic },
    maxRecommendations: Number(v.maxRecommendations) || 5,
  }),
  'schedule-session': (v) => ({
    duration: Number(v.duration) || 45,
    topics: v.topics ? v.topics.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    breakInterval: Number(v.breakInterval) || 45,
    breakDuration: Number(v.breakDuration) || 10,
  }),
  'schedule-reminder': (v) => {
    const delayMap: Record<string, number> = {
      'in 30 minutes': 30,
      'in 1 hour': 60,
      'in 2 hours': 120,
      'tomorrow morning': 720,
      'tomorrow evening': 1080,
    };
    const minutes = delayMap[v.scheduledFor] ?? 60;
    return {
      type: v.type || 'study',
      message: v.message,
      scheduledFor: new Date(Date.now() + minutes * 60000).toISOString(),
    };
  },
  'schedule-optimize': (v) => ({
    weekStart: new Date().toISOString(),
    goals: [{
      id: crypto.randomUUID(),
      title: v.goalTitle || 'Study Goal',
      estimatedMinutes: Number(v.estimatedMinutes) || 120,
      priority: parseInt(v.priority, 10) || 3,
    }],
    preferences: {
      dailyStudyLimit: Number(v.dailyStudyLimit) || 120,
      preferredDays: [1, 2, 3, 4, 5],
      preferredHours: { start: 9, end: 17 },
      breakFrequency: 45,
    },
  }),
  'schedule-get': (v) => {
    const now = new Date();
    const rangeMap: Record<string, number> = {
      'today': 1,
      'this week': 7,
      'next 7 days': 7,
      'this month': 30,
    };
    const days = rangeMap[v.range] ?? 7;
    return {
      from: now.toISOString(),
      to: new Date(now.getTime() + days * 86400000).toISOString(),
    };
  },
  'notification-send': (v) => ({
    type: v.type || 'reminder',
    title: v.title,
    body: v.body,
    priority: v.priority || 'normal',
    channels: ['in_app'],
  }),
  'notification-get': (v) => ({
    status: v.status === 'all' ? undefined : v.status,
    limit: Number(v.limit) || 10,
  }),
  'notification-mark-read': (v) => ({
    notificationId: v.notificationId || undefined,
    markAll: v.markAll === 'true',
  }),
  'notification-progress-report': (v) => ({
    period: v.period || 'weekly',
    includeComparison: v.includeComparison === 'true',
    includeGoals: v.includeGoals === 'true',
    includeRecommendations: v.includeRecommendations === 'true',
  }),
  'notification-achievement': (v) => ({
    achievement: {
      id: crypto.randomUUID(),
      name: v.achievementName || 'Achievement',
      description: v.achievementDescription || 'An achievement',
      rarity: v.rarity || 'common',
    },
  }),
};

// =============================================================================
// CATEGORY ICONS
// =============================================================================

function getToolIcon(toolId: string): React.ReactNode {
  if (toolId.startsWith('content-')) return <FileText className="h-4 w-4" />;
  if (toolId.startsWith('schedule-')) return <Calendar className="h-4 w-4" />;
  if (toolId.startsWith('notification-')) return <Bell className="h-4 w-4" />;
  if (toolId === 'external-calculator') return <Calculator className="h-4 w-4" />;
  if (toolId === 'external-web-search') return <Search className="h-4 w-4" />;
  if (toolId === 'external-dictionary' || toolId === 'external-wikipedia') return <BookOpen className="h-4 w-4" />;
  if (toolId === 'external-url-fetch') return <Globe className="h-4 w-4" />;
  return <Wrench className="h-4 w-4" />;
}

// =============================================================================
// RISK BADGE
// =============================================================================

function getRiskColor(category: string): string {
  switch (category) {
    case 'external': return 'var(--sam-error, #ef4444)';
    case 'notification': return 'var(--sam-warning, #f59e0b)';
    default: return 'var(--sam-accent)';
  }
}

// =============================================================================
// PROPS
// =============================================================================

interface ToolExecutionPanelProps {
  tool: ToolSummary;
  toolInput: string;
  toolStatus: ToolStatus;
  toolResult: ToolExecutionResult | null;
  toolError: string | null;
  onInputChange: (input: string) => void;
  onExecute: () => void;
  onClose: () => void;
  pageContext: PageContext;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ToolExecutionPanel({
  tool,
  toolInput,
  toolStatus,
  toolResult,
  toolError,
  onInputChange,
  onExecute,
  onClose,
  pageContext,
}: ToolExecutionPanelProps) {
  const template = TOOL_TEMPLATES[tool.id];
  const hasTemplate = template !== undefined;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Smart form state for template-based tools
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Initialize form values with defaults and auto-populated context
  useEffect(() => {
    if (!hasTemplate || !template) return;
    const initial: Record<string, string> = {};
    for (const field of template) {
      if (field.defaultValue) {
        initial[field.key] = field.defaultValue;
      }
      if (field.autoPopulate === 'entityId' && pageContext.entityId) {
        initial[field.key] = pageContext.entityId;
      }
      if (field.autoPopulate === 'courseId' && pageContext.parentEntityId) {
        initial[field.key] = pageContext.parentEntityId;
      }
    }
    setFormValues(initial);
  }, [tool.id, hasTemplate, template, pageContext.entityId, pageContext.parentEntityId]);

  // Sync form values → JSON input (use TOOL_TRANSFORMS when available)
  useEffect(() => {
    if (!hasTemplate) return;

    const transform = TOOL_TRANSFORMS[tool.id];
    if (transform) {
      const payload = transform(formValues);
      onInputChange(JSON.stringify(payload, null, 2));
      return;
    }

    // Fallback: generic flat conversion
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(formValues)) {
      if (value === '') continue;
      const fieldDef = template?.find((f) => f.key === key);
      if (fieldDef?.type === 'number') {
        const num = Number(value);
        if (!isNaN(num)) {
          payload[key] = num;
          continue;
        }
      }
      if (value === 'true') { payload[key] = true; continue; }
      if (value === 'false') { payload[key] = false; continue; }
      payload[key] = value;
    }
    onInputChange(JSON.stringify(payload, null, 2));
  }, [formValues, hasTemplate, template, onInputChange, tool.id]);

  const updateField = useCallback((key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Scroll to result when it appears
  useEffect(() => {
    if (toolResult && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [toolResult]);

  const isRunning = toolStatus === 'running';
  const isCompleted = toolStatus === 'completed';
  const isFailed = toolStatus === 'failed';
  const isAwaiting = toolStatus === 'awaiting_confirmation';

  // Format result for display
  const formattedResult = useMemo(() => {
    if (!toolResult?.result) return null;
    const result = toolResult.result;
    if (typeof result === 'string') return result;
    if (typeof result === 'number' || typeof result === 'boolean') return String(result);
    try {
      return JSON.stringify(result, null, 2);
    } catch {
      return String(result);
    }
  }, [toolResult]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid var(--sam-border)' }}
      >
        <button
          onClick={onClose}
          className="p-1 rounded-md transition-colors hover:bg-[var(--sam-surface-hover)]"
          aria-label="Back to chat"
        >
          <ArrowLeft className="h-4 w-4" style={{ color: 'var(--sam-text-secondary)' }} />
        </button>

        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--sam-accent)', opacity: 0.15 }}
        >
          <span style={{ color: 'var(--sam-accent)' }}>
            {getToolIcon(tool.id)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--sam-text)' }}>
            {tool.name}
          </p>
        </div>

        <button
          onClick={onExecute}
          disabled={isRunning || !tool.enabled}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
            isRunning
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:brightness-110 active:scale-[0.97]'
          )}
          style={{
            background: isRunning ? 'var(--sam-surface-hover)' : 'var(--sam-accent)',
            color: isRunning ? 'var(--sam-text-muted)' : '#fff',
          }}
        >
          {isRunning ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          {isRunning ? 'Running...' : 'Execute'}
        </button>
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto sam-scrollbar px-3 py-3 space-y-3">
        {/* Tool info */}
        <div className="space-y-1.5">
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--sam-text-secondary)' }}>
            {tool.description}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--sam-border)', color: 'var(--sam-text-secondary)' }}
            >
              {tool.category}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{
                background: getRiskColor(tool.category) + '18',
                color: getRiskColor(tool.category),
              }}
            >
              {tool.confirmationType === 'none' ? 'auto' : tool.confirmationType}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--sam-border)', color: 'var(--sam-text-muted)' }}
            >
              v{tool.version}
            </span>
          </div>
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px solid var(--sam-border)' }} />

        {/* Input section */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--sam-text-muted)' }}>
            Parameters
          </p>

          {hasTemplate && template && template.length > 0 ? (
            <div className="space-y-2.5">
              {template.map((field) => (
                <TemplateField
                  key={field.key}
                  field={field}
                  value={formValues[field.key] ?? ''}
                  onChange={(val) => updateField(field.key, val)}
                  disabled={isRunning}
                />
              ))}
            </div>
          ) : hasTemplate && template && template.length === 0 ? (
            <p className="text-[11px] italic py-2" style={{ color: 'var(--sam-text-muted)' }}>
              No parameters required. Click Execute to run.
            </p>
          ) : (
            <textarea
              value={toolInput}
              onChange={(e) => onInputChange(e.target.value)}
              disabled={isRunning}
              rows={5}
              spellCheck={false}
              className={cn(
                'w-full rounded-lg px-3 py-2 text-[11px] font-mono resize-none',
                'outline-none transition-colors',
                isRunning && 'opacity-60'
              )}
              style={{
                background: 'var(--sam-surface)',
                border: '1px solid var(--sam-border)',
                color: 'var(--sam-text)',
              }}
              placeholder='{ "key": "value" }'
            />
          )}
        </div>

        {/* Status / Error / Result */}
        {toolStatus !== 'idle' && (
          <>
            <div style={{ borderTop: '1px solid var(--sam-border)' }} />
            <div className="space-y-2">
              {/* Status indicator */}
              <div className="flex items-center gap-2">
                {isRunning && (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: 'var(--sam-accent)' }} />
                    <span className="text-[11px] font-medium" style={{ color: 'var(--sam-accent)' }}>
                      Executing...
                    </span>
                  </>
                )}
                {isAwaiting && (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: 'var(--sam-warning, #f59e0b)' }} />
                    <span className="text-[11px] font-medium" style={{ color: 'var(--sam-warning, #f59e0b)' }}>
                      Awaiting confirmation...
                    </span>
                  </>
                )}
                {isCompleted && (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" style={{ color: 'var(--sam-success, #22c55e)' }} />
                    <span className="text-[11px] font-medium" style={{ color: 'var(--sam-success, #22c55e)' }}>
                      Completed
                    </span>
                  </>
                )}
                {isFailed && (
                  <>
                    <XCircle className="h-3.5 w-3.5" style={{ color: 'var(--sam-error, #ef4444)' }} />
                    <span className="text-[11px] font-medium" style={{ color: 'var(--sam-error, #ef4444)' }}>
                      Failed
                    </span>
                  </>
                )}
              </div>

              {/* Error message */}
              {toolError && (
                <div
                  className="rounded-lg px-3 py-2 text-[11px]"
                  style={{
                    background: 'var(--sam-error, #ef4444)' + '12',
                    color: 'var(--sam-error, #ef4444)',
                    border: '1px solid var(--sam-error, #ef4444)' + '30',
                  }}
                >
                  {toolError}
                </div>
              )}

              {/* Result */}
              {formattedResult && (
                <div
                  className="rounded-lg px-3 py-2.5 text-[11px] leading-relaxed whitespace-pre-wrap break-words font-mono"
                  style={{
                    background: 'var(--sam-surface)',
                    border: '1px solid var(--sam-border)',
                    color: 'var(--sam-text)',
                    maxHeight: 240,
                    overflowY: 'auto',
                  }}
                >
                  {formattedResult}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TEMPLATE FIELD COMPONENT
// =============================================================================

interface TemplateFieldProps {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function TemplateField({ field, value, onChange, disabled }: TemplateFieldProps) {
  const inputStyle: React.CSSProperties = {
    background: 'var(--sam-surface)',
    border: '1px solid var(--sam-border)',
    color: 'var(--sam-text)',
  };

  const baseClasses = cn(
    'w-full rounded-lg px-2.5 py-1.5 text-[11px] outline-none transition-colors',
    'focus:ring-1 focus:ring-[var(--sam-accent)]',
    disabled && 'opacity-60'
  );

  return (
    <div className="space-y-1">
      <label
        className="text-[10px] font-medium"
        style={{ color: 'var(--sam-text-secondary)' }}
      >
        {field.label}
      </label>

      {field.type === 'select' && field.options ? (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn(baseClasses, 'appearance-none pr-7')}
            style={inputStyle}
          >
            <option value="">Select...</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none"
            style={{ color: 'var(--sam-text-muted)' }}
          />
        </div>
      ) : field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder={field.placeholder}
          className={cn(baseClasses, 'resize-none')}
          style={inputStyle}
        />
      ) : (
        <input
          type={field.type === 'number' ? 'number' : field.type === 'time' ? 'time' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={field.placeholder}
          className={baseClasses}
          style={inputStyle}
        />
      )}
    </div>
  );
}
