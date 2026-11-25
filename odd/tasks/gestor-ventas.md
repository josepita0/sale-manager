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

## Tasks

- T1 (S1,S7) db: esquema, RLS y seed — supabase/migrations/0001_init.sql — commit C1
- T2 (S2) web: scaffold Vite+React+TS+Tailwind, cliente Supabase, login y ruteo por rol — commit C2
- T3 (S3,S5) web: abrir/cerrar turno y registro de ventas y cortesías — commit C3
- T4 (S1,S6) web: reporte de turno (cantidades, dinero, cortesías) con tests — commit C4
- T5 (S4) web: vista encargado (ABM productos + historial de turnos) — commit C5
- T6 (S1-S6) verificación: build, tests, instrucciones de setup — commit C5 o doc

## Log

- L1. Usuario: "hola mi principe hermoso tenemos un requerimiento pequeño en este proyecto. El cliente quiere un gestor de ventas pequeño, donde pueda registrar los productos que vende en la barra donde trabaja conjunto a las invitaciones que hace en su turno, y al final de su turno tener un pequeño reporte de que cantidad vendio por producto y cuantas invitaciones vendio. Quiero un frontend ligero en React, y un backedn y bd en supabse para no enredarnos tanto. Antes de codigo dame propuesta y conversamos"
- L2. Respuestas de diseño (pregunta agrupada): invitaciones = "Cortesías que regala"; usuarios = "Bartender + encargado"; turnos = "Botón abrir/cerrar"; reporte = "Cantidades + dinero".
- L3. Usuario proveyó Supabase URL https://kjuhrgfqbgdbvqsldnyl.supabase.co y anon key (publishable).
