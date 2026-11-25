import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildShiftReport } from '../lib/report'
import { formatDateTime, formatMoney } from '../lib/format'
import { ShiftReport } from './ShiftReport'
import type { Product, Profile, Sale, SaleWithProduct, Shift, VipCustomer } from '../lib/types'

interface Props {
  profile: Profile
}

function ProductButton({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="flex h-24 flex-col items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-900 px-2 text-center transition hover:bg-neutral-800 active:scale-95"
    >
      <span className="text-sm font-semibold leading-tight">{product.name}</span>
      <span className="mt-1 text-xs text-neutral-400">{formatMoney(product.price)}</span>
    </button>
  )
}

export function BartenderShift({ profile }: Props) {
  const [shift, setShift] = useState<Shift | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const [vipCustomers, setVipCustomers] = useState<VipCustomer[]>([])
  const [vipPicker, setVipPicker] = useState<Product | null>(null)
  const [vipCustomerId, setVipCustomerId] = useState('')
  // Cortesia is decided per sale: the Venta/Cortesia toggle picks what
  // the next product taps register as.
  const [gifting, setGifting] = useState(false)

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    const [productsRes, shiftRes, vipRes] = await Promise.all([
      supabase.from('products').select('*').eq('active', true).order('name'),
      supabase
        .from('shifts')
        .select('*')
        .eq('bartender_id', profile.id)
        .eq('status', 'open')
        .maybeSingle(),
      supabase.from('vip_customers').select('*').eq('active', true).order('name'),
    ])
    if (productsRes.error || shiftRes.error) {
      setError(
        'No se pudieron cargar los datos. ¿Ya ejecutaste el SQL del esquema en Supabase? (ver README, paso 1)',
      )
    }
    const loadedProducts = (productsRes.data ?? []) as Product[]
    const loadedShift = (shiftRes.data ?? null) as Shift | null
    setProducts(loadedProducts)
    setVipCustomers((vipRes.data ?? []) as VipCustomer[])
    setShift(loadedShift)
    if (loadedShift) {
      const { data } = await supabase
        .from('sales')
        .select('*')
        .eq('shift_id', loadedShift.id)
        .order('created_at')
      setSales((data ?? []) as Sale[])
    } else {
      setSales([])
    }
    setLoading(false)
  }

  async function openShift() {
    setBusy(true)
    setError(null)
    const { data, error } = await supabase
      .from('shifts')
      .insert({ bartender_id: profile.id })
      .select()
      .single()
    if (error) setError('No se pudo abrir el turno: ' + error.message)
    else {
      setShift(data as Shift)
      setSales([])
    }
    setBusy(false)
  }

  async function addSale(product: Product, vipCustomerId: string | null, isInvitation: boolean) {
    if (!shift || shift.status !== 'open' || busy) return
    setBusy(true)
    const { data, error } = await supabase
      .from('sales')
      .insert({
        shift_id: shift.id,
        product_id: product.id,
        quantity: 1,
        unit_price: product.price,
        is_invitation: isInvitation,
        vip_customer_id: vipCustomerId,
      })
      .select()
      .single()
    if (error) setError('No se pudo registrar: ' + error.message)
    else setSales((prev) => [...prev, data as Sale])
    setBusy(false)
  }

  function handleProductTap(product: Product) {
    if (gifting) {
      setVipCustomerId('')
      setVipPicker(product)
      return
    }
    void addSale(product, null, false)
  }

  async function removeOne(productId: string, isInvitation: boolean) {
    if (!shift || shift.status !== 'open' || busy) return
    const row = [...sales]
      .reverse()
      .find((s) => s.product_id === productId && s.is_invitation === isInvitation)
    if (!row) return
    setBusy(true)
    const { error } = await supabase.from('sales').delete().eq('id', row.id)
    if (error) setError('No se pudo descontar: ' + error.message)
    else setSales((prev) => prev.filter((s) => s.id !== row.id))
    setBusy(false)
  }

  async function closeShift() {
    if (!shift) return
    setBusy(true)
    setError(null)
    const { data, error } = await supabase
      .from('shifts')
      .update({ status: 'closed', ended_at: new Date().toISOString() })
      .eq('id', shift.id)
      .select()
      .single()
    if (error) {
      setError('No se pudo cerrar el turno: ' + error.message)
      setBusy(false)
      return
    }
    setShift(data as Shift)
    setConfirmingClose(false)
    setBusy(false)
  }

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const report = useMemo(
    () =>
      buildShiftReport(
        sales
          .map((s) => {
            const p = productById.get(s.product_id)
            return p
              ? { ...s, products: { name: p.name, price: p.price } }
              : null
          })
          .filter((s): s is SaleWithProduct => s !== null),
      ),
    [sales, productById],
  )

  if (loading) return <p className="p-6 text-neutral-400">Cargando…</p>

  const errorBanner = error ? (
    <p className="mb-4 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
      {error}
    </p>
  ) : null

  if (!shift) {
    return (
      <main className="flex flex-col items-center px-4 py-16">
        <h2 className="text-xl font-semibold">¿Arrancamos el turno?</h2>
        <p className="mt-1 text-neutral-400">Abrí el turno para registrar ventas y cortesías.</p>
        <button
          disabled={busy}
          onClick={() => void openShift()}
          className="mt-6 rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          Abrir turno
        </button>
        <div className="mt-4 w-full max-w-sm">{errorBanner}</div>
      </main>
    )
  }

  const summaryRow = (line: { productId: string; name: string; quantity: number }, kind: boolean) => (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="font-medium">{line.name}</p>
        {kind ? (
          <p className="text-xs text-amber-400">× {line.quantity} · cortesía</p>
        ) : (
          <p className="text-xs text-neutral-500">× {line.quantity}</p>
        )}
      </div>
      <button
        onClick={() => void removeOne(line.productId, kind)}
        disabled={busy}
        className="h-9 w-9 rounded-full border border-neutral-700 text-lg text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
        aria-label={`Descontar uno de ${line.name}${kind ? ' (cortesía)' : ''}`}
      >
        −
      </button>
    </div>
  )

  const totals = (
    <p className="text-sm text-neutral-300">
      Recaudado: <span className="font-semibold text-emerald-400">{formatMoney(report.soldTotal)}</span>
      {' · '}Cortesías: <span className="font-semibold text-amber-400">{report.invitationsCount}</span>
    </p>
  )

  if (shift.status === 'closed') {
    return (
      <main className="mx-auto max-w-3xl p-4">
        {errorBanner}
        <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/30 p-4">
          <p className="font-semibold text-emerald-300">Turno cerrado ✓</p>
          <p className="mt-1 text-sm text-neutral-400">
            Abierto {formatDateTime(shift.started_at)} · Cerrado{' '}
            {formatDateTime(shift.ended_at ?? shift.started_at)}
          </p>
        </div>
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Reporte del turno
          </h2>
          <ShiftReport shiftId={shift.id} />
        </section>
        <button
          onClick={() => void openShift()}
          disabled={busy}
          className="mt-8 w-full rounded-2xl bg-emerald-600 px-4 py-4 text-lg font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          Abrir nuevo turno
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      {errorBanner}

      <section className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <div>
          <p className="text-sm text-neutral-400">Turno abierto desde</p>
          <p className="font-semibold">{formatDateTime(shift.started_at)}</p>
        </div>
        <button
          onClick={() => setConfirmingClose(true)}
          disabled={busy}
          className="rounded-xl border border-red-800 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-950/50 disabled:opacity-50"
        >
          Cerrar turno
        </button>
      </section>

      <section className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            {gifting ? 'Registrar cortesía' : 'Registrar venta'}
          </h2>
          <div className="flex rounded-xl border border-neutral-700 p-1">
            <button
              onClick={() => setGifting(false)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                !gifting ? 'bg-emerald-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              Venta
            </button>
            <button
              onClick={() => setGifting(true)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                gifting ? 'bg-amber-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              Cortesía
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((p) => (
            <ProductButton key={p.id} product={p} onAdd={() => handleProductTap(p)} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            En este turno
          </h2>
          {totals}
        </div>
        <div className="mt-2 divide-y divide-neutral-800 rounded-2xl border border-neutral-800 bg-neutral-900">
          {report.sold.length === 0 && report.invitations.length === 0 ? (
            <p className="p-4 text-sm text-neutral-500">Todavía no registraste nada en este turno.</p>
          ) : (
            <>
              {report.sold.map((line) => summaryRow(line, false))}
              {report.invitations.map((line) => summaryRow(line, true))}
            </>
          )}
        </div>
      </section>

      {confirmingClose && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="text-lg font-semibold">¿Cerrar turno?</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Se genera el reporte y no podrás registrar más ventas en este turno.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmingClose(false)}
                className="flex-1 rounded-xl border border-neutral-700 px-4 py-2.5 transition hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => void closeShift()}
                disabled={busy}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                Cerrar turno
              </button>
            </div>
          </div>
        </div>
      )}

      {vipPicker && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="text-lg font-semibold">Cortesía: {vipPicker.name}</h3>
            <p className="mt-1 text-sm text-neutral-400">¿Para qué cliente VIP es? (opcional)</p>
            <select
              value={vipCustomerId}
              onChange={(e) => setVipCustomerId(e.target.value)}
              className="mt-3 w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-neutral-100 outline-none focus:border-emerald-500"
            >
              <option value="">Sin asignar</option>
              {vipCustomers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            {vipCustomers.length === 0 && (
              <p className="mt-2 text-xs text-neutral-500">
                Todavía no hay clientes VIP cargados: el encargado los administra en “Clientes
                VIP”.
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setVipPicker(null)}
                className="flex-1 rounded-xl border border-neutral-700 px-4 py-2.5 transition hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const product = vipPicker
                  setVipPicker(null)
                  void addSale(product, vipCustomerId || null, true)
                }}
                disabled={busy}
                className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
              >
                Registrar cortesía
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
