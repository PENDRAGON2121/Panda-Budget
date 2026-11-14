import { useState } from 'react';
import { Button } from '@heroui/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useProjects } from '../../db/hooks';
import { projectSummary } from '../../lib/calc';
import { EmptyProjects } from './EmptyProjects';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';

export function ProjectsScreen() {
  const projects = useProjects();
  const expenses = useLiveQuery(() => db.expenses.toArray(), []);
  const payments = useLiveQuery(() => db.payments.toArray(), []);
  const [open, setOpen] = useState(false);

  if (!projects || !expenses || !payments) return null;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-display text-[22px] font-black text-ink">Proyectos</h1>
      {projects.length === 0 && <EmptyProjects />}
      <div className="grid grid-cols-2 gap-3">
        {projects.map((p) => {
          const exps = expenses.filter((e) => e.projectId === p.id);
          const { pct } = projectSummary(p, exps, payments);
          return <ProjectCard key={p.id} project={p} pct={pct} expenseCount={exps.length} />;
        })}
        <Button
          variant="outline"
          className="h-full min-h-32 flex-col rounded-lg border-2 border-dashed border-leaf text-green-deep"
          onPress={() => setOpen(true)}
        >
          <span aria-hidden className="text-2xl">+</span>
          Nuevo proyecto
        </Button>
      </div>
      <ProjectForm isOpen={open} onOpenChange={setOpen} />
    </section>
  );
}
