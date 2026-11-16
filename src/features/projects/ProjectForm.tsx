import { useState } from 'react';
import { Button, Input, Label, ListBox, Modal, Select, TextField } from '@heroui/react';
import { createProject } from '../../db/repos';
import { currencySymbol, parseAmount } from '../../lib/money';
import { getDefaultCurrency } from '../../lib/settings';

export const MAX_NAME = 60;

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectForm({ isOpen, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState<string>(getDefaultCurrency);
  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && trimmed.length <= MAX_NAME;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    await createProject({ name: trimmed, currency, totalBudget: parseAmount(budget) });
    setName('');
    setBudget('');
    setCurrency(getDefaultCurrency());
    onOpenChange(false);
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
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
                  inputMode="numeric"
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0"
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="secondary" onPress={() => onOpenChange(false)}>
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
