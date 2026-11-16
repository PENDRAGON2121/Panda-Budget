import { Button, Card } from '@heroui/react';
import { motion, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { Installment, Payment } from '../../db/types';
import { installmentStatus } from '../../lib/calc';
import { formatMoney } from '../../lib/money';
import { ReceiptThumb } from '../payments/ReceiptThumb';

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });

const RAIL_TOP = 8; // px from the list top where the cane starts (matches top-2)
const RAIL_BOTTOM = 12; // px kept free below (matches bottom-3)
const DOT_CENTER = 22; // status dot centre measured from its row's top (top-3 + half of h-5)
const ROW_GAP = 10; // gap-2.5

/** Pixel geometry of the cane, measured from the rendered rows (all zero in non-layout environments). */
interface Geometry {
  grown: number;
  knots: number[];
}

/**
 * Bamboo cane timeline: a pale rail full height, a grown cane (8px, knots between cuotas) that reaches the
 * próxima cuota (full length when everything is paid) and two swaying leaves at its tip, above the status dots.
 */
export function InstallmentTimeline({
  installments,
  payments,
  onPay,
  onDeletePayment,
  currency = 'CRC',
}: {
  installments: Installment[];
  payments: Payment[];
  onPay?: (installmentId: string) => void;
  /** Asks to delete a payment; on a cuota row it targets the cuota's most recent payment. */
  onDeletePayment?: (payment: Payment) => void;
  currency?: string;
}) {
  const reduce = useReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const [geo, setGeo] = useState<Geometry>({ grown: 0, knots: [] });

  const statuses = installments.map((i) => installmentStatus(i, payments, installments));
  const firstOpen = statuses.findIndex((st) => st !== 'pagada');
  /** How many cuotas the cane covers: up to the próxima cuota's dot, or all of them when everything is paid. */
  const grownCount = firstOpen === -1 ? installments.length : firstOpen;
  const key = `${installments.length}:${grownCount}`;

  useLayoutEffect(() => {
    const rows = Array.from(listRef.current?.children ?? []).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.dataset.testid === 'cuota',
    );
    const list = listRef.current;
    if (!list || rows.length === 0) return;
    const full = Math.max(0, list.offsetHeight - RAIL_TOP - RAIL_BOTTOM);
    const grown = firstOpen === -1 ? full : Math.max(0, rows[firstOpen].offsetTop + DOT_CENTER - RAIL_TOP);
    const knots = rows.slice(1).map((r) => r.offsetTop - ROW_GAP / 2 - RAIL_TOP - 1.5);
    setGeo({ grown, knots });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <ol ref={listRef} className="relative flex flex-col gap-2.5 pl-7">
      <div aria-hidden className="absolute bottom-3 left-[6px] top-2 w-2 rounded bg-cane-rail" />
      <motion.div
        aria-hidden
        data-testid="bamboo-cane"
        data-grown={grownCount}
        data-total={installments.length}
        className="absolute left-[6px] top-2 w-2"
        initial={{ height: 0 }}
        animate={{ height: geo.grown }}
        transition={reduce ? { duration: 0 } : { duration: 1.8, ease: 'easeOut' }}
      >
        <div
          className="absolute inset-0 overflow-hidden rounded"
          style={{ background: 'linear-gradient(90deg,#6db546,#7cc04b 30%,#b9e28f 50%,#7cc04b 70%,#5fa83c)' }}
        >
          {geo.knots.map((y, i) => (
            <span key={i} className="absolute inset-x-0 h-[3px] bg-node" style={{ top: y }} />
          ))}
        </div>
        {/* Leaf pair at the growing tip (design: 34×30, above the dots, stops just short of the próxima dot).
            Hidden until the cane is tall enough to hold it, so it never pokes into the heading above. */}
        <span
          hidden={geo.grown < 44}
          className="absolute z-20 block h-[30px] w-[34px] drop-shadow-[0_2px_3px_rgba(46,90,34,0.25)]"
          style={{ left: -13, bottom: 10 }}
        >
          <svg
            width="34"
            height="30"
            viewBox="0 0 34 30"
            className="block animate-leaf-sway overflow-visible"
            style={{ transformOrigin: '17px 26px' }}
          >
            <path data-testid="bamboo-leaf" d="M17 26 C19 15 25 8 34 4 C31 14 25 22 17 26 Z" className="fill-leaf" />
            <path data-testid="bamboo-leaf" d="M17 26 C14 17 7 12 -4 11 C0 20 8 25 17 26 Z" className="fill-leaf-light" />
          </svg>
        </span>
      </motion.div>
      {installments.map((inst, idx) => {
        const status = statuses[idx];
        const mine = payments.filter((p) => p.installmentId === inst.id);
        const lastPaid = mine.length ? Math.max(...mine.map((p) => p.date)) : undefined;
        const receiptId = mine.find((p) => p.receiptId)?.receiptId;
        const latest = [...mine].sort((a, b) => b.date - a.date || b.createdAt - a.createdAt)[0];
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
                    : 'border-[#d5ddcf] bg-white'
              }`}
            >
              {status === 'pagada' ? '✓' : ''}
            </span>
            <Card className={`rounded-cuota border shadow-row ${status === 'proxima' ? 'border-highlight' : 'border-hairline'}`}>
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
                      <span className="text-bamboo-ink">
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
                {latest && onDeletePayment && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={`Eliminar pago de cuota ${inst.index}`}
                    onPress={() => onDeletePayment(latest)}
                    className="text-danger-ink"
                  >
                    🗑
                  </Button>
                )}
                {status !== 'pagada' && onPay && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-control"
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
