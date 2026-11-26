import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildShiftReport } from '../lib/report'
import { formatDateTime, formatMoney } from '../lib/format'
import { SectionLabel } from '../components/ScreenHead'
import { ReportHeaderSkeleton } from './skeleton'
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

  if (loading) return <ReportHeaderSkeleton />
  if (error || !shift) return <p className="px-1 py-6 text-sm text-rojo">{error}</p>

  const report = buildShiftReport(shift.sales)
  const bartenderName = shift.profiles?.full_name || 'Bartender'

  return (
    <div>
      <div className="rounded-[10px] border border-hair bg-carta px-4 py-3">
        <p className="text-sm text-tinta">
          {bartenderName} · {formatDateTime(shift.started_at)}
          {shift.ended_at ? ` → ${formatDateTime(shift.ended_at)}` : ''}
        </p>
      </div>

      <section className="mt-5">
        <SectionLabel>Ventas</SectionLabel>
        {report.sold.length === 0 ? (
          <p className="py-3 text-sm text-tinta-suave">No se vendieron productos en este turno.</p>
        ) : (
          <table className="mt-1 w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase">
                <th className="py-1.5 pr-2 font-semibold">Producto</th>
                <th className="px-1.5 py-1.5 text-right font-semibold">Cant.</th>
                <th className="px-1.5 py-1.5 text-right font-semibold">Precio</th>
                <th className="py-1.5 pl-2 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {report.sold.map((line) => (
                <tr key={line.productId} className="border-b border-dashed border-hair">
                  <td className="py-2 pr-2 font-semibold text-tinta">{line.name}</td>
                  <td className="px-1.5 py-2 text-right font-mono tabular-nums text-tinta">
                    × {line.quantity}
                  </td>
                  <td className="px-1.5 py-2 text-right font-mono tabular-nums text-tinta-suave">
                    {formatMoney(line.unitPrice)}
                    {line.catalogUnitPrice != null && line.catalogUnitPrice !== line.unitPrice && (
                      <span className="mt-0.5 block text-[10px] line-through opacity-70">
                        {formatMoney(line.catalogUnitPrice)}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pl-2 text-right font-mono tabular-nums text-tinta">
                    {formatMoney(line.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-solid border-tinta">
                <td className="py-2.5 font-bold text-tinta" colSpan={3}>
                  Total recaudado
                </td>
                <td className="py-2.5 text-right font-mono font-bold tabular-nums text-verde">
                  {formatMoney(report.soldTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      {report.adjusted.length > 0 && (
        <section className="mt-5">
          <SectionLabel>Descuentos por precio</SectionLabel>
          <table className="mt-1 w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase">
                <th className="py-1.5 pr-2 font-semibold">Producto</th>
                <th className="px-1.5 py-1.5 text-right font-semibold">Cant.</th>
                <th className="py-1.5 pl-2 text-right font-semibold">Descuento</th>
              </tr>
            </thead>
            <tbody>
              {report.adjusted.map((line) => (
                <tr key={line.productId} className="border-b border-dashed border-hair">
                  <td className="py-2 pr-2 font-semibold text-tinta">
                    {line.name}
                    <span className="mt-0.5 block text-[11px] font-normal text-tinta-suave">
                      × {line.quantity} a {formatMoney(line.effectiveUnitPrice)} · carta{' '}
                      {formatMoney(line.catalogUnitPrice)}
                    </span>
                  </td>
                  <td className="px-1.5 py-2 text-right font-mono tabular-nums text-tinta">
                    × {line.quantity}
                  </td>
                  <td className="py-2 pl-2 text-right font-mono tabular-nums text-rojo">
                    − {formatMoney(line.discount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-solid border-tinta">
                <td className="py-2.5 font-bold text-tinta" colSpan={2}>
                  Total descuentos por precio
                </td>
                <td className="py-2.5 text-right font-mono font-bold tabular-nums text-rojo">
                  − {formatMoney(report.discountTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>
      )}

      <section className="mt-5">
        <SectionLabel>Cortesías</SectionLabel>
        {report.invitations.length === 0 ? (
          <p className="py-3 text-sm text-tinta-suave">No se registraron cortesías en este turno.</p>
        ) : (
          <table className="mt-1 w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase">
                <th className="py-1.5 pr-2 font-semibold">Producto</th>
                <th className="px-1.5 py-1.5 text-right font-semibold">Cant.</th>
                <th className="py-1.5 pl-2 text-right font-semibold">Regalado</th>
              </tr>
            </thead>
            <tbody>
              {report.invitations.map((line) => (
                <tr key={line.productId} className="border-b border-dashed border-hair">
                  <td className="py-2 pr-2 font-semibold text-tinta">
                    {line.name} <span className="text-[11px] font-semibold text-rojo">· cortesía</span>
                  </td>
                  <td className="px-1.5 py-2 text-right font-mono tabular-nums text-tinta">
                    × {line.quantity}
                  </td>
                  <td className="py-2 pl-2 text-right font-mono tabular-nums text-tinta-suave">
                    {formatMoney(line.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-solid border-tinta">
                <td className="py-2.5 font-bold text-tinta" colSpan={2}>
                  Total cortesías ({report.invitationsCount})
                </td>
                <td className="py-2.5 text-right font-mono font-bold tabular-nums text-rojo">
                  {formatMoney(report.giftedValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>
    </div>
  )
}
