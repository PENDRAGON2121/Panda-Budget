import { useState } from 'react';
import { Button, Card, ProgressBar } from '@heroui/react';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import { useAllPayments, useExpenses, useProject } from '../../db/hooks';
import type { Expense, Payment } from '../../db/types';
import { expenseProgress } from '../../lib/calc';
import { formatCRC } from '../../lib/money';
import { ExpenseForm } from '../expenses/ExpenseForm';
import { ProjectSummaryCard } from './ProjectSummaryCard';

function ExpenseRow({ expense, payments }: { expense: Expense; payments: Payment[] }) {
  const p = expenseProgress(expense, payments);
  const shown = Math.min(100, Math.max(0, p.pct));
  return (
    <Link to={`/gastos/${expense.id}`} className="block no-underline">
      <Card className="rounded-md shadow-row">
        <Card.Content className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-lg">{expense.icon ?? '🧾'}</span>
            <span className="break-words font-display text-[13.5px] font-extrabold text-ink">{expense.name}</span>
            <span className="rounded-full bg-icon-bg px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-green-deep">
              {expense.type === 'installments' ? 'Cuotas' : 'Único'}
            </span>
          </div>
          <div className={`text-[11px] tabular-nums ${p.over ? 'font-bold text-danger' : 'text-ink-muted'}`}>
            {formatCRC(p.paid)} de {formatCRC(expense.plannedAmount)}
          </div>
          <ProgressBar aria-label={`Progreso de ${expense.name}`} value={shown} className="w-full">
            <ProgressBar.Track className="h-1.5">
              <ProgressBar.Fill className={p.over ? 'bg-danger' : 'bg-leaf'} />
            </ProgressBar.Track>
          </ProgressBar>
        </Card.Content>
      </Card>
    </Link>
  );
}

export function ProjectDetail() {
  const { id } = useParams();
  const project = useProject(id);
  const expenses = useExpenses(id);
  const payments = useAllPayments();
  const [formOpen, setFormOpen] = useState(false);

  if (project === null) {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="font-display text-[17px] font-black text-ink">Proyecto no encontrado</h1>
        <Link to="/proyectos" className="text-sm font-bold text-green-deep">‹ Volver a proyectos</Link>
      </div>
    );
  }

  const ready = project !== undefined && expenses !== undefined && payments !== undefined;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <Link to="/proyectos" aria-label="Volver a proyectos" className="text-ink no-underline">‹</Link>
        <h1 className="break-words font-display text-[17px] font-black text-ink">{project?.name ?? ''}</h1>
      </header>

      {/* Container transform: the layoutId element mounts on first render (before data resolves) so Motion can
          match the exiting ProjectCard. App wraps in MotionConfig reducedMotion="user". */}
      <motion.div layoutId={`project-card-${id}`} className="rounded-lg" data-testid="detail-container">
        {ready ? (
          <ProjectSummaryCard project={project} expenses={expenses} payments={payments} />
        ) : (
          <div aria-busy="true" className="h-40 rounded-lg bg-white shadow-card" />
        )}
      </motion.div>

      {ready && (
      <section aria-label="Gastos" className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-black text-ink">
          Gastos <small className="font-bold text-ink-muted">· {expenses.length}</small>
        </h2>
        {expenses.length === 0 ? (
          <Card className="rounded-lg text-center shadow-card">
            <Card.Content className="flex flex-col items-center gap-1 py-6">
              <div aria-hidden className="text-4xl">🐼</div>
              <p className="font-display text-[15px] font-black text-ink">Agregá tu primer gasto</p>
              <p className="text-sm text-ink-muted">Dividí el presupuesto en gastos para ver en qué se va la plata.</p>
            </Card.Content>
          </Card>
        ) : (
          expenses.map((e) => <ExpenseRow key={e.id} expense={e} payments={payments} />)
        )}
      </section>
      )}

      <Button
        aria-label="Agregar gasto"
        onPress={() => setFormOpen(true)}
        className="fixed bottom-24 right-5 h-14 w-14 min-w-0 rounded-[19px] bg-leaf text-2xl text-white shadow-fab"
      >
        +
      </Button>
      {id && <ExpenseForm projectId={id} isOpen={formOpen} onOpenChange={setFormOpen} />}
    </div>
  );
}
