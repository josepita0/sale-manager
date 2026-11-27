import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Drawer } from '../components/Drawer'
import { ScreenHead } from '../components/ScreenHead'
import { ListRowsSkeleton } from './skeleton'
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
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="mb-3.5">
        <label
          htmlFor="vip-name"
          className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase"
        >
          Nombre
        </label>
        <input
          id="vip-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-12 w-full rounded-lg border border-hair-fuerte bg-papel px-3.5 text-[15px] text-tinta"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="mt-auto min-h-12 w-full rounded-lg bg-tinta py-3.5 text-[13px] font-bold tracking-[0.05em] text-papel uppercase transition-opacity disabled:opacity-50"
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

  const activeCount = (customers ?? []).filter((c) => c.active).length

  return (
    <main className="mx-auto max-w-3xl px-5 pt-4">
      <ScreenHead
        title="Clientes VIP"
        subtitle={`${customers?.length ?? 0} cargados · ${activeCount} activos`}
      />
      <p className="mb-3 text-xs leading-[1.5] text-tinta-suave">
        Al registrar una cortesía, el bartender puede elegir a cuál de estos clientes va destinada
        (opcional).
      </p>

      {error && (
        <p className="anim-slide-down mb-3 rounded-lg border border-rojo/40 bg-rojo/5 px-3 py-2 text-sm text-rojo">
          {error}
        </p>
      )}

      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="min-h-11 rounded-lg bg-tinta px-4 text-[12.5px] font-bold tracking-[0.05em] text-papel uppercase"
        >
          + Nuevo cliente
        </button>
      </div>

      <Drawer
        open={editing !== null}
        title={
          editing === 'new' ? 'Nuevo cliente' : editing ? `Editar ${editing.name}` : 'Cliente VIP'
        }
        heading={editing === 'new' ? 'Nuevo cliente' : 'Editar cliente'}
        subtitle="Destino opcional de las cortesías."
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <VipForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            onDone={async () => {
              setEditing(null)
              await load()
            }}
            onError={setError}
          />
        ) : null}
      </Drawer>

      <div>
        {customers === null ? (
          <ListRowsSkeleton label="Cargando clientes VIP" rows={4} />
        ) : customers.length === 0 ? (
          <p className="py-3 text-sm text-tinta-suave">Todavía no hay clientes VIP cargados.</p>
        ) : (
          customers.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-hair py-2.5"
            >
              <p className={`text-sm font-semibold ${c.active ? 'text-tinta' : 'text-tinta-suave'}`}>
                {c.name}
                {!c.active && <span className="ml-2 text-xs font-normal">Inactivo</span>}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  disabled={busy}
                  className="min-h-11 rounded-lg border border-hair-fuerte px-3 text-xs font-semibold text-tinta disabled:opacity-40"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void toggleActive(c)}
                  disabled={busy}
                  className="min-h-11 rounded-lg border border-hair-fuerte px-3 text-xs font-semibold text-tinta disabled:opacity-40"
                >
                  {c.active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(c)}
                  disabled={busy}
                  className="min-h-11 rounded-lg border border-rojo/50 px-3 text-xs font-semibold text-rojo disabled:opacity-40"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
