import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { decideBack } from './back';

/** Native-only behaviour (Android back button, status bar). Renders nothing; no-op on the web. */
export function NativeShell({ path }: { path: string }) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    void StatusBar.setBackgroundColor({ color: '#dcefd8' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handle = CapApp.addListener('backButton', ({ canGoBack }) => {
      // Open HeroUI overlays (Modal/Drawer) are modal dialogs: dismiss them first, like Escape would.
      const dialog = document.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]');
      if (dialog) {
        dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
        return;
      }
      if (decideBack(path, canGoBack || window.history.length > 1) === 'back') window.history.back();
      else void CapApp.exitApp();
    });
    return () => {
      void handle.then((h) => h.remove());
    };
  }, [path]);

  return null;
}
