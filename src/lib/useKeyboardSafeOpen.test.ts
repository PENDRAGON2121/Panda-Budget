import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useKeyboardSafeOpen } from './useKeyboardSafeOpen';

function focusThenBlurInput() {
  const input = document.createElement('input');
  document.body.appendChild(input);
  input.focus();
  input.blur();
  input.remove();
}

describe('useKeyboardSafeOpen', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('opens immediately when no text field was just being edited', () => {
    const { result } = renderHook(() => useKeyboardSafeOpen());
    act(() => result.current.onOpenChange(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('closes immediately', () => {
    const { result } = renderHook(() => useKeyboardSafeOpen());
    act(() => result.current.onOpenChange(true));
    act(() => result.current.onOpenChange(false));
    expect(result.current.isOpen).toBe(false);
  });

  it('waits for the viewport to settle after leaving a text field (keyboard closing)', () => {
    const { result } = renderHook(() => useKeyboardSafeOpen());
    act(() => focusThenBlurInput());
    act(() => result.current.onOpenChange(true));
    expect(result.current.isOpen).toBe(false);

    // keyboard animates closed: a burst of resizes
    act(() => {
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(60);
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(60);
    });
    expect(result.current.isOpen).toBe(false);

    act(() => vi.advanceTimersByTime(120)); // quiet period after the last resize
    expect(result.current.isOpen).toBe(true);
  });

  it('opens after a short grace period when the viewport never resizes (no soft keyboard)', () => {
    const { result } = renderHook(() => useKeyboardSafeOpen());
    act(() => focusThenBlurInput());
    act(() => result.current.onOpenChange(true));
    expect(result.current.isOpen).toBe(false);
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.isOpen).toBe(true);
  });

  it('never waits longer than the cap even if resizes keep coming', () => {
    const { result } = renderHook(() => useKeyboardSafeOpen());
    act(() => focusThenBlurInput());
    act(() => result.current.onOpenChange(true));
    act(() => {
      for (let i = 0; i < 20; i++) {
        window.dispatchEvent(new Event('resize'));
        vi.advanceTimersByTime(50);
      }
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('a close request cancels a pending open', () => {
    const { result } = renderHook(() => useKeyboardSafeOpen());
    act(() => focusThenBlurInput());
    act(() => result.current.onOpenChange(true));
    act(() => result.current.onOpenChange(false));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.isOpen).toBe(false);
  });
});
