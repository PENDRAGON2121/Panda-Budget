import { Card, ProgressBar } from '@heroui/react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import type { Project } from '../../db/types';
import { formatMoney } from '../../lib/money';

interface Props {
  project: Project;
  pct: number;
  expenseCount: number;
}

export function ProjectCard({ project, pct, expenseCount }: Props) {
  const shown = Math.min(100, Math.max(0, pct));
  const over = pct > 100;
  return (
    <Link to={`/proyectos/${project.id}`} className="block no-underline">
      <motion.div layoutId={`project-card-${project.id}`} className="h-full rounded-card">
      <Card className={`h-full rounded-card border ${over ? 'border-hairline-over shadow-over' : 'border-hairline shadow-card'}`}>
        <Card.Content className="flex flex-col gap-2">
          <div aria-hidden className="text-2xl">{project.icon ?? '📁'}</div>
          <h3 className="break-words font-display text-[15px] font-black text-ink">{project.name}</h3>
          <div className="font-sans text-base font-bold tabular-nums text-ink">
            {formatMoney(project.totalBudget, project.currency)}
          </div>
          <ProgressBar aria-label={`Progreso de ${project.name}`} value={shown} className="w-full">
            <ProgressBar.Track className="rail h-1.5">
              <ProgressBar.Fill data-testid="project-progress-fill" className={over ? 'bg-danger' : 'bg-leaf'} />
            </ProgressBar.Track>
          </ProgressBar>
          <div className="text-xs text-ink-muted">
            <span data-testid="project-pct" className={over ? 'font-bold text-danger' : undefined}>
              {Math.round(pct)}%
            </span>{' '}
            · {expenseCount} {expenseCount === 1 ? 'gasto' : 'gastos'}
          </div>
        </Card.Content>
      </Card>
      </motion.div>
    </Link>
  );
}
