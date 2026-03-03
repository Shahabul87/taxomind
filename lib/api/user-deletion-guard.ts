import { db } from '@/lib/db';

interface DeletionBlocker {
  type: string;
  count: number;
  message: string;
}

interface DeletionWarning {
  type: string;
  count: number;
  message: string;
}

interface PreflightResult {
  canDelete: boolean;
  blockers: DeletionBlocker[];
  warnings: DeletionWarning[];
}

/**
 * Check if a user can be safely deleted by verifying they have no
 * critical records that would be lost or leave orphaned data.
 */
export async function preflightUserDeletion(userId: string): Promise<PreflightResult> {
  const blockers: DeletionBlocker[] = [];
  const warnings: DeletionWarning[] = [];

  const [purchaseCount, courseCount, enrollmentCount] = await Promise.all([
    db.purchase.count({ where: { userId } }),
    db.course.count({ where: { userId } }),
    db.enrollment.count({ where: { userId } }),
  ]);

  if (purchaseCount > 0) {
    blockers.push({
      type: 'purchases',
      count: purchaseCount,
      message: `User has ${purchaseCount} purchase record(s). These must be preserved for financial auditing.`,
    });
  }

  if (courseCount > 0) {
    blockers.push({
      type: 'courses',
      count: courseCount,
      message: `User owns ${courseCount} course(s). These must be reassigned or archived before deletion.`,
    });
  }

  if (enrollmentCount > 0) {
    warnings.push({
      type: 'enrollments',
      count: enrollmentCount,
      message: `User has ${enrollmentCount} enrollment(s) that will be removed.`,
    });
  }

  return {
    canDelete: blockers.length === 0,
    blockers,
    warnings,
  };
}
