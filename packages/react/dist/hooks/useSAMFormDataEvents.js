/**
 * @sam-ai/react - useSAMFormDataEvents Hook
 * Listens for form data events and syncs them into SAM context.
 */
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSAMFormDataSync } from './useSAMFormDataSync';
import { SAM_FORM_DATA_EVENT } from '../utils/formDataEvents';
const EMPTY_DATA = {};
export function useSAMFormDataEvents(options = {}) {
    const [payload, setPayload] = useState(null);
    useEffect(() => {
        if (options.enabled === false)
            return;
        if (typeof window === 'undefined')
            return;
        const target = options.target ?? window;
        const handler = (event) => {
            const customEvent = event;
            const detail = customEvent.detail;
            if (!detail?.formId)
                return;
            setPayload(detail);
        };
        target.addEventListener(SAM_FORM_DATA_EVENT, handler);
        return () => {
            target.removeEventListener(SAM_FORM_DATA_EVENT, handler);
        };
    }, [options.enabled, options.target]);
    const syncOptions = useMemo(() => {
        const baseOptions = options.defaultOptions ?? {};
        const payloadOptions = payload?.options ?? {};
        return {
            ...baseOptions,
            ...payloadOptions,
            enabled: options.enabled ?? payloadOptions.enabled,
        };
    }, [options.defaultOptions, options.enabled, payload]);
    useSAMFormDataSync(payload?.formId ?? '', payload?.formData ?? EMPTY_DATA, syncOptions);
    return { lastPayload: payload };
}
