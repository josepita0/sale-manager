import type { ReactNode } from 'react'

export interface BottomBarItem {
  key: string
  label: string
  icon: ReactNode
  badge?: number
}

interface Props {
  items: BottomBarItem[]
  active: string
  onSelect: (key: string) => void
}

/**
 * Bottom navigation of direction 02: active tab is ink with a 3px
 * cortesía-red top border, inactive tabs stay muted.
 */
export function BottomBar({ items, active, onSelect }: Props) {
  return (
    <nav
      aria-label="Navegación"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-tinta bg-carta pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-3xl px-2.5 pb-1.5">
        {items.map((item) => {
          const isActive = item.key === active
          return (
            <button
              key={item.key}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelect(item.key)}
              className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 border-t-[3px] px-1 py-2 text-[10.5px] font-semibold uppercase tracking-[0.05em] transition-colors ${
                isActive
                  ? 'border-rojo text-tinta'
                  : 'border-transparent text-tinta-suave hover:text-tinta'
              }`}
            >
              <span className="relative block">
                <span className="block h-[21px] w-[21px]">{item.icon}</span>
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-2 rounded-full bg-rojo px-1.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
