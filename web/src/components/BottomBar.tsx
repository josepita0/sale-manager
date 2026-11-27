import { useState, type ReactNode } from 'react'
import { Drawer } from './Drawer'

export interface BottomBarItem {
  key: string
  label: string
  icon: ReactNode
  badge?: number
}

/** Who is navigating: shown inside the overflow sidebar (>4 items). */
export interface BottomBarIdentity {
  initials: string
  name: string
  detail: string
}

interface Props {
  items: BottomBarItem[]
  active: string
  onSelect: (key: string) => void
  identity?: BottomBarIdentity
}

/**
 * Bottom navigation of direction 02: a cortesía-red indicator slides
 * under the active tab (equal-width tabs, so a percentage left is
 * enough — no measuring), inactive tabs stay muted.
 *
 * With more than 4 items the bar keeps the first two, an elevated
 * central MENÚ button and the next two; the rest live in a right
 * sidebar (same backdrop/Escape pattern as the form Drawer) that the
 * central button opens. The indicator hides while an overflow tab is
 * active, because its tab is not in the bar.
 */
export function BottomBar({ items, active, onSelect, identity }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const overflow = items.length > 4 ? items.slice(4) : []
  const barItems: (BottomBarItem | null)[] =
    items.length > 4 ? [items[0], items[1], null, items[2], items[3]] : items
  const barIndex = barItems.findIndex((item) => item?.key === active)

  return (
    <>
      <nav
        aria-label="Navegación"
        className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-tinta bg-carta pb-[env(safe-area-inset-bottom)]"
      >
        <div className="relative mx-auto flex max-w-3xl px-2.5 pb-1.5">
          {barIndex >= 0 && (
            <span
              aria-hidden="true"
              className="absolute top-0 h-[3px] bg-rojo transition-[left] duration-200 ease-out"
              style={{
                left: `calc(${(barIndex * 100) / barItems.length}% + 10px)`,
                width: `calc(${100 / barItems.length}% - 20px)`,
              }}
            />
          )}
          {barItems.map((item) => {
            if (!item) {
              return (
                <div key="menu-slot" className="flex min-h-[52px] flex-1 items-start justify-center">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(true)}
                    aria-expanded={menuOpen}
                    aria-controls="bottombar-sidebar"
                    aria-label="Abrir el menú de navegación"
                    className="-mt-5 flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-full border-4 border-carta bg-tinta text-carta shadow-[0_8px_20px_rgba(60,45,20,0.38)]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      className="h-[19px] w-[19px]"
                      aria-hidden="true"
                    >
                      <path d="M4 7h16M4 12h16M4 17h16" />
                    </svg>
                    <span className="text-[8px] font-bold tracking-[0.1em]">MENÚ</span>
                  </button>
                </div>
              )
            }
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
      {overflow.length > 0 && (
        <div id="bottombar-sidebar">
          <Drawer
            open={menuOpen}
            title="Más opciones de navegación"
            heading="Más opciones"
            subtitle="Lo que no entra en la barra, vive acá."
            onClose={() => setMenuOpen(false)}
          >
            {identity && (
              <div className="mb-1 flex items-center gap-2.5 border-b-2 border-dashed border-hair-fuerte pb-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rojo text-xs font-bold text-white"
                >
                  {identity.initials}
                </span>
                <span>
                  <span className="block text-[13.5px] font-bold text-tinta">{identity.name}</span>
                  <span className="block text-[11px] text-tinta-suave">{identity.detail}</span>
                </span>
              </div>
            )}
            {overflow.map((item) => {
              const isActive = item.key === active
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    onSelect(item.key)
                    setMenuOpen(false)
                  }}
                  className={`flex w-full items-center gap-2.5 border-t border-dashed border-hair py-3 text-left text-sm font-semibold ${
                    isActive ? 'text-rojo' : 'text-tinta'
                  }`}
                >
                  <span className="block h-[19px] w-[19px] text-tinta-suave">{item.icon}</span>
                  {item.label}
                  {item.badge ? (
                    <span className="ml-auto rounded-full bg-rojo px-1.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              )
            })}
            <p className="mt-auto border-t-2 border-dashed border-hair-fuerte pt-3 text-xs leading-[1.5] text-tinta-suave">
              El botón central aparece cuando la navegación supera las 4 opciones: lo que no entra
              en la barra, vive acá.
            </p>
          </Drawer>
        </div>
      )}
    </>
  )
}
