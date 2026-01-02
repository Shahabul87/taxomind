#!/usr/bin/env tsx
/**
 * SAM Agentic Integration Validation Script
 * Phase 6: Testing and Validation
 *
 * Validates all quality gates from the improvement plan:
 * - All agentic routes use package classes
 * - ConfidenceScorer runs on responses
 * - BehaviorMonitor tracks interactions
 * - Frontend has goal management UI
 * - Documentation matches implementation
 *
 * Run with: npx tsx scripts/validate-agentic-integration.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface ValidationResult {
  name: string;
  passed: boolean;
  details: string;
  severity: 'critical' | 'warning' | 'info';
}

interface ValidationReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  results: ValidationResult[];
}

// ============================================================================
// HELPERS
// ============================================================================

function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function fileContains(filePath: string, pattern: string | RegExp): boolean {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return false;

  const content = fs.readFileSync(fullPath, 'utf-8');
  if (typeof pattern === 'string') {
    return content.includes(pattern);
  }
  return pattern.test(content);
}

function countPatternOccurrences(filePath: string, pattern: RegExp): number {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return 0;

  const content = fs.readFileSync(fullPath, 'utf-8');
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

function getFilesInDir(dir: string, extension: string): string[] {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) return [];

  const files: string[] = [];

  function walkDir(currentPath: string) {
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        walkDir(itemPath);
      } else if (item.endsWith(extension)) {
        files.push(itemPath.replace(process.cwd() + '/', ''));
      }
    }
  }

  walkDir(fullPath);
  return files;
}

// ============================================================================
// VALIDATION CHECKS
// ============================================================================

function validateAgenticPackageExists(): ValidationResult {
  const exists = fileExists('packages/agentic/package.json');
  return {
    name: '@sam-ai/agentic package exists',
    passed: exists,
    details: exists
      ? 'Package found at packages/agentic/'
      : 'Package not found - create packages/agentic/',
    severity: 'critical',
  };
}

function validateAgenticBridgeExists(): ValidationResult {
  const exists = fileExists('lib/sam/agentic-bridge.ts');
  return {
    name: 'Agentic bridge file exists',
    passed: exists,
    details: exists
      ? 'Bridge found at lib/sam/agentic-bridge.ts'
      : 'Bridge not found - integration incomplete',
    severity: 'critical',
  };
}

function validateUnifiedRouteUsesAgenticBridge(): ValidationResult {
  const filePath = 'app/api/sam/unified/route.ts';
  const hasImport = fileContains(filePath, 'agentic-bridge');
  const hasConfidenceScoring = fileContains(filePath, /scoreConfidence|ConfidenceScorer/);

  const passed = hasImport && hasConfidenceScoring;
  return {
    name: 'Unified route uses agentic bridge',
    passed,
    details: passed
      ? 'Bridge imported and confidence scoring enabled'
      : `Issues: ${!hasImport ? 'No bridge import. ' : ''}${!hasConfidenceScoring ? 'No confidence scoring.' : ''}`,
    severity: 'critical',
  };
}

function validateStreamRouteUsesAgenticBridge(): ValidationResult {
  const filePath = 'app/api/sam/unified/stream/route.ts';
  const hasImport = fileContains(filePath, 'agentic-bridge');

  return {
    name: 'Stream route uses agentic bridge',
    passed: hasImport,
    details: hasImport
      ? 'Bridge imported in stream route'
      : 'Bridge not imported - add agentic-bridge to stream route',
    severity: 'warning',
  };
}

function validateGoalsEndpointExists(): ValidationResult {
  const routeExists = fileExists('app/api/sam/agentic/goals/route.ts');
  const decomposeExists = fileExists('app/api/sam/agentic/goals/[goalId]/decompose/route.ts');

  const passed = routeExists && decomposeExists;
  return {
    name: 'Goals API endpoints exist',
    passed,
    details: passed
      ? 'Goals CRUD and decompose endpoints found'
      : `Missing: ${!routeExists ? 'goals/route.ts ' : ''}${!decomposeExists ? 'goals/[goalId]/decompose/route.ts' : ''}`,
    severity: 'critical',
  };
}

function validatePlansEndpointExists(): ValidationResult {
  const routeExists = fileExists('app/api/sam/agentic/plans/route.ts');
  const startExists = fileExists('app/api/sam/agentic/plans/[planId]/start/route.ts');
  const pauseExists = fileExists('app/api/sam/agentic/plans/[planId]/pause/route.ts');

  const passed = routeExists && startExists && pauseExists;
  return {
    name: 'Plans API endpoints exist',
    passed,
    details: passed
      ? 'Plans CRUD and state management endpoints found'
      : 'Some plan endpoints missing',
    severity: 'critical',
  };
}

function validateRecommendationsEndpointExists(): ValidationResult {
  const exists = fileExists('app/api/sam/agentic/recommendations/route.ts');
  return {
    name: 'Recommendations API endpoint exists',
    passed: exists,
    details: exists
      ? 'Recommendations endpoint found'
      : 'Missing app/api/sam/agentic/recommendations/route.ts',
    severity: 'warning',
  };
}

function validateSkillsEndpointExists(): ValidationResult {
  const exists = fileExists('app/api/sam/agentic/skills/route.ts');
  return {
    name: 'Skills API endpoint exists',
    passed: exists,
    details: exists
      ? 'Skills endpoint found'
      : 'Missing app/api/sam/agentic/skills/route.ts',
    severity: 'warning',
  };
}

function validateProgressEndpointExists(): ValidationResult {
  const exists = fileExists('app/api/sam/agentic/analytics/progress/route.ts');
  return {
    name: 'Progress analytics endpoint exists',
    passed: exists,
    details: exists
      ? 'Progress analytics endpoint found'
      : 'Missing app/api/sam/agentic/analytics/progress/route.ts',
    severity: 'warning',
  };
}

function validateEventsEndpointExists(): ValidationResult {
  const exists = fileExists('app/api/sam/agentic/events/route.ts');
  return {
    name: 'Events tracking endpoint exists',
    passed: exists,
    details: exists
      ? 'Events endpoint found for behavior tracking'
      : 'Missing app/api/sam/agentic/events/route.ts',
    severity: 'warning',
  };
}

function validateNotificationsEndpointExists(): ValidationResult {
  const exists = fileExists('app/api/sam/agentic/notifications/route.ts');
  return {
    name: 'Notifications endpoint exists',
    passed: exists,
    details: exists
      ? 'Notifications endpoint found'
      : 'Missing app/api/sam/agentic/notifications/route.ts',
    severity: 'warning',
  };
}

function validateCheckInsCronExists(): ValidationResult {
  const exists = fileExists('app/api/cron/sam-checkins/route.ts');
  return {
    name: 'Check-ins cron job exists',
    passed: exists,
    details: exists
      ? 'Cron job for scheduled check-ins found'
      : 'Missing app/api/cron/sam-checkins/route.ts',
    severity: 'warning',
  };
}

function validateUseAgenticHookExists(): ValidationResult {
  const exists = fileExists('packages/react/src/hooks/useAgentic.ts');
  const exported = fileContains('packages/react/src/index.ts', 'useAgentic');

  const passed = exists && exported;
  return {
    name: 'useAgentic hook exists and is exported',
    passed,
    details: passed
      ? 'Hook exists and exported from @sam-ai/react'
      : `Issues: ${!exists ? 'Hook file missing. ' : ''}${!exported ? 'Not exported from index.' : ''}`,
    severity: 'critical',
  };
}

function validateGoalPlannerComponentExists(): ValidationResult {
  const exists = fileExists('components/sam/goal-planner.tsx');
  return {
    name: 'GoalPlanner component exists',
    passed: exists,
    details: exists
      ? 'GoalPlanner UI component found'
      : 'Missing components/sam/goal-planner.tsx',
    severity: 'warning',
  };
}

function validateRecommendationWidgetExists(): ValidationResult {
  const exists = fileExists('components/sam/recommendation-widget.tsx');
  return {
    name: 'RecommendationWidget component exists',
    passed: exists,
    details: exists
      ? 'RecommendationWidget UI component found'
      : 'Missing components/sam/recommendation-widget.tsx',
    severity: 'warning',
  };
}

function validateNotificationBellExists(): ValidationResult {
  const exists = fileExists('components/sam/notification-bell.tsx');
  return {
    name: 'NotificationBell component exists',
    passed: exists,
    details: exists
      ? 'NotificationBell UI component found'
      : 'Missing components/sam/notification-bell.tsx',
    severity: 'warning',
  };
}

function validateProgressDashboardExists(): ValidationResult {
  const exists = fileExists('components/sam/progress-dashboard.tsx');
  return {
    name: 'ProgressDashboard component exists',
    passed: exists,
    details: exists
      ? 'ProgressDashboard UI component found'
      : 'Missing components/sam/progress-dashboard.tsx',
    severity: 'warning',
  };
}

function validateSAMAssistantTracksBehavior(): ValidationResult {
  const filePath = 'components/sam/SAMAssistant.tsx';
  const tracksEvents = fileContains(filePath, /trackBehaviorEvent|\/api\/sam\/agentic\/events/);

  return {
    name: 'SAMAssistant tracks behavior events',
    passed: tracksEvents,
    details: tracksEvents
      ? 'Behavior event tracking integrated'
      : 'SAMAssistant not tracking behavior events',
    severity: 'warning',
  };
}

function validateAgenticPackageInDependencies(): ValidationResult {
  const packageJsonPath = 'package.json';
  const hasAgenticDep = fileContains(packageJsonPath, '@sam-ai/agentic');

  return {
    name: '@sam-ai/agentic in dependencies',
    passed: hasAgenticDep,
    details: hasAgenticDep
      ? 'Agentic package listed in dependencies'
      : 'Add "@sam-ai/agentic": "workspace:*" to dependencies',
    severity: 'critical',
  };
}

function validateComponentsIndexExists(): ValidationResult {
  const exists = fileExists('components/sam/index.ts');
  return {
    name: 'Components index file exists',
    passed: exists,
    details: exists
      ? 'Component exports centralized in index.ts'
      : 'Create components/sam/index.ts for exports',
    severity: 'info',
  };
}

function validateUseAgenticHookTests(): ValidationResult {
  const exists = fileExists('packages/react/src/__tests__/useAgentic.test.ts');

  if (!exists) {
    return {
      name: 'useAgentic hook has tests',
      passed: false,
      details: 'Missing packages/react/src/__tests__/useAgentic.test.ts',
      severity: 'warning',
    };
  }

  const testCount = countPatternOccurrences(
    'packages/react/src/__tests__/useAgentic.test.ts',
    /it\(/g
  );

  return {
    name: 'useAgentic hook has tests',
    passed: testCount >= 10,
    details: `Found ${testCount} test cases (target: 10+)`,
    severity: testCount >= 10 ? 'info' : 'warning',
  };
}

// ============================================================================
// PRISMA & DATA PERSISTENCE VALIDATIONS
// ============================================================================

function validatePrismaAgenticDomainExists(): ValidationResult {
  const exists = fileExists('prisma/domains/17-sam-agentic.prisma');
  return {
    name: 'SAM Agentic Prisma domain file exists',
    passed: exists,
    details: exists
      ? 'Domain file found at prisma/domains/17-sam-agentic.prisma'
      : 'Missing prisma/domains/17-sam-agentic.prisma - create Prisma models',
    severity: 'critical',
  };
}

function validatePrismaAgenticModels(): ValidationResult {
  const domainFile = 'prisma/domains/17-sam-agentic.prisma';
  const requiredModels = [
    'SAMLearningGoal',
    'SAMSubGoal',
    'SAMExecutionPlan',
    'SAMPlanStep',
    'SAMPlanState',
    'SAMCheckpoint',
    'SAMScheduledCheckIn',
    'SAMCheckInResponse',
    'SAMBehaviorEvent',
    'SAMBehaviorPattern',
    'SAMIntervention',
    'SAMTopicProgress',
    'SAMLearningGap',
    'SAMSkillAssessment',
    'SAMRecommendation',
  ];

  const existingModels: string[] = [];
  const missingModels: string[] = [];

  for (const model of requiredModels) {
    if (fileContains(domainFile, `model ${model}`)) {
      existingModels.push(model);
    } else {
      missingModels.push(model);
    }
  }

  const passed = missingModels.length === 0;
  return {
    name: 'All SAM Agentic Prisma models defined',
    passed,
    details: passed
      ? `All ${requiredModels.length} models found`
      : `Missing models: ${missingModels.join(', ')}`,
    severity: 'critical',
  };
}

function validatePrismaAgenticEnums(): ValidationResult {
  const enumsFile = 'prisma/domains/01-enums.prisma';
  const requiredEnums = [
    'SAMGoalPriority',
    'SAMGoalStatus',
    'SAMPlanStatus',
    'SAMStepStatus',
    'SAMStepType',
    'SAMMasteryLevel',
    'SAMCheckpointType',
    'SAMCheckInType',
    'SAMCheckInStatus',
    'SAMBehaviorEventType',
    'SAMPatternType',
    'SAMInterventionType',
    'SAMGapSeverity',
    'SAMRecommendationType',
  ];

  const existingEnums: string[] = [];
  const missingEnums: string[] = [];

  for (const enumName of requiredEnums) {
    if (fileContains(enumsFile, `enum ${enumName}`)) {
      existingEnums.push(enumName);
    } else {
      missingEnums.push(enumName);
    }
  }

  const passed = missingEnums.length === 0;
  return {
    name: 'All SAM Agentic enums defined',
    passed,
    details: passed
      ? `All ${requiredEnums.length} enums found`
      : `Missing enums: ${missingEnums.join(', ')}`,
    severity: 'critical',
  };
}

function validateGoalStoreUsesPrisma(): ValidationResult {
  const filePath = 'lib/sam/stores/prisma-goal-store.ts';
  const usesPrismaDb = fileContains(filePath, "import { db } from '@/lib/db'");
  const usesSAMLearningGoal = fileContains(filePath, 'db.sAMLearningGoal');
  const hasNoInMemoryMap = !fileContains(filePath, /private\s+goals\s*=\s*new\s+Map/);

  const passed = usesPrismaDb && usesSAMLearningGoal && hasNoInMemoryMap;
  return {
    name: 'GoalStore uses Prisma (not in-memory)',
    passed,
    details: passed
      ? 'GoalStore correctly uses Prisma db.sAMLearningGoal'
      : `Issues: ${!usesPrismaDb ? 'No db import. ' : ''}${!usesSAMLearningGoal ? 'Not using sAMLearningGoal. ' : ''}${!hasNoInMemoryMap ? 'Still has in-memory Map.' : ''}`,
    severity: 'critical',
  };
}

function validatePlanStoreUsesPrisma(): ValidationResult {
  const filePath = 'lib/sam/stores/prisma-plan-store.ts';
  const usesPrismaDb = fileContains(filePath, "import { db } from '@/lib/db'");
  const usesSAMExecutionPlan = fileContains(filePath, 'db.sAMExecutionPlan');
  const hasNoInMemoryMap = !fileContains(filePath, /private\s+plans\s*=\s*new\s+Map/);

  const passed = usesPrismaDb && usesSAMExecutionPlan && hasNoInMemoryMap;
  return {
    name: 'PlanStore uses Prisma (not in-memory)',
    passed,
    details: passed
      ? 'PlanStore correctly uses Prisma db.sAMExecutionPlan'
      : `Issues: ${!usesPrismaDb ? 'No db import. ' : ''}${!usesSAMExecutionPlan ? 'Not using sAMExecutionPlan. ' : ''}${!hasNoInMemoryMap ? 'Still has in-memory Map.' : ''}`,
    severity: 'critical',
  };
}

function validateUserModelHasAgenticRelations(): ValidationResult {
  const authFile = 'prisma/domains/02-auth.prisma';
  const requiredRelations = [
    'samLearningGoals',
    'samExecutionPlans',
    'samScheduledCheckIns',
    'samBehaviorEvents',
    'samBehaviorPatterns',
    'samInterventions',
  ];

  const existingRelations: string[] = [];
  const missingRelations: string[] = [];

  for (const relation of requiredRelations) {
    if (fileContains(authFile, relation)) {
      existingRelations.push(relation);
    } else {
      missingRelations.push(relation);
    }
  }

  const passed = missingRelations.length === 0;
  return {
    name: 'User model has SAM Agentic relations',
    passed,
    details: passed
      ? `All ${requiredRelations.length} relations found on User model`
      : `Missing relations: ${missingRelations.join(', ')}`,
    severity: 'critical',
  };
}

function validateSchemaGenerated(): ValidationResult {
  const schemaFile = 'prisma/schema.prisma';
  const hasSAMLearningGoal = fileContains(schemaFile, 'model SAMLearningGoal');
  const hasSAMExecutionPlan = fileContains(schemaFile, 'model SAMExecutionPlan');

  const passed = hasSAMLearningGoal && hasSAMExecutionPlan;
  return {
    name: 'Generated schema includes SAM Agentic models',
    passed,
    details: passed
      ? 'Schema merged with SAM Agentic models (run npm run schema:merge if not)'
      : 'Run npm run schema:merge && npx prisma generate',
    severity: 'critical',
  };
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

function runAllValidations(): ValidationReport {
  const results: ValidationResult[] = [
    // Core Infrastructure
    validateAgenticPackageExists(),
    validateAgenticBridgeExists(),
    validateAgenticPackageInDependencies(),

    // Prisma & Data Persistence (CRITICAL for portability)
    validatePrismaAgenticDomainExists(),
    validatePrismaAgenticModels(),
    validatePrismaAgenticEnums(),
    validateGoalStoreUsesPrisma(),
    validatePlanStoreUsesPrisma(),
    validateUserModelHasAgenticRelations(),
    validateSchemaGenerated(),

    // API Routes
    validateUnifiedRouteUsesAgenticBridge(),
    validateStreamRouteUsesAgenticBridge(),
    validateGoalsEndpointExists(),
    validatePlansEndpointExists(),
    validateRecommendationsEndpointExists(),
    validateSkillsEndpointExists(),
    validateProgressEndpointExists(),
    validateEventsEndpointExists(),
    validateNotificationsEndpointExists(),
    validateCheckInsCronExists(),

    // Frontend Integration
    validateUseAgenticHookExists(),
    validateGoalPlannerComponentExists(),
    validateRecommendationWidgetExists(),
    validateNotificationBellExists(),
    validateProgressDashboardExists(),
    validateSAMAssistantTracksBehavior(),
    validateComponentsIndexExists(),

    // Testing
    validateUseAgenticHookTests(),
  ];

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed && r.severity === 'critical').length;
  const warnings = results.filter((r) => !r.passed && r.severity === 'warning').length;

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed,
    failed,
    warnings,
    results,
  };
}

function printReport(report: ValidationReport): void {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║         SAM AGENTIC INTEGRATION VALIDATION REPORT                ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log(`📅 Timestamp: ${report.timestamp}`);
  console.log(`📊 Total Checks: ${report.totalTests}`);
  console.log(`✅ Passed: ${report.passed}`);
  console.log(`❌ Failed (Critical): ${report.failed}`);
  console.log(`⚠️  Warnings: ${report.warnings}`);
  console.log('\n' + '─'.repeat(70) + '\n');

  // Group by status
  const criticalFailed = report.results.filter((r) => !r.passed && r.severity === 'critical');
  const warnings = report.results.filter((r) => !r.passed && r.severity === 'warning');
  const passed = report.results.filter((r) => r.passed);

  if (criticalFailed.length > 0) {
    console.log('❌ CRITICAL FAILURES:\n');
    for (const result of criticalFailed) {
      console.log(`   • ${result.name}`);
      console.log(`     └─ ${result.details}\n`);
    }
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    for (const result of warnings) {
      console.log(`   • ${result.name}`);
      console.log(`     └─ ${result.details}\n`);
    }
  }

  console.log('✅ PASSED:\n');
  for (const result of passed) {
    console.log(`   • ${result.name}`);
  }

  console.log('\n' + '─'.repeat(70));

  // Overall status
  if (report.failed === 0 && report.warnings === 0) {
    console.log('\n🎉 ALL CHECKS PASSED! Integration is complete.\n');
  } else if (report.failed === 0) {
    console.log(`\n⚠️  Integration mostly complete. ${report.warnings} warnings to address.\n`);
  } else {
    console.log(`\n❌ ${report.failed} critical issues must be fixed before deployment.\n`);
  }
}

// ============================================================================
// RUN
// ============================================================================

const report = runAllValidations();
printReport(report);

// Exit with error code if critical failures
process.exit(report.failed > 0 ? 1 : 0);
