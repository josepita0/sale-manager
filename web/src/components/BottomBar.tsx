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
 * Bottom navigation of direction 02: a cortesía-red indicator slides
 * under the active tab (equal-width tabs, so a percentage left is
 * enough — no measuring), inactive tabs stay muted.
 */
export function BottomBar({ items, active, onSelect }: Props) {
  const activeIndex = Math.max(
    items.findIndex((item) => item.key === active),
    0,
  )

  return (
    <nav
      aria-label="Navegación"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-tinta bg-carta pb-[env(safe-area-inset-bottom)]"
    >
      <div className="relative mx-auto flex max-w-3xl px-2.5 pb-1.5">
        <span
          aria-hidden="true"
          className="absolute top-0 h-[3px] bg-rojo transition-[left] duration-200 ease-out"
          style={{
            left: `calc(${(activeIndex * 100) / items.length}% + 10px)`,
            width: `calc(${100 / items.length}% - 20px)`,
          }}
        />
        {items.map((item) => {
          const isActive = item.key === active
          return (
            <button
              key={item.key}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelect(item.key)}
              className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 border-t-[3px] border-transparent px-1 py-2 text-[10.5px] font-semibold uppercase tracking-[0.05em] transition-colors ${
                isActive ? 'text-tinta' : 'text-tinta-suave hover:text-tinta'
              }`}
            >
              <span className="relative block">
                <span className="block h-[21px] w-[21px]">{item.icon}</span>
                {item.badge ? (
                  <span
                    key={item.badge}
                    className="anim-badge-pop absolute -top-1.5 -right-2 rounded-full bg-rojo px-1.5 text-[10px] font-bold text-white"
                  >
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
