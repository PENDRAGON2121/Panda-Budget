import { useState } from 'react';
import { Button, Input, Label, Modal, TextField } from '@heroui/react';
import { useProjectCurrency } from '../../db/hooks';
import { FormError } from '../../components/FormError';
import { createExpense } from '../../db/repos';
import { MAX_NAME } from '../../lib/limits';
import { currencySymbol, formatMoney, parseAmount } from '../../lib/money';
import { useGuardedAction } from '../../lib/useGuardedAction';
const MAX_INSTALLMENTS = 60;

interface Props {
  projectId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Row {
  amount: string;
  date: string; // yyyy-mm-dd or ''
}

function dateToMs(v: string): number | undefined {
  if (!v) return undefined;
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function ExpenseForm({ projectId, isOpen, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'single' | 'installments'>('single');
  const [amount, setAmount] = useState('');
  const [countStr, setCountStr] = useState('');
  const [total, setTotal] = useState('');
  const currency = useProjectCurrency(projectId);
  const [rows, setRows] = useState<Row[]>([]);
  const { saving, error, run, clearError } = useGuardedAction();

  const trimmed = name.trim();
  const nameOk = trimmed.length > 0 && trimmed.length <= MAX_NAME;
  const rowAmounts = rows.map((r) => parseAmount(r.amount));
  const installmentsOk = rows.length > 0 && rowAmounts.every((a) => a > 0);
  const canSave = nameOk && (type === 'single' ? parseAmount(amount) > 0 : installmentsOk) && !saving;

  const change = (open: boolean) => {
    if (!open) clearError();
    onOpenChange(open);
  };

  function changeCount(v: string) {
    const n = Math.min(MAX_INSTALLMENTS, parseAmount(v));
    setCountStr(n > 0 ? String(n) : '');
    setRows((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? { amount: '', date: '' }));
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  /** Splits the total evenly across the cuotas; any remainder goes to the last one. */
  function splitEvenly() {
    const t = parseAmount(total);
    const n = rows.length;
    if (t <= 0 || n === 0) return;
    const base = Math.floor(t / n);
    setRows((prev) =>
      prev.map((r, i) => ({ ...r, amount: String(i === n - 1 ? t - base * (n - 1) : base) })),
    );
  }

  function reset() {
    setName('');
    setType('single');
    setAmount('');
    setCountStr('');
    setTotal('');
    setRows([]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    const ok = await run(() =>
      type === 'single'
        ? createExpense({ projectId, name: trimmed, type, plannedAmount: parseAmount(amount) })
        : createExpense(
            { projectId, name: trimmed, type, plannedAmount: rowAmounts.reduce((s, a) => s + a, 0) },
            rows.map((r, i) => ({
              index: i + 1,
              plannedAmount: rowAmounts[i],
              dueDate: dateToMs(r.date),
            })),
          ),
    );
    if (!ok) return;
    reset();
    change(false);
  }

  const plannedSum = rowAmounts.reduce((s, a) => s + a, 0);

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={change}>
      <Modal.Container scroll="inside">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Nuevo gasto</Modal.Heading>
          </Modal.Header>
          <form onSubmit={submit}>
            <Modal.Body className="flex flex-col gap-4">
              <TextField fullWidth>
                <Label>Nombre</Label>
                <Input
                  value={name}
                  maxLength={MAX_NAME}
                  onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
                  placeholder="Ej. Constructora"
                />
              </TextField>

              <div role="group" aria-label="Tipo de gasto" className="flex gap-2">
                {(['single', 'installments'] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    variant={type === t ? 'primary' : 'secondary'}
                    aria-pressed={type === t}
                    onPress={() => setType(t)}
                  >
                    {t === 'single' ? 'Único' : 'Cuotas'}
                  </Button>
                ))}
              </div>

              {type === 'single' ? (
                <TextField fullWidth>
                  <Label>Monto planeado ({currencySymbol(currency)})</Label>
                  <Input
                    value={amount}
                    inputMode="decimal"
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                  />
                </TextField>
              ) : (
                <>
                  <TextField fullWidth>
                    <Label>Número de cuotas</Label>
                    <Input
                      value={countStr}
                      inputMode="numeric"
                      onChange={(e) => changeCount(e.target.value)}
                      placeholder="Ej. 8"
                    />
                  </TextField>
                  {rows.length > 0 && (
                    <>
                      <div className="flex items-end gap-2">
                        <TextField fullWidth>
                          <Label>Monto total ({currencySymbol(currency)})</Label>
                          <Input
                            value={total}
                            inputMode="decimal"
                            onChange={(e) => setTotal(e.target.value)}
                            placeholder="Opcional"
                          />
                        </TextField>
                        <Button type="button" variant="secondary" onPress={splitEvenly}>
                          Repartir en partes iguales
                        </Button>
                      </div>
                      <ol className="flex flex-col gap-3">
                        {rows.map((r, i) => (
                          <li key={i} className="flex items-end gap-2">
                            <TextField fullWidth>
                              <Label>{`Monto cuota ${i + 1}`}</Label>
                              <Input
                                value={r.amount}
                                inputMode="decimal"
                                onChange={(e) => updateRow(i, { amount: e.target.value })}
                                placeholder="0"
                              />
                            </TextField>
                            <TextField fullWidth>
                              <Label>{`Fecha cuota ${i + 1}`}</Label>
                              <Input
                                type="date"
                                value={r.date}
                                onChange={(e) => updateRow(i, { date: e.target.value })}
                              />
                            </TextField>
                          </li>
                        ))}
                      </ol>
                      <p className="text-sm font-bold tabular-nums text-ink">
                        Total planeado: {formatMoney(plannedSum, currency)}
                      </p>
                    </>
                  )}
                </>
              )}
              <FormError message={error} />
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="secondary" onPress={() => change(false)}>
                Cancelar
              </Button>
              <Button type="submit" isDisabled={!canSave}>
                Crear gasto
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
