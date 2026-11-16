import { Button, Card } from '@heroui/react';
import type { Installment, Payment } from '../../db/types';
import { installmentStatus } from '../../lib/calc';
import { formatMoney } from '../../lib/money';
import { ReceiptThumb } from '../payments/ReceiptThumb';

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });

export function InstallmentTimeline({
  installments,
  payments,
  onPay,
  currency = 'CRC',
}: {
  installments: Installment[];
  payments: Payment[];
  onPay?: (installmentId: string) => void;
  currency?: string;
}) {
  return (
    <ol className="relative flex flex-col gap-2.5 pl-7 before:absolute before:bottom-3 before:left-[9px] before:top-2 before:w-0.5 before:bg-shade">
      {installments.map((inst) => {
        const status = installmentStatus(inst, payments, installments);
        const mine = payments.filter((p) => p.installmentId === inst.id);
        const lastPaid = mine.length ? Math.max(...mine.map((p) => p.date)) : undefined;
        const receiptId = mine.find((p) => p.receiptId)?.receiptId;
        const hasReceipt = !!receiptId;
        const title = `Cuota ${inst.index}${inst.label ? ` · ${inst.label}` : ''}`;
        return (
          <li
            key={inst.id}
            data-testid="cuota"
            data-status={status}
            aria-current={status === 'proxima' ? 'step' : undefined}
            className="relative"
          >
            <span
              aria-hidden
              className={`absolute -left-7 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[11px] font-black ${
                status === 'pagada'
                  ? 'border-leaf bg-leaf text-white'
                  : status === 'proxima'
                    ? 'border-leaf bg-white shadow-[0_0_0_4px_rgba(79,158,52,.16)]'
                    : 'border-shade bg-white'
              }`}
            >
              {status === 'pagada' ? '✓' : ''}
            </span>
            <Card className={`rounded-md shadow-row ${status === 'proxima' ? 'border border-highlight' : ''}`}>
              <Card.Content className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[13px] font-extrabold text-ink">{title}</div>
                  <div className="mt-0.5 text-[10.5px] font-semibold text-ink-muted">
                    {status === 'pagada' ? (
                      <>
                        Pagada
                        {lastPaid ? <> · <b className="text-green-deep">{fmtDate(lastPaid)}</b></> : null}
                        {!hasReceipt && ' · sin recibo'}
                      </>
                    ) : (
                      <span className="text-[#b0783a]">
                        {status === 'proxima' ? 'Próxima' : 'Pendiente'}
                        {inst.dueDate ? ` · vence ${fmtDate(inst.dueDate)}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`shrink-0 text-right text-[13px] font-extrabold tabular-nums ${
                    status === 'pendiente' ? 'text-ink-muted' : 'text-ink'
                  }`}
                >
                  {formatMoney(inst.plannedAmount, currency)}
                </div>
                {receiptId && <ReceiptThumb receiptId={receiptId} />}
                {status !== 'pagada' && onPay && (
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={`Pagar cuota ${inst.index}`}
                    onPress={() => onPay(inst.id)}
                  >
                    Pagar
                  </Button>
                )}
              </Card.Content>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
