import { Button, Card, Chip, ProgressBar } from '@heroui/react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppBar } from '../../components/AppBar';
import { AppBarMenu } from '../../components/AppBarMenu';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useExpense, useExpenseCurrency, useInstallments, usePayments } from '../../db/hooks';
import { deleteExpense, deletePayment } from '../../db/repos';
import type { Payment } from '../../db/types';
import { expenseProgress, installmentStatus } from '../../lib/calc';
import { formatMoney } from '../../lib/money';
import { PaymentSheet } from '../payments/PaymentSheet';
import { InstallmentTimeline } from './InstallmentTimeline';
import { PaymentList } from './PaymentList';

export function ExpenseDetail() {
  const { id } = useParams();
  const expense = useExpense(id);
  const installments = useInstallments(id);
  const payments = usePayments(id);
  const currency = useExpenseCurrency(id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [targetInst, setTargetInst] = useState<string>();
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState(false);
  const navigate = useNavigate();

  if (expense === null) {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="font-display text-[17px] font-black text-ink">Gasto no encontrado</h1>
        <Link to="/proyectos" className="text-sm font-bold text-green-deep">‹ Volver a proyectos</Link>
      </div>
    );
  }

  const ready =
    expense !== undefined && installments !== undefined && payments !== undefined && currency !== undefined;
  const p = ready ? expenseProgress(expense, payments) : undefined;
  const paidCount =
    ready && expense.type === 'installments'
      ? installments.filter((i) => installmentStatus(i, payments, installments) === 'pagada').length
      : 0;

  return (
    <div className="flex flex-col gap-4">
      <AppBar
        backTo={expense ? `/proyectos/${expense.projectId}` : '/proyectos'}
        backLabel="Volver al proyecto"
        title={expense ? expense.name : ''}
        subtitle={expense ? (expense.type === 'installments' ? 'Gasto a plazos' : 'Pago único') : undefined}
        menu={
          expense && (
            <AppBarMenu
              label="Más opciones del gasto"
              actions={[{ id: 'delete', label: 'Eliminar gasto', danger: true, onAction: () => setConfirmDeleteExpense(true) }]}
            />
          )
        }
      />

      {ready && p ? (
        <>
          <Card
            className={`rounded-card border ${p.over ? 'border-hairline-over shadow-over' : 'border-hairline shadow-card'}`}
          >
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
                {formatMoney(expense.plannedAmount, currency)}
              </div>
              <ProgressBar
                aria-label={`Progreso de ${expense.name}`}
                value={Math.min(100, Math.max(0, p.pct))}
                className="w-full"
              >
                <ProgressBar.Track className="rail h-2.5">
                  <ProgressBar.Fill className={p.over ? 'bg-danger' : 'bg-leaf'} />
                </ProgressBar.Track>
              </ProgressBar>
              <div className="mt-1 flex gap-6">
                <div>
                  <div className="text-[11.5px] font-semibold text-ink-muted">Pagado</div>
                  <div
                    data-testid="pagado"
                    className={`text-sm font-extrabold tabular-nums ${p.over ? 'text-danger-ink' : 'text-ink'}`}
                  >
                    {formatMoney(p.paid, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] font-semibold text-ink-muted">
                    {p.over ? 'Excedido' : 'Restante'}
                  </div>
                  <div
                    data-testid="restante"
                    className={`text-sm font-extrabold tabular-nums ${p.over ? 'text-danger-ink' : 'text-ink'}`}
                  >
                    {formatMoney(Math.abs(p.remaining), currency)}
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
                currency={currency}
                onPay={(instId) => {
                  setTargetInst(instId);
                  setSheetOpen(true);
                }}
                onDeletePayment={setPaymentToDelete}
              />
            </section>
          )}

          {expense.type === 'single' ? (
            <PaymentList payments={payments} currency={currency} onDelete={setPaymentToDelete} />
          ) : (
            payments.some((pay) => !pay.installmentId) && (
              <PaymentList
                label="Pagos sin cuota"
                payments={payments.filter((pay) => !pay.installmentId)}
                currency={currency}
                onDelete={setPaymentToDelete}
              />
            )
          )}
        </>
      ) : (
        <div aria-busy="true" className="h-40 rounded-card border border-hairline bg-white shadow-card" />
      )}

      <Button
        aria-label="Registrar pago"
        onPress={() => {
          setTargetInst(undefined);
          setSheetOpen(true);
        }}
        className="fixed bottom-[96px] right-5 h-[52px] rounded-[17px] bg-leaf px-5 font-display text-sm font-extrabold text-white shadow-fab"
      >
        + Registrar pago
      </Button>
      <ConfirmDialog
        isOpen={paymentToDelete !== null}
        onOpenChange={(open) => !open && setPaymentToDelete(null)}
        title="¿Eliminar este pago?"
        description={
          paymentToDelete && currency
            ? `${formatMoney(paymentToDelete.amount, currency)} · ${new Date(paymentToDelete.date).toLocaleDateString('es-CR')}`
            : undefined
        }
        onConfirm={() => deletePayment(paymentToDelete!.id)}
      />
      <ConfirmDialog
        isOpen={confirmDeleteExpense}
        onOpenChange={setConfirmDeleteExpense}
        title={`¿Eliminar el gasto «${expense?.name ?? ''}»?`}
        description="Se eliminarán también sus cuotas, pagos y recibos."
        onConfirm={async () => {
          if (!expense) return;
          const projectId = expense.projectId;
          await deleteExpense(expense.id);
          navigate(`/proyectos/${projectId}`, { replace: true });
        }}
      />
      {id && <PaymentSheet expenseId={id} installmentId={targetInst} isOpen={sheetOpen} onOpenChange={setSheetOpen} />}
    </div>
  );
}
