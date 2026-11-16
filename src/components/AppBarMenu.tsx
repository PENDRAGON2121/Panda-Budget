import { Dropdown, Label } from '@heroui/react';

interface Action {
  id: string;
  label: string;
  danger?: boolean;
  onAction: () => void;
}

/** App-bar ⋯ button (top-right) opening a HeroUI Dropdown of screen actions. */
export function AppBarMenu({ label, actions }: { label: string; actions: Action[] }) {
  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={label}
        className="flex size-[38px] shrink-0 items-center justify-center rounded-[12px] bg-white text-ink shadow-row"
      >
        <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-5">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu onAction={(key) => actions.find((a) => a.id === key)?.onAction()}>
          {actions.map((a) => (
            <Dropdown.Item key={a.id} id={a.id} textValue={a.label} variant={a.danger ? 'danger' : 'default'}>
              <Label>{a.label}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
