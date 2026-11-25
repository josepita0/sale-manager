/**
 * Pulsing placeholders shown while a screen waits for Supabase. They
 * mirror the real layout so the switch to content does not jump.
 */

/** Shift screen: totals strip + the 3×2 product grid. */
export function ShiftSkeleton({ embedded = false }: { embedded?: boolean }) {
  return (
    <main
      role="status"
      aria-label="Cargando turno"
      className={`mx-auto max-w-3xl px-5 pt-4 ${embedded ? 'pb-10' : 'pb-32'}`}
    >
      <div className="flex animate-pulse items-center justify-between gap-3 rounded-[10px] border border-hair bg-carta px-4 py-3">
        <div>
          <div className="h-2.5 w-32 rounded bg-hair" />
          <div className="mt-2 h-[22px] w-24 rounded bg-hair" />
        </div>
        <div className="space-y-1.5">
          <div className="ml-auto h-3 w-20 rounded bg-hair" />
          <div className="ml-auto h-3 w-12 rounded bg-hair" />
        </div>
      </div>
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="min-h-[72px] animate-pulse rounded-lg border border-hair bg-carta"
          />
        ))}
      </div>
    </main>
  )
}

/** Product / history / VIP lists: title + subtitle rows with an action slot. */
export function ListRowsSkeleton({ label, rows = 5 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-label={label} className="animate-pulse">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-3 border-b border-dashed border-hair py-2.5"
        >
          <div className="min-w-0 flex-1">
            <div className="h-3.5 w-2/5 rounded bg-hair" />
            <div className="mt-1.5 h-2.5 w-1/4 rounded bg-hair" />
          </div>
          <div className="h-9 w-9 shrink-0 rounded-lg bg-hair" />
        </div>
      ))}
    </div>
  )
}

/** Shift report: the bartender/date header block above the tables. */
export function ReportHeaderSkeleton() {
  return (
    <div role="status" aria-label="Cargando reporte" className="px-1 py-6">
      <div className="animate-pulse rounded-[10px] border border-hair bg-carta px-4 py-3">
        <div className="h-3.5 w-3/4 rounded bg-hair" />
        <div className="mt-2 h-3.5 w-1/2 rounded bg-hair" />
      </div>
    </div>
  )
}
