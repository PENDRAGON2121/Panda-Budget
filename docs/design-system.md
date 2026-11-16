# Panda Wallet — Sistema de Diseño

> **Fuente de verdad del look & feel.** Todo lo de este documento es **PERMANENTE y GLOBAL**: no cambia entre vistas. Cualquier pantalla nueva **reutiliza estos tokens y componentes tal cual** para mantener coherencia visual. Si algo debe cambiar, se cambia **primero aquí** y luego en todas las vistas.

Última actualización: 2026-11-11 · Dirección elegida: **A (Menta cálida)**

---

## 0. Principios

- **Mobile-first.** Diseñado para una mano, pulgar y pantalla de teléfono.
- **Componentes desde bibliotecas, siempre.** Todos los controles (botones, cards, inputs, modales, chips, barras, tabs, avatares) salen de **HeroUI v3**, animados con **animate-ui / Motion**. **No se construyen componentes a mano con código**, salvo que el usuario lo indique explícitamente.
- **Local-first** (fase 1): datos y recibos viven en el dispositivo (IndexedDB/Dexie). Nube/cuentas = fase 2.
- **Claridad antes que decoración.** La app sirve para ver sin estrés *en qué se va la plata*.

---

## 1. Marca

- **Nombre:** Panda Wallet. **Mascota/icono:** Panda Bambú (`docs/prototypes/panda-icon.png`).
- El icono de app (fondo menta redondeado) se usa como **logo** en el header (tile 46px, radio 15px).
- No alterar colores del icono, no agregar contornos/sombras/degradados, no quitar manitas ni bambú.

---

## 2. Colores (tokens Panda Bambú)

| Token | Hex | Uso |
|---|---|---|
| `ink` | `#24212b` | Texto principal, iconos oscuros ("negro") |
| `ink-muted` | `#5d5866` | Texto secundario |
| `fur` | `#fffdf7` | Blanco cálido (texto sobre oscuro, superficies) |
| `shade` | `#ece6db` | Sombras suaves de marca |
| `cheek` | `#f6a6b6` | Rosa, solo detalle decorativo |
| `icon-bg` | `#c4e8c8` | **Menta** — superficies suaves, tiles, chips verdes |
| `highlight` | `#b9e28f` | Verde claro — fondos/acentos suaves |
| `bamboo` | `#7cc04b` | **Verde claro** — relleno de barras de progreso, acentos |
| `leaf-light` | `#6db546` | Verde — gradientes de barra |
| `leaf` | `#4f9e34` | Verde — segmentos de distribución, acentos de acción |
| `green-deep` | `#3c8a2e` | **Verde interactivo accesible** — texto/porcentajes sobre claro, fills de botón |
| `node` | `#4c8a2c` | Verde oscuro — detalles |
| `danger` | `#e0592f` | **Rojo de alerta** — sobre-giro / sobre-asignación |

**Reglas de color (accesibilidad):**
- `ink` sobre `fur`/`icon-bg` tiene contraste alto → es el color de texto por defecto.
- Los **verdes claros (`bamboo`, `highlight`, `leaf-light`) e `cheek` son ILUSTRATIVOS**: no se usan para texto ni para información (contraste < 3:1). Para texto/porcentaje en verde usar **`green-deep`**; para rellenos de botón con texto blanco usar **`leaf`/`green-deep`** (nunca `bamboo`).
- **Semántico:** `primary = green-deep/leaf` · `surface = fur/#fff` · `muted-surface = icon-bg` · `danger = #e0592f` · neutros de barra/disponible `#eef1ec`/`#dfe4dc`.
- **Fondo de pantalla (ground):** `linear-gradient(180deg,#dcefd8 0%,#eaf5e7 34%,#f1f6ef 100%)` — **nunca termina en blanco**, para que cards y nav blancos siempre contrasten.
- **Tokens de contorno/elevación:** `hairline` `rgba(36,33,43,.07)` · `hairline-strong` `.08` · `hairline-over` `rgba(203,71,36,.22)` · `rail` `#eef1ec` · `control` `#f4f8f2` (controles secundarios dentro de card) · `nav-pill` `#dcefd8` · `cane-rail` `#e1ead9`. Texto de sobre-giro `#b23f1d`.

---

## 3. Tipografía (respetar siempre)

Dos familias, roles fijos:

- **Nunito** (redondeada, como el panda) → **marca, títulos, encabezados de sección, labels de nav, texto de botón.** Pesos 700–900.
- **Inter** → **montos (₡), cifras, metadatos, body, chips.** Pesos 500–800.
- **Todo monto de dinero va en Inter con `font-variant-numeric: tabular-nums`** (cifras alineadas).

| Rol | Familia | Peso | Tamaño |
|---|---|---|---|
| Monto hero (saldo/total) | Inter | 800 | 27–30px, `letter-spacing:-1px` |
| Título pantalla (app bar) | Nunito | 900 | 17px |
| Título de sección (`h3`) | Nunito | 900 | 15px |
| Nombre de item (card) | Nunito | 800 | 13.5px |
| Saludo/nombre usuario | Nunito | 900 | 18px |
| Label / metadato | Inter | 600 | 11–12px |
| Monto en lista | Inter | 800 | 13px tabular |
| Caption / chip | Inter | 700–800 | 9–11px |

> Fuentes vía Google Fonts (`Nunito` 600–900, `Inter` 500–800). En el build: configurar como `--font-sans` (Inter) y `--font-display` (Nunito) en el tema de HeroUI/Tailwind.

---

## 4. Forma: espaciado, radio, sombra

- **Radios:** card hero/resumen `22px` (`rounded-card`) · fila `18px` (`rounded-row`) · fila de cuota/calendario `16px` (`rounded-cuota`) · botón `17px` · FAB `19px` (squircle) · tile de icono `13–15px` · chip/pill `999px`.
- **Padding card:** 18px (grande) · 11–13px (fila).
- **Gutter de pantalla:** 18px laterales.
- **Elevación (contorno + sombra; los tokens están en `src/styles.css`):**
  - Nivel 1 — card (`shadow-card`): borde `1px hairline` + `0 1px 2px rgba(36,33,43,.05), 0 14px 30px -16px rgba(46,90,34,.34)`. Fila (`shadow-row`): `0 1px 2px rgba(36,33,43,.05), 0 8px 20px -14px rgba(46,90,34,.30)`. Sobre-giro (`shadow-over`): igual con tinte `rgba(203,71,36,.30)` y borde `hairline-over`.
  - Nivel 2 — flotante (`shadow-float`): `0 1px 2px rgba(36,33,43,.06), 0 16px 34px -14px rgba(36,64,30,.38)`. Botones de app bar (`shadow-appbar`): `0 1px 2px rgba(36,33,43,.06), 0 6px 14px -8px rgba(46,90,34,.35)`. FAB (`shadow-fab`): anillo `0 0 0 4px rgba(255,255,255,.92)` + `0 14px 26px -8px rgba(46,110,30,.6)`.
  - **Dentro de una card nunca hay sombra**: rieles `#eef1ec` + `inset 0 0 0 1px rgba(36,33,43,.04)` (clase `.rail`), separadores `1px #eef1ec`, controles secundarios `#f4f8f2`.
- **Separación entre filas:** 9px.

---

## 5. Componentes fijos (reutilizar idénticos)

- **App bar (detalle) — `components/AppBar`:** botón volver (40px, radio 13, blanco, hairline + `shadow-appbar`) · **card blanca de título** (flex 1, radio 15, padding 7×14, borde `hairline-strong`, `shadow-appbar`) con título Nunito 900 + subtítulo Inter muted · menú ⋯ (mismo tile 40px).
- **Barra de navegación inferior (PERSISTENTE):** 4 tabs — **Inicio · Proyectos · Calendario · Perfil**. **Isla flotante** (nivel 2): `left/right 12px`, `bottom 14px`, alto 66px, radio 24, blanco, borde `hairline-strong`, `shadow-float`; el contenido tiene `padding-bottom` para que nada quede bajo ella. Tab activo: píldora `#dcefd8` (que **se desliza** entre tabs), icono `#2f6f22`, etiqueta `ink` 800; inactivos `#5d5866` sin opacidad. **Siempre visible** en pantallas principales y de detalle; nunca se reemplaza por un botón.
- **FAB (acción primaria):** verde (`leaf`), abajo-derecha, squircle 56px radio 19px, con `+`, con **anillo blanco** (`shadow-fab`) y ubicado sobre la isla (`bottom 96px`). Es la **acción primaria contextual** de cada pantalla (Inicio→nuevo proyecto, Proyecto→nuevo gasto, Gasto→registrar pago). Puede ser **extendido con texto** cuando la acción lo amerite (ej. "Registrar pago"). *(definir circular vs extendido de forma uniforme — pendiente de decisión del usuario).*
- **Cards:** fondo `#fff`, radio 22 (resumen) / 18 (fila) / 16 (cuota, calendario), borde hairline + sombra de nivel 1; las de sobre-giro usan borde y sombra rojizos. Entran con animación `rise`.
- **Tabs de proyecto (Gastos | Movimientos):** pista `rgba(255,255,255,.7)` + hairline + `inset 0 1px 2px rgba(36,33,43,.05)`; píldora blanca con hairline y sombra suave que se desliza (`layoutId`).
- **Botones (HeroUI Button):** primario = fill `leaf`/`green-deep` + texto blanco (Nunito 800); nunca fill `bamboo` con texto.
- **Chips/Tags (HeroUI Chip):** `Cuotas` = fondo `icon-bg` texto `green-deep`; `Único` = fondo `#efeae1` texto gris; `% ejecutado` = chip menta.
- **Barra de progreso (HeroUI Progress):** riel `#eef1ec`; relleno gradiente `bamboo→leaf-light`; **si sobre-giro → gradiente rojo** (`#f2a07e→danger`) al 100%.
- **Fila de gasto:** tile emoji (icon-bg) · nombre (Nunito 800) · chip tipo · "pagado de planeado" (Inter muted) · barra · estado (✓ pagado / chevron / rojo sobre-giro) · borde izquierdo de color que liga con su segmento de distribución.
- **Empty state:** card con borde punteado menta, panda en tile, título Nunito 900, texto guía y **botón circular de agregar** con anillos de pulso.
- **Timeline de cuotas (bambú):** la línea es una **caña de bambú**: riel pálido `#e1ead9` a todo el largo y caña crecida (8px, radio 4, degradado `#6db546→#7cc04b→#b9e28f→#7cc04b→#5fa83c`) con **nudos** de 3px `#4c8a2c` entre cuotas, hasta el nodo de la próxima cuota (todas pagadas → largo completo; ninguna → un tocón). Dos **hojas** (`#4f9e34`, `#6db546`) en la punta, sobre los nodos, se mecen. Nodo por cuota (verde ✓ si pagada, hueco si pendiente, resaltado la próxima); card con monto, fecha, estado y **miniatura de recibo** si existe.
- **Modales / bottom sheets (HeroUI Modal/Drawer):** crear/editar/registrar se abren como **overlay** (no reemplazan la nav).

---

## 6. Navegación (arquitectura)

- **Tabs persistentes** (Inicio, Proyectos, Calendario, Perfil) presentes en todas las vistas principales y de detalle.
- **Detalle (push):** app bar con volver + nav inferior visible. Tab de origen resaltado.
- **Crear / editar / registrar:** modal o bottom sheet overlay. Nunca ocultan ni reemplazan la nav.
- **Acción primaria** de cada pantalla = FAB.
- **Inicio:** carrusel **infinito** de proyectos (tarjeta centrada, asomo simétrico a ambos lados, puntos indicadores, sin leyenda). Al cambiar de proyecto, la lista de **Gastos** se actualiza.
- **Proyectos (tab):** **grid de tarjetas de proyecto**; se puede **crear desde una tarjeta** ("+ Nuevo proyecto" como card). Al tocar una tarjeta, hace **container transform** hacia su detalle (ver Movimiento §7).
- **Calendario (tab):** vista de **calendario** con navegación por **meses**; los días con movimientos muestran un **punto** indicador. Al **tocar una fecha** se ven los **registros (historial) de ese día** — qué pago se hizo y en qué proyecto/gasto — para saber *qué pasó cada día* y tener el tracking. Reemplaza al antiguo "Historial".

---

## 7. Movimiento (animar con animate-ui / Motion)

- **Entrada:** `rise` = fade + `translateY(14px)→0`, con *stagger* en listas.
- **Barras:** se llenan animadas al aparecer.
- **Carrusel:** infinito con loop sin topes; tarjeta activa centrada.
- **Gastos al cambiar de proyecto:** el bloque actual hace **banish hacia el lado del desliz** y el nuevo **entra siguiendo el mismo movimiento**, filas en cascada ("reflejo").
- **Píldora de la nav:** se **desliza** entre tabs (Motion `layoutId` `nav-pill`, 0.4s ease-out).
- **Tabs de proyecto:** píldora deslizante + el panel sale/entra horizontalmente según la dirección (calculada en el handler, no en render).
- **Bambú (timeline de cuotas):** crece al montar ~1.8s ease-out hasta la próxima cuota; hojas se mecen ±7° en 3.2s (loop). Con *reduced motion*: estático y completamente crecido.
- **FAB:** aparece con `pop`. **Botón de empty state:** anillos de pulso.
- **Tarjeta → detalle (container transform):** la **misma card crece con sombra** hacia el detalle y, al llegar, **aparecen el texto y los demás componentes**; al volver, se **contrae** a la card de origen. Cada transición se siente **conectada y fluida** (shared-element). En el build real: `layoutId` de Motion / animate-ui.
- **Nota técnica:** no depender de eventos `finish`/`finished` de animación para lógica crítica en entornos que los throttlean; en el build real Motion lo maneja.

---

## 8. Contenido y formato (reglas)

- **Moneda:** colones `₡` con separador de miles por punto (`₡38.000.000`), configurable por proyecto.
- **Títulos:** máximo **60 caracteres**, **nunca se truncan** (se muestran completos, pueden ir a 2 líneas). Solo las **descripciones** pueden recortarse con "…".
- **Sobre-asignación** (rubros planeados > total) y **sobre-giro** (pagado > planeado): **permitidos**, se **marcan en rojo** como aviso, no se bloquean.
- **Estados de gasto:** en curso (verde) · pagado completo (✓ verde) · sobre-giro (rojo, `+%`) · pendiente.
- **Recibo** del pago: **opcional** (imagen del giro/comprobante), se adjunta por pago/cuota.

---

## 9. Modelo (resumen, para contexto visual)

`Proyecto` (presupuesto total) → `Gastos` (sub-proyectos, cada uno con monto planeado; seguimiento planeado vs pagado; tipo **tracto único** o **cuotas planeadas pero flexibles**) → `Pagos` (monto, fecha, recibo opcional). **Dos niveles.** Proyectos independientes entre sí.

---

## 10. Mapeo a HeroUI (tema) — referencia para el build

```
primary        → leaf #4f9e34 / green-deep #3c8a2e (texto/estados)
danger         → #e0592f
background      → degradado menta→blanco; surfaces #fff / fur
mutedSurface    → icon-bg #c4e8c8
radius          → sm 12, md 17, lg 24, full 999
fonts           → sans: Inter · display: Nunito
```
