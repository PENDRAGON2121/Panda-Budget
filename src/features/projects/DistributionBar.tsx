import type { Expense } from '../../db/types';
import type { DistributionSegment } from '../../lib/calc';

const PALETTE = ['bg-leaf', 'bg-leaf-light', 'bg-bamboo', 'bg-green-deep', 'bg-highlight'];
const DOT = ['#4f9e34', '#6db546', '#7cc04b', '#3c8a2e', '#b9e28f'];

interface Props {
  expenses: Expense[];
  /** From projectSummary: PAID per gasto over the total budget (scaled by paid when overspent). */
  distribution: DistributionSegment[];
  freePct: number;
  overflowPct: number;
}

const w = (pct: number) => `${Math.round(pct * 100) / 100}%`;

/**
 * "En qué se fue la plata": one segment per gasto sized by what was PAID, plus Disponible (= what is left of
 * the total). A gasto paid over its plan is danger red. When total paid exceeds the budget the bar is scaled
 * by paid and the overspent tail is marked as Sobregiro. Over-allocation is a separate banner.
 */
export function DistributionBar({ expenses, distribution, freePct, overflowPct }: Props) {
  const byId = new Map(distribution.map((d) => [d.expenseId, d]));
  return (
    <div>
      <div
        role="img"
        aria-label="Distribución del presupuesto"
        className="relative my-4 flex h-3.5 gap-0.5 overflow-hidden rounded-full rail"
      >
        {expenses.map((e, i) => {
          const d = byId.get(e.id);
          return (
            <span
              key={e.id}
              data-testid="segment-expense"
              data-expense={e.name}
              className={`block h-full ${d?.over ? 'bg-danger' : PALETTE[i % PALETTE.length]}`}
              style={{ width: w(d?.pct ?? 0) }}
            />
          );
        })}
        <span data-testid="segment-disponible" className="block h-full bg-track-strong" style={{ width: w(freePct) }} />
        {overflowPct > 0 && (
          <span
            data-testid="segment-over"
            className="absolute inset-y-0 right-0 block border-l-2 border-white bg-danger/80"
            style={{ width: w(overflowPct) }}
          />
        )}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1.5 p-0">
        {expenses.map((e, i) => {
          const over = byId.get(e.id)?.over;
          return (
            <li
              key={e.id}
              className={`flex items-center gap-1.5 text-[10.5px] font-semibold ${over ? 'text-danger' : 'text-ink-muted'}`}
            >
              <i className="block h-2 w-2 rounded-[3px]" style={{ background: over ? '#e0592f' : DOT[i % DOT.length] }} />
              {e.name}
            </li>
          );
        })}
        <li className="flex items-center gap-1.5 text-[10.5px] font-semibold text-ink-muted">
          <i className="block h-2 w-2 rounded-[3px] bg-track-strong" />
          Disponible
        </li>
        {overflowPct > 0 && (
          <li className="flex items-center gap-1.5 text-[10.5px] font-semibold text-danger">
            <i className="block h-2 w-2 rounded-[3px] bg-danger" />
            Sobregiro
          </li>
        )}
      </ul>
    </div>
  );
}
