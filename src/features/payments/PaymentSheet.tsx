import { useEffect, useRef, useState } from 'react';
import { Button, Calendar, DateField, DatePicker, Drawer, Input, Label, ListBox, Select, TextField } from '@heroui/react';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { FormError } from '../../components/FormError';
import { useExpenseCurrency, useInstallments, usePayments } from '../../db/hooks';
import { addPayment } from '../../db/repos';
import { installmentRemaining, installmentStatus } from '../../lib/calc';
import { useGuardedAction } from '../../lib/useGuardedAction';
import { useKeyboardSafeOpen } from '../../lib/useKeyboardSafeOpen';
import { currencySymbol, formatMoney, parseAmount, formatAmountInput } from '../../lib/money';
import { compressImage } from './image';
import { ReceiptPicker } from './ReceiptPicker';

interface Props {
  expenseId: string;
  installmentId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const NONE = 'none';
const todayDate = () => today(getLocalTimeZone());

export function PaymentSheet({ expenseId, installmentId, isOpen, onOpenChange }: Props) {
  const installments = useInstallments(expenseId);
  const payments = usePayments(expenseId);
  const currency = useExpenseCurrency(expenseId);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<CalendarDate | null>(todayDate);
  const [target, setTarget] = useState<string>(installmentId ?? NONE);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const { saving, error, run, clearError } = useGuardedAction();
  const targetMenu = useKeyboardSafeOpen();
  const datePopover = useKeyboardSafeOpen();
  const targetChosen = useRef(false);

  // Re-target (and reset) each time the sheet opens.
  useEffect(() => {
    if (isOpen) {
      targetChosen.current = false;
      setTarget(installmentId ?? NONE);
      setAmount('');
      setDate(todayDate());
      setFile(null);
      setNote('');
    }
  }, [isOpen, installmentId]);

  // Default target: the given cuota, else the next unpaid ('proxima') cuota once data has loaded.
  // Decided once per opening so it never overrides the user's own choice (incl. "Sin cuota específica").
  useEffect(() => {
    if (!isOpen || targetChosen.current) return;
    if (installmentId) {
      targetChosen.current = true;
      return;
    }
    if (!installments || !payments) return;
    targetChosen.current = true;
    const next = installments.find((i) => installmentStatus(i, payments, installments) === 'proxima');
    if (next) setTarget(next.id);
  }, [isOpen, installmentId, installments, payments]);

  const change = (open: boolean) => {
    if (!open) clearError();
    onOpenChange(open);
  };

  const value = parseAmount(amount);
  const canSave = value > 0 && date !== null && !saving;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || !date) return;
    const ok = await run(async () => {
      const receipt = file ? await compressImage(file) : undefined;
      await addPayment(
        {
          expenseId,
          installmentId: target === NONE ? undefined : target,
          amount: value,
          date: new Date(date.year, date.month - 1, date.day).getTime(),
          note: note.trim() || undefined,
        },
        receipt,
      );
    });
    if (ok) change(false);
  }

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={change}>
      <Drawer.Content placement="bottom">
        <Drawer.Dialog>
          <Drawer.Handle />
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>Registrar pago</Drawer.Heading>
          </Drawer.Header>
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <Drawer.Body className="flex flex-col gap-4">
              <TextField fullWidth>
                <Label>Monto{currency ? ` (${currencySymbol(currency)})` : ''}</Label>
                <Input
                  value={amount}
                  inputMode="numeric"
                  placeholder="0"
                  onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                />
              </TextField>

              <DatePicker
                value={date}
                onChange={setDate}
                className="w-full"
                isOpen={datePopover.isOpen}
                onOpenChange={datePopover.onOpenChange}
              >
                <Label>Fecha</Label>
                <DateField.Group fullWidth>
                  <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
                  <DateField.Suffix>
                    <DatePicker.Trigger>
                      <DatePicker.TriggerIndicator />
                    </DatePicker.Trigger>
                  </DateField.Suffix>
                </DateField.Group>
                <DatePicker.Popover>
                  <Calendar aria-label="Elegir fecha">
                    <Calendar.Header>
                      <Calendar.YearPickerTrigger>
                        <Calendar.YearPickerTriggerHeading />
                        <Calendar.YearPickerTriggerIndicator />
                      </Calendar.YearPickerTrigger>
                      <Calendar.NavButton slot="previous" />
                      <Calendar.NavButton slot="next" />
                    </Calendar.Header>
                    <Calendar.Grid>
                      <Calendar.GridHeader>{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
                      <Calendar.GridBody>{(d) => <Calendar.Cell date={d} />}</Calendar.GridBody>
                    </Calendar.Grid>
                  </Calendar>
                </DatePicker.Popover>
              </DatePicker>

              {installments && installments.length > 0 && currency && (
                <Select
                  fullWidth
                  aria-label="Aplicar a"
                  selectedKey={target}
                  onSelectionChange={(k) => setTarget(String(k))}
                  isOpen={targetMenu.isOpen}
                  onOpenChange={targetMenu.onOpenChange}
                >
                  <Label>Aplicar a</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id={NONE} textValue="Sin cuota">
                        Sin cuota específica
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      {installments.map((i) => {
                        const left = installmentRemaining(i, payments ?? []);
                        const text = `Cuota ${i.index} · ${
                          left > 0 && left < i.plannedAmount
                            ? `faltan ${formatMoney(left, currency)} de ${formatMoney(i.plannedAmount, currency)}`
                            : left === 0
                              ? `${formatMoney(i.plannedAmount, currency)} · pagada`
                              : formatMoney(i.plannedAmount, currency)
                        }`;
                        return (
                          <ListBox.Item key={i.id} id={i.id} textValue={text}>
                            {text}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        );
                      })}
                    </ListBox>
                  </Select.Popover>
                </Select>
              )}

              <ReceiptPicker file={file} onChange={setFile} />

              <TextField fullWidth>
                <Label>Nota</Label>
                <Input value={note} placeholder="Opcional" onChange={(e) => setNote(e.target.value)} />
              </TextField>
              <FormError message={error} />
            </Drawer.Body>
            <Drawer.Footer>
              <Button type="submit" fullWidth isDisabled={!canSave} className="bg-leaf font-display font-extrabold text-white">
                Guardar pago
              </Button>
            </Drawer.Footer>
          </form>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
