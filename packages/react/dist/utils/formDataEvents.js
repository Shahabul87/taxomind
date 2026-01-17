/**
 * @sam-ai/react - Form data event utilities
 * Lightweight event bridge for syncing external form state into SAM.
 */
export const SAM_FORM_DATA_EVENT = 'sam:form-data';
export function emitSAMFormData(detail, target) {
    if (!detail?.formId)
        return;
    const eventTarget = target ??
        (typeof window !== 'undefined' ? window : undefined);
    if (!eventTarget || typeof eventTarget.dispatchEvent !== 'function')
        return;
    const payload = {
        ...detail,
        emittedAt: detail.emittedAt ?? new Date().toISOString(),
    };
    const event = new CustomEvent(SAM_FORM_DATA_EVENT, {
        detail: payload,
    });
    eventTarget.dispatchEvent(event);
}
