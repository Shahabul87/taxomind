/**
 * @sam-ai/react - Form data event utilities
 * Lightweight event bridge for syncing external form state into SAM.
 */

import type { SAMFormDataEventDetail } from '../types';

export const SAM_FORM_DATA_EVENT = 'sam:form-data';

export function emitSAMFormData(detail: SAMFormDataEventDetail, target?: EventTarget): void {
  if (!detail?.formId) return;

  const eventTarget =
    target ??
    (typeof window !== 'undefined' ? window : undefined);

  if (!eventTarget || typeof eventTarget.dispatchEvent !== 'function') return;

  const payload: SAMFormDataEventDetail = {
    ...detail,
    emittedAt: detail.emittedAt ?? new Date().toISOString(),
  };

  const event = new CustomEvent<SAMFormDataEventDetail>(SAM_FORM_DATA_EVENT, {
    detail: payload,
  });

  eventTarget.dispatchEvent(event);
}
