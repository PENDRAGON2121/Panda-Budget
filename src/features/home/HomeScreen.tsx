import { useCallback, useRef, useState } from 'react';
import { useAllExpenses, useAllPayments, useProjects } from '../../db/hooks';
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

  const active = projects[Math.min(index, projects.length - 1)];
  return (
    <div>
      <h1 className="mb-3 font-display text-[22px] font-black text-ink">Inicio</h1>
      <div className="-mx-[18px]">
        <ProjectCarousel
          projects={projects}
          expenses={expenses}
          payments={payments}
          activeIndex={index}
          onSelect={onSelect}
        />
      </div>
      <HomeGastos projectId={active.id} direction={direction} />
    </div>
  );
}
