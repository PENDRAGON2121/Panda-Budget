import { useEffect, useState } from 'react';
import { Button, Calendar, DateField, DatePicker, Drawer, Input, Label, ListBox, Select, TextField } from '@heroui/react';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { useInstallments } from '../../db/hooks';
import { addPayment } from '../../db/repos';
import { formatCRC, parseAmount } from '../../lib/money';
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
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<CalendarDate | null>(todayDate);
  const [target, setTarget] = useState<string>(installmentId ?? NONE);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Re-target (and reset) each time the sheet opens.
  useEffect(() => {
    if (isOpen) {
      setTarget(installmentId ?? NONE);
      setAmount('');
      setDate(todayDate());
      setFile(null);
      setNote('');
    }
  }, [isOpen, installmentId]);

  const value = parseAmount(amount);
  const canSave = value > 0 && date !== null && !saving;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || !date) return;
    setSaving(true);
    try {
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
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="bottom">
        <Drawer.Dialog>
          <Drawer.Handle />
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>Registrar pago</Drawer.Heading>
          </Drawer.Header>
          <form onSubmit={save}>
            <Drawer.Body className="flex flex-col gap-4">
              <TextField fullWidth>
                <Label>Monto (₡)</Label>
                <Input
                  value={amount}
                  inputMode="numeric"
                  placeholder="0"
                  onChange={(e) => setAmount(e.target.value)}
                />
              </TextField>

              <DatePicker value={date} onChange={setDate} className="w-full">
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

              {installments && installments.length > 0 && (
                <Select
                  fullWidth
                  aria-label="Aplicar a"
                  selectedKey={target}
                  onSelectionChange={(k) => setTarget(String(k))}
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
                        const text = `Cuota ${i.index} · ${formatCRC(i.plannedAmount)}`;
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
