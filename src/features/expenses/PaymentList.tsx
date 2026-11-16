import { Button, Card } from '@heroui/react';
import type { Payment } from '../../db/types';
import { formatMoney } from '../../lib/money';
import { ReceiptThumb } from '../payments/ReceiptThumb';

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });

/** Simple list of a gasto's payments: date, amount, receipt and a delete action. */
export function PaymentList({
  payments,
  currency,
  label = 'Pagos',
  onDelete,
}: {
  payments: Payment[];
  currency: string;
  label?: string;
  onDelete: (payment: Payment) => void;
}) {
  return (
    <section aria-labelledby="payment-list-heading" className="flex flex-col gap-2.5">
      <h2 id="payment-list-heading" className="font-display text-[15px] font-black text-ink">
        {label} <small className="font-bold text-ink-muted">· {payments.length}</small>
      </h2>
      {payments.length === 0 ? (
        <p className="text-sm text-ink-muted">Todavía no hay pagos registrados.</p>
      ) : (
        <ul aria-label={label} className="m-0 flex list-none flex-col gap-2 p-0">
          {payments.map((p) => (
            <li key={p.id}>
              <Card className="rounded-row border border-hairline shadow-row">
                <Card.Content className="flex flex-row items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-extrabold tabular-nums text-ink">{formatMoney(p.amount, currency)}</div>
                    <div className="text-[10.5px] font-semibold text-ink-muted">
                      {fmtDate(p.date)}
                      {p.note ? ` · ${p.note}` : ''}
                      {!p.receiptId && ' · sin recibo'}
                    </div>
                  </div>
                  {p.receiptId && <ReceiptThumb receiptId={p.receiptId} />}
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={`Eliminar pago de ${formatMoney(p.amount, currency)}`}
                    onPress={() => onDelete(p)}
                    className="text-danger"
                  >
                    🗑
                  </Button>
                </Card.Content>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
