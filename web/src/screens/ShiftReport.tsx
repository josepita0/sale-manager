import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildShiftReport } from '../lib/report'
import { formatDateTime, formatMoney } from '../lib/format'
import type { ShiftWithDetails } from '../lib/types'

interface Props {
  shiftId: string
}

export function ShiftReport({ shiftId }: Props) {
  const [shift, setShift] = useState<ShiftWithDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    supabase
      .from('shifts')
      .select('*, profiles(full_name), sales(*, products(name, price))')
      .eq('id', shiftId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) setError('No se pudo cargar el reporte del turno.')
        else setShift(data as unknown as ShiftWithDetails)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [shiftId])

  if (loading) return <p className="p-6 text-neutral-400">Cargando reporte…</p>
  if (error || !shift) return <p className="p-6 text-red-300">{error}</p>

  const report = buildShiftReport(shift.sales)
  const bartenderName = shift.profiles?.full_name || 'Bartender'

  return (
    <div>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-sm text-neutral-400">
          {bartenderName} · {formatDateTime(shift.started_at)}
          {shift.ended_at ? ` → ${formatDateTime(shift.ended_at)}` : ''}
        </p>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
        <h3 className="border-b border-neutral-800 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Ventas
        </h3>
        {report.sold.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">No se vendieron productos en este turno.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-2 font-medium">Producto</th>
                <th className="px-2 py-2 text-right font-medium">Cant.</th>
                <th className="px-2 py-2 text-right font-medium">Precio</th>
                <th className="px-4 py-2 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {report.sold.map((line) => (
                <tr key={line.productId}>
                  <td className="px-4 py-2.5 font-medium">{line.name}</td>
                  <td className="px-2 py-2.5 text-right">× {line.quantity}</td>
                  <td className="px-2 py-2.5 text-right text-neutral-400">
                    {formatMoney(line.unitPrice)}
                  </td>
                  <td className="px-4 py-2.5 text-right">{formatMoney(line.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-neutral-800 bg-neutral-950/40">
                <td className="px-4 py-3 font-semibold" colSpan={3}>
                  Total recaudado
                </td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                  {formatMoney(report.soldTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-amber-900/50 bg-neutral-900">
        <h3 className="border-b border-amber-900/50 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-amber-400/90">
          Cortesías
        </h3>
        {report.invitations.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">No se registraron cortesías en este turno.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-2 font-medium">Producto</th>
                <th className="px-4 py-2 text-right font-medium">Cant.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {report.invitations.map((line) => (
                <tr key={line.productId}>
                  <td className="px-4 py-2.5 font-medium">{line.name}</td>
                  <td className="px-4 py-2.5 text-right">× {line.quantity}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-amber-900/50 bg-neutral-950/40">
                <td className="px-4 py-3 font-semibold">
                  Total cortesías ({report.invitationsCount})
                </td>
                <td className="px-4 py-3 text-right font-semibold text-amber-400">
                  Regalado: {formatMoney(report.giftedValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>
    </div>
  )
}
