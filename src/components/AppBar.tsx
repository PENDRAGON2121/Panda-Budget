import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Detail app bar: back button · white title card (title + subtitle) · optional ⋯ menu. */
export function AppBar({
  backTo,
  backLabel,
  title,
  subtitle,
  menu,
}: {
  backTo: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  menu?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-2.5">
      <Link
        to={backTo}
        aria-label={backLabel}
        className="flex size-10 shrink-0 items-center justify-center rounded-[13px] border border-hairline-strong bg-white text-xl font-bold leading-none text-ink no-underline shadow-appbar"
      >
        ‹
      </Link>
      <div className="min-w-0 flex-1 rounded-[15px] border border-hairline-strong bg-white px-3.5 py-[7px] shadow-appbar">
        <h1 className="m-0 break-words font-display text-[15px] font-black leading-tight text-ink">{title}</h1>
        {subtitle && <div className="text-[10.5px] font-semibold leading-tight text-ink-muted">{subtitle}</div>}
      </div>
      {menu}
    </header>
  );
}
