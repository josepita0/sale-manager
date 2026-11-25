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
 * Right-side drawer of direction 02 (~300px, full height, ink left
 * border); same backdrop/Escape contract as the bottom sheet.
 */
export function Drawer({ title, heading, subtitle, onClose, children }: Props) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40">
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
        className="absolute inset-y-0 right-0 flex w-[300px] max-w-[86vw] flex-col overflow-y-auto border-l-2 border-tinta bg-carta px-5 py-6 shadow-[-14px_0_40px_rgba(60,45,20,0.28)]"
      >
        <h3 className="text-[15px] font-bold tracking-[0.02em] text-tinta uppercase">{heading}</h3>
        {subtitle ? <div className="mt-1 mb-4 text-xs text-tinta-suave">{subtitle}</div> : null}
        {children}
      </div>
    </div>
  )
}
