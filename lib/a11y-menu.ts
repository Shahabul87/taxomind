/**
 * Accessibility Keyboard Navigation Utilities
 *
 * Provides keyboard navigation handlers for the sidebar menu:
 * - Arrow keys for navigation
 * - Escape for closing menus
 * - Enter/Space for activation
 * - Tab for focus management
 */

export interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
}

/**
 * Handle keyboard navigation for menu items
 */
export function handleMenuKeyDown(
  event: React.KeyboardEvent,
  options: KeyboardNavigationOptions
): void {
  const { key } = event;

  switch (key) {
    case 'Escape':
      event.preventDefault();
      options.onEscape?.();
      break;

    case 'Enter':
    case ' ': // Space
      event.preventDefault();
      options.onEnter?.();
      break;

    case 'ArrowUp':
      event.preventDefault();
      options.onArrowUp?.();
      break;

    case 'ArrowDown':
      event.preventDefault();
      options.onArrowDown?.();
      break;

    case 'ArrowLeft':
      event.preventDefault();
      options.onArrowLeft?.();
      break;

    case 'ArrowRight':
      event.preventDefault();
      options.onArrowRight?.();
      break;

    case 'Home':
      event.preventDefault();
      options.onHome?.();
      break;

    case 'End':
      event.preventDefault();
      options.onEnd?.();
      break;

    default:
      break;
  }
}

/**
 * Focus first focusable element in container
 */
export function focusFirstElement(container: HTMLElement | null): void {
  if (!container) return;

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
}

/**
 * Focus last focusable element in container
 */
export function focusLastElement(container: HTMLElement | null): void {
  if (!container) return;

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[focusableElements.length - 1].focus();
  }
}

/**
 * Focus next element in container
 */
export function focusNextElement(container: HTMLElement | null): void {
  if (!container) return;

  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.findIndex(
    (el) => el === document.activeElement
  );

  if (currentIndex < focusableElements.length - 1) {
    focusableElements[currentIndex + 1].focus();
  } else {
    // Wrap to first
    focusableElements[0].focus();
  }
}

/**
 * Focus previous element in container
 */
export function focusPreviousElement(container: HTMLElement | null): void {
  if (!container) return;

  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.findIndex(
    (el) => el === document.activeElement
  );

  if (currentIndex > 0) {
    focusableElements[currentIndex - 1].focus();
  } else {
    // Wrap to last
    focusableElements[focusableElements.length - 1].focus();
  }
}

/**
 * Get all focusable elements in a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Trap focus within a container (for modals, dialogs)
 */
export function trapFocus(
  container: HTMLElement,
  event: KeyboardEvent
): void {
  if (event.key !== 'Tab') return;

  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    // Shift + Tab: Moving backwards
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab: Moving forwards
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

/**
 * Generate unique ID for ARIA relationships
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
