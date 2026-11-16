import { useState } from 'react';
import { Button, Card } from '@heroui/react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { deletePayment } from '../../db/repos';
import { ReceiptThumb } from '../payments/ReceiptThumb';
import { formatMoney } from '../../lib/money';
import { msOfIso, WEEKDAYS_ES, MONTHS_ES } from '../../lib/calendar';
import type { Payment } from '../../db/types';

export interface DayRecord {
  payment: Payment;
  expenseName: string;
  expenseIcon?: string;
  projectName: string;
  /** 1-based installment number when the payment was applied to a cuota. */
  installmentIndex?: number;
  currency: string;
}

export function DayRecords({ iso, records }: { iso: string; records: DayRecord[] }) {
  const [toDelete, setToDelete] = useState<DayRecord | null>(null);
  const d = new Date(msOfIso(iso));
  const title = `${WEEKDAYS_ES[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()].toLowerCase()}`;
  // One total per currency (stable alphabetical order) so currencies are never mixed.
  const totals = new Map<string, number>();
  for (const r of records) totals.set(r.currency, (totals.get(r.currency) ?? 0) + r.payment.amount);
  const totalText = [...totals].sort(([a], [b]) => a.localeCompare(b)).map(([c, n]) => formatMoney(n, c)).join(' + ');
  return (
    <section aria-label="Registros del día" className="flex flex-col gap-[9px]">
      <div className="flex flex-col gap-0.5 px-0.5">
        <h2 className="m-0 font-display text-base font-black text-ink">{title}</h2>
        {records.length > 0 && (
          <span className="text-xs font-semibold tabular-nums text-ink-muted">
            {totalText} · {records.length} {records.length === 1 ? 'pago' : 'pagos'}
          </span>
        )}
      </div>
      {records.length === 0 ? (
        <Card className="rounded-card border border-hairline shadow-card">
          <Card.Content className="py-5 text-center text-[12.5px] font-semibold text-ink-muted">
            Sin registros este día
          </Card.Content>
        </Card>
      ) : (
          <ul className="m-0 flex list-none flex-col gap-[9px] p-0">
            {records.map((r) => (
              <li key={r.payment.id}>
                <Card className="rounded-cuota border border-hairline shadow-row">
                  <Card.Content className="flex flex-row items-center gap-[11px] px-3 py-2.5">
                    <span aria-hidden className="flex size-[38px] shrink-0 items-center justify-center rounded-sm bg-icon-tile text-lg">
                      {r.expenseIcon ?? '🧾'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="break-words font-display text-[13px] font-extrabold text-ink">{r.expenseName}</div>
                      <div className="text-[11px] text-ink-muted">
                        {r.projectName}
                        {r.installmentIndex !== undefined && ` · Cuota ${r.installmentIndex}`}
                      </div>
                    </div>
                    {r.payment.receiptId && <ReceiptThumb receiptId={r.payment.receiptId} />}
                    <span className="shrink-0 text-[13px] font-extrabold tabular-nums">{formatMoney(r.payment.amount, r.currency)}</span>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label={`Eliminar pago de ${r.expenseName}`}
                      onPress={() => setToDelete(r)}
                      className="text-danger-ink"
                    >
                      🗑
                    </Button>
                  </Card.Content>
                </Card>
              </li>
            ))}
          </ul>
      )}
      <ConfirmDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Eliminar este pago?"
        description={toDelete ? `${toDelete.expenseName} · ${formatMoney(toDelete.payment.amount, toDelete.currency)}` : undefined}
        onConfirm={() => deletePayment(toDelete!.payment.id)}
      />
    </section>
  );
}
