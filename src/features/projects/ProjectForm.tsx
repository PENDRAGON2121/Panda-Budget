import { useState } from 'react';
import { Button, Description, Input, Label, ListBox, Modal, Select, TextField } from '@heroui/react';
import { FormError } from '../../components/FormError';
import { createProject } from '../../db/repos';
import { MAX_NAME } from '../../lib/limits';
import { currencySymbol, parseAmount } from '../../lib/money';
import { getDefaultCurrency } from '../../lib/settings';
import { useGuardedAction } from '../../lib/useGuardedAction';
import { useKeyboardSafeOpen } from '../../lib/useKeyboardSafeOpen';

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectForm({ isOpen, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState<string>(getDefaultCurrency);
  const { saving, error, run, clearError } = useGuardedAction();
  const currencyMenu = useKeyboardSafeOpen();
  const trimmed = name.trim();
  const totalBudget = parseAmount(budget);
  const budgetOk = totalBudget > 0;
  const canSave = trimmed.length > 0 && trimmed.length <= MAX_NAME && budgetOk && !saving;

  const change = (open: boolean) => {
    if (!open) clearError();
    onOpenChange(open);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    const ok = await run(() => createProject({ name: trimmed, currency, totalBudget }));
    if (!ok) return;
    setName('');
    setBudget('');
    setCurrency(getDefaultCurrency());
    change(false);
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={change}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Nuevo proyecto</Modal.Heading>
          </Modal.Header>
          <form onSubmit={submit}>
            <Modal.Body className="flex flex-col gap-4">
              <TextField fullWidth>
                <Label>Nombre</Label>
                <Input
                  value={name}
                  maxLength={MAX_NAME}
                  onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
                  placeholder="Ej. Casa nueva"
                />
              </TextField>
              <Select
                fullWidth
                selectedKey={currency}
                onSelectionChange={(k) => k && setCurrency(String(k))}
                isOpen={currencyMenu.isOpen}
                onOpenChange={currencyMenu.onOpenChange}
              >
                <Label>Moneda</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="CRC" textValue="Colones ₡">Colones ₡</ListBox.Item>
                    <ListBox.Item id="USD" textValue="Dólares $">Dólares $</ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
              <TextField fullWidth>
                <Label>Presupuesto total ({currencySymbol(currency)})</Label>
                <Input
                  value={budget}
                  inputMode="decimal"
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0"
                />
                {!budgetOk && (
                  <Description className="text-xs text-ink-muted">Ingresá un presupuesto mayor a 0</Description>
                )}
              </TextField>
              <FormError message={error} />
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="secondary" onPress={() => change(false)}>
                Cancelar
              </Button>
              <Button type="submit" isDisabled={!canSave}>
                Crear proyecto
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
