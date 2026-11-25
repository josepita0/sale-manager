import { useEffect, useRef, useState } from 'react'

/**
 * Keeps an overlay mounted while its exit animation runs: `open`
 * mounts it immediately, flipping to `false` keeps it rendered for
 * `exitMs` with `closing === true`, then unmounts.
 */
export function useTransitionMount(open: boolean, exitMs = 170) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const mountedRef = useRef(open)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (open) {
      window.clearTimeout(timer.current)
      mountedRef.current = true
      setMounted(true)
      setClosing(false)
      return
    }
    if (!mountedRef.current) return
    setClosing(true)
    timer.current = window.setTimeout(() => {
      mountedRef.current = false
      setMounted(false)
      setClosing(false)
    }, exitMs)
    return () => window.clearTimeout(timer.current)
  }, [open, exitMs])

  return { mounted, closing }
}
