import { Card } from '@heroui/react';
import type { Expense, Payment, Project } from '../../db/types';
import { projectSummary } from '../../lib/calc';
import { formatCRC } from '../../lib/money';
import { DistributionBar } from './DistributionBar';

interface Props {
  project: Project;
  expenses: Expense[];
  payments: Payment[];
}

export function ProjectSummaryCard({ project, expenses, payments }: Props) {
  const s = projectSummary(project, expenses, payments);
  return (
    <Card className="rounded-lg shadow-card">
      <Card.Content>
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] font-semibold text-ink-muted">Presupuesto total</span>
          <span className="rounded-full bg-icon-bg px-2.5 py-0.5 text-[10.5px] font-extrabold text-green-deep">
            {Math.round(s.pct)}% ejecutado
          </span>
        </div>
        <div className="my-1 font-sans text-3xl font-extrabold tabular-nums tracking-tight text-ink">
          {formatCRC(project.totalBudget)}
        </div>
        <div className="mt-2 flex gap-6">
          <div>
            <span className="text-[11.5px] font-semibold text-ink-muted">Pagado</span>
            <b data-testid="pagado" className="block text-sm font-extrabold tabular-nums">{formatCRC(s.paid)}</b>
          </div>
          <div>
            <span className="text-[11.5px] font-semibold text-ink-muted">Disponible</span>
            <b
              data-testid="disponible"
              className={`block text-sm font-extrabold tabular-nums ${s.available < 0 ? 'text-danger' : ''}`}
            >
              {formatCRC(s.available)}
            </b>
          </div>
        </div>
        {s.overAllocated && (
          <div role="status" className="mt-3 rounded-sm bg-danger/10 px-3 py-2 text-xs font-bold text-danger">
            ⚠ Presupuesto sobreasignado: los gastos planeados superan el total.
          </div>
        )}
        <DistributionBar expenses={expenses} totalBudget={project.totalBudget} />
      </Card.Content>
    </Card>
  );
}
