# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

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
