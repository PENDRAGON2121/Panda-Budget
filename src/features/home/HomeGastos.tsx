import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ProgressBar } from '@heroui/react';
import { useAllPayments, useExpenses, useProjectCurrency } from '../../db/hooks';
import { expenseProgress } from '../../lib/calc';
import { formatMoney } from '../../lib/money';

interface Props {
  projectId: string;
  /** 1 = swiped forward (content leaves left), -1 = backward (leaves right). */
  direction: 1 | -1;
}

function GastosList({ projectId }: { projectId: string }) {
  const expenses = useExpenses(projectId);
  const payments = useAllPayments();
  const currency = useProjectCurrency(projectId);
  if (!expenses || !payments) return null;
  if (expenses.length === 0) {
    return <p className="py-4 text-center text-sm text-ink-muted">Este proyecto aún no tiene gastos.</p>;
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {expenses.map((e) => {
        const p = expenseProgress(e, payments);
        const shown = Math.min(100, Math.max(0, p.pct));
        return (
          <li key={e.id}>
            <Link to={`/gastos/${e.id}`} className="block rounded-md bg-white p-3 no-underline shadow-row">
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-lg">{e.icon ?? '🧾'}</span>
                <span className="break-words font-display text-[13.5px] font-extrabold text-ink">{e.name}</span>
              </div>
              <div className={`mt-1 text-[11px] tabular-nums ${p.over ? 'font-bold text-danger' : 'text-ink-muted'}`}>
                {formatMoney(p.paid, currency)} de {formatMoney(e.plannedAmount, currency)}
              </div>
              <ProgressBar aria-label={`Progreso de ${e.name}`} value={shown} className="mt-1.5 w-full">
                <ProgressBar.Track className="h-1.5">
                  <ProgressBar.Fill className={p.over ? 'bg-danger' : 'bg-leaf'} />
                </ProgressBar.Track>
              </ProgressBar>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Active project's gastos; on project change the old list exits toward the swipe direction and the new enters from it. */
export function HomeGastos({ projectId, direction }: Props) {
  const reduce = useReducedMotion();
  const dist = reduce ? 0 : 48;
  return (
    <section aria-label="Gastos" className="mt-5">
      <h2 className="mb-2 font-display text-[15px] font-black text-ink">Gastos</h2>
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={projectId}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * dist }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: -d * dist }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduce ? 0 : 0.22, ease: 'easeOut' }}
          >
            <GastosList projectId={projectId} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
