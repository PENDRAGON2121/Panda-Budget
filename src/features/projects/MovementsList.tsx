import { Card } from '@heroui/react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useProjectInstallments, useExpenses, useAllPayments } from '../../db/hooks';
import type { Project } from '../../db/types';
import { formatMoney } from '../../lib/money';
import { projectMovements, type Movement } from '../../lib/movements';
import { ReceiptThumb } from '../payments/ReceiptThumb';

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });

const ROW_BORDER = '1px solid rgba(36,33,43,0.07)';
const ROW_SHADOW = '0 1px 2px rgba(36,33,43,0.05), 0 8px 20px -14px rgba(46,90,34,0.30)';

function Arrow({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {up ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
    </svg>
  );
}

function MovementRow({ m, currency, index }: { m: Movement; currency: string; index: number }) {
  const entrada = m.kind === 'entrada';
  const body = (
    <Card
      className="rounded-2xl"
      style={{ border: entrada ? '1px solid rgba(60,138,46,0.22)' : ROW_BORDER, boxShadow: ROW_SHADOW }}
    >
      <Card.Content className="flex flex-row items-center gap-3 p-3">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
          style={entrada ? { background: '#e3f2df', color: '#2f6f22' } : { background: '#fbe9e3', color: '#b23f1d' }}
        >
          <Arrow up={entrada} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="break-words font-display text-[13.5px] font-extrabold text-ink">
            {m.label}
            {m.detail ? ` · ${m.detail}` : ''}
          </div>
          <div className="text-[11px] tabular-nums text-ink-muted">
            {fmtDate(m.date)} ·{' '}
            <span style={m.balance < 0 ? { color: '#b23f1d', fontWeight: 700 } : undefined}>
              saldo {formatMoney(m.balance, currency)}
            </span>
          </div>
        </div>
        {m.receiptId && <ReceiptThumb receiptId={m.receiptId} />}
        <span
          className="shrink-0 font-display text-[14px] font-black tabular-nums"
          style={{ color: entrada ? '#2f6f22' : '#24212b' }}
        >
          {entrada ? '+' : '−'}
          {formatMoney(m.amount, currency)}
        </span>
      </Card.Content>
    </Card>
  );

  const content: ReactNode = m.expenseId ? (
    <Link to={`/gastos/${m.expenseId}`} className="block no-underline">
      {body}
    </Link>
  ) : (
    body
  );

  return (
    <motion.li
      data-testid={`movement-${m.kind}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 * index }}
    >
      {content}
    </motion.li>
  );
}

export function MovementsList({ project }: { project: Project }) {
  const expenses = useExpenses(project.id);
  const installments = useProjectInstallments(project.id);
  const payments = useAllPayments();
  if (!expenses || !installments || !payments) return <div aria-busy="true" className="h-24" />;

  const newestFirst = projectMovements(project, expenses, installments, payments).slice().reverse();
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {newestFirst.map((m, i) => (
        <MovementRow key={m.id} m={m} currency={project.currency} index={i} />
      ))}
    </ul>
  );
}
