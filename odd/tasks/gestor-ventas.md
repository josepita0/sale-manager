# Gestor de ventas de barra

App ligera para que un bartender registre ventas y cortesías de su turno y cierre con un reporte; vista de encargado para productos e historial. React + Vite + TS + Tailwind; Supabase (Postgres + Auth + RLS).

## Specs

S1. El cliente quiere "un gestor de ventas pequeño, donde pueda registrar los productos que vende en la barra donde trabaja conjunto a las invitaciones que hace en su turno, y al final de su turno tener un pequeño reporte de que cantidad vendio por producto y cuantas invitaciones vendio."
S2. "Quiero un frontend ligero en React, y un backedn y bd en supabse para no enredarnos tanto".
S3. Las "invitaciones" son cortesías que el bartender regala durante el turno; se cuentan aparte de lo vendido (respuesta del usuario: "Cortesías que regala").
S4. Usuarios: bartender + encargado; el encargado administra productos y ve el historial completo de turnos (respuesta: "Bartender + encargado").
S5. Turno con botón abrir/cerrar; al cerrar se genera el reporte (respuesta: "Botón abrir/cerrar").
S6. El reporte incluye montos: subtotal por producto y total recaudado (respuesta: "Cantidades + dinero"). Extra acordado en propuesta: valor regalado en cortesías.
S7. Proyecto Supabase provisto por el usuario: URL https://kjuhrgfqbgdbvqsldnyl.supabase.co con publishable key; las claves viven en web/.env (gitignored), nunca en el repo.
S8. "El repo va a ser publico, entonces quiero las mejores praxis, estructura, etc" — LICENSE MIT, CI, README público, .env.example, origin https://github.com/josepita0/sale-manager.git.
S9. "me gustaria que opcionalmente puedas agregar un apartado de 'clientes vip' que sea opcional, si selecciona 'is_invitation' se aperture un select con los 'clientes vip' previamente cargados" — al registrar una cortesía se abre un select opcional de clientes VIP; el encargado los administra.
S10. Usuario eligió "Pestaña 'Mi turno'": el encargado también tiene el flujo completo del bartender (abrir/cerrar turno, registrar, reporte) dentro de su vista, junto a las pestañas admin.
S11. "La logica de la cortesia esta mal implementada. No es producto sino por venta" — la cortesía se decide al momento de cada venta (modo Venta/Cortesía en la pantalla de turno), no por el tipo de producto; el catálogo deja de tener el flag.
S12. "El nombre no va a ser gestor de barra, como marca del sistema que se llame 'Naira's'" — la marca del sistema es Naira's (UI, título, README, diseño).
S13. Usuario eligió la dirección visual 02 (Comanda de papel): tema claro papel/tinta, bottom bar de navegación, alta en drawer, acciones de ítem en bottom sheet (···).
S14. "que la opcion de ticket sea una opcion flotante... una especie de 'ticket' y que luego cuando se registre se limpie... no tengamos que hacer tanto scroll" + "Abrir cuenta... se mantendra abierta una cuenta y podras seguir registrando otros productos en paralelo, debera poderse registrar un nombre o seleccionar un cliente vio": FAB de ticket sobre la grilla, comanda pendiente que se registra por lote y se limpia, cuentas abiertas en paralelo (nombre libre o cliente VIP) registrables una por una — con soporte en BD (tabla accounts + sales.account_id).

## Tasks

- T1 (S1,S7) db: esquema, RLS y seed — supabase/migrations/0001_init.sql — commit C1
- T2 (S2) web: scaffold Vite+React+TS+Tailwind, cliente Supabase, login y ruteo por rol — commit C2
- T3 (S3,S5) web: abrir/cerrar turno y registro de ventas y cortesías — commit C2 (misma unidad con T2)
- T4 (S1,S6) web: reporte de turno (cantidades, dinero, cortesías) con tests — commit C3
- T5 (S4) web: vista encargado (ABM productos + historial de turnos) — commit C4
- T6 (S1-S6) verificación: build, tests, instrucciones de setup — commit C5 o doc
- T7 (S1) fix de fondo R3-001: snapshot is_invitation en sales — migrations/0002 + report — commit f3c91ae
- T8 (S9) feature Clientes VIP — migrations/0003 + picker + ABM — commit a26bab3
- T9 (S8) prácticas repo público (LICENSE, CI, README, .env.example) — commit docs
- T10 (S1-S9) revisión nativa del nuevo candidato y push a origin
- T11 (S10) pestaña "Mi turno" del encargado reutilizando BartenderShift
- T12 (S11) cortesía por venta: modo Venta/Cortesía, sin flag de producto — migration 0004
- T13 (S14) migración accounts + sales.account_id — supabase/migrations/0005_accounts.sql
- T14 (S13,S14) rediseño dirección 02: tema claro, bottom bar, FAB ticket, comanda pendiente por lote, cuentas abiertas — web/src
- T15 (S1-S14) verificación, revisión nativa y push

## Log

- L1. Usuario: "hola mi principe hermoso tenemos un requerimiento pequeño en este proyecto. El cliente quiere un gestor de ventas pequeño, donde pueda registrar los productos que vende en la barra donde trabaja conjunto a las invitaciones que hace en su turno, y al final de su turno tener un pequeño reporte de que cantidad vendio por producto y cuantas invitaciones vendio. Quiero un frontend ligero en React, y un backedn y bd en supabse para no enredarnos tanto. Antes de codigo dame propuesta y conversamos"
- L2. Respuestas de diseño (pregunta agrupada): invitaciones = "Cortesías que regala"; usuarios = "Bartender + encargado"; turnos = "Botón abrir/cerrar"; reporte = "Cantidades + dinero".
- L3. Usuario proveyó Supabase URL https://kjuhrgfqbgdbvqsldnyl.supabase.co y anon key (publishable).
- L4. La política de seguridad del harness bloqueó escribir web/.env; el usuario eligió "Más tarde": creará el archivo él mismo con el contenido que se le pasa al cierre. La app muestra un error claro si faltan las variables.
- L5. Implementación completa: C1 esquema+RLS, C2 scaffold+turno, C3 reporte+tests (RED→GREEN), C4 vista encargado. Verificación: vitest 4/4 y build (tsc+vite) en verde. Smoke end-to-end pendiente del setup del usuario (SQL + cuentas + .env).
- L6. Revisión nativa (base 9e39f38): hallazgo CRÍTICO R3-001 (clasificación de reporte leía el flag mutable del producto). La corrección parcial (lock en formulario) fue rechazada por el validador dirigido: "No snapshot of is_invitation is added to Sale or database constraint/trigger". Linaje escalado (terminal). Fix de fondo implementado: migration 0002 snapshot en sales + report lee el snapshot + 2 tests nuevos; se quitó el lock parcial.
- L7. Usuario: "aparte, me gustaria que opcionalmente puedas agregar un apartado de 'clientes vip' que sea opcional, si selecciona 'is_invitation' se aperture un select con los 'clientes vip' previamente cargados" → migration 0003 (vip_customers + sales.vip_customer_id), picker opcional al registrar cortesía, pestaña Clientes VIP del encargado.
- L8. Usuario: "Este es el repo remoto al que vas a agregar el origin: https://github.com/josepita0/sale-manager.git El repo va a ser publico, entonces quiero las mejores praxis, estructura, etc" → origin agregado; LICENSE MIT, CI, README público; push tras revisar el nuevo candidato.
- L9. Revisión nativa del nuevo candidato (base d1c9d9e, linaje review-c1ac67f0f07535fe): APROBADA. Un hallazgo no bloqueante (vipRes.error sin chequear en load(): lista VIP silenciosamente vacía si falla la query) — queda como follow-up.
- L10. Usuario preguntó por las vistas de venta del encargado y eligió "Pestaña 'Mi turno'": EncargadoHome recibe profile y agrega la pestaña que monta BartenderShift (RLS ya lo permitía; el turno queda a nombre del encargado).
- L11. Usuario: "La logica de la cortesia esta mal implementada. No es producto sino por venta" → migration 0004 (elimina products.is_invitation y los productos cortesía de ejemplo), modo Venta/Cortesía en la pantalla de turno, resumen del turno dividido en ventas y cortesías (− por tipo). sales.is_invitation (snapshot) queda como única fuente de clasificación.
- L12. Revisión nativa del candidato cortesía-por-venta (base b303e3f): assess high (item 1, DDL con borrado); el consentimiento del review fue DECLINADO para este candidato (consent-declined, sin linaje). Queda sin revisión nativa; verificación del writer: 6/6 tests + build en verde. El usuario puede pedir una revisión explícita más adelante.
- L13. Usuario: la visual es "un bodrio total"; pidió bottom bar, drawer de alta y bottom sheet de acciones. Diseño propuesto en design/gestor-barra-ui/ con 3 direcciones (01 táctil oscura, 02 comanda clara, 03 suizo plano); a la espera de elección para implementar.
- L14. Usuario: "El nombre no va a ser gestor de barra, como marca del sistema que se llame 'Naira's'" → marca aplicada en artboards, header, login, título y README.
- L15. Usuario: "el historial de lo vendido se note aparte, que al momento de ir cargando se marque como en una especie de ticket y que luego cuando se registre se limpie... no tengamos que hacer tanto scroll" y "por ahora va ganando la opcion 2" → artboard 02 rehecho con flujo de comanda: Turno (grilla llena) · Ticket (pendientes, se registra y limpia) · Reporte (registrados con −); bottom bar de 3 pestañas para el bartender.
- L16. Usuario: "que la opcion de ticket sea una opcion flotante en la misma vista de turno, un floating button en la parte inferior. Quiero que agregues una opcion dentro del ticket que se aperturo que diga 'Abrir cuenta', cuando eso se seleccione se mantendra abierta una cuenta y podras seguir registrando otros productos en paralelo, debera poderse registrar un nombre o seleccionar un cliente vio" → artboard 02: FAB de ticket con badge sobre la grilla, bottom bar vuelve a Turno/Reporte; comanda con sección “Cuentas abiertas”, “+ Abrir cuenta” (nombre libre o VIP) y detalle de cuenta (registrar / seguir anotando, chip de cuenta activa en la grilla).
- L17. Usuario: "Bello, nos vamos con la segunda direccion. Toma en cuenta lo que comente tambien para hacer ajustes en backend y base de datos" → se implementa la dirección 02 completa con soporte de BD para cuentas (migration 0005 + accounts/sales.account_id) y rediseño frontend delegado a worker con la artboard como spec visual.
