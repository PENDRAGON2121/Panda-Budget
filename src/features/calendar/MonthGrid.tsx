import { Button } from '@heroui/react';
import { monthGrid, MONTHS_ES } from '../../lib/calendar';

interface Props {
  year: number;
  month: number;
  selected: string;
  /** ISO days that have at least one payment. */
  activeDays: Set<string>;
  onSelect: (iso: string) => void;
}

const WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function MonthGrid({ year, month, selected, activeDays, onSelect }: Props) {
  const cells = monthGrid(year, month);
  return (
    <div>
      <div className="mb-1 grid grid-cols-7">
        {WEEK.map((w, i) => (
          <span key={i} data-testid="weekday" className="text-center text-[10px] font-extrabold text-ink-muted">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((c) => {
          const day = Number(c.iso.slice(8));
          if (!c.inMonth) {
            return (
              <span key={c.iso} aria-hidden className="flex aspect-square items-center justify-center text-[13px] font-bold text-ink-muted/40">
                {day}
              </span>
            );
          }
          const isSel = c.iso === selected;
          const active = activeDays.has(c.iso);
          return (
            <Button
              key={c.iso}
              variant={isSel ? 'primary' : 'ghost'}
              aria-label={`${day} de ${MONTHS_ES[month].toLowerCase()}${active ? ', con pagos' : ''}`}
              aria-pressed={isSel}
              onPress={() => onSelect(c.iso)}
              className="relative flex aspect-square h-auto min-w-0 items-center justify-center rounded-[11px] p-0 text-[13px] font-bold"
            >
              {day}
              {active && (
                <span
                  data-testid="dot"
                  aria-hidden
                  className={`absolute bottom-[5px] h-1 w-1 rounded-full ${isSel ? 'bg-white' : 'bg-leaf'}`}
                />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
