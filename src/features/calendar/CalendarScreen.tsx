import { useMemo, useState } from 'react';
import { Button, Card } from '@heroui/react';
import { useAllExpenses, useAllInstallments, usePaymentsBetween, useProjects } from '../../db/hooks';
import { isoFromDate, isoOf, MONTHS_ES } from '../../lib/calendar';
import { DayRecords, type DayRecord } from './DayRecords';
import { MonthGrid } from './MonthGrid';

/** Default selection: today when it falls in the viewed month, otherwise the 1st. */
function defaultSelection(year: number, month: number, today: Date): string {
  const inView = today.getFullYear() === year && today.getMonth() === month;
  return isoFromDate(inView ? today : new Date(year, month, 1));
}

export function CalendarScreen({ initialDate }: { initialDate?: Date }) {
  const today = useMemo(() => initialDate ?? new Date(), [initialDate]);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(isoFromDate(today));

  const payments = usePaymentsBetween(
    new Date(view.year, view.month, 1).getTime(),
    new Date(view.year, view.month + 1, 1).getTime(),
  );
  const expenses = useAllExpenses();
  const projects = useProjects();
  const installments = useAllInstallments();

  const go = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    const next = { year: d.getFullYear(), month: d.getMonth() };
    setView(next);
    setSelected(defaultSelection(next.year, next.month, today));
  };

  const activeDays = useMemo(() => new Set((payments ?? []).map((p) => isoOf(p.date))), [payments]);

  const records: DayRecord[] | undefined = useMemo(() => {
    if (!payments || !expenses || !projects || !installments) return undefined;
    const ex = new Map(expenses.map((e) => [e.id, e]));
    const pr = new Map(projects.map((p) => [p.id, p]));
    const inst = new Map(installments.map((i) => [i.id, i]));
    return payments
      .filter((p) => isoOf(p.date) === selected)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((payment) => {
        const e = ex.get(payment.expenseId);
        return {
          payment,
          expenseName: e?.name ?? 'Gasto',
          expenseIcon: e?.icon,
          projectName: (e && pr.get(e.projectId)?.name) ?? '',
          installmentIndex: payment.installmentId ? inst.get(payment.installmentId)?.index : undefined,
          currency: (e && pr.get(e.projectId)?.currency) ?? 'CRC',
        };
      });
  }, [payments, expenses, projects, installments, selected]);

  return (
    <div className="flex flex-col gap-3.5">
      <h1 className="m-0 font-display text-2xl font-black text-ink">Calendario</h1>
      <Card className="rounded-card border border-hairline shadow-card">
        <Card.Content className="flex flex-col gap-2 px-3.5 pb-4 pt-3.5">
          <div className="flex items-center justify-between">
            <MonthNavButton label="Mes anterior" path="M15 6l-6 6 6 6" onPress={() => go(-1)} />
            <span className="font-display text-base font-black text-ink">
              {MONTHS_ES[view.month]} {view.year}
            </span>
            <MonthNavButton label="Mes siguiente" path="M9 6l6 6-6 6" onPress={() => go(1)} />
          </div>
          <MonthGrid year={view.year} month={view.month} selected={selected} activeDays={activeDays} onSelect={setSelected} />
        </Card.Content>
      </Card>
      {records && <DayRecords iso={selected} records={records} />}
    </div>
  );
}

function MonthNavButton({ label, path, onPress }: { label: string; path: string; onPress: () => void }) {
  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={label}
      onPress={onPress}
      className="size-9 min-w-0 rounded-[11px] border border-hairline-strong bg-control text-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </Button>
  );
}
