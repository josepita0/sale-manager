import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { formatMoney } from '../lib/format'
import { Drawer } from '../components/Drawer'
import { Sheet } from '../components/Sheet'
import { ScreenHead } from '../components/ScreenHead'
import { LapizIcon, MasIcon, PausaIcon, TachoIcon } from '../components/icons'
import type { Product } from '../lib/types'

function ProductForm({
  initial,
  onDone,
  onError,
}: {
  initial: Product | null
  onDone: () => Promise<void> | void
  onError: (message: string) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsedPrice = Number(price.replace(',', '.'))
    if (!name.trim()) {
      onError('El nombre es obligatorio.')
      return
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      onError('El precio debe ser un número mayor o igual a 0.')
      return
    }
    setBusy(true)
    const payload = { name: name.trim(), price: parsedPrice }
    const { error } = initial
      ? await supabase.from('products').update(payload).eq('id', initial.id)
      : await supabase.from('products').insert(payload)
    if (error) {
      onError(
        error.code === '23505'
          ? 'Ya existe un producto con ese nombre.'
          : 'No se pudo guardar: ' + error.message,
      )
    } else {
      await onDone()
    }
    setBusy(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="mb-3.5">
        <label
          htmlFor="product-name"
          className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase"
        >
          Nombre
        </label>
        <input
          id="product-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-12 w-full rounded-lg border border-hair-fuerte bg-papel px-3.5 text-[15px] text-tinta"
        />
      </div>
      <div className="mb-3.5">
        <label
          htmlFor="product-price"
          className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase"
        >
          Precio
        </label>
        <input
          id="product-price"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="h-12 w-full rounded-lg border border-hair-fuerte bg-papel px-3.5 font-mono text-[15px] tabular-nums text-tinta"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="mt-auto min-h-12 w-full rounded-lg bg-tinta py-3.5 text-[13px] font-bold tracking-[0.05em] text-papel uppercase transition-opacity disabled:opacity-50"
      >
        Guardar producto
      </button>
      <p className="mt-3.5 border-t-2 border-dashed border-hair-fuerte pt-3 text-xs leading-[1.5] text-tinta-suave">
        Se activa al guardar y aparece en la grilla del turno al instante. Vender o regalar se
        decide en el turno, no acá.
      </p>
    </form>
  )
}

export function ProductsTab() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [actionsFor, setActionsFor] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setError(null)
    const { data, error } = await supabase.from('products').select('*').order('name')
    if (error) setError('No se pudieron cargar los productos: ' + error.message)
    setProducts((data ?? []) as Product[])
  }

  async function toggleActive(p: Product) {
    setBusy(true)
    setError(null)
    const { error } = await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    if (error) setError('No se pudo actualizar: ' + error.message)
    else await load()
    setBusy(false)
    setActionsFor(null)
  }

  async function remove(p: Product) {
    setBusy(true)
    setError(null)
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) {
      setError(
        error.code === '23503'
          ? `"${p.name}" tiene ventas registradas: no se puede eliminar. Desactivala para sacarla del catálogo.`
          : 'No se pudo eliminar: ' + error.message,
      )
    } else {
      await load()
    }
    setBusy(false)
    setActionsFor(null)
  }

  const activeCount = (products ?? []).filter((p) => p.active).length
  const total = products?.length ?? 0

  return (
    <main className="mx-auto max-w-3xl px-5 pt-4">
      <ScreenHead
        title="Productos"
        subtitle={`${total} en el catálogo · ${activeCount} activos`}
      />

      {error && (
        <p className="mb-3 rounded-lg border border-rojo/40 bg-rojo/5 px-3 py-2 text-sm text-rojo">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-tinta px-4 text-[12.5px] font-bold tracking-[0.05em] text-papel uppercase"
        >
          <MasIcon className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      <div className="mt-3.5">
        {products === null ? (
          <p className="py-3 text-sm text-tinta-suave">Cargando…</p>
        ) : products.length === 0 ? (
          <p className="py-3 text-sm text-tinta-suave">El catálogo está vacío.</p>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 border-b border-dashed border-hair py-2.5"
            >
              <div>
                <p className={`text-sm font-semibold ${p.active ? 'text-tinta' : 'text-tinta-suave'}`}>
                  {p.name}
                </p>
                <p className="mt-0.5 font-mono text-xs tabular-nums text-tinta-suave">
                  {formatMoney(p.price)}
                  {!p.active && ' · Inactiva'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActionsFor(p)}
                aria-label={`Acciones de ${p.name}`}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-tinta text-sm font-bold text-tinta before:absolute before:-inset-1 before:rounded-lg before:content-['']"
              >
                ···
              </button>
            </div>
          ))
        )}
      </div>

      {editing && (
        <Drawer
          title={editing === 'new' ? 'Nuevo producto' : `Editar ${editing.name}`}
          heading={editing === 'new' ? 'Nuevo producto' : 'Editar producto'}
          subtitle="Vender o regalar se decide en el turno, no acá."
          onClose={() => setEditing(null)}
        >
          <ProductForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            onDone={async () => {
              setEditing(null)
              await load()
            }}
            onError={setError}
          />
        </Drawer>
      )}

      {actionsFor && (
        <Sheet
          title={`Acciones de ${actionsFor.name}`}
          heading={actionsFor.name}
          subtitle={
            <span className="font-mono tabular-nums">
              {formatMoney(actionsFor.price)} · {actionsFor.active ? 'activo' : 'inactivo'}
            </span>
          }
          onClose={() => setActionsFor(null)}
        >
          <button
            type="button"
            onClick={() => {
              const product = actionsFor
              setActionsFor(null)
              setEditing(product)
            }}
            className="flex min-h-12 w-full items-center gap-3 border-t border-dashed border-hair px-1 py-3 text-left text-sm font-semibold text-tinta"
          >
            <LapizIcon className="h-[19px] w-[19px] text-tinta-suave" />
            Editar precio o nombre
          </button>
          <button
            type="button"
            onClick={() => void toggleActive(actionsFor)}
            disabled={busy}
            className="flex min-h-12 w-full items-center gap-3 border-t border-dashed border-hair px-1 py-3 text-left text-sm font-semibold text-tinta disabled:opacity-40"
          >
            <PausaIcon className="h-[19px] w-[19px] text-tinta-suave" />
            {actionsFor.active ? 'Desactivar' : 'Activar'}
            <small className="ml-auto text-[11px] font-normal text-tinta-suave">
              {actionsFor.active ? 'sale de la grilla' : 'vuelve a la grilla'}
            </small>
          </button>
          <button
            type="button"
            onClick={() => void remove(actionsFor)}
            disabled={busy}
            className="flex min-h-12 w-full items-center gap-3 border-t border-dashed border-hair px-1 py-3 text-left text-sm font-semibold text-rojo disabled:opacity-40"
          >
            <TachoIcon className="h-[19px] w-[19px]" />
            Eliminar
          </button>
          <button
            type="button"
            onClick={() => setActionsFor(null)}
            className="mt-3 min-h-12 w-full rounded-lg border-[1.5px] border-tinta text-[13px] font-semibold tracking-[0.05em] text-tinta uppercase"
          >
            Cancelar
          </button>
        </Sheet>
      )}
    </main>
  )
}
