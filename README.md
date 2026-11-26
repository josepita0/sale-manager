# La Barra

Gestor ligero de ventas para la barra: el bartender registra los productos que vende y las cortesías ("invitaciones") de su turno, y al cerrarlo obtiene un reporte con cantidades por producto, dinero recaudado y cortesías aparte.

## Funcionalidades

- Registro táctil de ventas y cortesías durante el turno (botón abrir/cerrar). La cortesía se decide por venta, con el modo Venta/Cortesía: cualquier producto puede regalarse.
- La pantalla de turno es una grilla a pantalla completa con un **ticket flotante** (comanda): lo tocado queda pendiente, agrupado por producto, y se registra por lote limpiando la comanda.
- **Cuentas abiertas:** desde la comanda se puede abrir una cuenta con nombre libre o cliente VIP; mientras está activa, los taps de la grilla se anotan en esa cuenta en paralelo a la comanda suelta. Cada cuenta se registra y cierra por separado.
- Reporte al cerrar: cantidades por producto, subtotal, total recaudado y valor regalado en cortesías.
- Clientes VIP (opcional): al registrar una cortesía se puede elegir a qué cliente VIP va destinada.
- Vista de encargado: ABM de productos, clientes VIP, historial de todos los turnos y su propio turno (puede además atender la barra).

- **Frontend:** React + Vite + TypeScript + Tailwind (`web/`)
- **Backend + BD:** Supabase — Postgres con Row Level Security, Auth con roles (`supabase/migrations/`)

## Setup de Supabase (una sola vez)

1. **Esquema:** Entrá al [dashboard de Supabase](https://supabase.com/dashboard) → tu proyecto → **SQL Editor** → New query. Ejecutá los archivos de `supabase/migrations/` **en orden numérico** (0001 a 0007): pegá el contenido de cada uno y ejecutalo con **Run**. Crea las tablas, la seguridad (RLS) y un catálogo de ejemplo.
2. **Usuarios:** **Authentication → Users → Add user → Create new user**. Cargá email + contraseña y marcá *Auto Confirm User*. Creá así la cuenta del bartender y la del encargado.
3. **Promover al encargado:** en **SQL Editor** ejecutá (reemplazá el email):

   ```sql
   update public.profiles
   set role = 'manager' -- o 'admin' (permisología propia a definir)
   where id = (select id from auth.users where email = 'encargado@tu-bar.com');
   ```

   Toda cuenta nueva arranca como `bartender`; los roles **nunca viajan en la metadata de registro**: se asignan del lado del servidor (SQL del dashboard o la función de alta). Los roles son un enum de la base: `admin`, `manager`, `bartender`.
4. **Desplegar las Edge Functions de gestión de usuarios:** con el [CLI de Supabase](https://supabase.com/docs/guides/cli) logueado y linkeado al proyecto:

   ```bash
   npx supabase functions deploy create-user
   npx supabase functions deploy update-user
   ```

   La función usa la clave `service_role` **dentro del servidor de Supabase** (nunca viaja al navegador) y deja que un `admin` cree usuarios desde la app, ya confirmados y sin mandar ningún email; el rol queda asignado por la función con la clave de servicio, así que el registro público jamás puede auto-asignarse un rol.
5. **Cerrar el registro público (recomendado):** **Authentication → Sign In / Providers → Email** → desactivá **Allow new users to sign up**. Las cuentas se crean solo desde el dashboard o desde la pestaña **Usuarios** del admin.

### Gestionar usuarios desde la app (admin)

Una vez desplegadas las funciones, el rol `admin` ve la pestaña **Usuarios**, donde carga email, nombre, rol y una contraseña inicial. El usuario nace **autoconfirmado**: sin email de verificación, puede entrar con su contraseña al instante. La función valida que el que pide sea `admin` y asigna el rol con la clave de servicio: la metadata de registro nunca define roles.

Además de crear, el admin puede **editar** cada usuario: nombre, rol y reset de contraseña (el email no se edita: es el identificador de login). La edición también es **solo admin** — la base restringe la actualización de perfiles con la migración `0008` — y un admin no puede cambiar su propio rol desde la app (evita quedarse sin admins: se cambia por SQL del dashboard o desde otra cuenta admin).

## Frontend

Antes de correr la app, creá el archivo `web/.env` (no se sube al repo) con las claves de tu proyecto:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XXXX
```

```bash
cd web
npm install
npm run dev
```

Si faltan esas variables, la app muestra un error claro al arrancar.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Type-check + build de producción (`dist/`) |
| `npm test` | Tests unitarios (Vitest) |
| `npm run preview` | Sirve el build de producción |

## Deploy

El frontend se puede publicar en Vercel o Netlify (gratis): root del proyecto `web/`, build `npm run build`, output `dist/`, y las dos variables `VITE_*` configuradas en el panel. La base ya queda expuesta solo por la API segura de Supabase con RLS.

## Seguridad

La clave `publishable` que usa el frontend es pública por diseño: viaja en el bundle de cualquier app que se conecta a Supabase. La protección real está en las políticas **RLS** de la base. Nunca subas ni expongas la clave `service_role` (acceso total sin RLS), y mantené el registro público de usuarios deshabilitado. La Edge Function `create-user` es el único punto que toca la `service_role`: vive del lado de Supabase, valida que el que pide sea `admin` y rechaza cualquier otra sesión.

## Licencia

[MIT](LICENSE)

## Privacidad y protección de datos

El aviso de privacidad del sistema (datos tratados, acceso por rol, proveedores,
retención, cookies y almacenamiento) vive en [`docs/privacidad.md`](docs/privacidad.md):
completá los campos `[CORCHETES]` con los datos del local antes de publicarlo o
distribuirlo al personal.

## Modelo de datos

- `profiles` — usuario, nombre y rol (`admin` / `manager` / `bartender`, enum de la base); se crea sola al crear el usuario.
- `products` — catálogo: nombre, precio, activo. Vender o regalar se decide por venta, no por producto.
- `shifts` — turno: bartender, inicio, fin, estado. Un solo turno abierto por bartender (índice único parcial).
- `sales` — cada venta/cortesía: turno, producto, cantidad, **precio al momento** (snapshot), fecha, y opcionalmente la cuenta (`account_id`) en la que se anotó.
- `accounts` — cuentas abiertas dentro de un turno: nombre (libre o del cliente VIP), cliente VIP opcional, estado (`open` / `closed`) y fecha de apertura.

La seguridad vive en la base: el bartender solo ve y toca su propio turno abierto; el encargado administra productos y ve todo el historial.
