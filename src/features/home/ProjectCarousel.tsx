import { useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { Expense, Payment, Project } from '../../db/types';
import { formatCRC } from '../../lib/money';
import { projectSummary } from '../../lib/calc';

interface Props {
  projects: Project[];
  expenses: Expense[];
  payments: Payment[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function ProjectCarousel({ projects, expenses, payments, activeIndex, onSelect }: Props) {
  const [viewportRef, embla] = useEmblaCarousel({ loop: true, align: 'center' });

  useEffect(() => {
    if (!embla) return;
    const handler = () => onSelect(embla.selectedScrollSnap());
    embla.on('select', handler);
    return () => {
      embla.off('select', handler);
    };
  }, [embla, onSelect]);

  const goTo = useCallback(
    (i: number) => {
      onSelect(i);
      embla?.scrollTo(i);
    },
    [embla, onSelect],
  );

  return (
    <div>
      <div ref={viewportRef} className="overflow-hidden" data-testid="carousel">
        <div className="flex">
          {projects.map((p) => {
            const exps = expenses.filter((e) => e.projectId === p.id);
            const s = projectSummary(p, exps, payments);
            return (
              <div key={p.id} className="min-w-0 shrink-0 grow-0 basis-[86%] px-1.5">
                <article className="rounded-lg bg-white p-4 shadow-card" aria-label={`Proyecto ${p.name}`}>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="break-words font-display text-[15px] font-black text-ink">{p.name}</h2>
                    <span className="shrink-0 rounded-full bg-icon-bg px-2.5 py-0.5 text-[10.5px] font-extrabold text-green-deep">
                      {Math.round(s.pct)}% ejecutado
                    </span>
                  </div>
                  <div className="my-1 text-3xl font-extrabold tabular-nums tracking-tight text-ink">
                    {formatCRC(p.totalBudget)}
                  </div>
                  <div className="mt-2 flex gap-6 text-[11.5px] font-semibold text-ink-muted">
                    <div>
                      Pagado
                      <b className="block text-sm font-extrabold tabular-nums text-ink">{formatCRC(s.paid)}</b>
                    </div>
                    <div>
                      Disponible
                      <b className={`block text-sm font-extrabold tabular-nums ${s.available < 0 ? 'text-danger' : 'text-ink'}`}>
                        {formatCRC(s.available)}
                      </b>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Proyectos">
        {projects.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Ir a ${p.name}`}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full border-0 p-0 transition-all ${i === activeIndex ? 'w-5 bg-leaf' : 'w-2 bg-shade'}`}
          />
        ))}
      </div>
    </div>
  );
}
