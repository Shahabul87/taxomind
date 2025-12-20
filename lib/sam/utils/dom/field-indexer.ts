export interface FieldMeta {
  id?: string;
  name?: string;
  type?: string;
  tagName: string;
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  role?: string;
}

export interface FieldMatch extends FieldMeta {
  confidence: number; // 0..1
  key?: string; // semantic key if identified (e.g., 'title')
}

const getLabelFor = (el: HTMLElement): string | undefined => {
  const id = el.getAttribute('id');
  if (id) {
    const forLabel = document.querySelector(`label[for="${CSS && (CSS as any).escape ? (CSS as any).escape(id) : id}"]`) as HTMLLabelElement | null;
    if (forLabel?.textContent) return forLabel.textContent.trim();
  }
  const wrappingLabel = el.closest('label');
  if (wrappingLabel?.textContent) return wrappingLabel.textContent.trim();
  const aria = el.getAttribute('aria-label') || undefined;
  if (aria) return aria;
  const placeholder = (el as HTMLInputElement | HTMLTextAreaElement).placeholder || undefined;
  if (placeholder) return placeholder;
  return undefined;
};

export function buildFieldIndex(): FieldMeta[] {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(
    'input, textarea, select, [contenteditable="true"], [data-field], [role="textbox"]'
  ));

  const fields: FieldMeta[] = nodes.map((el) => {
    const tagName = el.tagName.toLowerCase();
    const type = (el as HTMLInputElement).type || (tagName === 'textarea' ? 'textarea' : tagName);
    const id = el.getAttribute('id') || undefined;
    const name = (el as HTMLInputElement).name || undefined;
    const label = getLabelFor(el);
    const ariaLabel = el.getAttribute('aria-label') || undefined;
    const placeholder = (el as HTMLInputElement | HTMLTextAreaElement).placeholder || undefined;
    const required = (el as HTMLInputElement).required || false;
    const disabled = (el as HTMLInputElement).disabled || false;
    const readOnly = (el as HTMLInputElement).readOnly || false;
    const role = el.getAttribute('role') || undefined;

    return { id, name, type, tagName, label, ariaLabel, placeholder, required, disabled, readOnly, role };
  });

  // De-duplicate by id/name/tag/label signature
  const seen = new Set<string>();
  const unique: FieldMeta[] = [];
  for (const f of fields) {
    const sig = [f.id, f.name, f.type, f.label, f.ariaLabel, f.placeholder, f.tagName].join('|').toLowerCase();
    if (!seen.has(sig)) {
      seen.add(sig);
      unique.push(f);
    }
  }
  return unique;
}

export function resolveFieldByPhrase(
  fields: FieldMeta[],
  phrase: string,
  synonyms: Record<string, string[]>
): FieldMatch | null {
  const q = phrase.toLowerCase().trim();
  if (!q) return null;

  // 1) Try synonyms by key
  let best: FieldMatch | null = null;
  const all = Object.entries(synonyms).flatMap(([key, syns]) => syns.map(s => ({ key, syn: s })));

  const scoreField = (f: FieldMeta, needle: string): number => {
    const hay = [f.label, f.name, f.ariaLabel, f.placeholder, f.type, f.tagName]
      .filter(Boolean)
      .map(s => (s as string).toLowerCase())
      .join(' ');
    if (!hay) return 0;
    if (hay.includes(needle)) return 1;
    // Partial token overlap score
    const htokens = new Set(hay.split(/[^a-z0-9]+/g).filter(Boolean));
    const ntokens = new Set(needle.split(/[^a-z0-9]+/g).filter(Boolean));
    const inter = [...ntokens].filter(t => htokens.has(t)).length;
    return inter > 0 ? Math.min(0.9, inter / Math.max(3, htokens.size)) : 0;
  };

  for (const { key, syn } of all) {
    if (q.includes(syn.toLowerCase())) {
      for (const f of fields) {
        const s = scoreField(f, syn.toLowerCase());
        if (s > (best?.confidence || 0)) best = { ...f, confidence: s, key };
      }
    }
  }

  // 2) Fallback: direct phrase match over fields
  if (!best) {
    for (const f of fields) {
      const s = scoreField(f, q);
      if (s > (best?.confidence || 0)) best = { ...f, confidence: s };
    }
  }

  // Confidence threshold to avoid random picks
  if (best && best.confidence >= 0.4) return best;
  return null;
}

