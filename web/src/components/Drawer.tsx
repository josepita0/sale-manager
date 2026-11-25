import { useEffect, useRef, type ReactNode } from 'react'
import { useTransitionMount } from '../lib/useTransitionMount'

interface Props {
  /** Controlled visibility: keep the Drawer rendered while closing. */
  open: boolean
  /** Accessible name of the dialog. */
  title: string
  heading: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
}

/**
 * Right-side drawer of direction 02 (~300px, full height, ink left
 * border); same backdrop/Escape contract as the bottom sheet. Slides
 * in from the right and keeps its last content while sliding out.
 */
export function Drawer({ open, title, heading, subtitle, onClose, children }: Props) {
  const { mounted, closing } = useTransitionMount(open)
  const lastContent = useRef<ReactNode>(null)
  const lastHeading = useRef<ReactNode>(heading)
  const lastSubtitle = useRef<ReactNode>(subtitle)

  useEffect(() => {
    if (open) {
      lastContent.current = children
      lastHeading.current = heading
      lastSubtitle.current = subtitle
    }
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!mounted) return null

  const content = open ? children : lastContent.current
  const shownHeading = open ? heading : lastHeading.current
  const shownSubtitle = open ? subtitle : lastSubtitle.current

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label={`Cerrar ${title}`}
        onClick={onClose}
        className={`absolute inset-0 bg-tinta/45 ${closing ? 'anim-fade-out' : 'anim-fade-in'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-y-0 right-0 flex w-[300px] max-w-[86vw] flex-col overflow-y-auto border-l-2 border-tinta bg-carta px-5 py-6 shadow-[-14px_0_40px_rgba(60,45,20,0.28)] ${
          closing ? 'anim-drawer-out' : 'anim-drawer-in'
        }`}
      >
        <h3 className="text-[15px] font-bold tracking-[0.02em] text-tinta uppercase">{shownHeading}</h3>
        {shownSubtitle ? <div className="mt-1 mb-4 text-xs text-tinta-suave">{shownSubtitle}</div> : null}
        {content}
      </div>
    </div>
  )
}
