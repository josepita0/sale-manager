import type { ReactNode } from 'react'

/** Page heading of the encargado tabs (the artboard app-head line). */
export function ScreenHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h1 className="text-base font-extrabold tracking-[0.04em] text-tinta uppercase">{title}</h1>
      {subtitle ? <p className="mt-0.5 text-xs text-tinta-suave">{subtitle}</p> : null}
    </div>
  )
}

/** 10px uppercase section label of the artboard. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="border-b-2 border-dashed border-hair-fuerte pb-1.5 text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase">
      {children}
    </p>
  )
}
