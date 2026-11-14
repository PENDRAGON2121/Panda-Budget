import { useState } from 'react';
import { Button, Input, Label, Modal, TextField } from '@heroui/react';
import { createProject } from '../../db/repos';
import { parseAmount } from '../../lib/money';

export const MAX_NAME = 60;

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectForm({ isOpen, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && trimmed.length <= MAX_NAME;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    await createProject({ name: trimmed, currency: 'CRC', totalBudget: parseAmount(budget) });
    setName('');
    setBudget('');
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
              <TextField fullWidth>
                <Label>Presupuesto total (₡)</Label>
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
