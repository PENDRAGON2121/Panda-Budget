# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.0.4] - 2026-11-16

### Added
- Gasto en cuotas: cada cuota pendiente muestra cuánto falta por pagar ("Faltan ₡X"), descontando los abonos parciales.
- Registrar pago: en "Aplicar a", cada cuota indica cuánto falta o si ya está pagada.

## [0.0.3] - 2026-11-16

### Changed
- Todos los campos de monto muestran separadores de miles mientras escribís (1.250.000) y abren el teclado numérico. Los montos son en unidades enteras.

## [0.0.2] - 2026-11-16

### Added
- Inicio: tocar la tarjeta del proyecto abre su detalle.
- Inicio: el botón + agrega un gasto al proyecto que está en pantalla.

### Changed
- Calendario rediseñado: flechas de mes con borde, días más grandes con punto de pagos y registros con el detalle "Proyecto · Cuota N".
- Gasto: cuotas más compactas (una sola línea) y hojas de bambú más grandes en la punta de la caña.

### Fixed
- El formulario de nuevo gasto con muchas cuotas ahora se desplaza y el botón "Crear gasto" queda siempre visible (igual en nuevo proyecto y registrar pago).
- Los selectores (moneda, cuota, fecha) ya no quedan flotando cuando se cierra el teclado.
- Las últimas cuotas ya no quedan tapadas por el botón "Registrar pago".
- El APK de Android vuelve a compilar (versionCode) y la firma se verifica antes de compilar.

## [0.0.1] - 2026-11-16

### Added
- Proyectos para organizar los gastos, con moneda por proyecto.
- Gastos únicos y en cuotas.
- Pagos con recibo (foto o galería).
- Movimientos: historial de gastos y pagos.
- Calendario de vencimientos.
- Pantalla de bienvenida y perfil con moneda predeterminada y nombre de usuario.
- Rediseño visual (HeroUI) y app instalable como PWA.
- App Android (Capacitor) con APK firmado generado por GitHub Actions.
- Actualizaciones dentro de la app: en Android revisa GitHub Releases (al iniciar, máximo una vez al día, y desde Perfil → "Buscar actualizaciones") y ofrece descargar el APK nuevo; en la PWA avisa "Hay una versión nueva — Recargar". Es la única llamada de red y no envía datos del usuario.
