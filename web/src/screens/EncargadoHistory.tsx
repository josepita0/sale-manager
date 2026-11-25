import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildShiftReport } from '../lib/report'
import { formatDateTime, formatMoney } from '../lib/format'
import { ShiftReport } from './ShiftReport'
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
      .select('*, profiles(full_name), sales(*, products(name, price, is_invitation))')
      .eq('status', 'closed')
      .order('started_at', { ascending: false })
      .limit(50)
    if (error) setError('No se pudo cargar el historial: ' + error.message)
    setShifts((data ?? []) as unknown as ShiftWithDetails[])
  }

  if (selectedId) {
    return (
      <div>
        <button
          onClick={() => setSelectedId(null)}
          className="mb-3 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800"
        >
          ← Volver al historial
        </button>
        <ShiftReport shiftId={selectedId} />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Últimos 50 turnos cerrados
      </h2>
      {error && (
        <p className="mt-3 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="mt-2 divide-y divide-neutral-800 rounded-2xl border border-neutral-800 bg-neutral-900">
        {shifts === null ? (
          <p className="p-4 text-sm text-neutral-500">Cargando…</p>
        ) : shifts.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">Todavía no hay turnos cerrados.</p>
        ) : (
          shifts.map((shift) => {
            const report = buildShiftReport(shift.sales)
            return (
              <button
                key={shift.id}
                onClick={() => setSelectedId(shift.id)}
                className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-neutral-800/50"
              >
                <div>
                  <p className="font-medium">
                    {formatDateTime(shift.started_at)} ·{' '}
                    {shift.profiles?.full_name || 'Bartender'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Cortesías: {report.invitationsCount}
                  </p>
                </div>
                <span className="font-semibold text-emerald-400">
                  {formatMoney(report.soldTotal)}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
