/**
 * @sam-ai/react - Form data event utilities
 * Lightweight event bridge for syncing external form state into SAM.
 */
import type { SAMFormDataEventDetail } from '../types';
export declare const SAM_FORM_DATA_EVENT = "sam:form-data";
export declare function emitSAMFormData(detail: SAMFormDataEventDetail, target?: EventTarget): void;
//# sourceMappingURL=formDataEvents.d.ts.map