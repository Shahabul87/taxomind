"use client";

import { EventTracker } from './event-tracker';

let initialized = false;

export function initAnalyticsDomBridge(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const tracker = EventTracker.getInstance();

  const onImpression = (e: Event) => {
    const detail = (e as CustomEvent).detail || {};
    tracker.trackInteraction('card_impression', { targetId: detail.id });
  };

  const onClick = (e: Event) => {
    const detail = (e as CustomEvent).detail || {};
    tracker.trackClick(detail.id || 'unknown', { targetId: detail.id });
  };

  const onViewTime = (e: Event) => {
    const detail = (e as CustomEvent).detail || {};
    tracker.trackInteraction('card_view_time', { targetId: detail.id, ms: detail.ms });
  };

  window.addEventListener('analytics:impression' as any, onImpression as any);
  window.addEventListener('analytics:click' as any, onClick as any);
  window.addEventListener('analytics:viewtime' as any, onViewTime as any);
}

