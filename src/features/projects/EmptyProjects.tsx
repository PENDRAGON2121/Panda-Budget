import { Card } from '@heroui/react';

export function EmptyProjects() {
  return (
    <Card className="rounded-card border border-hairline shadow-card text-center">
      <Card.Content className="flex flex-col items-center gap-2 py-8">
        <div aria-hidden className="text-5xl">🐼</div>
        <h2 className="font-display text-[17px] font-black text-ink">Agregá un proyecto</h2>
        <p className="text-sm text-ink-muted">
          Creá tu primer proyecto para empezar a planear y registrar tus gastos.
        </p>
      </Card.Content>
    </Card>
  );
}
