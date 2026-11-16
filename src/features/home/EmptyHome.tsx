import { useState } from "react";
import { Button, Card } from "@heroui/react";
import { ProjectForm } from "../projects/ProjectForm";

export function EmptyHome() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Card className="rounded-card border border-hairline shadow-card text-center">
        <Card.Content className="flex flex-col items-center gap-3 py-10">
          <div aria-hidden className="text-6xl">
            🐼
          </div>
          <h2 className="font-display text-[21px] font-black text-ink">
            Agregá un proyecto
          </h2>
          <p className="max-w-[235px] text-[13px] leading-normal text-ink-muted">
            Creá tu primer proyecto, cargale un presupuesto y empezá a seguir
            cada gasto.
          </p>
          <Button
            isIconOnly
            aria-label="Nuevo proyecto"
            onPress={() => setOpen(true)}
            className="mt-2 size-16 rounded-full bg-leaf text-3xl font-bold text-white shadow-row"
          >
            +
          </Button>
          <span aria-hidden className="text-xs font-bold text-green-deep">
            Nuevo proyecto
          </span>
        </Card.Content>
      </Card>
      <ProjectForm isOpen={open} onOpenChange={setOpen} />
    </>
  );
}
