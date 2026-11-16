import { useCallback, useEffect, useRef, useState } from 'react';

/** A text field lost focus this recently → the soft keyboard is probably still animating closed. */
const RECENT_EDIT_MS = 600;
/** If no resize starts within this time, there was no soft keyboard (desktop, hardware keyboard). */
const GRACE_MS = 180;
/** Viewport counts as settled after this long without a resize. */
const QUIET_MS = 110;
/** Never delay opening more than this. */
const MAX_WAIT_MS = 700;

let lastEditBlurAt = -Infinity;

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly;
  if (el instanceof HTMLInputElement) {
    const nonText = ['button', 'checkbox', 'radio', 'range', 'color', 'file', 'submit', 'reset', 'image', 'hidden'];
    return !el.readOnly && !nonText.includes(el.type);
  }
  return false;
}

if (typeof document !== 'undefined') {
  document.addEventListener(
    'focusout',
    (e) => {
      if (isEditable(e.target)) lastEditBlurAt = performance.now();
    },
    true,
  );
}

/**
 * Controlled open state for overlay triggers (Select, menus) inside forms on mobile.
 *
 * Tapping a Select while typing closes the soft keyboard; the viewport then resizes and the dialog moves, but the
 * popover was already positioned against the old layout and is left floating. When a text field was just being
 * edited, this waits for the viewport to stop resizing before opening, so the popover anchors to the final layout.
 */
export function useKeyboardSafeOpen() {
  const [isOpen, setIsOpen] = useState(false);
  const cancelPending = useRef<(() => void) | null>(null);

  const clearPending = () => {
    cancelPending.current?.();
    cancelPending.current = null;
  };

  useEffect(() => clearPending, []);

  const onOpenChange = useCallback((open: boolean) => {
    clearPending();
    const editingJustNow =
      isEditable(document.activeElement) || performance.now() - lastEditBlurAt < RECENT_EDIT_MS;
    if (!open || !editingJustNow) {
      setIsOpen(open);
      return;
    }

    (document.activeElement as HTMLElement | null)?.blur?.();
    const target: EventTarget = window.visualViewport ?? window;
    let quietTimer = setTimeout(finish, GRACE_MS);
    const capTimer = setTimeout(finish, MAX_WAIT_MS);
    const onResize = () => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(finish, QUIET_MS);
    };
    target.addEventListener('resize', onResize);
    if (target !== window) window.addEventListener('resize', onResize);

    function cleanup() {
      clearTimeout(quietTimer);
      clearTimeout(capTimer);
      target.removeEventListener('resize', onResize);
      if (target !== window) window.removeEventListener('resize', onResize);
    }
    function finish() {
      cleanup();
      cancelPending.current = null;
      setIsOpen(true);
    }
    cancelPending.current = cleanup;
  }, []);

  return { isOpen, onOpenChange };
}
