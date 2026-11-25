import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { VipCustomer } from '../lib/types'

function VipForm({
  initial,
  onDone,
  onError,
}: {
  initial: VipCustomer | null
  onDone: () => Promise<void> | void
  onError: (message: string) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      onError('El nombre es obligatorio.')
      return
    }
    setBusy(true)
    const { error } = initial
      ? await supabase.from('vip_customers').update({ name: name.trim() }).eq('id', initial.id)
      : await supabase.from('vip_customers').insert({ name: name.trim() })
    if (error) {
      onError(
        error.code === '23505'
          ? 'Ya existe un cliente con ese nombre.'
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
        <label htmlFor="vip-name" className="mb-1 block text-sm text-neutral-300">
          Nombre
        </label>
        <input
          id="vip-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2.5 outline-none focus:border-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        Guardar
      </button>
    </form>
  )
}

export function VipCustomersTab() {
  const [customers, setCustomers] = useState<VipCustomer[] | null>(null)
  const [editing, setEditing] = useState<VipCustomer | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setError(null)
    const { data, error } = await supabase.from('vip_customers').select('*').order('name')
    if (error) setError('No se pudieron cargar los clientes VIP: ' + error.message)
    setCustomers((data ?? []) as VipCustomer[])
  }

  async function toggleActive(c: VipCustomer) {
    setBusy(true)
    setError(null)
    const { error } = await supabase.from('vip_customers').update({ active: !c.active }).eq('id', c.id)
    if (error) setError('No se pudo actualizar: ' + error.message)
    else await load()
    setBusy(false)
  }

  async function remove(c: VipCustomer) {
    setBusy(true)
    setError(null)
    const { error } = await supabase.from('vip_customers').delete().eq('id', c.id)
    if (error) setError('No se pudo eliminar: ' + error.message)
    else await load()
    setBusy(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Clientes VIP
        </h2>
        {!editing && (
          <button
            onClick={() => setEditing('new')}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            + Agregar cliente
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Al registrar una cortesía, el bartender puede elegir a cuál de estos clientes va destinada
        (opcional).
      </p>

      {error && (
        <p className="mt-3 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {editing && (
        <div className="mt-3">
          <VipForm
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
        {customers === null ? (
          <p className="p-4 text-sm text-neutral-500">Cargando…</p>
        ) : customers.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">Todavía no hay clientes VIP cargados.</p>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <p className={`font-medium ${c.active ? '' : 'text-neutral-500 line-through'}`}>
                {c.name}
                {!c.active && <span className="ml-2 text-xs normal-case">Inactivo</span>}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(c)}
                  disabled={busy || editing !== null}
                  className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-40"
                >
                  Editar
                </button>
                <button
                  onClick={() => void toggleActive(c)}
                  disabled={busy}
                  className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-40"
                >
                  {c.active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => void remove(c)}
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
