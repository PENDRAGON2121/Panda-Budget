import { useCallback, useEffect, useMemo } from 'react';
import { Card } from '@heroui/react';
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

export const SLIDE_BASIS_PCT = 86;

export interface LoopSlide {
  key: string;
  project: Project;
  /** index of the real project this slide represents */
  realIndex: number;
  isClone: boolean;
}

/**
 * embla only enables `loop` when the slides other than any one slide cover the
 * viewport (`canLoop`). With 86% slides that needs >= 3 slides, so with exactly
 * 2 projects we render the set twice (4 slides) and map clones back to the real
 * project. 1 project needs no loop; 3+ already satisfy the condition.
 */
export function buildLoopSlides(projects: Project[]): LoopSlide[] {
  const copies = projects.length === 2 ? 2 : 1;
  return Array.from({ length: copies }, (_, c) =>
    projects.map((project, realIndex) => ({
      key: c === 0 ? project.id : `${project.id}-clone${c}`,
      project,
      realIndex,
      isClone: c > 0,
    })),
  ).flat();
}

export function ProjectCarousel({ projects, expenses, payments, activeIndex, onSelect }: Props) {
  const slides = useMemo(() => buildLoopSlides(projects), [projects]);
  const [viewportRef, embla] = useEmblaCarousel({ loop: projects.length > 1, align: 'center' });

  useEffect(() => {
    if (!embla) return;
    const handler = () => onSelect(slides[embla.selectedScrollSnap()]?.realIndex ?? 0);
    embla.on('select', handler);
    return () => {
      embla.off('select', handler);
    };
  }, [embla, onSelect, slides]);

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
          {slides.map(({ key, project: p, isClone }) => {
            const exps = expenses.filter((e) => e.projectId === p.id);
            const s = projectSummary(p, exps, payments);
            return (
              <div
                key={key}
                data-testid="carousel-slide"
                aria-hidden={isClone || undefined}
                className="min-w-0 shrink-0 grow-0 px-1.5"
                style={{ flexBasis: `${SLIDE_BASIS_PCT}%` }}
              >
                <Card
                  role="article"
                  aria-label={isClone ? undefined : `Proyecto ${p.name}`}
                  className="rounded-lg shadow-card"
                >
                  <Card.Content className="gap-0 p-1">
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
                  </Card.Content>
                </Card>
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
