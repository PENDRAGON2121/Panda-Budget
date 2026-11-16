import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { requestPersistence } from './lib/storage';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import './styles.css';

// Ask once that local data not be evicted (guarded: no-op where the Storage API is missing).
void requestPersistence();

// PWA service worker: registered by <UpdateManager> (prompt mode, web only; skipped in the Capacitor shell).

// HeroUI v3 needs no provider; styles come from @heroui/styles (imported in styles.css).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
