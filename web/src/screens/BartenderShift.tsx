import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { buildShiftReport } from '../lib/report'
import {
  enqueueLine,
  lineAmount,
  linesForAccount,
  linesTotal,
  looseLines,
  pendingCount,
  readTicket,
  ticketStorageKey,
  visibleSales,
  writeTicket,
  type TicketLine,
} from '../lib/comanda'
import { formatDateTime, formatMoney, formatTime } from '../lib/format'
import { BottomBar } from '../components/BottomBar'
import { SectionLabel } from '../components/ScreenHead'
import { Sheet } from '../components/Sheet'
import { BarrasIcon, CopaIcon, MasIcon, TicketIcon } from '../components/icons'
import { ShiftReport } from './ShiftReport'
import type { Account, Product, Profile, Sale, SaleWithProduct, Shift, VipCustomer } from '../lib/types'

interface Props {
  profile: Profile
  /** Rendered inside the encargado screen: no bottom bar, inner tabs instead. */
  embedded?: boolean
}

type InnerTab = 'turno' | 'reporte'
type SheetView = { type: 'comanda' } | { type: 'abrir-cuenta' } | { type: 'account'; accountId: string } | null

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="mb-4 rounded-lg border border-rojo/40 bg-rojo/5 px-3 py-2 text-sm text-rojo">
      {message}
    </p>
  )
}

function TotalsStrip({ collected, invitations, sales }: { collected: number; invitations: number; sales: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-hair bg-carta px-4 py-3">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase">
          Recaudado en el turno
        </p>
        <p className="mt-0.5 font-mono text-[22px] font-bold tabular-nums text-tinta">
          {formatMoney(collected)}
        </p>
      </div>
      <p className="text-right text-xs leading-[1.5] text-tinta-suave">
        <b className="font-semibold text-rojo">{invitations} cortesías</b>
        <br />
        {sales} ventas
      </p>
    </div>
  )
}

function TicketRow({ line, onRemove }: { line: TicketLine; onRemove?: () => void }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-dashed border-hair py-2">
      <span className="text-[13.5px] font-semibold text-tinta">
        {line.name}{' '}
        <span className="font-normal text-tinta-suave">× {line.qty}</span>
        {line.is_invitation && (
          <span className="ml-1 text-[11px] font-semibold text-rojo">· cortesía</span>
        )}
      </span>
      <span className="flex-1 -translate-y-1 border-b-2 border-dotted border-hair-fuerte" aria-hidden="true" />
      <span className="font-mono text-[13px] tabular-nums text-tinta">
        {line.is_invitation ? '—' : formatMoney(lineAmount(line))}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar una ${line.name} de la comanda`}
          className="relative ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hair-fuerte text-tinta-suave before:absolute before:-inset-1.5 before:rounded-lg before:content-['']"
        >
          −
        </button>
      )}
    </div>
  )
}

export function BartenderShift({ profile, embedded = false }: Props) {
  const [shift, setShift] = useState<Shift | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [lines, setLines] = useState<TicketLine[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const [vipCustomers, setVipCustomers] = useState<VipCustomer[]>([])
  const [vipPicker, setVipPicker] = useState<Product | null>(null)
  const [vipCustomerId, setVipCustomerId] = useState('')
  // Cortesía is decided per sale: the Venta/Cortesía toggle picks what
  // the next product taps note into the comanda as.
  const [gifting, setGifting] = useState(false)
  const [tab, setTab] = useState<InnerTab>('turno')
  const [sheet, setSheet] = useState<SheetView>(null)
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [accountName, setAccountName] = useState('')
  const [accountVipId, setAccountVipId] = useState('')
  const [accountError, setAccountError] = useState<string | null>(null)

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The pending comanda lives per shift in localStorage and is reloaded
  // whenever a (new) shift opens.
  const shiftId = shift?.id ?? null
  useEffect(() => {
    if (!shiftId) {
      setLines([])
      setActiveAccountId(null)
      return
    }
    const store = safeStorage()
    setLines(store ? readTicket(store, shiftId) : [])
    setActiveAccountId(null)
  }, [shiftId])

  function commitLines(next: TicketLine[]) {
    setLines(next)
    const store = safeStorage()
    if (shift && store) writeTicket(store, shift.id, next)
  }

  async function loadAccounts(shiftId: string) {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('shift_id', shiftId)
      .eq('status', 'open')
      .order('created_at')
    if (error) setError('No se pudieron cargar las cuentas abiertas: ' + error.message)
    setAccounts((data ?? []) as Account[])
  }

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
    if (productsRes.error || shiftRes.error || vipRes.error) {
      setError(
        'No se pudieron cargar los datos. ¿Ya ejecutaste el SQL del esquema en Supabase? (ver README, paso 1)',
      )
    }
    const loadedShift = (shiftRes.data ?? null) as Shift | null
    setProducts((productsRes.data ?? []) as Product[])
    setVipCustomers((vipRes.data ?? []) as VipCustomer[])
    setShift(loadedShift)
    if (loadedShift) {
      const [salesRes] = await Promise.all([
        supabase.from('sales').select('*').eq('shift_id', loadedShift.id).order('created_at'),
        loadAccounts(loadedShift.id),
      ])
      if (salesRes.error) setError('No se pudieron cargar las ventas del turno: ' + salesRes.error.message)
      setSales((salesRes.data ?? []) as Sale[])
    } else {
      setSales([])
      setAccounts([])
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
      setAccounts([])
    }
    setBusy(false)
  }

  function noteProduct(product: Product, isInvitation: boolean, vipId: string | null) {
    if (!shift || shift.status !== 'open') return
    commitLines(
      enqueueLine(lines, {
        productId: product.id,
        name: product.name,
        price: product.price,
        is_invitation: isInvitation,
        vipCustomerId: vipId,
        accountId: activeAccountId,
      }),
    )
  }

  function handleProductTap(product: Product) {
    if (gifting) {
      setVipCustomerId('')
      setVipPicker(product)
      return
    }
    noteProduct(product, false, null)
  }

  function removePendingLine(line: TicketLine) {
    commitLines(
      line.qty <= 1
        ? lines.filter((l) => l.key !== line.key)
        : lines.map((l) => (l.key === line.key ? { ...l, qty: l.qty - 1 } : l)),
    )
  }

  /** Batch insert: one sales row per pending line, quantity = line.qty. */
  async function registerLines(
    target: TicketLine[],
    accountId: string | null,
    fallbackVipId: string | null,
  ): Promise<boolean> {
    if (!shift || shift.status !== 'open' || busy || target.length === 0) return false
    setBusy(true)
    setError(null)
    const { data, error } = await supabase
      .from('sales')
      .insert(
        target.map((line) => ({
          shift_id: shift.id,
          product_id: line.productId,
          quantity: line.qty,
          unit_price: line.price,
          is_invitation: line.is_invitation,
          vip_customer_id: line.vipCustomerId ?? fallbackVipId,
          account_id: accountId,
        })),
      )
      .select()
    if (error) {
      setError('No se pudo registrar: ' + error.message)
      setBusy(false)
      return false
    }
    setSales((prev) => [...prev, ...((data ?? []) as Sale[])])
    setBusy(false)
    return true
  }

  async function registerComanda() {
    const target = looseLines(lines)
    const ok = await registerLines(target, null, null)
    if (!ok) return
    commitLines(lines.filter((line) => line.accountId !== null))
    setSheet(null)
  }

  async function registerAccount(account: Account) {
    const target = linesForAccount(lines, account.id)
    if (target.length === 0) {
      setError('La cuenta no tiene ítems anotados todavía.')
      return
    }
    const ok = await registerLines(target, account.id, account.vip_customer_id)
    if (!ok) return
    setBusy(true)
    const { error } = await supabase
      .from('accounts')
      .update({ status: 'closed' })
      .eq('id', account.id)
    if (error) {
      setError('No se pudo cerrar la cuenta: ' + error.message)
      setBusy(false)
      return
    }
    setAccounts((prev) => prev.filter((a) => a.id !== account.id))
    if (activeAccountId === account.id) setActiveAccountId(null)
    commitLines(lines.filter((line) => line.accountId !== account.id))
    setBusy(false)
    setSheet(null)
  }

  async function removeOne(productId: string, isInvitation: boolean) {
    if (!shift || shift.status !== 'open' || busy) return
    const row = [...countableSales]
      .reverse()
      .find((s) => s.product_id === productId && s.is_invitation === isInvitation)
    if (!row) return
    setBusy(true)
    const { error } = await supabase.from('sales').delete().eq('id', row.id)
    if (error) setError('No se pudo descontar: ' + error.message)
    else setSales((prev) => prev.filter((s) => s.id !== row.id))
    setBusy(false)
  }

  async function openAccount(e: FormEvent) {
    e.preventDefault()
    if (!shift || shift.status !== 'open' || busy) return
    const name = accountName.trim()
    const vipId = accountVipId || null
    const vip = vipCustomers.find((v) => v.id === vipId) ?? null
    if (!name && !vip) {
      setAccountError('Poné un nombre o elegí un cliente VIP.')
      return
    }
    setBusy(true)
    setAccountError(null)
    const { data, error } = await supabase
      .from('accounts')
      .insert({ shift_id: shift.id, name: name || vip!.name, vip_customer_id: vipId })
      .select()
      .single()
    if (error) {
      setAccountError('No se pudo abrir la cuenta: ' + error.message)
      setBusy(false)
      return
    }
    await loadAccounts(shift.id).catch(() => {})
    // Append locally so the chip never points at an account the fetch failed to load.
    setAccounts((prev) =>
      prev.some((a) => a.id === (data as Account).id) ? prev : [...prev, data as Account],
    )
    setActiveAccountId((data as Account).id)
    setAccountName('')
    setAccountVipId('')
    setSheet(null)
    setBusy(false)
  }

  async function closeShift() {
    if (!shift) return
    setBusy(true)
    setError(null)
    // Close any open accounts first so no row gets stuck in 'open' forever.
    const { error: accError } = await supabase
      .from('accounts')
      .update({ status: 'closed' })
      .eq('shift_id', shift.id)
      .eq('status', 'open')
    if (accError) setError('No se pudieron cerrar las cuentas abiertas: ' + accError.message)
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
    const store = safeStorage()
    if (store) store.removeItem(ticketStorageKey(shift.id))
    setLines([])
    setActiveAccountId(null)
    setAccounts([])
    setShift(data as Shift)
    setConfirmingClose(false)
    setSheet(null)
    setBusy(false)
  }

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const openAccountIds = useMemo(() => new Set(accounts.map((a) => a.id)), [accounts])
  // Sales noted into a still-open account are on the account tab, not on
  // the shift's collected total yet.
  const countableSales = useMemo(() => visibleSales(sales, openAccountIds), [sales, openAccountIds])
  const report = useMemo(
    () =>
      buildShiftReport(
        countableSales
          .map((s) => {
            const p = productById.get(s.product_id)
            return p ? { ...s, products: { name: p.name, price: p.price } } : null
          })
          .filter((s): s is SaleWithProduct => s !== null),
      ),
    [countableSales, productById],
  )
  const salesCount = report.sold.reduce((acc, line) => acc + line.quantity, 0)
  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? null
  const loose = looseLines(lines)
  const pending = pendingCount(lines)

  if (loading) return <p className="px-5 py-6 text-sm text-tinta-suave">Cargando…</p>

  const errorBanner = error ? <ErrorBanner message={error} /> : null

  if (!shift) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center px-5 py-16">
        <h2 className="text-xl font-semibold text-tinta">¿Arrancamos el turno?</h2>
        <p className="mt-1 text-sm text-tinta-suave">Abrí el turno para registrar ventas y cortesías.</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void openShift()}
          className="mt-6 min-h-12 rounded-lg bg-tinta px-8 py-3.5 text-[13px] font-bold tracking-[0.05em] text-papel uppercase transition-opacity disabled:opacity-50"
        >
          Abrir turno
        </button>
        <div className="mt-4 w-full max-w-sm">{errorBanner}</div>
      </main>
    )
  }

  if (shift.status === 'closed') {
    return (
      <main className="mx-auto max-w-3xl px-5 pt-4 pb-10">
        {errorBanner}
        <div className="rounded-lg border border-verde/40 bg-verde/5 p-4">
          <p className="font-semibold text-verde">Turno cerrado ✓</p>
          <p className="mt-1 text-sm text-tinta-suave">
            Abierto {formatDateTime(shift.started_at)} · Cerrado{' '}
            {formatDateTime(shift.ended_at ?? shift.started_at)}
          </p>
        </div>
        <section className="mt-6">
          <SectionLabel>Reporte del turno</SectionLabel>
          <div className="mt-2">
            <ShiftReport shiftId={shift.id} />
          </div>
        </section>
        <button
          type="button"
          onClick={() => void openShift()}
          disabled={busy}
          className="mt-8 min-h-12 w-full rounded-lg bg-tinta px-4 py-4 text-[13px] font-bold tracking-[0.05em] text-papel uppercase transition-opacity disabled:opacity-50"
        >
          Abrir nuevo turno
        </button>
      </main>
    )
  }

  const modeSegment = (
    <div
      role="group"
      aria-label="Modo de registro"
      className="mt-3.5 flex overflow-hidden rounded-lg border-[1.5px] border-tinta"
    >
      <button
        type="button"
        aria-pressed={!gifting}
        onClick={() => setGifting(false)}
        className={`min-h-11 flex-1 py-2.5 text-[13px] font-semibold tracking-[0.06em] uppercase transition-colors ${
          !gifting ? 'bg-tinta text-papel' : 'text-tinta-suave'
        }`}
      >
        Venta
      </button>
      <button
        type="button"
        aria-pressed={gifting}
        onClick={() => setGifting(true)}
        className={`min-h-11 flex-1 border-l-[1.5px] border-tinta py-2.5 text-[13px] font-semibold tracking-[0.06em] uppercase transition-colors ${
          gifting ? 'bg-tinta text-papel' : 'text-tinta-suave'
        }`}
      >
        Cortesía
      </button>
    </div>
  )

  const turnoView = (
    <>
      <TotalsStrip
        collected={report.soldTotal}
        invitations={report.invitationsCount}
        sales={salesCount}
      />
      {activeAccount && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border-[1.5px] border-rojo bg-carta py-1.5 pr-1.5 pl-3.5 text-[12.5px] font-semibold text-tinta">
          <span>
            Anotando en la cuenta: <em className="text-rojo not-italic">{activeAccount.name}</em>
          </span>
          <button
            type="button"
            onClick={() => setActiveAccountId(null)}
            aria-label={`Dejar de anotar en la cuenta de ${activeAccount.name}`}
            className="relative flex h-7 w-7 items-center justify-center rounded-full border border-hair-fuerte text-[13px] text-tinta-suave before:absolute before:-inset-2 before:rounded-full before:content-['']"
          >
            ✕
          </button>
        </div>
      )}
      {modeSegment}
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleProductTap(p)}
            className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border border-hair bg-carta px-1.5 py-2 text-center transition active:scale-[0.97]"
          >
            <span className="text-[12.5px] font-semibold leading-tight text-tinta">{p.name}</span>
            <span className="font-mono text-[11px] tabular-nums text-tinta-suave">
              {formatMoney(p.price)}
            </span>
          </button>
        ))}
      </div>
      {products.length === 0 && (
        <p className="mt-4 text-sm text-tinta-suave">
          No hay productos activos: el encargado los carga en “Productos”.
        </p>
      )}
    </>
  )

  const reportRows = (target: 'sold' | 'invitations') =>
    target === 'sold'
      ? report.sold.map((line) => (
          <div
            key={line.productId}
            className="flex items-center justify-between gap-3 border-b border-dashed border-hair py-2.5"
          >
            <div>
              <p className="text-sm font-semibold text-tinta">{line.name}</p>
              <p className="mt-0.5 font-mono text-xs tabular-nums text-tinta-suave">
                × {line.quantity} · {formatMoney(line.subtotal)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void removeOne(line.productId, false)}
              disabled={busy}
              aria-label={`Descontar una ${line.name} registrada`}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-tinta text-[17px] text-tinta before:absolute before:-inset-1 before:rounded-lg before:content-[''] disabled:opacity-40"
            >
              −
            </button>
          </div>
        ))
      : report.invitations.map((line) => (
          <div
            key={line.productId}
            className="flex items-center justify-between gap-3 border-b border-dashed border-hair py-2.5"
          >
            <div>
              <p className="text-sm font-semibold text-tinta">{line.name}</p>
              <p className="mt-0.5 font-mono text-xs tabular-nums text-tinta-suave">
                × {line.quantity} · <span className="font-semibold text-rojo">cortesía</span> ·
                regalado {formatMoney(line.subtotal)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void removeOne(line.productId, true)}
              disabled={busy}
              aria-label={`Descontar una cortesía de ${line.name} registrada`}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-tinta text-[17px] text-tinta before:absolute before:-inset-1 before:rounded-lg before:content-[''] disabled:opacity-40"
            >
              −
            </button>
          </div>
        ))

  const reporteView = (
    <>
      <div className="mt-3.5">
        <SectionLabel>Ventas registradas</SectionLabel>
        <div className="mt-1.5">
          {report.sold.length === 0 ? (
            <p className="py-3 text-sm text-tinta-suave">Todavía no registraste ventas.</p>
          ) : (
            reportRows('sold')
          )}
        </div>
      </div>
      <div className="mt-4">
        <SectionLabel>Cortesías registradas</SectionLabel>
        <div className="mt-1.5">
          {report.invitations.length === 0 ? (
            <p className="py-3 text-sm text-tinta-suave">Todavía no registraste cortesías.</p>
          ) : (
            reportRows('invitations')
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setConfirmingClose(true)}
        disabled={busy}
        className="mt-5 min-h-12 w-full rounded-lg bg-rojo py-3.5 text-[13px] font-bold tracking-[0.05em] text-white uppercase transition-opacity disabled:opacity-50"
      >
        Cerrar turno
      </button>
    </>
  )

  const sheetAccount =
    sheet?.type === 'account' ? accounts.find((a) => a.id === sheet.accountId) ?? null : null

  return (
    <main className={`mx-auto max-w-3xl px-5 pt-4 ${embedded ? 'pb-10' : 'pb-32'}`}>
      {errorBanner}

      {embedded && (
        <div
          role="group"
          aria-label="Vista del turno"
          className="mb-3 flex gap-1 rounded-lg border border-hair bg-carta p-1"
        >
          <button
            type="button"
            aria-pressed={tab === 'turno'}
            onClick={() => setTab('turno')}
            className={`min-h-10 flex-1 rounded-md text-xs font-semibold tracking-[0.06em] uppercase transition-colors ${
              tab === 'turno' ? 'bg-tinta text-papel' : 'text-tinta-suave'
            }`}
          >
            Turno
          </button>
          <button
            type="button"
            aria-pressed={tab === 'reporte'}
            onClick={() => setTab('reporte')}
            className={`min-h-10 flex-1 rounded-md text-xs font-semibold tracking-[0.06em] uppercase transition-colors ${
              tab === 'reporte' ? 'bg-tinta text-papel' : 'text-tinta-suave'
            }`}
          >
            Reporte
          </button>
        </div>
      )}

      {tab === 'turno' ? turnoView : reporteView}

      {tab === 'turno' && (
        <button
          type="button"
          onClick={() => setSheet({ type: 'comanda' })}
          aria-label={`Abrir comanda, ${pending} ${pending === 1 ? 'ítem pendiente' : 'ítems pendientes'}`}
          className="fixed right-[18px] bottom-[92px] z-20 flex h-[62px] w-[62px] flex-col items-center justify-center rounded-full bg-rojo text-white shadow-[0_10px_24px_rgba(60,45,20,0.38)]"
        >
          <span className="absolute -top-1.5 -right-0.5 rounded-full bg-tinta px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-white">
            {pending}
          </span>
          <TicketIcon className="h-6 w-6" />
          <small className="mt-0.5 text-[8.5px] font-bold tracking-[0.08em]">TICKET</small>
        </button>
      )}

      {!embedded && (
        <BottomBar
          items={[
            { key: 'turno', label: 'Turno', icon: <CopaIcon className="h-full w-full" /> },
            { key: 'reporte', label: 'Reporte', icon: <BarrasIcon className="h-full w-full" /> },
          ]}
          active={tab}
          onSelect={(key) => setTab(key as InnerTab)}
        />
      )}

      {sheet?.type === 'comanda' && (
        <Sheet
          title="Comanda y cuentas abiertas"
          heading="Comanda del turno"
          subtitle={
            loose.length === 0
              ? 'Comanda vacía — tocá un producto para anotarla'
              : `${pendingCount(loose)} ${pendingCount(loose) === 1 ? 'ítem suelto' : 'ítems sueltos'}`
          }
          onClose={() => setSheet(null)}
        >
          {loose.map((line) => (
            <TicketRow key={line.key} line={line} onRemove={() => removePendingLine(line)} />
          ))}

          {loose.length > 0 && (
            <div className="flex justify-between pt-2.5 text-sm font-bold text-tinta">
              <span>Pendiente</span>
              <span className="font-mono tabular-nums">{formatMoney(linesTotal(loose))}</span>
            </div>
          )}

          <div className="mt-3.5 flex gap-2">
            <button
              type="button"
              onClick={() => commitLines(lines.filter((line) => line.accountId !== null))}
              disabled={loose.length === 0 || busy}
              className="min-h-12 rounded-lg border-[1.5px] border-tinta px-4 text-xs font-semibold tracking-[0.05em] text-tinta uppercase disabled:opacity-40"
            >
              Vaciar
            </button>
            <button
              type="button"
              onClick={() => void registerComanda()}
              disabled={loose.length === 0 || busy}
              className="min-h-12 flex-1 rounded-lg bg-tinta px-4 text-[13px] font-bold tracking-[0.05em] text-papel uppercase transition-opacity disabled:opacity-40"
            >
              Registrar comanda
            </button>
          </div>

          <p className="mt-3.5 border-b-2 border-dashed border-hair-fuerte pb-1.5 text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase">
            Cuentas abiertas
          </p>

          {accounts.length === 0 && (
            <p className="py-3 text-sm text-tinta-suave">No hay cuentas abiertas en este turno.</p>
          )}

          {accounts.map((account) => {
            const accountLines = linesForAccount(lines, account.id)
            const vip = vipCustomers.find((v) => v.id === account.vip_customer_id)
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => setSheet({ type: 'account', accountId: account.id })}
                className="flex w-full items-center gap-2.5 border-t border-dashed border-hair px-1 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="text-sm font-semibold text-tinta">
                    {account.name}
                    {vip && (
                      <em className="ml-1.5 rounded bg-rojo px-1.5 py-px align-[2px] text-[10px] font-bold tracking-[0.06em] text-white not-italic uppercase">
                        VIP
                      </em>
                    )}
                  </span>
                  <small className="mt-0.5 block font-mono text-[11.5px] tabular-nums text-tinta-suave">
                    {pendingCount(accountLines)} ítems · {formatMoney(linesTotal(accountLines))} ·
                    abierta {formatTime(account.created_at)}
                  </small>
                </span>
                <span className="ml-auto text-base text-tinta-suave" aria-hidden="true">
                  ›
                </span>
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => {
              setAccountName('')
              setAccountVipId('')
              setAccountError(null)
              setSheet({ type: 'abrir-cuenta' })
            }}
            className="mt-1.5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-rojo py-3 text-[13px] font-bold tracking-[0.06em] text-rojo uppercase"
          >
            <MasIcon className="h-4 w-4" />
            Abrir cuenta
          </button>
        </Sheet>
      )}

      {sheet?.type === 'abrir-cuenta' && (
        <Sheet
          title="Abrir cuenta"
          heading="Abrir cuenta"
          subtitle="Poné un nombre o elegí un cliente VIP. Después seguís tocando productos y caen acá."
          onClose={() => setSheet({ type: 'comanda' })}
        >
          <form onSubmit={openAccount}>
            <div className="mb-3.5">
              <label
                htmlFor="account-name"
                className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase"
              >
                Nombre de la cuenta (opcional)
              </label>
              <input
                id="account-name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Mesa 3, Cumpleaños…"
                className="h-12 w-full rounded-lg border border-hair-fuerte bg-papel px-3.5 text-[15px] text-tinta placeholder:text-tinta-suave/70"
              />
            </div>
            <div className="mb-3.5">
              <label
                htmlFor="account-vip"
                className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase"
              >
                Cliente VIP (opcional)
              </label>
              <select
                id="account-vip"
                value={accountVipId}
                onChange={(e) => setAccountVipId(e.target.value)}
                className="h-12 w-full rounded-lg border border-hair-fuerte bg-papel px-3.5 text-[15px] text-tinta"
              >
                <option value="">Sin cliente VIP</option>
                {vipCustomers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            {accountError && <p className="mb-3 text-sm text-rojo">{accountError}</p>}
            <button
              type="submit"
              disabled={busy}
              className="min-h-12 w-full rounded-lg bg-rojo text-[13px] font-bold tracking-[0.05em] text-white uppercase transition-opacity disabled:opacity-50"
            >
              Abrir cuenta
            </button>
            <p className="mt-3.5 border-t-2 border-dashed border-hair-fuerte pt-3 text-xs leading-[1.5] text-tinta-suave">
              Puede convivir con otras cuentas abiertas. Registrar la cuenta cobra sus ítems y la
              limpia.
            </p>
          </form>
        </Sheet>
      )}

      {sheet?.type === 'account' && sheetAccount && (() => {
        const accountLines = linesForAccount(lines, sheetAccount.id)
        const vip = vipCustomers.find((v) => v.id === sheetAccount.vip_customer_id)
        return (
          <Sheet
            title={`Cuenta de ${sheetAccount.name}`}
            heading={
              <>
                {sheetAccount.name}
                {vip && (
                  <em className="ml-1.5 rounded bg-rojo px-1.5 py-px align-[2px] text-[10px] font-bold tracking-[0.06em] text-white not-italic uppercase">
                    VIP
                  </em>
                )}
              </>
            }
            subtitle={`Abierta ${formatTime(sheetAccount.created_at)} · ${pendingCount(accountLines)} ítems`}
            onClose={() => setSheet({ type: 'comanda' })}
          >
            {accountLines.length === 0 ? (
              <p className="py-2 text-sm text-tinta-suave">
                Comanda vacía — tocá un producto para anotarla en esta cuenta.
              </p>
            ) : (
              accountLines.map((line) => <TicketRow key={line.key} line={line} />)
            )}
            {accountLines.length > 0 && (
              <div className="flex justify-between pt-2.5 text-sm font-bold text-tinta">
                <span>Total de la cuenta</span>
                <span className="font-mono tabular-nums">{formatMoney(linesTotal(accountLines))}</span>
              </div>
            )}
            <div className="mt-3.5 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  commitLines(lines.filter((line) => line.accountId !== sheetAccount.id))
                }
                disabled={accountLines.length === 0 || busy}
                className="min-h-12 rounded-lg border-[1.5px] border-tinta px-4 text-xs font-semibold tracking-[0.05em] text-tinta uppercase disabled:opacity-40"
              >
                Vaciar
              </button>
              <button
                type="button"
                onClick={() => void registerAccount(sheetAccount)}
                disabled={accountLines.length === 0 || busy}
                className="min-h-12 flex-1 rounded-lg bg-tinta px-4 text-[13px] font-bold tracking-[0.05em] text-papel uppercase transition-opacity disabled:opacity-40"
              >
                Registrar cuenta
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveAccountId(sheetAccount.id)
                setSheet(null)
              }}
              className="mt-2.5 min-h-12 w-full rounded-lg border-[1.5px] border-rojo py-3 text-[13px] font-bold tracking-[0.06em] text-rojo uppercase"
            >
              Seguir anotando en esta cuenta
            </button>
          </Sheet>
        )
      })()}

      {confirmingClose && (
        <Sheet
          title="Cerrar turno"
          heading="¿Cerrar turno?"
          subtitle="Se genera el reporte y no podrás registrar más ventas en este turno."
          onClose={() => setConfirmingClose(false)}
        >
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmingClose(false)}
              className="min-h-12 flex-1 rounded-lg border-[1.5px] border-tinta text-xs font-semibold tracking-[0.05em] text-tinta uppercase"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void closeShift()}
              disabled={busy}
              className="min-h-12 flex-1 rounded-lg bg-rojo text-[13px] font-bold tracking-[0.05em] text-white uppercase transition-opacity disabled:opacity-50"
            >
              Cerrar turno
            </button>
          </div>
        </Sheet>
      )}

      {vipPicker && (
        <Sheet
          title={`Cortesía: ${vipPicker.name}`}
          heading={`Cortesía: ${vipPicker.name}`}
          subtitle="¿Para qué cliente VIP es? (opcional)"
          onClose={() => setVipPicker(null)}
        >
          <select
            aria-label="Cliente VIP de la cortesía"
            value={vipCustomerId}
            onChange={(e) => setVipCustomerId(e.target.value)}
            className="h-12 w-full rounded-lg border border-hair-fuerte bg-papel px-3.5 text-[15px] text-tinta"
          >
            <option value="">Sin asignar</option>
            {vipCustomers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          {vipCustomers.length === 0 && (
            <p className="mt-2 text-xs text-tinta-suave">
              Todavía no hay clientes VIP cargados: el encargado los administra en “Clientes VIP”.
            </p>
          )}
          <div className="mt-3.5 flex gap-2">
            <button
              type="button"
              onClick={() => setVipPicker(null)}
              className="min-h-12 flex-1 rounded-lg border-[1.5px] border-tinta text-xs font-semibold tracking-[0.05em] text-tinta uppercase"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                const product = vipPicker
                setVipPicker(null)
                noteProduct(product, true, vipCustomerId || null)
              }}
              disabled={busy}
              className="min-h-12 flex-1 rounded-lg bg-rojo text-[13px] font-bold tracking-[0.05em] text-white uppercase transition-opacity disabled:opacity-50"
            >
              Anotar cortesía
            </button>
          </div>
        </Sheet>
      )}
    </main>
  )
}
