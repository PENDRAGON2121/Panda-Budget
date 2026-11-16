import { useMemo, useState } from 'react';
import { Button, Card } from '@heroui/react';
import { useAllExpenses, usePaymentsBetween, useProjects } from '../../db/hooks';
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

  const go = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    const next = { year: d.getFullYear(), month: d.getMonth() };
    setView(next);
    setSelected(defaultSelection(next.year, next.month, today));
  };

  const activeDays = useMemo(() => new Set((payments ?? []).map((p) => isoOf(p.date))), [payments]);

  const records: DayRecord[] | undefined = useMemo(() => {
    if (!payments || !expenses || !projects) return undefined;
    const ex = new Map(expenses.map((e) => [e.id, e]));
    const pr = new Map(projects.map((p) => [p.id, p]));
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
        };
      });
  }, [payments, expenses, projects, selected]);

  return (
    <div>
      <h1 className="mb-3 font-display text-[22px] font-black">Calendario</h1>
      <Card>
        <Card.Content className="p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <Button isIconOnly variant="ghost" aria-label="Mes anterior" onPress={() => go(-1)}>‹</Button>
            <span className="font-display text-base font-black">{MONTHS_ES[view.month]} {view.year}</span>
            <Button isIconOnly variant="ghost" aria-label="Mes siguiente" onPress={() => go(1)}>›</Button>
          </div>
          <MonthGrid year={view.year} month={view.month} selected={selected} activeDays={activeDays} onSelect={setSelected} />
        </Card.Content>
      </Card>
      {records && <DayRecords iso={selected} records={records} />}
    </div>
  );
}
