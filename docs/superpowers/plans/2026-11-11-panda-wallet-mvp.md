# Panda Wallet MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the local-first, mobile-first Panda Wallet PWA for tracking project budgets (Proyecto → Gastos → Pagos) with HeroUI, matching the approved design.

**Architecture:** Vite + React + TypeScript SPA. IndexedDB (Dexie) is the single source of truth; the UI is reactive via `useLiveQuery`. Pure domain logic (money formatting, planned-vs-paid, installment status, project distribution, calendar grid) lives in `src/lib` and is unit-tested; UI is composed from HeroUI components and animated with animate-ui / Motion; visuals are verified against the prototypes in the browser.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v4, HeroUI v3, animate-ui / `motion`, Dexie + `dexie-react-hooks`, React Router, `vite-plugin-pwa`, embla-carousel-react. Tests: Vitest + React Testing Library + `fake-indexeddb` + jsdom.

**Spec:** `docs/design-doc.md` (design) and `docs/design-system.md` (visual rules). Prototypes: `docs/prototypes/*.html`. Icons: `docs/assets/panda-app-icon.svg`, `docs/assets/panda-sin-fondo.svg`.

## Global Constraints

- UI from the library only: **HeroUI v3 + Tailwind v4** components, animated with **animate-ui / Motion**. No hand-built UI primitives unless the user asks.
- **Local-first:** IndexedDB via Dexie. No backend, no auth, no network calls for data.
- Currency: **CRC `₡`** (configurable per project), thousands separated by **period** → `₡38.000.000`.
- Titles: **≤ 60 characters**, enforced at input, **never truncated** in display (wrap); only descriptions may truncate with `…`.
- **Over-allocation** (Σ planned > total) and **over-spend** (paid > planned) are **allowed and flagged in red**, never blocked.
- Two levels only: `Project → Expense`. Projects are independent.
- Persistent bottom nav, 4 tabs: **Inicio · Proyectos · Calendario · Perfil**. Create/edit/register = overlay (modal/drawer), never replaces the nav.
- Visual identity: Direction A, Panda Bambú tokens, **Nunito** (display) + **Inter** (sans; `tabular-nums` for money). Tokens in `design-system.md §2,§10`.
- Respect `prefers-reduced-motion` (motion-off variant).

## Review Focus

- **Over-spend / over-allocation:** paid > planned and Σ planned > total must render red flags with correct `remaining`/`available` (can be negative) and no `NaN`. → Task 3.
- **Currency parse/format edges:** `₡0`, millions, and user typing non-digits must format as `₡` + period-grouped and parse safely to a non-negative integer. → Task 3.
- **Empty states:** no projects, project with no gastos, and a calendar day with no payments must render a friendly empty state, never crash. → Tasks 5, 6, 10.
- **Title length:** a 60-char title is accepted and shown in full (wraps); input blocks >60. → Tasks 5, 7.
- **Optional receipt:** a payment saved without a receipt shows "sin recibo"; a saved receipt renders from a Blob and its objectURL is revoked on unmount. → Task 8.

---

### Task 1: Scaffolding, theme, and app shell

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `tailwind.config.ts`, `src/main.tsx`, `src/app/App.tsx`, `src/app/theme.ts`, `src/app/TabBar.tsx`, `src/styles.css`
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Test: `src/app/TabBar.test.tsx`

**Interfaces:**
- Produces: `<App/>` mounting a `BrowserRouter` with routes `/` (Inicio), `/proyectos`, `/calendario`, `/perfil`, each rendering a placeholder, wrapped in a layout that always renders `<TabBar/>`. Theme exposes Tailwind tokens from `design-system.md §10` (primary `#4f9e34`/`#3c8a2e`, danger `#e0592f`, radii, fonts Inter/Nunito).

- [ ] **Step 1: Scaffold** Vite React-TS app; add Tailwind v4, HeroUI v3 (`HeroUIProvider`), `motion`, React Router, `vite-plugin-pwa`; add Vitest + RTL + `fake-indexeddb` + jsdom. Configure `src/styles.css` with the Panda Bambú tokens and Google Fonts (Inter, Nunito). Verify HeroUI v3 provider/setup against current docs (use the docs MCP).
- [ ] **Step 2: Write the failing test** `src/app/TabBar.test.tsx`:
```tsx
test('renders the four persistent tabs', () => {
  render(<MemoryRouter><TabBar/></MemoryRouter>);
  for (const label of ['Inicio','Proyectos','Calendario','Perfil'])
    expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument();
});
```
- [ ] **Step 3: Run it — expect FAIL** (`TabBar` not implemented).
- [ ] **Step 4: Implement** `TabBar` (4 `NavLink`s with icons, active = `leaf`) and the layout in `App.tsx` so every route shows it.
- [ ] **Step 5: Run the test — expect PASS.** Also run `npm run build` and the dev server; confirm the shell renders with the theme.
- [ ] **Step 6: Commit** `chore: scaffold Panda Wallet app shell, theme, and tab bar`.

---

### Task 2: Data layer — Dexie schema and types

**Files:**
- Create: `src/db/types.ts`, `src/db/db.ts`
- Test: `src/db/db.test.ts`

**Interfaces:**
- Produces: the interfaces `Project, Expense, Installment, Payment, Receipt` exactly as in `design-doc.md §6`. `db` is a Dexie instance with stores: `projects: 'id, createdAt'`, `expenses: 'id, projectId'`, `installments: 'id, expenseId, index'`, `payments: 'id, expenseId, installmentId, date'`, `receipts: 'id'`. IDs are `crypto.randomUUID()`.

- [ ] **Step 1: Write the failing test** `db.test.ts` (uses `fake-indexeddb`): create a `Project`, read it back by id, assert fields round-trip; assert `payments` can be queried by the `date` index.
- [ ] **Step 2: Run it — expect FAIL.**
- [ ] **Step 3: Implement** `types.ts` and `db.ts` with the stores above.
- [ ] **Step 4: Run the test — expect PASS.**
- [ ] **Step 5: Commit** `feat(db): add Dexie schema and domain types`.

---

### Task 3: Domain logic — money + derived calculations

**Files:**
- Create: `src/lib/money.ts`, `src/lib/calc.ts`
- Test: `src/lib/money.test.ts`, `src/lib/calc.test.ts`

**Interfaces:**
- Produces:
  - `formatCRC(n: number): string` → `formatCRC(38000000) === '₡38.000.000'`, `formatCRC(0) === '₡0'`.
  - `parseAmount(input: string): number` → digits only, non-negative integer; `parseAmount('₡1.200.000')===1200000`, `parseAmount('abc')===0`.
  - `expenseProgress(expense: Expense, payments: Payment[]): { paid: number; remaining: number; pct: number; over: boolean }` — `pct` clamped display value is caller's job; `over = paid > plannedAmount`; `remaining = plannedAmount - paid` (may be negative).
  - `installmentStatus(inst: Installment, payments: Payment[], siblings: Installment[]): 'pagada'|'proxima'|'pendiente'` — pagada if its applied payments ≥ `plannedAmount`; else the earliest unpaid by `index` is `proxima`, rest `pendiente`.
  - `projectSummary(project: Project, expenses: Expense[], payments: Payment[]): { paid: number; available: number; pct: number; overAllocated: boolean; distribution: { expenseId: string; amount: number; pct: number }[] }` — `available = totalBudget - paid` (may be negative); `overAllocated = Σ expense.plannedAmount > totalBudget`; distribution pct over `totalBudget`, plus an implicit "disponible" remainder the UI adds.

- [ ] **Step 1: Write failing tests** covering: format/parse edges (0, millions, non-numeric → Review Focus); `expenseProgress` with paid < / = / > planned (over flag true, remaining negative — Review Focus); `installmentStatus` for paid, next, pending, and an over-payment on one cuota; `projectSummary` with Σ planned > total → `overAllocated` true and `available` negative (Review Focus).
- [ ] **Step 2: Run them — expect FAIL.**
- [ ] **Step 3: Implement** `money.ts` (use `Intl`/manual period grouping to guarantee `.` separators) and `calc.ts`.
- [ ] **Step 4: Run the tests — expect PASS.**
- [ ] **Step 5: Commit** `feat(lib): money formatting and planned-vs-paid calculations`.

---

### Task 4: Repositories and reactive hooks

**Files:**
- Create: `src/db/repos.ts`, `src/db/hooks.ts`
- Test: `src/db/repos.test.ts`

**Interfaces:**
- Produces (repos): `createProject(data)`, `updateProject(id, patch)`, `deleteProject(id)` **cascade** (expenses, installments, payments, and receipts owned only by those payments); `createExpense(data, installments?)` — when `type==='installments'`, persists the provided installment rows; `addPayment(data, receipt?: { blob: Blob; mime: string })` — stores the receipt and links `receiptId`; `deletePayment(id)` — frees its receipt if unreferenced.
- Produces (hooks): `useProjects()`, `useProject(id)`, `useExpenses(projectId)`, `usePayments(expenseId)`, `useInstallments(expenseId)`, `usePaymentsBetween(startMs, endMs)` — all via `useLiveQuery`.

- [ ] **Step 1: Write failing tests:** creating an expense with 3 installments persists 3 rows; `addPayment` with a receipt stores a `receipts` row and links it; `deleteProject` removes all descendants and leaves no orphan payments/receipts (Review Focus — persistence/cascade).
- [ ] **Step 2: Run them — expect FAIL.**
- [ ] **Step 3: Implement** `repos.ts` (transactions for cascade) and `hooks.ts`.
- [ ] **Step 4: Run the tests — expect PASS.**
- [ ] **Step 5: Commit** `feat(db): repositories and live-query hooks`.

---

### Task 5: Proyectos grid, create-project, and empty state

**Files:**
- Create: `src/features/projects/ProjectsScreen.tsx`, `src/features/projects/ProjectCard.tsx`, `src/features/projects/ProjectForm.tsx` (HeroUI `Modal`), `src/features/projects/EmptyProjects.tsx`
- Test: `src/features/projects/ProjectsScreen.test.tsx`
- Reference: `docs/prototypes/proyectos-transicion.html` (grid + add card), `home-A-empty.html` (empty state)

**Interfaces:**
- Consumes: `useProjects`, `createProject` (Task 4), `projectSummary` (Task 3).
- Produces: route `/proyectos` renders a grid of `ProjectCard` + a "Nuevo proyecto" card opening `ProjectForm`; `ProjectCard` shows name, total, mini progress, "% · N gastos".

- [ ] **Step 1: Write failing tests:** with a seeded project the grid shows its name and `formatCRC(total)`; with no projects the empty state renders "Agregá un proyecto" (Review Focus — empty); `ProjectForm` blocks names > 60 chars and accepts exactly 60 (Review Focus — title).
- [ ] **Step 2: Run them — expect FAIL.**
- [ ] **Step 3: Implement** the screen/card/form/empty with HeroUI; wire create.
- [ ] **Step 4: Run tests — expect PASS;** verify visuals vs prototype in the browser.
- [ ] **Step 5: Commit** `feat(projects): grid, create-project modal, empty state`.

---

### Task 6: Proyecto detail + distribution + container transform

**Files:**
- Create: `src/features/projects/ProjectDetail.tsx`, `src/features/projects/DistributionBar.tsx`, `src/features/projects/ProjectSummaryCard.tsx`
- Test: `src/features/projects/ProjectDetail.test.tsx`
- Reference: `docs/prototypes/proyecto-detalle.html`; transform = `proyectos-transicion.html`

**Interfaces:**
- Consumes: `useProject`, `useExpenses`, `usePayments`, `projectSummary`.
- Produces: route `/proyectos/:id`; summary (total, pagado, disponible, % ejecutado), `DistributionBar` (segments per expense + disponible, over-spend segment in `danger`), and the Gastos list (each links to `/gastos/:id`). FAB `+` opens expense creation (Task 7). Container transform via Motion `layoutId` shared with `ProjectCard`.

- [ ] **Step 1: Write failing tests:** renders `pagado`/`disponible` from `projectSummary`; when Σ planned > total the over-allocation flag shows (Review Focus); DistributionBar renders one segment per expense plus disponible; with no expenses, a Gastos empty state renders (Review Focus — empty).
- [ ] **Step 2: Run them — expect FAIL.**
- [ ] **Step 3: Implement;** add `layoutId` to `ProjectCard`↔`ProjectDetail` container.
- [ ] **Step 4: Run tests — expect PASS;** verify the transform and distribution in the browser (both reduced-motion on/off).
- [ ] **Step 5: Commit** `feat(projects): detail, distribution bar, container transform`.

---

### Task 7: Gasto creation (single / installments) + Gasto detail

**Files:**
- Create: `src/features/expenses/ExpenseForm.tsx`, `src/features/expenses/ExpenseDetail.tsx`, `src/features/expenses/InstallmentTimeline.tsx`
- Test: `src/features/expenses/ExpenseForm.test.tsx`, `src/features/expenses/ExpenseDetail.test.tsx`
- Reference: `docs/prototypes/gasto-detalle.html`

**Interfaces:**
- Consumes: `createExpense`, `useExpenses`, `useInstallments`, `usePayments`, `expenseProgress`, `installmentStatus`.
- Produces: `ExpenseForm` (type toggle; for installments, editable count/amounts/dates — flexible); route `/gastos/:id` detail (planeado vs pagado + restante; for installments, `InstallmentTimeline` with status + receipt per cuota, next-due highlighted). FAB "Registrar pago" opens Task 8.

- [ ] **Step 1: Write failing tests:** creating an installments expense with count 8 persists 8 cuotas with the given planned amounts; detail shows `over` red when paid > planned (Review Focus); the earliest unpaid cuota is marked `proxima`; name > 60 blocked (Review Focus — title).
- [ ] **Step 2: Run them — expect FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run tests — expect PASS;** verify timeline vs prototype.
- [ ] **Step 5: Commit** `feat(expenses): create single/installments and detail timeline`.

---

### Task 8: Registrar pago (bottom-sheet) + receipt capture

**Files:**
- Create: `src/features/payments/PaymentSheet.tsx` (HeroUI `Drawer` placement bottom), `src/features/payments/ReceiptPicker.tsx`, `src/features/payments/ReceiptThumb.tsx`
- Test: `src/features/payments/PaymentSheet.test.tsx`, `src/features/payments/ReceiptThumb.test.tsx`
- Reference: `docs/prototypes/registrar-pago.html`

**Interfaces:**
- Consumes: `addPayment`, `useInstallments`, `parseAmount`, `formatCRC`.
- Produces: `PaymentSheet({ expenseId, installmentId? })` with fields monto (`parseAmount`), fecha (HeroUI DatePicker, default today), "aplicar a" (installment Select), captura opcional (ReceiptPicker → File/Blob), nota. On save calls `addPayment`. `ReceiptThumb({ receiptId })` renders the Blob via objectURL and **revokes it on unmount**.

- [ ] **Step 1: Write failing tests:** saving a payment calls `addPayment` with parsed amount and chosen date and, when applicable, `installmentId`; saving without a receipt yields no `receiptId` and the UI shows "sin recibo"; `ReceiptThumb` creates and then revokes its objectURL on unmount (Review Focus — optional receipt).
- [ ] **Step 2: Run them — expect FAIL.**
- [ ] **Step 3: Implement** (compress/resize image before storing — builder's call on exact size).
- [ ] **Step 4: Run tests — expect PASS;** verify the sheet vs prototype.
- [ ] **Step 5: Commit** `feat(payments): register-payment sheet with optional receipt`.

---

### Task 9: Inicio — project carousel + active-project gastos

**Files:**
- Create: `src/features/home/HomeScreen.tsx`, `src/features/home/ProjectCarousel.tsx`, `src/features/home/HomeGastos.tsx`, `src/features/home/EmptyHome.tsx`
- Test: `src/features/home/HomeScreen.test.tsx`
- Reference: `docs/prototypes/home-A-v5.html`, `home-A-empty.html`

**Interfaces:**
- Consumes: `useProjects`, `useExpenses`, `projectSummary`, `expenseProgress`.
- Produces: route `/`; infinite loop carousel (embla, `loop:true`) of project summary cards with page dots; below, `HomeGastos` for the active project that re-renders on slide change (directional transition via Motion); empty state when no projects.

- [ ] **Step 1: Write failing tests:** with 2 projects the carousel renders both; the gastos section shows the active project's expenses and, after changing the selected project (logic/state level), shows the other project's expenses; empty state when none (Review Focus — empty).
- [ ] **Step 2: Run them — expect FAIL.**
- [ ] **Step 3: Implement** (carousel loop + directional gastos transition with `prefers-reduced-motion` fallback).
- [ ] **Step 4: Run tests — expect PASS;** verify carousel + transition in the browser.
- [ ] **Step 5: Commit** `feat(home): project carousel and active-project gastos`.

---

### Task 10: Calendario — month navigation + day records

**Files:**
- Create: `src/lib/calendar.ts`, `src/features/calendar/CalendarScreen.tsx`, `src/features/calendar/MonthGrid.tsx`, `src/features/calendar/DayRecords.tsx`
- Test: `src/lib/calendar.test.ts`, `src/features/calendar/CalendarScreen.test.tsx`
- Reference: `docs/prototypes/calendario.html`

**Interfaces:**
- Consumes: `usePaymentsBetween`, `formatCRC`.
- Produces: `monthGrid(year, month): { iso: string; inMonth: boolean }[]` (Monday-first, leading/trailing filler); `CalendarScreen` with month nav (prev/next), activity dots on days with payments, and `DayRecords` listing the selected day's payments (project/gasto, amount, receipt, day total) or an empty state.

- [ ] **Step 1: Write failing tests:** `monthGrid(2026,4)` (May) starts on the correct weekday and has 31 in-month days; a day with 2 payments lists both and the total equals their sum; a day with none shows "Sin registros este día" (Review Focus — empty).
- [ ] **Step 2: Run them — expect FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run tests — expect PASS;** verify vs prototype (navigate months, tap dates).
- [ ] **Step 5: Commit** `feat(calendar): month navigation and per-day records`.

---

### Task 11: Perfil, PWA packaging, reduced-motion, polish

**Files:**
- Create: `src/features/profile/ProfileScreen.tsx`, `public/manifest` icons from `docs/assets/panda-app-icon.svg`
- Modify: `vite.config.ts` (PWA manifest: name "Panda Wallet", theme `#c4e8c8`, icons), `src/styles.css` (global `prefers-reduced-motion`)
- Test: `src/features/profile/ProfileScreen.test.tsx`

**Interfaces:**
- Consumes: project count / default currency setting.
- Produces: route `/perfil` (default currency, app info, note that data is local + fase-2 backup placeholder); installable PWA with the panda icon; a global reduced-motion rule disabling non-essential animation.

- [ ] **Step 1: Write failing test:** Profile renders the default-currency control and the "datos locales" note; (manifest presence asserted via a build check).
- [ ] **Step 2: Run it — expect FAIL.**
- [ ] **Step 3: Implement** profile, generate PWA icons from the SVG, add the reduced-motion rule.
- [ ] **Step 4: Run tests + `npm run build` — expect PASS;** verify install/manifest and motion-off in the browser.
- [ ] **Step 5: Commit** `feat(profile): profile screen, PWA packaging, reduced-motion`.

---

### Task 12: Movimientos (historial de entradas y salidas por proyecto)

*Added 2026-11-16 at the user's request ("cada pago agregado debe registrar un movimiento — cada entrada y salida de cada proyecto"). User decision: Movimientos is the chronological history of the project — the initial budget load is the first **entrada**, every payment is a **salida**; no other kind of entrada.*

**Files:**
- Create: `src/lib/movements.ts`, `src/features/projects/MovementsList.tsx`
- Modify: `src/features/projects/ProjectDetail.tsx` (HeroUI `Tabs`: "Gastos" | "Movimientos")
- Test: `src/lib/movements.test.ts`, `src/features/projects/MovementsList.test.tsx`
- Reference: `docs/design-system.md` (tokens, rows, chips)

**Interfaces:**
- Consumes: `Project, Expense, Installment, Payment` (`src/db/types.ts`); `useProject`, `useExpenses`, `useAllPayments`/`usePayments`, `useInstallments` (`src/db/hooks.ts`); `formatMoney` (`src/lib/money.ts`); `ReceiptThumb` (`src/features/payments`).
- Produces: `projectMovements(project: Project, expenses: Expense[], installments: Installment[], payments: Payment[]): Movement[]` where
  `Movement = { id: string; kind: 'entrada' | 'salida'; date: number; label: string; detail?: string; amount: number; balance: number; receiptId?: string; expenseId?: string }`.
  - Derived, never stored (deleting a payment removes its movement automatically).
  - First movement: `kind:'entrada'`, `id:'budget-'+project.id`, `date: project.createdAt`, `label:'Presupuesto inicial'`, `amount: project.totalBudget`, `balance: project.totalBudget`.
  - One `salida` per payment of the project's expenses, chronological by `date` then `createdAt`: `label` = gasto name, `detail` = `"Cuota N"` (or the installment label) when `installmentId` is set, `amount` = payment amount, `balance` = running `totalBudget − cumulative paid` (may go negative).
  - Return order: oldest → newest (UI renders newest first).

- [ ] **Step 1: Write failing tests** `movements.test.ts`: budget entrada first with balance = total; salidas in date order with running balance; tie broken by `createdAt`; cuota detail "Cuota 3"; balance goes negative on over-spend; payments of other projects excluded; no payments → only the entrada. `MovementsList.test.tsx`: renders newest first, entrada shown as `+₡…` and salidas as `−₡…` in the project's currency, running saldo shown, receipt thumb for payments with `receiptId`; after `deletePayment` the movement disappears; ProjectDetail shows the "Movimientos" tab.
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement** `movements.ts` (pure) and `MovementsList` (HeroUI Card rows, entrada in `leaf`/green, salida in ink, negative saldo in `danger`); add HeroUI `Tabs` "Gastos | Movimientos" to ProjectDetail (Gastos stays default). Rows link to the gasto detail.
- [ ] **Step 4: Run tests — expect PASS;** `tsc --noEmit`, `npm run build`.
- [ ] **Step 5: Commit** `feat(projects): movimientos history (entradas y salidas)`.

Note for a future "editar proyecto" task: changing `totalBudget` after creation must surface as its own movement (e.g. "Ajuste de presupuesto"), which will require storing budget changes.

---

### Task 13: Rediseño — contorno y elevación (aplicar el lienzo aprobado)

*Added 2026-11-16 — user approved applying the redesign from the Design canvas "Panda Wallet — contorno y elevación" (Inicio, Proyecto, Gasto, Calendario + "Sistema de elevación" board). Problem it solves: white cards and the bottom nav blended into the background.*

**Files (expected):** `src/styles.css` (tokens), `src/app/TabBar.tsx`, the card/row components across `src/features/{home,projects,expenses,calendar,payments,profile}`, `src/features/expenses/InstallmentTimeline.tsx`, `docs/design-system.md` (update §2/§4/§5/§7 with the new rules). Tests: adjust/add where structure changes (TabBar active state, timeline).

**Exact values (from the "Sistema de elevación" board):**
- Ground: `linear-gradient(180deg, #dcefd8 0%, #eaf5e7 34%, #f1f6ef 100%)` — never ends in white.
- Card (level 1): bg `#ffffff`; border `1px solid rgba(36,33,43,0.07)`; shadow `0 1px 2px rgba(36,33,43,0.05), 0 14px 30px -16px rgba(46,90,34,0.34)`; radius 22 (hero/summary), 18 (rows, shadow `0 1px 2px rgba(36,33,43,0.05), 0 8px 20px -14px rgba(46,90,34,0.30)`), 16 (cuota/calendar rows).
- Floating (level 2): bottom nav = island `left/right 12px, bottom 14px, height 66px, radius 24, bg #fff, border 1px rgba(36,33,43,0.08), shadow 0 1px 2px rgba(36,33,43,0.06), 0 16px 34px -14px rgba(36,64,30,0.38)`; page content gets bottom padding so nothing hides under it. FAB: add ring `0 0 0 4px rgba(255,255,255,0.92)` + `0 14px 26px -8px rgba(46,110,30,0.6)`, positioned above the island (bottom ≈ 96px).
- Inside cards: rails `#eef1ec` + `inset 0 0 0 1px rgba(36,33,43,0.04)`; separators `1px #eef1ec`; secondary controls `#f4f8f2`. Never a shadow inside a card.
- Active tab (nav): pill `#dcefd8`, icon `#2f6f22`, label ink `#24212b` 800; inactive `#5d5866` (no opacity). **The active pill glides between tabs** (Motion shared `layoutId`), respecting reduced motion.
- App-bar icon buttons (back, ⋯): 40px, radius 13, white, hairline border + `0 1px 2px rgba(36,33,43,0.06), 0 6px 14px -8px rgba(46,90,34,0.35)`.
- Over-spend rows: border `1px solid rgba(203,71,36,0.22)`, shadow tinted `rgba(203,71,36,0.30)`, text `#b23f1d`.
- **Bamboo timeline** (gasto detail cuotas): the vertical line is a bamboo cane — pale rail `#e1ead9` full height, and the grown cane (8px wide, radius 4, `linear-gradient(90deg,#6db546,#7cc04b 30%,#b9e28f 50%,#7cc04b 70%,#5fa83c)`, knots `3px #4c8a2c` between cuotas) that grows on mount (~1.8s ease-out) from the top down to the próxima cuota (or the full length when all paid); two leaves (`#4f9e34`, `#6db546`) at the growing tip, rendered above the status dots, sitting just before the próxima dot, gently swaying (rotate ±7°, 3.2s loop). Reduced motion: static, fully grown.

**Steps:** TDD where behaviour changes (nav active state, timeline grown length = paid progress); then restyle; `tsc`, full `vitest run`, `npm run build`; commit `feat(ui): contorno y elevación redesign`.
