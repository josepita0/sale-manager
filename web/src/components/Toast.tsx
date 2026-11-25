import { useEffect, useState } from 'react'

interface ToastItem {
  id: number
  message: string
}

let push: ((message: string) => void) | null = null

/** Fire a confirmation toast from anywhere (mounted <Toaster /> shows it). */
export function toast(message: string) {
  push?.(message)
}

/** Paper-chip toasts that slide up above the bottom bar and auto-dismiss. */
export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    push = (message) => {
      const id = Date.now() + Math.random()
      setToasts((current) => [...current, { id, message }])
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id))
      }, 2200)
    }
    return () => {
      push = null
    }
  }, [])

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-6"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          className="anim-toast-in rounded-lg border border-tinta bg-tinta px-4 py-2.5 text-sm font-semibold text-papel shadow-[0_10px_24px_rgba(35,28,18,0.35)]"
        >
          {item.message}
        </div>
      ))}
    </div>
  )
}
