import type { Expense } from '../../db/types';

const PALETTE = ['bg-leaf', 'bg-leaf-light', 'bg-bamboo', 'bg-green-deep', 'bg-highlight'];
const DOT = ['#4f9e34', '#6db546', '#7cc04b', '#3c8a2e', '#b9e28f'];

interface Props {
  expenses: Expense[];
  totalBudget: number;
}

/** Multi-segment "en qué se fue la plata" bar: one segment per expense + disponible. Over-spend in danger red. */
export function DistributionBar({ expenses, totalBudget }: Props) {
  const planned = expenses.reduce((s, e) => s + e.plannedAmount, 0);
  const denom = Math.max(totalBudget, planned, 1);
  const over = Math.max(0, planned - totalBudget);
  const free = Math.max(0, totalBudget - planned);
  const w = (n: number) => `${(n / denom) * 100}%`;

  return (
    <div>
      <div
        role="img"
        aria-label="Distribución del presupuesto"
        className="relative my-4 flex h-3.5 gap-0.5 overflow-hidden rounded-full bg-track"
      >
        {expenses.map((e, i) => (
          <span
            key={e.id}
            data-testid="segment-expense"
            className={`block h-full ${PALETTE[i % PALETTE.length]}`}
            style={{ width: w(e.plannedAmount) }}
          />
        ))}
        <span data-testid="segment-disponible" className="block h-full bg-track-strong" style={{ width: w(free) }} />
        {over > 0 && (
          <span
            data-testid="segment-over"
            className="absolute inset-y-0 right-0 block bg-danger"
            style={{ width: w(over) }}
          />
        )}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1.5 p-0">
        {expenses.map((e, i) => (
          <li key={e.id} className="flex items-center gap-1.5 text-[10.5px] font-semibold text-ink-muted">
            <i className="block h-2 w-2 rounded-[3px]" style={{ background: DOT[i % DOT.length] }} />
            {e.name}
          </li>
        ))}
        <li className="flex items-center gap-1.5 text-[10.5px] font-semibold text-ink-muted">
          <i className="block h-2 w-2 rounded-[3px] bg-track-strong" />
          Disponible
        </li>
        {over > 0 && (
          <li className="flex items-center gap-1.5 text-[10.5px] font-semibold text-danger">
            <i className="block h-2 w-2 rounded-[3px] bg-danger" />
            Excedido
          </li>
        )}
      </ul>
    </div>
  );
}
