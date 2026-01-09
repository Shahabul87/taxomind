# SAM AI Agentic System - Phases H, I, J Completion Plan

**Created**: January 6, 2026
**Status**: Ready for Implementation
**Estimated Duration**: 6 weeks

---

## Executive Summary

This plan completes the remaining 3 phases of the SAM AI Agentic system:
- **Phase H (Orchestration)**: 98% → 100% (~1 week)
- **Phase I (Real-Time)**: 45% → 100% (~3 weeks)
- **Phase J (Observability)**: 40% → 100% (~2 weeks)

**Total Estimated Effort**: 6 weeks

---

## Current State Analysis

### Phase H - Orchestration (98% Complete)

| Component | Status | Lines | Location |
|-----------|--------|-------|----------|
| TutoringLoopController | ✅ Complete | 937 | `packages/agentic/src/orchestration/tutoring-loop-controller.ts` |
| ActiveStepExecutor | ✅ Complete | 657 | `packages/agentic/src/orchestration/active-step-executor.ts` |
| ConfirmationGate | ✅ Complete | 366 | `packages/agentic/src/orchestration/confirmation-gate.ts` |
| PlanContextInjector | ✅ Complete | 502 | `packages/agentic/src/orchestration/plan-context-injector.ts` |

**Gaps**:
- Not wired into unified API route
- Criterion evaluation is placeholder

### Phase I - Real-Time (45% Complete)

| Component | Status | Location |
|-----------|--------|----------|
| WebSocketManager | ✅ Complete | `packages/agentic/src/realtime/websocket-manager.ts` |
| PresenceTracker | ⚠️ In-memory only | `packages/agentic/src/realtime/presence-tracker.ts` |
| PushDispatcher | ⚠️ WebSocket only | `packages/agentic/src/realtime/push-dispatcher.ts` |
| InterventionSurface | ⚠️ Types only | `packages/agentic/src/realtime/intervention-surface.ts` |

**Critical Gaps**:
- No React hooks
- No UI components
- No persistence layer

### Phase J - Observability (40% Complete)

| Component | Status | Lines | Location |
|-----------|--------|-------|----------|
| Type System | ✅ Complete | 641 | `packages/agentic/src/observability/types.ts` |
| ToolTelemetry | ⚠️ In-memory | 430 | `packages/agentic/src/observability/tool-telemetry.ts` |
| MemoryQualityTracker | ⚠️ In-memory | 401 | `packages/agentic/src/observability/memory-quality-tracker.ts` |
| ConfidenceCalibration | ⚠️ In-memory | 506 | `packages/agentic/src/observability/confidence-calibration.ts` |
| MetricsCollector | ⚠️ In-memory | 753 | `packages/agentic/src/observability/metrics-collector.ts` |

**Critical Gaps**:
- No database persistence
- Dashboard uses mock data
- No external integrations

---

## Phase H: Orchestration Completion

### H.1 - Wire Orchestration into Unified API Route

**File**: `app/api/sam/unified/route.ts`

```typescript
// Add orchestration integration
import { TutoringLoopController } from '@sam-ai/agentic';

// In POST handler, after message processing:
const orchestrator = new TutoringLoopController(config);
const result = await orchestrator.execute({
  userId,
  sessionId,
  message,
  context
});
```

**Tasks**:
1. Import TutoringLoopController in unified route
2. Initialize orchestrator with user context
3. Route goal-related messages through orchestrator
4. Handle orchestrator state persistence via session

### H.2 - Implement Real Criterion Evaluation

**File**: `packages/agentic/src/orchestration/active-step-executor.ts`

Current placeholder at line ~200:
```typescript
// TODO: Implement real criterion evaluation
private async evaluateCriterion(criterion: StepCriterion): Promise<boolean> {
  return true; // Placeholder
}
```

**Implementation**:
```typescript
private async evaluateCriterion(criterion: StepCriterion): Promise<boolean> {
  switch (criterion.type) {
    case 'quiz_score':
      return await this.evaluateQuizScore(criterion);
    case 'time_spent':
      return await this.evaluateTimeSpent(criterion);
    case 'content_completed':
      return await this.evaluateContentCompletion(criterion);
    case 'skill_demonstrated':
      return await this.evaluateSkillDemonstration(criterion);
    default:
      return false;
  }
}
```

**Tasks**:
1. Define criterion types in types.ts
2. Implement each evaluation method
3. Connect to learning analytics for data
4. Add unit tests for each criterion type

### H.3 - Add Orchestration Tests

**Directory**: `packages/agentic/src/orchestration/__tests__/`

**Files to Create**:
1. `tutoring-loop-controller.test.ts`
2. `active-step-executor.test.ts`
3. `confirmation-gate.test.ts`
4. Integration test for full tutoring flow

---

## Phase I: Real-Time System Completion

### I.1 - React Hooks for Real-Time

**Files to Create**:

#### `packages/react/src/hooks/useRealtime.ts`
```typescript
export function useRealtime(options: RealtimeOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [presence, setPresence] = useState<PresenceState[]>([]);

  useEffect(() => {
    const manager = new WebSocketManager(options);
    manager.connect();

    manager.on('presence:update', setPresence);
    manager.on('connection:change', setConnectionState);

    return () => manager.disconnect();
  }, [options]);

  return { connectionState, presence, send: manager.send };
}
```

#### `packages/react/src/hooks/usePresence.ts`
```typescript
export function usePresence(userId: string) {
  const { presence } = useRealtime({ userId });

  return {
    isOnline: presence.some(p => p.userId === userId && p.status === 'online'),
    activeUsers: presence.filter(p => p.status === 'online'),
    lastSeen: presence.find(p => p.userId === userId)?.lastSeen
  };
}
```

#### `packages/react/src/hooks/useInterventions.ts`
```typescript
export function useInterventions() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);

  useEffect(() => {
    const unsubscribe = InterventionSurfaceManager.subscribe(setInterventions);
    return unsubscribe;
  }, []);

  return {
    interventions,
    dismiss: (id: string) => InterventionSurfaceManager.dismiss(id),
    acknowledge: (id: string) => InterventionSurfaceManager.acknowledge(id)
  };
}
```

#### `packages/react/src/hooks/usePushNotifications.ts`
```typescript
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  return { permission, requestPermission };
}
```

### I.2 - Presence Tracker Persistence

**File**: `packages/agentic/src/realtime/presence-tracker.ts`

**Prisma Schema Addition**:
```prisma
model UserPresence {
  id        String   @id @default(cuid())
  userId    String   @unique
  status    String   // online, away, offline
  activity  String?  // current activity description
  metadata  Json?
  lastSeen  DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([status])
  @@index([lastSeen])
}
```

**Implementation**:
```typescript
async updatePresence(userId: string, state: PresenceState): Promise<void> {
  // Update in-memory for fast access
  this.presenceMap.set(userId, state);

  // Persist to database for durability
  await this.db.userPresence.upsert({
    where: { userId },
    update: {
      status: state.status,
      activity: state.activity,
      metadata: state.metadata,
      lastSeen: new Date()
    },
    create: {
      userId,
      status: state.status,
      activity: state.activity,
      metadata: state.metadata
    }
  });
}
```

### I.3 - Push Dispatcher Channels

**File**: `packages/agentic/src/realtime/push-dispatcher.ts`

**Current State**: Only WebSocket channel implemented

**Channels to Add**:

#### Email Channel
```typescript
// packages/agentic/src/realtime/channels/email-channel.ts
export class EmailChannel implements PushChannel {
  async send(notification: Notification, recipient: User): Promise<boolean> {
    return await sendEmail({
      to: recipient.email,
      subject: notification.title,
      template: 'sam-notification',
      data: notification
    });
  }
}
```

#### Browser Push Channel
```typescript
// packages/agentic/src/realtime/channels/browser-push-channel.ts
export class BrowserPushChannel implements PushChannel {
  async send(notification: Notification, subscription: PushSubscription): Promise<boolean> {
    const webpush = require('web-push');
    await webpush.sendNotification(subscription, JSON.stringify({
      title: notification.title,
      body: notification.message,
      data: notification.data
    }));
    return true;
  }
}
```

### I.4 - Intervention Surface UI Components

**Directory**: `components/sam/interventions/`

#### `InterventionBanner.tsx`
```typescript
'use client';

import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Intervention } from '@sam-ai/agentic';

interface Props {
  intervention: Intervention;
  onDismiss: () => void;
  onAction: () => void;
}

export function InterventionBanner({ intervention, onDismiss, onAction }: Props) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-4 shadow-lg"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <div>
            <p className="font-medium">{intervention.title}</p>
            <p className="text-sm text-violet-100">{intervention.message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {intervention.actionLabel || 'Take Action'}
          </Button>
          <button onClick={onDismiss} className="p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

#### `InterventionToast.tsx`
```typescript
'use client';

import { toast } from 'sonner';
import type { Intervention } from '@sam-ai/agentic';

export function showInterventionToast(intervention: Intervention) {
  toast(intervention.title, {
    description: intervention.message,
    action: intervention.actionLabel ? {
      label: intervention.actionLabel,
      onClick: () => intervention.onAction?.()
    } : undefined,
    duration: intervention.priority === 'high' ? Infinity : 10000
  });
}
```

#### `InterventionProvider.tsx`
```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useInterventions } from '@sam-ai/react';
import { InterventionBanner } from './InterventionBanner';
import { InterventionModal } from './InterventionModal';
import { showInterventionToast } from './InterventionToast';

const InterventionContext = createContext<ReturnType<typeof useInterventions> | null>(null);

export function InterventionProvider({ children }: { children: React.ReactNode }) {
  const interventions = useInterventions();
  const [activeIntervention, setActiveIntervention] = useState<Intervention | null>(null);

  useEffect(() => {
    const latest = interventions.interventions[0];
    if (latest) {
      if (latest.surface === 'banner') {
        setActiveIntervention(latest);
      } else if (latest.surface === 'toast') {
        showInterventionToast(latest);
      }
    }
  }, [interventions.interventions]);

  return (
    <InterventionContext.Provider value={interventions}>
      {children}
      <AnimatePresence>
        {activeIntervention?.surface === 'banner' && (
          <InterventionBanner
            intervention={activeIntervention}
            onDismiss={() => {
              interventions.dismiss(activeIntervention.id);
              setActiveIntervention(null);
            }}
            onAction={() => {
              interventions.acknowledge(activeIntervention.id);
              setActiveIntervention(null);
            }}
          />
        )}
      </AnimatePresence>
    </InterventionContext.Provider>
  );
}
```

### I.5 - Real-Time Tests

**Test Files**:
1. `packages/agentic/src/realtime/__tests__/websocket-manager.test.ts`
2. `packages/agentic/src/realtime/__tests__/presence-tracker.test.ts`
3. `packages/agentic/src/realtime/__tests__/push-dispatcher.test.ts`
4. `packages/react/src/hooks/__tests__/useRealtime.test.ts`

---

## Phase J: Observability Completion

### J.1 - Database Persistence Layer

**Prisma Schema Additions**:
```prisma
model SAMMetric {
  id          String   @id @default(cuid())
  name        String
  value       Float
  labels      Json     @default("{}")
  timestamp   DateTime @default(now())
  userId      String?
  sessionId   String?

  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([name, timestamp])
  @@index([userId, timestamp])
  @@index([sessionId])
}

model SAMToolExecution {
  id          String   @id @default(cuid())
  toolName    String
  status      String   // success, failure, timeout
  duration    Int      // milliseconds
  input       Json?
  output      Json?
  error       String?
  userId      String
  sessionId   String
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([toolName, createdAt])
  @@index([userId, createdAt])
  @@index([status, createdAt])
}

model SAMConfidenceScore {
  id          String   @id @default(cuid())
  predicted   Float
  actual      Float?
  category    String
  metadata    Json?
  userId      String
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([category, createdAt])
  @@index([userId, createdAt])
}

model SAMMemoryQuality {
  id          String   @id @default(cuid())
  memoryType  String   // short_term, long_term, episodic
  score       Float
  factors     Json     // breakdown of quality factors
  userId      String
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([memoryType, createdAt])
  @@index([userId, createdAt])
}
```

**Update MetricsCollector**:
```typescript
// packages/agentic/src/observability/metrics-collector.ts

export class MetricsCollector {
  private db: PrismaClient;
  private buffer: Metric[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor(db: PrismaClient) {
    this.db = db;
    // Batch writes every 10 seconds
    this.flushInterval = setInterval(() => this.flush(), 10000);
  }

  record(metric: Metric): void {
    this.buffer.push(metric);

    // Flush immediately if buffer is large
    if (this.buffer.length >= 100) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const metrics = [...this.buffer];
    this.buffer = [];

    await this.db.sAMMetric.createMany({
      data: metrics.map(m => ({
        name: m.name,
        value: m.value,
        labels: m.labels,
        userId: m.userId,
        sessionId: m.sessionId,
        timestamp: m.timestamp
      }))
    });
  }
}
```

### J.2 - Connect Dashboard to Real Data

**New API Route**: `app/api/admin/sam/metrics/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const admin = await adminAuth();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { timeRange, metricNames } = await req.json();

  const startDate = getStartDate(timeRange);

  // Aggregate metrics
  const metrics = await db.sAMMetric.groupBy({
    by: ['name'],
    _avg: { value: true },
    _count: true,
    _min: { value: true },
    _max: { value: true },
    where: {
      timestamp: { gte: startDate },
      ...(metricNames && { name: { in: metricNames } })
    }
  });

  // Tool execution stats
  const toolStats = await db.sAMToolExecution.groupBy({
    by: ['toolName', 'status'],
    _count: true,
    _avg: { duration: true },
    where: {
      createdAt: { gte: startDate }
    }
  });

  // Confidence calibration data
  const confidenceData = await db.sAMConfidenceScore.findMany({
    where: { createdAt: { gte: startDate } },
    select: {
      predicted: true,
      actual: true,
      category: true
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      metrics,
      toolStats,
      confidenceCalibration: calculateCalibration(confidenceData)
    }
  });
}

function getStartDate(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

function calculateCalibration(data: { predicted: number; actual: number | null }[]) {
  // Group by predicted confidence buckets and calculate actual success rate
  const buckets = new Map<number, { predictions: number; successes: number }>();

  data.forEach(d => {
    if (d.actual === null) return;
    const bucket = Math.floor(d.predicted * 10) / 10;
    const existing = buckets.get(bucket) || { predictions: 0, successes: 0 };
    existing.predictions++;
    if (d.actual >= 0.5) existing.successes++;
    buckets.set(bucket, existing);
  });

  return Array.from(buckets.entries()).map(([bucket, stats]) => ({
    predicted: bucket,
    actual: stats.successes / stats.predictions,
    count: stats.predictions
  }));
}
```

**Update Dashboard Component**: `components/admin/sam-observability-dashboard.tsx`

```typescript
// Replace mock data fetching with real API calls
import useSWR from 'swr';

export function SAMObservabilityDashboard() {
  const [timeRange, setTimeRange] = useState('24h');

  const { data, isLoading, error } = useSWR(
    ['sam-metrics', timeRange],
    () => fetch('/api/admin/sam/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeRange })
    }).then(res => res.json())
  );

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} />;

  return (
    <div className="space-y-6">
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      <MetricCards metrics={data.metrics} />
      <ToolExecutionChart data={data.toolStats} />
      <ConfidenceCalibrationChart data={data.confidenceCalibration} />
    </div>
  );
}
```

### J.3 - External Monitoring Integration

**Railway Logging Exporter**:
```typescript
// packages/agentic/src/observability/exporters/railway-exporter.ts

export class RailwayExporter implements MetricsExporter {
  private serviceName: string;

  constructor(serviceName: string = 'sam-ai') {
    this.serviceName = serviceName;
  }

  async export(metrics: Metric[]): Promise<void> {
    // Railway uses structured JSON logging
    metrics.forEach(metric => {
      console.log(JSON.stringify({
        level: 'info',
        type: 'metric',
        service: this.serviceName,
        metric: {
          name: metric.name,
          value: metric.value,
          labels: metric.labels,
          timestamp: metric.timestamp.toISOString()
        }
      }));
    });
  }

  async exportToolExecution(execution: ToolExecution): Promise<void> {
    console.log(JSON.stringify({
      level: execution.status === 'failure' ? 'error' : 'info',
      type: 'tool_execution',
      service: this.serviceName,
      tool: {
        name: execution.toolName,
        status: execution.status,
        duration_ms: execution.duration,
        error: execution.error
      },
      user_id: execution.userId,
      session_id: execution.sessionId,
      timestamp: new Date().toISOString()
    }));
  }
}
```

### J.4 - Observability Tests

**Test Files**:
1. `packages/agentic/src/observability/__tests__/metrics-collector.test.ts`
2. `packages/agentic/src/observability/__tests__/tool-telemetry.test.ts`
3. `packages/agentic/src/observability/__tests__/confidence-calibration.test.ts`
4. `app/api/admin/sam/metrics/__tests__/route.test.ts`

---

## Implementation Timeline

### Week 1: Phase H Completion
- [ ] H.1 - Wire orchestration into unified route
- [ ] H.2 - Implement criterion evaluation
- [ ] H.3 - Add orchestration tests

### Week 2-3: Phase I Core
- [ ] I.1 - Create React hooks (useRealtime, usePresence, useInterventions, usePushNotifications)
- [ ] I.2 - Add Prisma persistence to PresenceTracker
- [ ] I.3 - Implement email notification channel

### Week 4: Phase I UI
- [ ] I.4 - Create intervention UI components (Banner, Toast, Modal, Provider)
- [ ] I.5 - Add real-time tests
- [ ] I.3 continued - Browser push notifications

### Week 5: Phase J Persistence
- [ ] J.1 - Add Prisma models and migration
- [ ] J.1 continued - Update all collectors to use Prisma

### Week 6: Phase J Dashboard
- [ ] J.2 - Create admin API routes for metrics
- [ ] J.2 continued - Connect dashboard to real data
- [ ] J.3 - Add Railway logging exporter
- [ ] J.4 - Add observability tests

---

## Success Criteria

### Phase H Complete When:
- [ ] Orchestration is accessible via `/api/sam/unified` route
- [ ] All criterion types evaluate correctly
- [ ] Full tutoring loop works end-to-end
- [ ] Test coverage > 80%

### Phase I Complete When:
- [ ] React hooks work in SAM components
- [ ] Presence persists across page refreshes
- [ ] Email notifications send for interventions
- [ ] Intervention UI components render correctly
- [ ] Test coverage > 80%

### Phase J Complete When:
- [ ] All metrics persist to database
- [ ] Admin dashboard shows real data
- [ ] Metrics export to Railway logs
- [ ] Historical data queryable via API
- [ ] Test coverage > 80%

---

## Files Summary

### New Files (19)

| File | Purpose |
|------|---------|
| `packages/react/src/hooks/useRealtime.ts` | WebSocket connection hook |
| `packages/react/src/hooks/usePresence.ts` | Presence tracking hook |
| `packages/react/src/hooks/useInterventions.ts` | Intervention notifications hook |
| `packages/react/src/hooks/usePushNotifications.ts` | Push notification hook |
| `packages/agentic/src/realtime/channels/email-channel.ts` | Email notification channel |
| `packages/agentic/src/realtime/channels/browser-push-channel.ts` | Browser push channel |
| `components/sam/interventions/InterventionBanner.tsx` | Banner intervention UI |
| `components/sam/interventions/InterventionToast.tsx` | Toast intervention helper |
| `components/sam/interventions/InterventionModal.tsx` | Modal intervention UI |
| `components/sam/interventions/InterventionInline.tsx` | Inline intervention UI |
| `components/sam/interventions/InterventionProvider.tsx` | Context provider |
| `app/api/admin/sam/metrics/route.ts` | Metrics API endpoint |
| `packages/agentic/src/observability/exporters/railway-exporter.ts` | Railway logging |
| `packages/agentic/src/orchestration/__tests__/*.test.ts` | Orchestration tests (4) |
| `packages/agentic/src/realtime/__tests__/*.test.ts` | Real-time tests (3) |
| `packages/agentic/src/observability/__tests__/*.test.ts` | Observability tests (4) |

### Modified Files (9)

| File | Changes |
|------|---------|
| `app/api/sam/unified/route.ts` | Add orchestration integration |
| `packages/agentic/src/orchestration/active-step-executor.ts` | Implement criterion evaluation |
| `packages/agentic/src/realtime/presence-tracker.ts` | Add Prisma persistence |
| `packages/agentic/src/realtime/push-dispatcher.ts` | Add notification channels |
| `packages/agentic/src/observability/metrics-collector.ts` | Add Prisma persistence |
| `packages/agentic/src/observability/tool-telemetry.ts` | Add Prisma persistence |
| `packages/agentic/src/observability/confidence-calibration.ts` | Add Prisma persistence |
| `components/admin/sam-observability-dashboard.tsx` | Connect to real data |
| `prisma/schema.prisma` | Add observability models |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Database Performance | Add indexes, implement batch writes with buffer |
| WebSocket Scalability | Plan Redis pub/sub for multi-instance deployments |
| Notification Deliverability | Implement retry queues with exponential backoff |
| Dashboard Performance | Data aggregation, time-based partitioning, caching |
| Migration Safety | All new fields optional or with defaults |

---

## Related Documentation

- Master Plan: `/SAM_AGENTIC_AI_MENTOR_MASTER_PLAN.md`
- Gaps Analysis: `/docs/features/sam-ai-system/reports/SAM_ENGINE_GAPS_AND_IMPROVEMENTS.md`
- Test Plan: `/docs/testing/SAM_AI_TESTING_PLAN.md`
- Phase 4 Thinking: `/docs/features/sam-ai-system/improvement-plan/phase-4-thinking/`
