import type { ReactNode } from 'react';
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

export function TabBar() {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md items-center justify-around bg-white/70 px-2.5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
    >
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 font-sans text-[10px] font-bold transition-opacity ${
              isActive ? 'text-leaf opacity-100' : 'text-ink opacity-45'
            }`
          }
        >
          {t.icon}
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
