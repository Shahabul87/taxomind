import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/error-handling/api-error-handler';

export const runtime = 'nodejs';

// POST /api/error-management/alerts/[alertId]/acknowledge - Acknowledge an alert
export const POST = withErrorHandling(async (request: Request, { params }: { params: { alertId: string } }) => {
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const { alertId } = params;
  
  if (!alertId) {
    throw new Error('Alert ID is required');
  }

  // Check if alert exists
  const alert = await db.errorAlert.findUnique({
    where: { id: alertId }
  });

  if (!alert) {
    throw new Error('Alert not found');
  }

  if (alert.acknowledged) {
    throw new Error('Alert is already acknowledged');
  }

  // Update the alert
  const updatedAlert = await db.errorAlert.update({
    where: { id: alertId },
    data: {
      acknowledged: true,
      acknowledgedBy: user.id,
      acknowledgedAt: new Date()
    }
  });

  return {
    message: 'Alert acknowledged successfully',
    alert: {
      id: updatedAlert.id,
      acknowledged: updatedAlert.acknowledged,
      acknowledgedBy: updatedAlert.acknowledgedBy,
      acknowledgedAt: updatedAlert.acknowledgedAt
    }
  };
});

// DELETE /api/error-management/alerts/[alertId]/acknowledge - Unacknowledge an alert
export const DELETE = withErrorHandling(async (request: Request, { params }: { params: { alertId: string } }) => {
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const { alertId } = params;
  
  if (!alertId) {
    throw new Error('Alert ID is required');
  }

  // Check if alert exists
  const alert = await db.errorAlert.findUnique({
    where: { id: alertId }
  });

  if (!alert) {
    throw new Error('Alert not found');
  }

  if (!alert.acknowledged) {
    throw new Error('Alert is not acknowledged');
  }

  // Update the alert
  const updatedAlert = await db.errorAlert.update({
    where: { id: alertId },
    data: {
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null
    }
  });

  return {
    message: 'Alert unacknowledged successfully',
    alert: {
      id: updatedAlert.id,
      acknowledged: updatedAlert.acknowledged,
      acknowledgedBy: updatedAlert.acknowledgedBy,
      acknowledgedAt: updatedAlert.acknowledgedAt
    }
  };
});