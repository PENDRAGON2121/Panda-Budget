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
  return (
    <Link to={`/proyectos/${project.id}`} className="block no-underline">
      <motion.div layoutId={`project-card-${project.id}`} className="h-full rounded-lg">
      <Card className="h-full rounded-lg shadow-card">
        <Card.Content className="flex flex-col gap-2">
          <div aria-hidden className="text-2xl">{project.icon ?? '📁'}</div>
          <h3 className="break-words font-display text-[15px] font-black text-ink">{project.name}</h3>
          <div className="font-sans text-base font-bold tabular-nums text-ink">
            {formatMoney(project.totalBudget, project.currency)}
          </div>
          <ProgressBar aria-label={`Progreso de ${project.name}`} value={shown} className="w-full">
            <ProgressBar.Track className="h-1.5">
              <ProgressBar.Fill className="bg-leaf" />
            </ProgressBar.Track>
          </ProgressBar>
          <div className="text-xs text-ink-muted">
            {Math.round(pct)}% · {expenseCount} {expenseCount === 1 ? 'gasto' : 'gastos'}
          </div>
        </Card.Content>
      </Card>
      </motion.div>
    </Link>
  );
}
