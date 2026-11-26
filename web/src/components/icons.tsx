import type { SVGProps } from 'react'

/**
 * Inline SVG icon set of direction 02. Stroke 1.6, round caps/joins,
 * 24px viewBox; size comes from the `className` of the caller.
 */
type IconProps = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

/** Copa — pestaña Turno. */
export function CopaIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 4h14l-7 8z" />
      <path d="M12 12v7M8 19h8" />
    </Svg>
  )
}

/** Ticket — FAB de la comanda. */
export function TicketIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 3h10v18l-2.5-2-2.5 2-2.5-2L7 21z" />
      <path d="M10 8h4M10 12h4" />
    </Svg>
  )
}

/** Usuarios — pestaña Usuarios del admin. */
export function UsuariosIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6S13.9 16 14.5 19" />
      <path d="M15.5 5.4a3.2 3.2 0 0 1 0 5.2M17.5 14.6c1.8.7 2.8 2.2 3 4.4" />
    </Svg>
  )
}

/** Barras — pestaña Reporte. */
export function BarrasIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 19V9M10 19V5M16 19v-8M22 19H2" />
    </Svg>
  )
}

/** Caja — pestaña Productos. */
export function CajaIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
      <path d="M4 8l8 4 8-4M12 12v8" />
    </Svg>
  )
}

/** Reloj — pestaña Turnos. */
export function RelojIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </Svg>
  )
}

/** Estrella — pestaña VIP. */
export function EstrellaIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3l2.7 5.6 6.3.9-4.5 4.3 1 6.2-5.5-3-5.5 3 1-6.2L3 9.5l6.3-.9z" />
    </Svg>
  )
}

/** Lápiz — editar producto. */
export function LapizIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20l4-1L19 8l-3-3L5 16z" />
    </Svg>
  )
}

/** Pausa — desactivar producto. */
export function PausaIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 5v14M15 5v14" />
    </Svg>
  )
}

/** Tacho — eliminar producto. */
export function TachoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 7h14M10 7V5h4v2M9 7l1 13h4l1-13" />
    </Svg>
  )
}

/** Más — alta de producto / abrir cuenta. */
export function MasIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}
