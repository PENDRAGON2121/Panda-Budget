import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';

const icon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[22px] w-[22px]" aria-hidden="true">
    {children}
  </svg>
);

const tabs = [
  { to: '/', label: 'Inicio', end: true, icon: icon(<path d="M3 10l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />) },
  { to: '/proyectos', label: 'Proyectos', icon: icon(<><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 9h18" /></>) },
  { to: '/calendario', label: 'Calendario', icon: icon(<><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M3 9h18M8 2v4M16 2v4" /></>) },
  { to: '/perfil', label: 'Perfil', icon: icon(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>) },
];

/** Floating island (level 2). The active pill is one shared-layout element that glides between tabs. */
export function TabBar() {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-3 bottom-[max(14px,env(safe-area-inset-bottom))] z-50 mx-auto flex h-[66px] max-w-[calc(28rem-24px)] items-center gap-1 rounded-[24px] border border-hairline-strong bg-white p-1.5 shadow-float"
    >
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className="relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 rounded-[18px] font-sans text-[10px] no-underline outline-none focus-visible:ring-2 focus-visible:ring-leaf"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  data-testid="nav-pill"
                  aria-hidden
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-[18px] bg-nav-pill"
                />
              )}
              <span className={`relative ${isActive ? 'text-[#2f6f22]' : 'text-ink-muted'}`}>{t.icon}</span>
              <span className={`relative ${isActive ? 'font-extrabold text-ink' : 'font-bold text-ink-muted'}`}>{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
