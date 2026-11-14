import { Button, Card, Chip, ProgressBar } from '@heroui/react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useExpense, useInstallments, usePayments } from '../../db/hooks';
import { expenseProgress, installmentStatus } from '../../lib/calc';
import { formatCRC } from '../../lib/money';
import { PaymentSheet } from '../payments/PaymentSheet';
import { InstallmentTimeline } from './InstallmentTimeline';

export function ExpenseDetail() {
  const { id } = useParams();
  const expense = useExpense(id);
  const installments = useInstallments(id);
  const payments = usePayments(id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [targetInst, setTargetInst] = useState<string>();

  if (expense === null) {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="font-display text-[17px] font-black text-ink">Gasto no encontrado</h1>
        <Link to="/proyectos" className="text-sm font-bold text-green-deep">‹ Volver a proyectos</Link>
      </div>
    );
  }

  const ready = expense !== undefined && installments !== undefined && payments !== undefined;
  const p = ready ? expenseProgress(expense, payments) : undefined;
  const paidCount =
    ready && expense.type === 'installments'
      ? installments.filter((i) => installmentStatus(i, payments, installments) === 'pagada').length
      : 0;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <Link
          to={expense ? `/proyectos/${expense.projectId}` : '/proyectos'}
          aria-label="Volver al proyecto"
          className="text-ink no-underline"
        >
          ‹
        </Link>
        <h1 className="break-words font-display text-[17px] font-black text-ink">
          {expense ? expense.name : ''}
        </h1>
      </header>

      {ready && p ? (
        <>
          <Card className="rounded-lg shadow-card">
            <Card.Content className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-ink-muted">Planeado</span>
                <Chip size="sm">
                  {expense.type === 'installments'
                    ? `Cuotas · ${paidCount}/${installments.length} pagadas`
                    : 'Único'}
                </Chip>
              </div>
              <div data-testid="planeado" className="text-[29px] font-extrabold tabular-nums text-ink">
                {formatCRC(expense.plannedAmount)}
              </div>
              <ProgressBar
                aria-label={`Progreso de ${expense.name}`}
                value={Math.min(100, Math.max(0, p.pct))}
                className="w-full"
              >
                <ProgressBar.Track className="h-2.5">
                  <ProgressBar.Fill className={p.over ? 'bg-danger' : 'bg-leaf'} />
                </ProgressBar.Track>
              </ProgressBar>
              <div className="mt-1 flex gap-6">
                <div>
                  <div className="text-[11.5px] font-semibold text-ink-muted">Pagado</div>
                  <div
                    data-testid="pagado"
                    className={`text-sm font-extrabold tabular-nums ${p.over ? 'text-danger' : 'text-ink'}`}
                  >
                    {formatCRC(p.paid)}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] font-semibold text-ink-muted">
                    {p.over ? 'Excedido' : 'Restante'}
                  </div>
                  <div
                    data-testid="restante"
                    className={`text-sm font-extrabold tabular-nums ${p.over ? 'text-danger' : 'text-ink'}`}
                  >
                    {formatCRC(Math.abs(p.remaining))}
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {expense.type === 'installments' && (
            <section aria-label="Cuotas" className="flex flex-col gap-3">
              <h2 className="font-display text-[15px] font-black text-ink">
                Cuotas <small className="font-bold text-ink-muted">· {installments.length}</small>
              </h2>
              <InstallmentTimeline
                installments={installments}
                payments={payments}
                onPay={(instId) => {
                  setTargetInst(instId);
                  setSheetOpen(true);
                }}
              />
            </section>
          )}
        </>
      ) : (
        <div aria-busy="true" className="h-40 rounded-lg bg-white shadow-card" />
      )}

      <Button
        aria-label="Registrar pago"
        onPress={() => {
          setTargetInst(undefined);
          setSheetOpen(true);
        }}
        className="fixed bottom-24 right-5 h-[52px] rounded-[17px] bg-leaf px-5 font-display text-sm font-extrabold text-white shadow-fab"
      >
        + Registrar pago
      </Button>
      {id && <PaymentSheet expenseId={id} installmentId={targetInst} isOpen={sheetOpen} onOpenChange={setSheetOpen} />}
    </div>
  );
}
