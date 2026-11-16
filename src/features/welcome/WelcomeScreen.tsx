import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Button, Card, Input, Label, TextField } from '@heroui/react';
import pandaIcon from '../../assets/panda-app-icon.svg';
import { MAX_NAME_LENGTH, setUserName } from '../../lib/settings';

/** First-launch screen: asks for the user's name, then the app opens normally. */
export function WelcomeScreen() {
  const [name, setName] = useState('');
  const canSubmit = name.trim().length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (canSubmit) setUserName(name);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-[18px] pb-10 pt-[calc(2.5rem+env(safe-area-inset-top))]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex w-full flex-col items-center gap-6 text-center"
      >
        <div className="size-24 overflow-hidden rounded-[28px] shadow-card">
          <img src={pandaIcon} alt="" className="block size-full object-cover" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[28px] font-black leading-tight text-ink">
            ¡Bienvenido a Panda Wallet!
          </h1>
          <p className="text-[15px] leading-snug text-ink-muted">
            Llevá el control de cada proyecto y de cada pago.
          </p>
        </div>
        <Card className="w-full rounded-card border border-hairline text-left shadow-card">
          <Card.Content>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <TextField fullWidth>
                <Label>¿Cómo te llamás?</Label>
                <Input
                  autoFocus
                  autoComplete="given-name"
                  maxLength={MAX_NAME_LENGTH}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </TextField>
              <Button type="submit" variant="primary" fullWidth isDisabled={!canSubmit}>
                Empezar
              </Button>
            </form>
          </Card.Content>
        </Card>
      </motion.div>
    </div>
  );
}
