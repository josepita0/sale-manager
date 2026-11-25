import { useEffect, type ReactNode } from 'react'

interface Props {
  /** Accessible name of the dialog. */
  title: string
  heading: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
}

/**
 * Bottom sheet of direction 02: torn-paper panel over an ink backdrop,
 * grabber on top, Escape and backdrop click close it.
 */
export function Sheet({ title, heading, subtitle, onClose, children }: Props) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label={`Cerrar ${title}`}
        onClick={onClose}
        className="absolute inset-0 bg-tinta/45"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[86vh] overflow-y-auto rounded-t-2xl border-t-2 border-tinta bg-carta px-5 pt-2.5 pb-7 shadow-[0_-14px_40px_rgba(60,45,20,0.28)]"
      >
        <div className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-hair-fuerte" aria-hidden="true" />
        <h3 className="text-[15px] font-bold tracking-[0.02em] text-tinta uppercase">{heading}</h3>
        {subtitle ? <div className="mt-0.5 mb-2.5 text-xs text-tinta-suave">{subtitle}</div> : null}
        {children}
      </div>
    </div>
  )
}
