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
      <div className="grid grid-cols-7">
        {WEEK.map((w, i) => (
          <span key={i} data-testid="weekday" className="text-center text-[11px] font-extrabold text-ink-muted">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((c) => {
          const day = Number(c.iso.slice(8));
          if (!c.inMonth) {
            return (
              <span key={c.iso} aria-hidden className="flex h-10 items-center justify-center text-[13px] font-semibold text-day-out">
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
              className={`flex h-10 w-full min-w-0 flex-col items-center justify-center gap-[3px] rounded-sm p-0 text-[13px] ${
                isSel ? 'bg-green-deep font-extrabold text-white shadow-[0_6px_14px_-6px_rgba(46,110,30,0.6)]' : 'font-bold text-ink'
              }`}
            >
              {day}
              {active && (
                <span
                  data-testid="dot"
                  aria-hidden
                  className={`size-1 rounded-full ${isSel ? 'bg-white' : 'bg-green-deep'}`}
                />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
