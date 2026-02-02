/**
 * @sam-ai/react - useContextGathering
 *
 * Comprehensive client-side DOM collector that produces a PageContextSnapshot.
 * Replaces and unifies useSAMPageContext page detection, useSAMFormAutoDetect,
 * and useSAMPageLinks into a single, complete snapshot of page state.
 *
 * Features:
 * - Full form scanning with field metadata, labels, validation, options
 * - Content extraction (headings, tables, code blocks, images, text)
 * - Navigation analysis (links, tabs, sidebar, pagination)
 * - Page state detection (editing, draft, publishing, wizard steps)
 * - Interaction tracking (scroll, focus, selection, time on page)
 * - MutationObserver for SPA navigation + DOM changes
 * - Extensible via custom ContextProviders
 * - Debounced with content hash change detection
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { CONTEXT_SNAPSHOT_VERSION } from '@sam-ai/core';
// ============================================================================
// HELPERS
// ============================================================================
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash).toString(36);
}
function getVisibleText(el, maxLength) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;
            if (!parent)
                return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (tag === 'script' || tag === 'style' || tag === 'noscript') {
                return NodeFilter.FILTER_REJECT;
            }
            // Exclude SAM chat widget (portalled to body with data-sam-theme)
            // and sidebar/nav chrome so we only capture actual page content
            if (parent.closest('[data-sam-theme], [role="navigation"], nav.sidebar, aside')) {
                return NodeFilter.FILTER_REJECT;
            }
            const style = window.getComputedStyle(parent);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    let text = '';
    let node = walker.nextNode();
    while (node && text.length < maxLength) {
        const content = (node.textContent ?? '').trim();
        if (content) {
            text += (text ? ' ' : '') + content;
        }
        node = walker.nextNode();
    }
    return text.slice(0, maxLength);
}
/** Find the main content area, excluding sidebars and nav chrome */
function getMainContentElement() {
    return (document.querySelector('main') ??
        document.querySelector('[role="main"]') ??
        document.querySelector('#main-content') ??
        document.body);
}
// ============================================================================
// PAGE DETECTION
// ============================================================================
function detectPageContext() {
    const path = window.location.pathname;
    const title = document.title;
    // Extract data attributes from body or main element
    const mainEl = document.querySelector('main') ?? document.body;
    const dataType = mainEl.dataset.pageType ?? mainEl.dataset.samPageType ?? '';
    const dataEntityId = mainEl.dataset.entityId ?? mainEl.dataset.samEntityId ?? '';
    const dataParentId = mainEl.dataset.parentEntityId ?? '';
    const dataGrandParentId = mainEl.dataset.grandParentEntityId ?? '';
    // Detect page type from URL if not in data attributes
    const pageType = dataType || detectPageTypeFromPath(path);
    // Build breadcrumbs
    const breadcrumbEls = document.querySelectorAll('[aria-label="breadcrumb"] a, nav.breadcrumb a, [data-breadcrumb] a');
    const breadcrumb = breadcrumbEls.length > 0
        ? Array.from(breadcrumbEls).map((a) => a.textContent?.trim() ?? '')
        : buildBreadcrumbFromPath(path);
    // Extract capabilities
    const capEl = mainEl.dataset.capabilities ?? mainEl.dataset.samCapabilities;
    const capabilities = capEl ? capEl.split(',').map((c) => c.trim()) : [];
    // Meta tags
    const meta = {};
    document.querySelectorAll('meta[name], meta[property]').forEach((el) => {
        const name = el.getAttribute('name') ?? el.getAttribute('property') ?? '';
        const content = el.getAttribute('content') ?? '';
        if (name && content)
            meta[name] = content;
    });
    // Page state
    const state = detectPageState();
    return {
        type: pageType,
        path,
        title,
        entityId: dataEntityId || undefined,
        parentEntityId: dataParentId || undefined,
        grandParentEntityId: dataGrandParentId || undefined,
        capabilities,
        breadcrumb,
        state,
        meta,
    };
}
function detectPageTypeFromPath(path) {
    const segments = path.split('/').filter(Boolean);
    if (segments[0] === 'teacher') {
        if (segments.length >= 4 && segments[2] === 'sections')
            return 'teacher-section-edit';
        if (segments.length >= 4 && segments[2] === 'chapters')
            return 'teacher-chapter-edit';
        if (segments.length >= 2 && segments[1] === 'courses') {
            return segments.length > 2 ? 'teacher-course-edit' : 'teacher-courses';
        }
        if (segments[1] === 'analytics')
            return 'teacher-analytics';
        return 'teacher-dashboard';
    }
    if (segments[0] === 'courses') {
        if (segments.length === 1)
            return 'courses-list';
        if (segments.length >= 4 && segments[2] === 'sections')
            return 'section-detail';
        if (segments.length >= 4 && segments[2] === 'chapters')
            return 'chapter-detail';
        return 'course-detail';
    }
    if (segments[0] === 'exams') {
        return segments.length > 1 ? 'exam-detail' : 'exams-list';
    }
    if (segments[0] === 'study-plan')
        return 'study-plan';
    if (segments[0] === 'dashboard')
        return 'dashboard';
    if (segments[0] === 'settings')
        return 'settings';
    if (segments[0] === 'profile')
        return 'profile';
    return 'unknown';
}
function buildBreadcrumbFromPath(path) {
    return path
        .split('/')
        .filter(Boolean)
        .filter((seg) => !/^[0-9a-f-]{20,}$/i.test(seg) && !/^c[a-z0-9]{20,}$/i.test(seg))
        .map((seg) => seg
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()));
}
function detectPageState() {
    const mainEl = document.querySelector('main') ?? document.body;
    const isEditing = !!document.querySelector('[contenteditable="true"]') ||
        mainEl.dataset.editing === 'true' ||
        !!document.querySelector('form [data-editing]');
    const statusEl = mainEl.dataset.status ?? '';
    const isDraft = statusEl === 'draft' || !!document.querySelector('[data-status="draft"]');
    const isPublished = statusEl === 'published' || !!document.querySelector('[data-status="published"]');
    const hasUnsavedChanges = mainEl.dataset.unsaved === 'true' ||
        !!document.querySelector('form.dirty, [data-dirty="true"]');
    const permStr = mainEl.dataset.permissions ?? '';
    const permissions = permStr ? permStr.split(',').map((p) => p.trim()) : [];
    const stepEl = document.querySelector('[data-step]');
    const step = stepEl ? parseInt(stepEl.getAttribute('data-step') ?? '', 10) : undefined;
    const totalStepsEl = document.querySelector('[data-total-steps]');
    const totalSteps = totalStepsEl
        ? parseInt(totalStepsEl.getAttribute('data-total-steps') ?? '', 10)
        : undefined;
    return {
        isEditing,
        isDraft,
        isPublished,
        hasUnsavedChanges,
        permissions,
        step: Number.isFinite(step) ? step : undefined,
        totalSteps: Number.isFinite(totalSteps) ? totalSteps : undefined,
    };
}
// ============================================================================
// FORM SCANNING
// ============================================================================
function scanForms(maxForms) {
    const formEls = document.querySelectorAll('form');
    const snapshots = [];
    for (let i = 0; i < Math.min(formEls.length, maxForms); i++) {
        const form = formEls[i];
        const snapshot = scanSingleForm(form, i);
        if (snapshot)
            snapshots.push(snapshot);
    }
    return snapshots;
}
function scanSingleForm(form, index) {
    const formId = form.id || form.dataset.formId || form.name || `form-${index}`;
    const formName = form.dataset.formName || form.getAttribute('aria-label') || form.name || formId;
    const fields = [];
    const fieldGroups = [];
    const validationRules = {};
    // Scan fieldsets for groups
    form.querySelectorAll('fieldset').forEach((fieldset, gi) => {
        const legend = fieldset.querySelector('legend');
        const groupName = fieldset.dataset.group || legend?.textContent?.trim() || `group-${gi}`;
        const fieldNames = [];
        fieldset.querySelectorAll('input, select, textarea').forEach((el) => {
            const name = el.name;
            if (name)
                fieldNames.push(name);
        });
        fieldGroups.push({
            name: groupName,
            label: legend?.textContent?.trim(),
            fields: fieldNames,
            order: gi,
        });
    });
    // Scan all form elements
    const elements = form.querySelectorAll('input, select, textarea');
    elements.forEach((el, order) => {
        const field = scanFormField(el, order);
        if (field) {
            fields.push(field);
            // Collect validation rules
            const rules = extractValidationRules(el);
            if (rules.length > 0) {
                validationRules[field.name] = rules;
            }
        }
    });
    if (fields.length === 0)
        return null;
    // Determine form purpose
    const purpose = inferFormPurpose(form, fields);
    // Compute state
    const requiredFields = fields.filter((f) => f.required);
    const filledRequired = requiredFields.filter((f) => f.value != null && f.value !== '');
    const errorFields = fields.filter((f) => f.validationState === 'invalid');
    const dirtyFields = fields.filter((f) => f.value != null && f.value !== '' && f.validationState !== 'untouched');
    return {
        formId,
        formName,
        purpose,
        action: form.action || undefined,
        method: form.method || undefined,
        fields,
        fieldGroups,
        state: {
            isDirty: dirtyFields.length > 0,
            isValid: errorFields.length === 0,
            isSubmitting: form.dataset.submitting === 'true',
            completionPercent: requiredFields.length > 0
                ? Math.round((filledRequired.length / requiredFields.length) * 100)
                : 100,
            errorCount: errorFields.length,
        },
        validation: {
            rules: validationRules,
            dependencies: [],
        },
    };
}
function scanFormField(el, order) {
    const name = el.name || el.id;
    if (!name)
        return null;
    // Skip hidden and submit-type fields
    if (el instanceof HTMLInputElement) {
        if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') {
            return null;
        }
    }
    const type = el instanceof HTMLSelectElement
        ? 'select'
        : el instanceof HTMLTextAreaElement
            ? 'textarea'
            : el.type || 'text';
    const value = getFieldValue(el);
    const label = resolveFieldLabel(el);
    // Options for select/datalist
    let options;
    if (el instanceof HTMLSelectElement) {
        options = Array.from(el.options).map((opt) => ({
            value: opt.value,
            label: opt.textContent?.trim() ?? opt.value,
            selected: opt.selected,
        }));
    }
    // Data attributes
    const dataAttributes = {};
    for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('data-')) {
            dataAttributes[attr.name] = attr.value;
        }
    }
    // Validation state
    const validationState = detectValidationState(el);
    const errors = extractFieldErrors(el);
    // Help text
    const describedBy = el.getAttribute('aria-describedby');
    let helpText;
    if (describedBy) {
        const helpEl = document.getElementById(describedBy);
        if (helpEl && !helpEl.classList.contains('error')) {
            helpText = helpEl.textContent?.trim();
        }
    }
    if (!helpText) {
        helpText = el.title || undefined;
    }
    return {
        name,
        type,
        value,
        label,
        placeholder: 'placeholder' in el ? el.placeholder || undefined : undefined,
        helpText,
        required: el.required,
        disabled: el.disabled,
        readOnly: el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.readOnly : false,
        hidden: el.type === 'hidden' || el.hidden,
        validationState,
        errors,
        options,
        min: el instanceof HTMLInputElement ? el.min || undefined : undefined,
        max: el instanceof HTMLInputElement ? el.max || undefined : undefined,
        minLength: el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? (el.minLength > 0 ? el.minLength : undefined) : undefined,
        maxLength: el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? (el.maxLength > 0 && el.maxLength < 524288 ? el.maxLength : undefined) : undefined,
        pattern: el instanceof HTMLInputElement ? el.pattern || undefined : undefined,
        step: el instanceof HTMLInputElement && el.step ? parseFloat(el.step) : undefined,
        group: el.closest('fieldset')?.dataset.group ?? el.closest('fieldset')?.querySelector('legend')?.textContent?.trim(),
        order,
        dataAttributes,
    };
}
function getFieldValue(el) {
    if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox')
            return el.checked;
        if (el.type === 'number' || el.type === 'range') {
            return el.value ? parseFloat(el.value) : null;
        }
        if (el.type === 'file')
            return el.files ? Array.from(el.files).map((f) => f.name) : null;
        return el.value || null;
    }
    if (el instanceof HTMLSelectElement) {
        if (el.multiple) {
            return Array.from(el.selectedOptions).map((o) => o.value);
        }
        return el.value || null;
    }
    return el.value || null;
}
function resolveFieldLabel(el) {
    // 1. Explicit label via for attribute
    const id = el.id;
    if (id) {
        const labelEl = document.querySelector(`label[for="${id}"]`);
        if (labelEl?.textContent?.trim())
            return labelEl.textContent.trim();
    }
    // 2. aria-label
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel)
        return ariaLabel;
    // 3. aria-labelledby
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
        const refEl = document.getElementById(labelledBy);
        if (refEl?.textContent?.trim())
            return refEl.textContent.trim();
    }
    // 4. Wrapping label
    const parentLabel = el.closest('label');
    if (parentLabel) {
        // Get label text excluding the input element text
        const clone = parentLabel.cloneNode(true);
        clone.querySelectorAll('input, select, textarea').forEach((c) => c.remove());
        const text = clone.textContent?.trim();
        if (text)
            return text;
    }
    // 5. Previous sibling label
    const prev = el.previousElementSibling;
    if (prev?.tagName === 'LABEL') {
        const text = prev.textContent?.trim();
        if (text)
            return text;
    }
    // 6. Fallback: format name attribute
    const name = el.name || el.id || '';
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
}
function detectValidationState(el) {
    // Check native validity
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        if (!el.value && !el.required)
            return 'untouched';
        if (el.validity && !el.validity.valid)
            return 'invalid';
    }
    // Check aria-invalid
    if (el.getAttribute('aria-invalid') === 'true')
        return 'invalid';
    // Check error class indicators
    if (el.classList.contains('error') || el.classList.contains('is-invalid'))
        return 'invalid';
    // Check data attributes
    if (el.dataset.valid === 'false' || el.dataset.error)
        return 'invalid';
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        if (el.value)
            return 'valid';
    }
    return 'untouched';
}
function extractFieldErrors(el) {
    const errors = [];
    // Check native validation message
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        if (el.validationMessage)
            errors.push(el.validationMessage);
    }
    // Check aria-describedby for error messages
    const describedBy = el.getAttribute('aria-describedby');
    if (describedBy) {
        const errorEl = document.getElementById(describedBy);
        if (errorEl && (errorEl.classList.contains('error') || errorEl.getAttribute('role') === 'alert')) {
            const text = errorEl.textContent?.trim();
            if (text)
                errors.push(text);
        }
    }
    // Check adjacent error elements
    const nextEl = el.nextElementSibling;
    if (nextEl && (nextEl.classList.contains('error-message') || nextEl.getAttribute('role') === 'alert')) {
        const text = nextEl.textContent?.trim();
        if (text)
            errors.push(text);
    }
    return errors;
}
function extractValidationRules(el) {
    const rules = [];
    if (el.required)
        rules.push({ type: 'required' });
    if (el.minLength > 0)
        rules.push({ type: 'minLength', value: el.minLength });
    if (el.maxLength > 0 && el.maxLength < 524288)
        rules.push({ type: 'maxLength', value: el.maxLength });
    if (el.min)
        rules.push({ type: 'min', value: el.min });
    if (el.max)
        rules.push({ type: 'max', value: el.max });
    if (el.pattern)
        rules.push({ type: 'pattern', value: el.pattern });
    return rules;
}
function inferFormPurpose(form, fields) {
    const action = (form.action ?? '').toLowerCase();
    const method = (form.method ?? 'get').toLowerCase();
    const dataRole = form.dataset.purpose ?? form.dataset.role ?? '';
    if (dataRole) {
        const normalized = dataRole.toLowerCase();
        if (['create', 'edit', 'search', 'filter', 'settings'].includes(normalized)) {
            return normalized;
        }
    }
    if (method === 'get' || action.includes('search') || fields.some((f) => f.name === 'q' || f.name === 'query' || f.name === 'search')) {
        return 'search';
    }
    if (fields.some((f) => f.name.includes('filter') || f.type === 'select') && fields.length <= 5) {
        return 'filter';
    }
    if (action.includes('settings') || action.includes('preferences') || action.includes('config')) {
        return 'settings';
    }
    // Check path context
    const path = window.location.pathname;
    if (path.includes('/new') || path.includes('/create'))
        return 'create';
    if (path.includes('/edit') || path.includes('/update'))
        return 'edit';
    if (path.includes('/settings') || path.includes('/preferences'))
        return 'settings';
    // Heuristic: forms with many text inputs are likely create/edit
    const textFields = fields.filter((f) => ['text', 'textarea', 'email', 'url'].includes(f.type));
    if (textFields.length >= 3)
        return method === 'post' ? 'create' : 'edit';
    return 'unknown';
}
// ============================================================================
// CONTENT EXTRACTION
// ============================================================================
function extractContent() {
    // Use main content area to avoid capturing sidebar, nav, and SAM chat text
    const mainEl = getMainContentElement();
    const headings = [];
    mainEl.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
        // Skip headings inside the SAM chat widget
        if (el.closest('[data-sam-theme]'))
            return;
        const text = el.textContent?.trim();
        if (text) {
            headings.push({
                level: parseInt(el.tagName[1], 10),
                text,
                id: el.id || undefined,
            });
        }
    });
    const tables = [];
    mainEl.querySelectorAll('table').forEach((table) => {
        if (table.closest('[data-sam-theme]'))
            return;
        const caption = table.querySelector('caption')?.textContent?.trim();
        const headers = Array.from(table.querySelectorAll('thead th, tr:first-child th')).map((th) => th.textContent?.trim() ?? '');
        const rows = table.querySelectorAll('tbody tr').length || table.querySelectorAll('tr').length;
        tables.push({ caption, headers, rowCount: rows });
    });
    const codeBlocks = [];
    mainEl.querySelectorAll('pre code, code[class*="language-"]').forEach((el) => {
        if (el.closest('[data-sam-theme]'))
            return;
        const langClass = Array.from(el.classList).find((c) => c.startsWith('language-'));
        const language = langClass ? langClass.replace('language-', '') : undefined;
        const preview = (el.textContent ?? '').slice(0, 200).trim();
        if (preview)
            codeBlocks.push({ language, preview });
    });
    const images = [];
    mainEl.querySelectorAll('img[alt]').forEach((el) => {
        if (el.closest('[data-sam-theme]'))
            return;
        const img = el;
        if (img.alt && img.src) {
            images.push({ alt: img.alt, src: img.src });
        }
    });
    // Extract visible text from main content area (not sidebar/chat), with 5000 char limit
    const textSummary = getVisibleText(mainEl, 5000);
    const wordCount = textSummary.split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.ceil(wordCount / 200);
    return {
        headings,
        tables,
        codeBlocks,
        images,
        textSummary,
        wordCount,
        readingTimeMinutes,
    };
}
// ============================================================================
// NAVIGATION ANALYSIS
// ============================================================================
function extractNavigation(maxLinks) {
    const links = [];
    const currentPath = window.location.pathname;
    const allLinks = document.querySelectorAll('a[href]');
    const seen = new Set();
    for (const el of Array.from(allLinks).slice(0, maxLinks * 2)) {
        const anchor = el;
        const href = anchor.getAttribute('href') ?? '';
        if (!href || href === '#' || href.startsWith('javascript:'))
            continue;
        if (seen.has(href))
            continue;
        seen.add(href);
        const text = anchor.textContent?.trim() ?? '';
        if (!text)
            continue;
        const category = categorizeLink(anchor, href);
        const isActive = href === currentPath || anchor.classList.contains('active') || anchor.getAttribute('aria-current') === 'page';
        links.push({
            href,
            text,
            category,
            ariaLabel: anchor.getAttribute('aria-label') ?? undefined,
            isActive,
        });
        if (links.length >= maxLinks)
            break;
    }
    // Tabs
    const tabEls = document.querySelectorAll('[role="tab"], [data-tab]');
    const tabs = tabEls.length > 0
        ? Array.from(tabEls).map((el) => ({
            label: el.textContent?.trim() ?? '',
            isActive: el.getAttribute('aria-selected') === 'true' || el.classList.contains('active'),
            href: el.href || undefined,
        }))
        : undefined;
    // Pagination
    const paginationEl = document.querySelector('[aria-label="pagination"], nav.pagination, [data-pagination]');
    let pagination;
    if (paginationEl) {
        const currentEl = paginationEl.querySelector('[aria-current="page"], .active, [data-current]');
        const current = currentEl ? parseInt(currentEl.textContent?.trim() ?? '1', 10) : 1;
        const allPages = Array.from(paginationEl.querySelectorAll('a, button'))
            .map((el) => parseInt(el.textContent?.trim() ?? '', 10))
            .filter((n) => !isNaN(n));
        const total = allPages.length > 0 ? Math.max(...allPages) : 1;
        pagination = {
            current: Number.isFinite(current) ? current : 1,
            total: Number.isFinite(total) ? total : 1,
            hasNext: !!paginationEl.querySelector('[aria-label*="next"], [rel="next"], .next'),
            hasPrev: !!paginationEl.querySelector('[aria-label*="prev"], [rel="prev"], .prev'),
        };
    }
    // Sidebar
    const sidebarEl = document.querySelector('aside nav, [role="navigation"][aria-label*="sidebar"], [data-sidebar]');
    const sidebar = sidebarEl
        ? Array.from(sidebarEl.querySelectorAll('a')).map((el) => {
            const anchor = el;
            const depth = countParentListDepth(anchor);
            return {
                label: anchor.textContent?.trim() ?? '',
                href: anchor.href,
                isActive: anchor.getAttribute('aria-current') === 'page' || anchor.classList.contains('active'),
                depth,
            };
        })
        : undefined;
    return { links, pagination, tabs, sidebar };
}
function categorizeLink(anchor, href) {
    // Breadcrumb
    if (anchor.closest('[aria-label="breadcrumb"], nav.breadcrumb'))
        return 'breadcrumb';
    // Pagination
    if (anchor.closest('[aria-label="pagination"], nav.pagination'))
        return 'pagination';
    // External
    try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin)
            return 'external';
    }
    catch {
        // relative URL
    }
    // Resource (downloads, files)
    if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|csv)$/i.test(href))
        return 'resource';
    // Action (buttons styled as links, CTA patterns)
    if (anchor.closest('[role="button"]') || anchor.classList.contains('btn') || anchor.classList.contains('button')) {
        return 'action';
    }
    return 'navigation';
}
function countParentListDepth(el) {
    let depth = 0;
    let current = el;
    while (current) {
        if (current.tagName === 'UL' || current.tagName === 'OL')
            depth++;
        current = current.parentElement;
    }
    return Math.max(0, depth - 1);
}
// ============================================================================
// INTERACTION STATE
// ============================================================================
function captureInteraction(pageLoadTime) {
    const docEl = document.documentElement;
    const scrollHeight = docEl.scrollHeight - docEl.clientHeight;
    const scrollPosition = scrollHeight > 0
        ? Math.round((docEl.scrollTop / scrollHeight) * 100)
        : 0;
    const focusedEl = document.activeElement;
    const focusedElement = focusedEl && focusedEl !== document.body
        ? describeElement(focusedEl)
        : undefined;
    const selection = window.getSelection();
    const selectedText = selection && selection.toString().trim()
        ? selection.toString().trim().slice(0, 500)
        : undefined;
    return {
        scrollPosition,
        viewportHeight: window.innerHeight,
        focusedElement,
        selectedText,
        timeOnPage: Math.round((Date.now() - pageLoadTime) / 1000),
    };
}
function describeElement(el) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const name = el.name ? `[name="${el.name}"]` : '';
    return `${tag}${id}${name}`;
}
// ============================================================================
// MAIN HOOK
// ============================================================================
export function useContextGathering(options = {}) {
    const { enabled = true, debounceMs = 500, includeContent = true, includeInteraction = true, maxForms = 5, maxLinks = 100, customProviders: initialProviders = [], } = options;
    const [snapshot, setSnapshot] = useState(null);
    const [isGathering, setIsGathering] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const optionsRef = useRef(options);
    optionsRef.current = options;
    const providersRef = useRef(initialProviders);
    const pageLoadTimeRef = useRef(Date.now());
    const lastHashRef = useRef('');
    const timerRef = useRef(null);
    const gather = useCallback(async () => {
        if (!enabled)
            return;
        if (typeof document === 'undefined')
            return;
        setIsGathering(true);
        try {
            // 1. Page detection
            const page = detectPageContext();
            // 2. Form scanning
            const forms = scanForms(maxForms);
            // 3. Content extraction
            const content = includeContent ? extractContent() : {
                headings: [],
                tables: [],
                codeBlocks: [],
                images: [],
                textSummary: '',
                wordCount: 0,
                readingTimeMinutes: 0,
            };
            // 4. Navigation analysis
            const navigation = extractNavigation(maxLinks);
            // 5. Interaction state
            const interaction = includeInteraction
                ? captureInteraction(pageLoadTimeRef.current)
                : { scrollPosition: 0, viewportHeight: 0, timeOnPage: 0 };
            // 6. Custom providers
            let custom = {};
            for (const provider of providersRef.current) {
                try {
                    const result = await provider.gather();
                    custom = { ...custom, [provider.name]: result };
                }
                catch {
                    // Skip failed providers
                }
            }
            // 7. Content hash for change detection
            const hashInput = `${page.path}:${page.type}:${page.title}:${forms.length}:${content.wordCount}:${JSON.stringify(forms.map((f) => f.fields.map((fi) => `${fi.name}=${String(fi.value ?? '')}`)))}`;
            const contentHash = simpleHash(hashInput);
            // Skip if no change
            if (contentHash === lastHashRef.current) {
                setIsGathering(false);
                return;
            }
            lastHashRef.current = contentHash;
            const newSnapshot = {
                version: CONTEXT_SNAPSHOT_VERSION,
                timestamp: Date.now(),
                contentHash,
                page,
                forms,
                content,
                navigation,
                interaction,
                custom,
            };
            setSnapshot(newSnapshot);
            setLastUpdated(new Date());
            optionsRef.current.onSnapshotReady?.(newSnapshot);
        }
        finally {
            setIsGathering(false);
        }
    }, [enabled, maxForms, maxLinks, includeContent, includeInteraction]);
    const debouncedGather = useCallback(() => {
        if (timerRef.current)
            clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            gather();
        }, debounceMs);
    }, [gather, debounceMs]);
    const refresh = useCallback(() => {
        lastHashRef.current = '';
        gather();
    }, [gather]);
    const registerProvider = useCallback((provider) => {
        providersRef.current = [...providersRef.current.filter((p) => p.name !== provider.name), provider];
    }, []);
    // Initial gather + MutationObserver + SPA listeners
    useEffect(() => {
        if (!enabled || typeof document === 'undefined')
            return;
        // Initial gather
        pageLoadTimeRef.current = Date.now();
        gather();
        // MutationObserver for DOM changes
        const observer = new MutationObserver(() => {
            debouncedGather();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        // SPA navigation
        const onNav = () => {
            pageLoadTimeRef.current = Date.now();
            lastHashRef.current = '';
            debouncedGather();
        };
        window.addEventListener('popstate', onNav);
        // Intercept pushState/replaceState
        const origPush = history.pushState.bind(history);
        const origReplace = history.replaceState.bind(history);
        history.pushState = (...args) => {
            origPush(...args);
            onNav();
        };
        history.replaceState = (...args) => {
            origReplace(...args);
            onNav();
        };
        // Form change listener
        const onInput = () => debouncedGather();
        document.addEventListener('input', onInput, true);
        document.addEventListener('change', onInput, true);
        return () => {
            observer.disconnect();
            window.removeEventListener('popstate', onNav);
            document.removeEventListener('input', onInput, true);
            document.removeEventListener('change', onInput, true);
            history.pushState = origPush;
            history.replaceState = origReplace;
            if (timerRef.current)
                clearTimeout(timerRef.current);
        };
    }, [enabled, gather, debouncedGather]);
    return {
        snapshot,
        isGathering,
        lastUpdated,
        refresh,
        registerProvider,
    };
}
