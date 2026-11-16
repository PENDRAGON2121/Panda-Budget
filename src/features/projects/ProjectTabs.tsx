import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export type TabId = 'gastos' | 'movimientos';
const TABS: { id: TabId; label: string }[] = [
  { id: 'gastos', label: 'Gastos' },
  { id: 'movimientos', label: 'Movimientos' },
];

/**
 * Segmented control with a sliding pill (shared `layoutId`) + directionally animated panel.
 * Built from plain buttons with full tablist ARIA and arrow-key navigation (HeroUI Tabs unmounts inactive
 * panels, which prevents the directional exit animation). Reduced motion is handled by the app-level MotionConfig.
 */
export function ProjectTabs({
  value,
  onChange,
  panels,
}: {
  value: TabId;
  onChange: (id: TabId) => void;
  panels: Record<TabId, ReactNode>;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const index = TABS.findIndex((t) => t.id === value);
  // Slide direction is decided in the event handler (state), never by mutating a ref during render.
  const [dir, setDir] = useState<1 | -1>(1);
  const select = (id: TabId) => {
    setDir(TABS.findIndex((t) => t.id === id) >= index ? 1 : -1);
    onChange(id);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    select(TABS[next].id);
    refs.current[TABS[next].id]?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="Secciones del proyecto"
        onKeyDown={onKeyDown}
        className="grid grid-cols-2"
        style={{
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(36,33,43,0.08)',
          borderRadius: 14,
          padding: 4,
          boxShadow: 'inset 0 1px 2px rgba(36,33,43,0.05)',
        }}
      >
        {TABS.map((t) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active}
              aria-controls={active ? `panel-${t.id}` : undefined}
              tabIndex={active ? 0 : -1}
              onClick={() => select(t.id)}
              className="relative h-9 cursor-pointer border-0 bg-transparent font-display text-[14px] font-extrabold outline-none focus-visible:ring-2 focus-visible:ring-leaf"
              style={{ color: active ? '#24212b' : '#5d5866', borderRadius: 11 }}
            >
              {active && (
                <motion.span
                  layoutId="project-tab-pill"
                  aria-hidden
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0"
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(36,33,43,0.06)',
                    borderRadius: 11,
                    boxShadow: '0 1px 2px rgba(36,33,43,0.08), 0 4px 10px -6px rgba(46,90,34,0.35)',
                  }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={value}
          role="tabpanel"
          id={`panel-${value}`}
          aria-labelledby={`tab-${value}`}
          aria-label={TABS[index].label}
          custom={dir}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: 28 * d }),
            center: { opacity: 1, x: 0 },
            exit: (d: number) => ({ opacity: 0, x: -28 * d }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {panels[value]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
