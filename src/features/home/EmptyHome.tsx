import { Card } from '@heroui/react';
import { Link } from 'react-router-dom';

export function EmptyHome() {
  return (
    <Card className="rounded-lg text-center shadow-card">
      <Card.Content className="flex flex-col items-center gap-3 py-10">
        <div aria-hidden className="text-6xl">🐼</div>
        <h2 className="font-display text-[21px] font-black text-ink">Agregá un proyecto</h2>
        <p className="max-w-[235px] text-[13px] leading-normal text-ink-muted">
          Creá tu primer proyecto, cargale un presupuesto y empezá a seguir cada gasto.
        </p>
        <Link
          to="/proyectos"
          aria-label="Agregar proyecto"
          className="mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-leaf text-3xl font-bold text-white no-underline shadow-card"
        >
          +
        </Link>
        <span className="text-xs font-bold text-green-deep">Nuevo proyecto</span>
      </Card.Content>
    </Card>
  );
}
