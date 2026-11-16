import { useCallback, useEffect, useRef, useState } from 'react';
import { useAllExpenses, useAllPayments, useProjects } from '../../db/hooks';
import pandaIcon from '../../assets/panda-app-icon.svg';
import { EmptyHome } from './EmptyHome';
import { HomeGastos } from './HomeGastos';
import { ProjectCarousel } from './ProjectCarousel';

export function HomeScreen() {
  const projects = useProjects();
  const expenses = useAllExpenses();
  const payments = useAllPayments();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const prev = useRef(0);
  const count = projects?.length ?? 0;
  // When the list shrinks (e.g. a project was deleted) the stored index may point past the end: clamp and re-sync.
  const safeIndex = count > 0 ? Math.min(index, count - 1) : 0;
  useEffect(() => {
    if (index !== safeIndex) {
      prev.current = safeIndex;
      setIndex(safeIndex);
    }
  }, [index, safeIndex]);

  const onSelect = useCallback(
    (next: number) => {
      if (next === prev.current || count === 0) return;
      // shortest way around the loop decides the direction
      const fwd = (next - prev.current + count) % count;
      setDirection(fwd <= count / 2 ? 1 : -1);
      prev.current = next;
      setIndex(next);
    },
    [count],
  );

  if (!projects || !expenses || !payments) return null;
  if (projects.length === 0) return <EmptyHome />;

  const active = projects[safeIndex];
  return (
    <div>
      <header className="flex items-center gap-3 pb-3.5 pt-2">
        <div className="size-[46px] shrink-0 overflow-hidden rounded-[15px] shadow-card">
          <img src={pandaIcon} alt="Panda Wallet" className="block size-full object-cover" />
        </div>
        <div>
          <div className="font-sans text-xs font-semibold text-ink-muted">¡Hola! 👋</div>
          <h1 className="font-display text-lg font-black leading-tight text-ink">Bienvenido</h1>
        </div>
      </header>
      <div className="-mx-[18px]">
        <ProjectCarousel
          projects={projects}
          expenses={expenses}
          payments={payments}
          activeIndex={safeIndex}
          onSelect={onSelect}
        />
      </div>
      <HomeGastos projectId={active.id} direction={direction} />
    </div>
  );
}
