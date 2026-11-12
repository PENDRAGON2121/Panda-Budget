# Panda Wallet — Documento de Diseño

**Fecha:** 2026-11-11 · **Estado:** para aprobación (antes de construir) · **Tipo:** proyecto

Documentos hermanos: reglas visuales en [`design-system.md`](./design-system.md) · prototipos navegables en [`prototypes/`](./prototypes) · assets de marca en [`assets/`](./assets).

> Este documento define **qué** construimos y **cómo**, con suficiente detalle para planificar e implementar sin volver atrás. Lo visual (tokens, tipografía, componentes) vive en el sistema de diseño y no se repite aquí.

---

## 1. Intención y por qué

Panda Wallet es una **webapp mobile-first para dar seguimiento al presupuesto de proyectos personales con gastos grandes y escalonados**.

**El problema (caso real):** alguien emprende un proyecto —p. ej. *construir una casa*— con un presupuesto. Dentro hay desembolsos de naturaleza distinta: *patentes* (un solo pago), *constructora* (muchas cuotas), *materiales* (compras sueltas). La persona necesita **visibilidad y seguimiento**: cuánto planeó por rubro, cuánto lleva pagado, **en qué se fue la plata**, **cuándo** se hizo cada pago, y poder guardar **el comprobante del giro** de forma opcional.

**Para quién:** el propio usuario, gestionando uno o varios proyectos independientes (construcción, remodelación, viaje, etc.), en Costa Rica (colones).

**Por qué ahora:** hoy esto se lleva en hojas de cálculo o en la cabeza; falta una herramienta simple, visual y de bolsillo que muestre el estado sin fricción.

**Resultado esperado:** abrir la app y en segundos entender, por proyecto, cuánto queda, dónde se fue y qué pasó cada día.

---

## 2. Objetivos / No-objetivos / Anti-objetivos

**Objetivos (MVP):**
- Crear **proyectos** con presupuesto total e identidad (nombre, ícono/emoji).
- Dentro de cada proyecto, crear **gastos** con **monto planeado** propio y tipo **tracto único** o **cuotas planeadas pero flexibles**.
- **Registrar pagos** (monto, fecha, **recibo/captura opcional**) contra un gasto o una cuota.
- Ver **planeado vs pagado** por gasto y por proyecto, con **alertas de sobre-giro/sobre-asignación**.
- Ver **distribución** ("en qué se fue la plata") por proyecto.
- **Calendario** para navegar por fechas y ver los **registros de cada día** (tracking diario).
- Funcionar **local-first** y usable como PWA en el teléfono.

**No-objetivos (fase 1, sí candidatos a fase 2):**
- Nube, cuentas, login, sincronización multi-dispositivo, colaboración multiusuario.
- Exportación/reportes avanzados, gráficas históricas complejas.
- Múltiples monedas simultáneas, conversión, integración bancaria/OCR de recibos.
- Notificaciones push / recordatorios de vencimiento (nice-to-have posterior).

**Anti-objetivos (qué sería un fracaso aunque "funcione"):**
- Sentirse como contabilidad pesada o un ERP.
- **Bloquear** al usuario por sobre-girar o sobre-asignar (debe avisar, no impedir).
- Perder la **coherencia visual** entre vistas.
- Construir componentes a mano en vez de usar la biblioteca.

---

## 3. Restricciones

- **Plataforma:** React web, mobile-first (no React Native).
- **UI:** **HeroUI v3 + Tailwind CSS v4**; **componentes siempre desde la biblioteca** (+ **animate-ui / Motion** para animación). Nada a mano salvo indicación explícita del usuario.
- **Persistencia:** local-first (IndexedDB). Sin backend en fase 1.
- **Moneda:** colones `₡` (configurable por proyecto), formato con separador de miles por punto.
- **Identidad visual:** Dirección **A (menta cálida)**, paleta **Panda Bambú**, Nunito + Inter. Ver `design-system.md`.
- **Contenido:** títulos ≤ **60 caracteres** y nunca truncados; solo descripciones pueden recortarse.

---

## 4. Enfoques considerados (y el elegido)

- **A — App local-first real, "estilo primero" (ELEGIDO).** Vite + React + TS, HeroUI v3 + Tailwind v4, animate-ui, IndexedDB. Entrega un producto usable y persistente ya; nube como fase 2. Elegido por calzar exactamente con "prototipos de alta fidelidad + desarrollo real".
- **B — Mock navegable sin persistencia.** Descartado: no es usable, habría que rehacer la lógica.
- **C — Full-stack con nube/cuentas desde el día 1.** Descartado para el arranque: mucho mayor alcance y contradice el local-first acordado. Queda como fase 2.
- **Next.js:** descartado para una SPA mobile client-only; el SSR agrega peso sin beneficio.

---

## 5. Arquitectura y stack

- **Build:** Vite + React + TypeScript. **PWA** con `vite-plugin-pwa` (instalable, offline shell).
- **UI:** HeroUI v3 + Tailwind v4, tema personalizado con los tokens Panda Bambú (ver §8 y `design-system.md`).
- **Animación:** animate-ui / Motion (`layoutId` para el container transform; variantes para entradas, carrusel, transiciones de gastos y calendario).
- **Ruteo:** React Router (tabs + rutas de detalle). Las acciones crear/editar/registrar son **overlays** (modal/drawer), no rutas que tapen la nav.
- **Estado + datos:** **Dexie (IndexedDB)** como fuente de verdad; capa de hooks/consultas reactivas (`dexie-react-hooks` `useLiveQuery`) para que la UI refleje cambios al instante. Estado efímero de UI con React state/Zustand si hace falta.
- **Recibos:** imágenes guardadas como **Blob** en IndexedDB (tabla `receipts`), referenciadas por id; render con `URL.createObjectURL`.
- **Estructura propuesta:**
  ```
  src/
    app/            (router, layout con tab bar persistente, tema)
    features/
      projects/     (lista/grid, detalle, crear/editar)
      expenses/     (detalle de gasto, cuotas, crear/editar)
      payments/     (registrar pago, recibo)
      calendar/     (vista mes + registros del día)
    db/             (Dexie schema, repos, selectores derivados)
    components/     (wrappers finos sobre HeroUI si se necesitan)
    lib/            (formato ₡, fechas, cálculos planeado/pagado)
    assets/         (panda-app-icon.svg, panda-sin-fondo.svg)
  ```

---

## 6. Modelo de datos

Dos niveles (`Proyecto → Gasto`), con cuotas y pagos colgando del gasto. Interfaces de referencia:

```ts
interface Project {
  id: string;
  name: string;        // ≤ 60, requerido
  icon?: string;       // emoji o clave de ícono
  currency: string;    // 'CRC' por defecto
  totalBudget: number; // presupuesto total
  note?: string;
  createdAt: number;
}

interface Expense {            // "Gasto" (sub-proyecto / rubro)
  id: string;
  projectId: string;
  name: string;                // ≤ 60
  icon?: string;
  type: 'single' | 'installments';
  plannedAmount: number;       // monto planeado del rubro
  note?: string;
  createdAt: number;
}

interface Installment {        // solo si type === 'installments'
  id: string;
  expenseId: string;
  index: number;               // orden (1..n)
  label?: string;              // "Anticipo", "Retención", ...
  plannedAmount: number;       // editable (flexible)
  dueDate?: number;            // vencimiento opcional
  // estado se deriva de los pagos aplicados
}

interface Payment {
  id: string;
  expenseId: string;
  installmentId?: string;      // si aplica a una cuota
  amount: number;
  date: number;                // fecha del pago (clave para el calendario)
  receiptId?: string;          // captura opcional
  note?: string;
  createdAt: number;
}

interface Receipt { id: string; blob: Blob; mime: string; }
```

**Valores derivados (no se guardan, se calculan):**
- Gasto: `pagado = Σ payments.amount`; `pct = pagado / plannedAmount`; `over = pagado > plannedAmount`.
- Cuota: `pagado`, `status ∈ {pendiente, próxima, pagada}` (próxima = la primera pendiente por fecha).
- Proyecto: `pagado = Σ gastos.pagado`; `disponible = totalBudget − pagado`; `distribución` = share de cada gasto (+ disponible) sobre `totalBudget`; `sobreAsignado = Σ gastos.plannedAmount > totalBudget`.

**Reglas de negocio:**
- **Sobre-asignar** (rubros planeados > total) y **sobre-girar** (pagado > planeado): **permitidos**, se marcan en **rojo**; nunca se bloquean.
- Cuotas **flexibles**: se puede editar monto/fecha, agregar una cuota extra o registrar un pago suelto.
- Borrados: borrar un gasto borra sus cuotas/pagos; borrar un pago libera su recibo si no lo usa otro.

---

## 7. Pantallas, navegación y flujos

**Tabs persistentes:** `Inicio · Proyectos · Calendario · Perfil` (barra inferior siempre visible; detalle usa app bar con volver + nav visible; crear/editar/registrar = overlay).

- **Inicio:** saludo + **carrusel infinito** de proyectos (tarjeta centrada, asomo simétrico, puntos). Debajo, los **Gastos** del proyecto activo, que cambian con **transición direccional** al deslizar. FAB `+` = nuevo proyecto. *Empty state* si no hay proyectos (tarjeta "Agregá un proyecto" + botón circular). → `prototypes/home-A-v5.html`, `home-A-empty.html`.
- **Proyectos (tab):** **grid de tarjetas**; tarjeta "+ Nuevo proyecto" para crear. Tocar una tarjeta → **container transform** hacia su detalle; volver la contrae. → `prototypes/proyectos-transicion.html`.
- **Proyecto (detalle):** resumen (total, pagado, disponible, % ejecutado), **barra de distribución** "en qué se fue la plata" con leyenda, y lista de **Gastos** (tipo, planeado vs pagado, cuotas, estados, borde de color que liga a la distribución). FAB `+` = nuevo gasto. → `prototypes/proyecto-detalle.html`.
- **Gasto (detalle):** planeado vs pagado + restante; para *cuotas*, **cronograma (timeline)** con fecha, estado y **recibo** por cuota; la próxima resalta. FAB "Registrar pago". → `prototypes/gasto-detalle.html`.
- **Registrar pago (overlay / bottom-sheet):** monto, fecha, cuota a la que aplica, **captura del giro opcional** (cámara/galería) y nota. → `prototypes/registrar-pago.html`.
- **Calendario (tab):** navegación por **meses**; días con movimientos muestran punto; tocar una fecha lista los **registros de ese día** (qué se pagó, en qué proyecto, con comprobante). *Empty* si el día no tiene registros. → `prototypes/calendario.html`.
- **Perfil:** moneda por defecto, datos de la app, (futuro) respaldo/export, info de fase 2.

**Flujos clave:** crear proyecto → agregar gastos (elegir tipo; si cuotas, definir cantidad/montos/fechas) → registrar pagos con recibo → seguimiento en Inicio/Proyecto/Calendario.

---

## 8. Mapeo a componentes (HeroUI / animate-ui)

| Elemento UI | Componente |
|---|---|
| Botones, FAB | HeroUI `Button` (`isIconOnly` para FAB; variante extendida con texto p. ej. "Registrar pago") |
| Tarjetas | HeroUI `Card` |
| Chips (Cuotas/Único, % ejecutado) | HeroUI `Chip` |
| Barras de progreso / distribución | HeroUI `Progress` (segmentada con varias instancias o barra custom mínima sobre primitivas) |
| Modal / bottom-sheet | HeroUI `Modal` / `Drawer` (placement bottom) |
| Inputs (monto, nota) | HeroUI `Input` / `NumberInput` |
| Fecha | HeroUI `DatePicker` / `Calendar` |
| Selección de cuota | HeroUI `Select` |
| Tabs inferiores | `Tabs` o navegación custom fina sobre `Button` |
| Carrusel infinito | `embla-carousel-react` (loop) o carrusel de animate-ui |
| Avatar / logo | ícono SVG inline (`panda-app-icon.svg`) |

**Tema HeroUI:** `primary = leaf #4f9e34 / green-deep #3c8a2e`, `danger = #e0592f`, superficies `#fff / fur`, `radius` sm 12 / md 17 / lg 24, fuentes `sans: Inter` · `display: Nunito`. Detalle en `design-system.md §10`.

**Decisión del FAB (mi call, antes abierta):** **circular `+` por defecto** en todas las pantallas; **extendido con texto** solo cuando la acción necesita ser explícita (p. ej. "Registrar pago"). Uniforme en forma, posición y color.

---

## 9. Animación / movimiento

Con animate-ui / Motion (resumen; detalle en `design-system.md §7`):
- Entradas con `rise` (fade + translateY) y *stagger* en listas.
- **Carrusel** infinito y centrado; al cambiar de proyecto los **Gastos** hacen **banish direccional + aparición en cascada**.
- **Container transform** tarjeta↔detalle con `layoutId`.
- Barras que se llenan; FAB con `pop`; empty state con pulso; calendario revela los registros del día.
- Respetar `prefers-reduced-motion` (versión sin movimiento).

---

## 10. Assets de marca

En `docs/assets/`: `panda-app-icon.svg` (fondo menta `#c4e8c8`, esquinas redondeadas — ícono de app, logo en header) y `panda-sin-fondo.svg` (transparente, solo sobre fondos claros). SVG = fuente principal (escalable). Reglas de uso en `design-system.md §1`. Para tiendas/manifest se exportan PNG desde el SVG.

---

## 11. Fases de entrega

**Fase 1 — MVP local-first (lo que construimos):**
1. Scaffolding (Vite+TS+React), Tailwind v4 + HeroUI v3, tema Panda Bambú, fuentes, PWA, layout con tab bar.
2. Capa de datos Dexie (schema del §6) + selectores derivados + formato ₡/fechas.
3. Proyectos: grid + crear/editar + container transform + detalle con distribución.
4. Gastos: crear/editar (tracto único / cuotas flexibles) + detalle con timeline.
5. Pagos: registrar pago + recibo (captura) + aplicación a cuota.
6. Inicio: carrusel infinito + gastos del proyecto activo con transición + empty state.
7. Calendario: mes navegable + registros del día.
8. Perfil básico + estados vacíos/carga + repaso de accesibilidad y `reduced-motion`.

**Fase 2 (futuro):** nube/cuentas/sync, respaldo/export (JSON), recordatorios de vencimiento, multi-moneda, OCR de recibos, reportes.

---

## 12. Qué queda al builder (decisiones menores)

- Librería exacta de carrusel (embla vs animate-ui) y de date-picker si HeroUI no cubre todo.
- Estructura fina de carpetas/archivos y nombres.
- Validaciones de formularios (montos > 0, requeridos, máscara de moneda) y límite de 60 caracteres en títulos.
- Compresión/redimensionado de imágenes de recibo antes de guardarlas (p. ej. a ~1600px/JPEG) para no inflar IndexedDB.
- IDs (`crypto.randomUUID()`), orden/orden-por de listas, paginación si una lista crece mucho.

---

## 13. Riesgos y mitigaciones

- **Persistencia local frágil** (borrar datos del navegador = pérdida): avisar en Perfil y priorizar **export/respaldo** temprano en fase 2; nada de datos críticos irrecuperables.
- **Peso de recibos** en IndexedDB: comprimir imágenes al guardar.
- **Contraste de verdes**: los verdes claros son ilustrativos; texto/estado usan `green-deep`/`ink` (ya normado en el sistema de diseño).
- **HeroUI v3 nuevo**: verificar APIs reales con la documentación/MCP al construir cada componente.

---

## 14. Criterios de aceptación (MVP)

- Puedo crear un proyecto con presupuesto y verlo en Inicio (carrusel) y en Proyectos (grid).
- Puedo agregar gastos de tracto único y de cuotas flexibles, con su planeado.
- Puedo registrar un pago con fecha y adjuntar (o no) un recibo, y aplicarlo a una cuota.
- Veo planeado vs pagado y la distribución por proyecto, con sobre-giro en rojo.
- En Calendario, al tocar una fecha veo los pagos de ese día.
- Los datos persisten al recargar; la app se instala como PWA; todo con los componentes de HeroUI y la identidad Panda Bambú.
