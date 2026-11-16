import { Card } from '@heroui/react';
import { ReceiptThumb } from '../payments/ReceiptThumb';
import { formatCRC } from '../../lib/money';
import { msOfIso, WEEKDAYS_ES, MONTHS_ES } from '../../lib/calendar';
import type { Payment } from '../../db/types';

export interface DayRecord {
  payment: Payment;
  expenseName: string;
  expenseIcon?: string;
  projectName: string;
}

export function DayRecords({ iso, records }: { iso: string; records: DayRecord[] }) {
  const d = new Date(msOfIso(iso));
  const title = `${WEEKDAYS_ES[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()].toLowerCase()}`;
  const total = records.reduce((s, r) => s + r.payment.amount, 0);
  return (
    <section aria-label="Registros del día" className="mt-4">
      <h2 className="font-display text-[15px] font-black text-ink">{title}</h2>
      {records.length === 0 ? (
        <Card className="mt-3">
          <Card.Content className="py-5 text-center text-[12.5px] font-semibold text-ink-muted">
            Sin registros este día
          </Card.Content>
        </Card>
      ) : (
        <>
          <p className="mb-3 mt-0.5 text-[11.5px] font-semibold tabular-nums text-ink-muted">
            {formatCRC(total)} · {records.length} {records.length === 1 ? 'pago' : 'pagos'}
          </p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {records.map((r) => (
              <li key={r.payment.id}>
                <Card>
                  <Card.Content className="flex flex-row items-center gap-3 p-3">
                    <span aria-hidden className="text-lg">{r.expenseIcon ?? '🧾'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="break-words font-display text-[13px] font-extrabold text-ink">{r.expenseName}</div>
                      <div className="text-[10.5px] text-ink-muted">{r.projectName}</div>
                    </div>
                    {r.payment.receiptId && <ReceiptThumb receiptId={r.payment.receiptId} />}
                    <span className="shrink-0 text-[13px] font-extrabold tabular-nums">{formatCRC(r.payment.amount)}</span>
                  </Card.Content>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
