# Sistema de diseño — Naira's (sale-manager)

Fuente única de tokens: `web/src/styles.css` (Tailwind v4 `@theme`). Reglas de componentes observadas en `web/src/screens/Login.tsx`.

## Colores

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-papel` | `#fbf7ef` | Fondo general de la app y de los inputs |
| `--color-carta` | `#ffffff` | Superficie de cards y sheets |
| `--color-tinta` | `#231c12` | Texto principal, botón primario |
| `--color-tinta-suave` | `#7a6f5c` | Texto secundario, micro-labels |
| `--color-hair` | `#e3d9c6` | Bordes suaves |
| `--color-hair-fuerte` | `#cfc4ac` | Bordes de inputs |
| `--color-rojo` | `#b3402a` | Acento, errores, foco visible |
| `--color-verde` | `#1f6e43` | Confirmaciones |
| `--color-crema` | `#efe8d9` | Fondos tenues, chips |

## Tipografía

| Token | Valor |
| --- | --- |
| `--font-sans` | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| `--font-mono` | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` |

Micro-labels: `10px`, `font-semibold`, `uppercase`, `tracking 0.14em`, color `tinta-suave` (fuente: `web/src/screens/Login.tsx`).

## Componentes (reglas observadas)

- Card / sheet: fondo `carta`, borde `hair`, `rounded-lg`, sombra `0 6px 18px rgba(60,45,20,0.10)`.
- Input: alto `48px` (`h-12`), fondo `papel`, borde `hair-fuerte`, `rounded-lg`, texto `15px`.
- Botón primario: fondo `tinta`, texto `papel`, `uppercase`, `13px bold`, `tracking 0.05em`, `rounded-lg`, `disabled: opacity 0.5`.
- Error: borde `rojo/40`, fondo `rojo/5`, texto `rojo`, `rounded-lg`.
- Foco visible: `outline 2px solid var(--color-rojo)`, `offset 2px`.

## Movimiento

| Animación | Duración / easing | Uso |
| --- | --- | --- |
| `sheet-in` / `sheet-out` | 220ms / 160ms, `cubic-bezier(0.2, 0, 0, 1)` | Sheets que suben desde abajo |
| `drawer-in` / `drawer-out` | 240ms / 170ms | Paneles laterales |
| `fade-in` / `fade-out` | 180ms / 160ms | Overlays |
| `pop-in` | 180ms | Aparición de cards |
| `toast-in` | 200ms | Notificaciones |

`prefers-reduced-motion: reduce` fuerza todas las animaciones a 1ms.
