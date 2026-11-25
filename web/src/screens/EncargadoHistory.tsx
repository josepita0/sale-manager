import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildShiftReport } from '../lib/report'
import { formatDateTime, formatMoney } from '../lib/format'
import { ScreenHead } from '../components/ScreenHead'
import { ShiftReport } from './ShiftReport'
import { ListRowsSkeleton } from './skeleton'
import type { ShiftWithDetails } from '../lib/types'

export function HistoryTab() {
  const [shifts, setShifts] = useState<ShiftWithDetails[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setError(null)
    const { data, error } = await supabase
      .from('shifts')
      .select('*, profiles(full_name), sales(*, products(name, price))')
      .eq('status', 'closed')
      .order('started_at', { ascending: false })
      .limit(50)
    if (error) setError('No se pudo cargar el historial: ' + error.message)
    setShifts((data ?? []) as unknown as ShiftWithDetails[])
  }

  if (selectedId) {
    return (
      <main className="mx-auto max-w-3xl px-5 pt-4">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="mb-3 min-h-11 rounded-lg border-[1.5px] border-tinta px-3.5 text-xs font-semibold tracking-[0.05em] text-tinta uppercase"
        >
          ← Volver al historial
        </button>
        <ShiftReport shiftId={selectedId} />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pt-4">
      <ScreenHead title="Turnos" subtitle="Últimos 50 turnos cerrados" />
      {error && (
        <p className="anim-slide-down mb-3 rounded-lg border border-rojo/40 bg-rojo/5 px-3 py-2 text-sm text-rojo">
          {error}
        </p>
      )}
      <div className="mt-1">
        {shifts === null ? (
          <ListRowsSkeleton label="Cargando turnos" rows={5} />
        ) : shifts.length === 0 ? (
          <p className="py-3 text-sm text-tinta-suave">Todavía no hay turnos cerrados.</p>
        ) : (
          shifts.map((shift) => {
            const report = buildShiftReport(shift.sales)
            return (
              <button
                key={shift.id}
                type="button"
                onClick={() => setSelectedId(shift.id)}
                className="flex w-full items-center justify-between gap-3 border-b border-dashed border-hair py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-semibold text-tinta">
                    {formatDateTime(shift.started_at)} · {shift.profiles?.full_name || 'Bartender'}
                  </span>
                  <span className="mt-0.5 block font-mono text-xs tabular-nums text-tinta-suave">
                    {report.invitationsCount} cortesías ·{' '}
                    {report.sold.reduce((acc, line) => acc + line.quantity, 0)} ventas
                  </span>
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums text-verde">
                  {formatMoney(report.soldTotal)}
                </span>
              </button>
            )
          })
        )}
      </div>
    </main>
  )
}
