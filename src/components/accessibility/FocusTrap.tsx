import React, { useEffect, useRef } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  returnFocusOnDeactivate?: boolean;
  /** Auto-focus the first focusable element when activated. Defaults to true. */
  autoFocus?: boolean;
}

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
  ).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      el.getAttribute('aria-hidden') !== 'true' &&
      // Element is rendered (not display:none)
      el.offsetParent !== null,
  );
}

export function FocusTrap({
  children,
  active = true,
  returnFocusOnDeactivate = true,
  autoFocus = true,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    previousActiveElement.current = document.activeElement;

    // Focus first focusable element on activation.
    if (autoFocus) {
      const focusables = getFocusable(container);
      const initial = focusables[0] ?? container;
      // Make container focusable as a fallback so screen readers land inside.
      if (initial === container && !container.hasAttribute('tabindex')) {
        container.setAttribute('tabindex', '-1');
      }
      // Defer focus to after Radix/Portal mount completes.
      requestAnimationFrame(() => initial.focus());
    }

    // Listen on document so the trap works regardless of where focus is,
    // including content rendered inside Portals nested under the container.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (!containerRef.current) return;

      const focusables = getFocusable(containerRef.current);
      if (focusables.length === 0) {
        // Nothing to focus – keep focus on container itself.
        e.preventDefault();
        containerRef.current.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      const isInside = activeEl ? containerRef.current.contains(activeEl) : false;

      if (!isInside) {
        // Focus escaped the trap — pull it back.
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }

      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);

      if (
        returnFocusOnDeactivate &&
        previousActiveElement.current instanceof HTMLElement
      ) {
        // Defer to avoid race with unmount of focused element.
        requestAnimationFrame(() => {
          (previousActiveElement.current as HTMLElement)?.focus?.();
        });
      }
    };
  }, [active, returnFocusOnDeactivate, autoFocus]);

  return (
    <div ref={containerRef} data-focus-trap={active ? 'active' : 'inactive'}>
      {children}
    </div>
  );
}
