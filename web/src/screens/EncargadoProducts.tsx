import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { formatMoney } from '../lib/format'
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div>
        <label htmlFor="product-name" className="mb-1 block text-sm text-neutral-300">
          Nombre
        </label>
        <input
          id="product-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2.5 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label htmlFor="product-price" className="mb-1 block text-sm text-neutral-300">
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
          className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2.5 outline-none focus:border-emerald-500"
        />
      </div>
      <p className="text-xs text-neutral-500">
        Vender o regalar se decide al momento de la venta, con el modo Venta/Cortesía de la
        pantalla de turno.
      </p>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Guardar
        </button>
      </div>
    </form>
  )
}

export function ProductsTab() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
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
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Catálogo
        </h2>
        {!editing && (
          <button
            onClick={() => setEditing('new')}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            + Agregar producto
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {editing && (
        <div className="mt-3">
          <ProductForm
            initial={editing === 'new' ? null : editing}
            onDone={async () => {
              setEditing(null)
              await load()
            }}
            onError={setError}
          />
          <button
            onClick={() => setEditing(null)}
            className="mt-2 text-sm text-neutral-400 hover:text-neutral-200"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="mt-3 divide-y divide-neutral-800 rounded-2xl border border-neutral-800 bg-neutral-900">
        {products === null ? (
          <p className="p-4 text-sm text-neutral-500">Cargando…</p>
        ) : products.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">El catálogo está vacío.</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className={`font-medium ${p.active ? '' : 'text-neutral-500 line-through'}`}>
                  {p.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatMoney(p.price)}
                  {!p.active && ' · Inactiva'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(p)}
                  disabled={busy || editing !== null}
                  className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-40"
                >
                  Editar
                </button>
                <button
                  onClick={() => void toggleActive(p)}
                  disabled={busy}
                  className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-40"
                >
                  {p.active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => void remove(p)}
                  disabled={busy}
                  className="rounded-lg border border-red-900/60 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-40"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
