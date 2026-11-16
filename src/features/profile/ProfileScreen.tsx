import { useEffect, useState } from 'react';
import { Card, Input, Label, Radio, RadioGroup, TextField } from '@heroui/react';
import pandaIcon from '../../assets/panda-app-icon.svg';
import { MAX_NAME_LENGTH, getDefaultCurrency, setDefaultCurrency, setUserName, type Currency } from '../../lib/settings';
import { useUserName } from '../../lib/useUserName';
import { isPersisted } from '../../lib/storage';
import { UpdateCheckCard } from '../updates/UpdateCheckCard';

export function ProfileScreen() {
  const [currency, setCurrency] = useState<Currency>(getDefaultCurrency);
  const storedName = useUserName();
  const [draft, setDraft] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean>();

  useEffect(() => {
    let alive = true;
    void isPersisted().then((p) => alive && setPersisted(p));
    return () => {
      alive = false;
    };
  }, []);

  const onChange = (value: string) => {
    const c: Currency = value === 'USD' ? 'USD' : 'CRC';
    setDefaultCurrency(c);
    setCurrency(c);
  };

  const saveName = () => {
    if (draft !== null) setUserName(draft); // empty/whitespace is rejected: stored name stays
    setDraft(null);
  };

  return (
    <div className="flex flex-col gap-3.5">
      <header className="flex items-center gap-3 pb-1 pt-2">
        <div className="size-[46px] shrink-0 overflow-hidden rounded-[15px] shadow-row">
          <img src={pandaIcon} alt="Panda Wallet" className="block size-full object-cover" />
        </div>
        <div>
          <div className="font-sans text-xs font-semibold text-ink-muted">Tu cuenta</div>
          <h1 className="font-display text-lg font-black leading-tight text-ink">Perfil</h1>
        </div>
      </header>

      <Card className="rounded-card border border-hairline shadow-card">
        <Card.Content>
          <TextField fullWidth>
            <Label>Tu nombre</Label>
            <Input
              maxLength={MAX_NAME_LENGTH}
              autoComplete="given-name"
              value={draft ?? storedName}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveName();
                  e.currentTarget.blur();
                }
              }}
            />
          </TextField>
        </Card.Content>
      </Card>

      <Card className="rounded-card border border-hairline shadow-card">
        <Card.Content className="flex flex-col gap-3">
          <RadioGroup
            aria-label="Moneda predeterminada para nuevos proyectos"
            value={currency}
            onChange={onChange}
            name="currency"
          >
            <span className="font-display text-[15px] font-extrabold text-ink">
              Moneda predeterminada para nuevos proyectos
            </span>
            <Radio value="CRC">
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <Radio.Content>Colones (₡ CRC)</Radio.Content>
            </Radio>
            <Radio value="USD">
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <Radio.Content>Dólares ($ USD)</Radio.Content>
            </Radio>
          </RadioGroup>
        </Card.Content>
      </Card>

      <Card className="rounded-card border border-hairline shadow-card">
        <Card.Content className="flex flex-col gap-1.5">
          <h2 className="font-display text-[15px] font-extrabold text-ink">Datos locales</h2>
          <p className="text-[13px] leading-snug text-ink-muted">
            Tus proyectos, gastos y pagos se guardan solo en este dispositivo. Funciona sin
            conexión. Nada se envía a ningún servidor; solo se consulta si hay versiones nuevas.
          </p>
          {persisted !== undefined && (
            <p
              data-testid="storage-status"
              className={`text-[12.5px] font-bold ${persisted ? 'text-green-deep' : 'text-bamboo-ink'}`}
            >
              <span aria-hidden>{persisted ? '🔒 ' : '⚠ '}</span>
              <span>{persisted ? 'Almacenamiento protegido' : 'El navegador podría borrar los datos'}</span>
            </p>
          )}
        </Card.Content>
      </Card>

      <Card className="rounded-card border border-hairline shadow-card opacity-60" aria-disabled="true">
        <Card.Content className="flex flex-col gap-1">
          <h2 className="font-display text-[15px] font-extrabold text-ink">
            Respaldo / exportar (próximamente)
          </h2>
          <p className="text-[13px] text-ink-muted">Disponible en una próxima fase.</p>
        </Card.Content>
      </Card>

      <UpdateCheckCard />
    </div>
  );
}
