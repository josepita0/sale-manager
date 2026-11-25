import { useEffect, useRef, type ReactNode } from 'react'
import { useTransitionMount } from '../lib/useTransitionMount'

interface Props {
  /** Controlled visibility: keep the Sheet rendered while closing. */
  open: boolean
  /** Accessible name of the dialog. */
  title: string
  heading: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
}

/**
 * Bottom sheet of direction 02: torn-paper panel over an ink backdrop,
 * grabber on top, Escape and backdrop click close it. Slides in from
 * the bottom on open and slides out (keeping its last content) on
 * close.
 */
export function Sheet({ open, title, heading, subtitle, onClose, children }: Props) {
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
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
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
        className={`relative max-h-[86vh] overflow-y-auto rounded-t-2xl border-t-2 border-tinta bg-carta px-5 pt-2.5 pb-7 shadow-[0_-14px_40px_rgba(60,45,20,0.28)] ${
          closing ? 'anim-sheet-out' : 'anim-sheet-in'
        }`}
      >
        <div className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-hair-fuerte" aria-hidden="true" />
        <h3 className="text-[15px] font-bold tracking-[0.02em] text-tinta uppercase">{shownHeading}</h3>
        {shownSubtitle ? <div className="mt-0.5 mb-2.5 text-xs text-tinta-suave">{shownSubtitle}</div> : null}
        {content}
      </div>
    </div>
  )
}
