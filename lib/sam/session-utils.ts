/**
 * SAM Session Utilities
 * Provides stable session IDs for plan-driven tutoring flows.
 */

import { createHash } from 'crypto';

export function buildSAMSessionId(params: {
  userId: string;
  entityId?: string;
  pagePath?: string;
}): string {
  const base = [
    params.userId,
    params.entityId ?? '',
    params.pagePath ?? '',
  ].join('|');

  const digest = createHash('sha256').update(base).digest('hex').slice(0, 12);
  return `sam_${params.userId}_${digest}`;
}
