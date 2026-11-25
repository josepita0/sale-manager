# Gestor de Barra

Gestor ligero de ventas para la barra: el bartender registra los productos que vende y las cortesías ("invitaciones") de su turno, y al cerrarlo obtiene un reporte con cantidades por producto, dinero recaudado y cortesías aparte.

- **Frontend:** React + Vite + TypeScript + Tailwind (`web/`)
- **Backend + BD:** Supabase — Postgres con Row Level Security, Auth con roles (`supabase/migrations/`)

## Setup de Supabase (una sola vez)

1. **Esquema:** Entrá al [dashboard de Supabase](https://supabase.com/dashboard) → tu proyecto → **SQL Editor** → New query. Pegá todo el contenido de `supabase/migrations/0001_init.sql` y ejecutalo (**Run**). Crea las tablas, la seguridad (RLS) y un catálogo de ejemplo.
2. **Usuarios:** **Authentication → Users → Add user → Create new user**. Cargá email + contraseña y marcá *Auto Confirm User*. Creá así la cuenta del bartender y la del encargado.
3. **Promover al encargado:** en **SQL Editor** ejecutá (reemplazá el email):

   ```sql
   update public.profiles
   set role = 'encargado'
   where id = (select id from auth.users where email = 'encargado@tu-bar.com');
   ```

   Toda cuenta nueva arranca como `bartender`; el rol de encargado nunca sale del registro público.
4. **Cerrar el registro público (recomendado):** **Authentication → Sign In / Providers → Email** → desactivá **Allow new users to sign up**. Las cuentas se crean solo desde el dashboard.

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

## Modelo de datos

- `profiles` — usuario, nombre y rol (`bartender` / `encargado`); se crea sola al crear el usuario.
- `products` — catálogo: nombre, precio, flag de cortesía (`is_invitation`), activo.
- `shifts` — turno: bartender, inicio, fin, estado. Un solo turno abierto por bartender (índice único parcial).
- `sales` — cada venta/cortesía: turno, producto, cantidad, **precio al momento** (snapshot), fecha.

La seguridad vive en la base: el bartender solo ve y toca su propio turno abierto; el encargado administra productos y ve todo el historial.
