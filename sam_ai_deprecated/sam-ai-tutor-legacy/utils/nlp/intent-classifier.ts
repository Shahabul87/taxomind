export type SAMIntent = 'presence' | 'retrieve' | 'modify';

export interface IntentResult {
  intent: SAMIntent | null;
  target?: string;
  value?: string;
}

const PRESENCE_TRIGGERS = [
  'can you see', 'do you see', 'can you access', 'can you find',
  'is there', 'do we have', 'is the', 'do you have'
];

const RETRIEVE_TRIGGERS = [
  'what is', "what's", 'tell me', 'show me', 'read', 'get', 'fetch'
];

const MODIFY_VERBS = ['set', 'change', 'update', 'edit', 'modify'];

export function classifyIntent(text: string): IntentResult {
  const t = (text || '').toLowerCase().trim();
  if (!t) return { intent: null };

  // Modify intent: set/change/update/edit X to Y
  const modifyRe = new RegExp(`(?:${MODIFY_VERBS.join('|')})\\s+([^]+?)\\s+(?:to|as)\\s+(.+)`, 'i');
  const m = t.match(modifyRe);
  if (m && m[1] && m[2]) {
    const target = m[1].trim();
    const raw = m[2].trim();
    const value = raw.replace(/^"|^'|"$|'$/g, '').trim();
    return { intent: 'modify', target, value };
  }

  // Presence intent
  if (PRESENCE_TRIGGERS.some(k => t.includes(k))) {
    // Extract a simple target by removing trigger text; fallback to remainder
    for (const trig of PRESENCE_TRIGGERS) {
      const idx = t.indexOf(trig);
      if (idx >= 0) {
        const after = t.slice(idx + trig.length).trim();
        const target = after.replace(/^the\s+/, '').replace(/\?+$/, '').trim();
        return { intent: 'presence', target };
      }
    }
    return { intent: 'presence' };
  }

  // Retrieve intent
  if (RETRIEVE_TRIGGERS.some(k => t.includes(k))) {
    for (const trig of RETRIEVE_TRIGGERS) {
      const idx = t.indexOf(trig);
      if (idx >= 0) {
        const after = t.slice(idx + trig.length).trim();
        const target = after.replace(/^the\s+/, '').replace(/\?+$/, '').trim();
        return { intent: 'retrieve', target };
      }
    }
    return { intent: 'retrieve' };
  }

  // Special shorthand for follow-ups: "what it is" / "what is it"
  if (/what\s+(it\s+is|is\s+it)/i.test(t)) {
    return { intent: 'retrieve' };
  }

  // Modify without value: "change X" or "update X"
  const modifyNoValue = new RegExp(`(?:${MODIFY_VERBS.join('|')})\\s+(.+)`, 'i');
  const mv = t.match(modifyNoValue);
  if (mv && mv[1]) {
    const target = mv[1].trim();
    return { intent: 'modify', target };
  }

  return { intent: null };
}

