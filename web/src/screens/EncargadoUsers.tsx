import { useEffect, useState, type FormEvent } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { ROLE_LABEL, type Profile, type Role } from '../lib/types'
import { DataTable, type DataTableColumn, type DataTableFilter } from '../components/DataTable'
import { Drawer } from '../components/Drawer'
import { ScreenHead } from '../components/ScreenHead'
import { toast } from '../components/Toast'
import { validateNewUser, type NewUserErrors } from '../lib/newUser'
import { validateEditUser, type EditUserErrors } from '../lib/editUser'
import { PasswordInput } from '../components/PasswordInput'

/** Profile row with the creation date shown in the list. */
interface StaffProfile extends Profile {
  created_at: string
}

/** Turns a failed edge-function call into a Spanish, user-facing message. */
async function edgeErrorMessage(error: unknown, action = 'crear'): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = (await error.context.json()) as { error?: string }
      if (payload?.error) return payload.error
    } catch {
      // fall through to the generic message
    }
  }
  return (
    `No se pudo ${action} el usuario: ` +
    (error instanceof Error ? error.message : 'error desconocido')
  )
}

function UserForm({
  initial,
  currentUserId,
  onDone,
  onError,
}: {
  /** null creates a user; a profile edits it (email is never editable). */
  initial: StaffProfile | null
  currentUserId: string
  onDone: () => Promise<void> | void
  onError: (message: string) => void
}) {
  const editing = initial !== null
  const isSelf = editing && initial.id === currentUserId
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState(initial?.full_name ?? '')
  const [role, setRole] = useState<Role | ''>(initial?.role ?? 'bartender')
  const [password, setPassword] = useState('')
  const [newUserErrors, setNewUserErrors] = useState<NewUserErrors>({})
  const [editUserErrors, setEditUserErrors] = useState<EditUserErrors>({})
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (initial) {
      const input = { id: initial.id, fullName, role, password }
      const errors = validateEditUser(input)
      setEditUserErrors(errors)
      if (Object.keys(errors).length > 0) return

      setBusy(true)
      try {
        const { error } = await supabase.functions.invoke('update-user', {
          body: {
            id: input.id.trim().toLowerCase(),
            full_name: fullName.trim(),
            role,
            password,
          },
        })
        if (error) {
          onError(await edgeErrorMessage(error, 'actualizar'))
        } else {
          toast('Usuario actualizado ✓')
          await onDone()
        }
      } catch (callError) {
        onError(await edgeErrorMessage(callError, 'actualizar'))
      }
      setBusy(false)
      return
    }

    const errors = validateNewUser({ email, fullName, role, password })
    setNewUserErrors(errors)
    if (Object.keys(errors).length > 0) return

    setBusy(true)
    try {
      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          role,
          password,
        },
      })
      if (error) {
        onError(await edgeErrorMessage(error))
      } else {
        toast('Usuario creado ✓')
        await onDone()
      }
    } catch (callError) {
      onError(await edgeErrorMessage(callError))
    }
    setBusy(false)
  }

  const fieldErrors: NewUserErrors & EditUserErrors = editing ? editUserErrors : newUserErrors
  const fieldClass = 'h-12 w-full rounded-lg border border-hair-fuerte bg-papel px-3.5 text-[15px] text-tinta'
  const labelClass = 'mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase'

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      {!editing && (
        <div className="mb-3.5">
          <label htmlFor="user-email" className={labelClass}>
            Email
          </label>
          <input
            id="user-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
          {fieldErrors.email && <p className="mt-1 text-xs text-rojo">{fieldErrors.email}</p>}
          <p className="mt-1 text-[11px] text-tinta-suave">Identificador de login; no se envía ningún email.</p>
        </div>
      )}

      <div className="mb-3.5">
        <label htmlFor="user-full-name" className={labelClass}>
          Nombre
        </label>
        <input
          id="user-full-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={fieldClass}
        />
        {fieldErrors.fullName && <p className="mt-1 text-xs text-rojo">{fieldErrors.fullName}</p>}
      </div>

      <div className="mb-3.5">
        <label htmlFor="user-role" className={labelClass}>
          Rol
        </label>
        <select
          id="user-role"
          value={role}
          disabled={isSelf}
          onChange={(e) => setRole(e.target.value as Role | '')}
          className={`${fieldClass} disabled:opacity-50`}
        >
          {(['admin', 'manager', 'bartender'] as const).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        {fieldErrors.role && <p className="mt-1 text-xs text-rojo">{fieldErrors.role}</p>}
        {isSelf && <p className="mt-1 text-[11px] text-tinta-suave">No podés cambiar tu propio rol.</p>}
      </div>

      <div className="mb-3.5">
        <label htmlFor="user-password" className={labelClass}>
          {editing ? 'Contraseña' : 'Contraseña inicial'}
        </label>
        <PasswordInput
          id="user-password"
          autoComplete="new-password"
          placeholder={editing ? 'Dejar vacío para no cambiar' : undefined}
          value={password}
          onChange={setPassword}
        />
        {fieldErrors.password && <p className="mt-1 text-xs text-rojo">{fieldErrors.password}</p>}
        <p className="mt-1 text-[11px] text-tinta-suave">Mínimo 6 caracteres; compartila con el usuario.</p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-auto min-h-12 w-full rounded-lg bg-tinta py-3.5 text-[13px] font-bold tracking-[0.05em] text-papel uppercase transition-opacity disabled:opacity-50"
      >
        {editing ? 'Guardar cambios' : 'Crear usuario'}
      </button>
    </form>
  )
}

export function UsersTab({ profile }: { profile: Profile }) {
  const [profiles, setProfiles] = useState<StaffProfile[] | null>(null)
  /** 'new' creates; a profile edits it. Only one form is open at a time. */
  const [editing, setEditing] = useState<StaffProfile | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setError(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('full_name')
    if (error) setError('No se pudieron cargar los usuarios: ' + error.message)
    setProfiles((data ?? []) as StaffProfile[])
  }

  const columns: DataTableColumn<StaffProfile>[] = [
    {
      key: 'name',
      header: 'Usuario',
      cell: (p) => (
        <span>
          <span className="block text-sm font-semibold text-tinta">
            {p.full_name || '(sin nombre)'}
          </span>
          <span className="block text-xs text-tinta-suave">{ROLE_LABEL[p.role]}</span>
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      cell: (p) => <span className="text-xs font-semibold text-tinta">{ROLE_LABEL[p.role]}</span>,
    },
  ]

  const rolFilter: DataTableFilter<StaffProfile> = {
    id: 'rol',
    label: 'Rol',
    options: [
      { value: '', label: 'Todos' },
      { value: 'admin', label: 'Admins' },
      { value: 'manager', label: 'Encargados' },
      { value: 'bartender', label: 'Bartenders' },
    ],
    predicate: (p, value) => p.role === value,
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pt-4">
      <ScreenHead title="Usuarios" subtitle={`${profiles?.length ?? 0} cuentas`} />
      <p className="mb-3 text-xs leading-[1.5] text-tinta-suave">
        Creás el usuario con email, nombre, rol y una contraseña inicial: nace confirmado, sin email de
        verificación. Después podés editar nombre, rol y contraseña (el email no se cambia).
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
          + Nuevo usuario
        </button>
      </div>

      <Drawer
        open={editing !== null}
        title={
          editing === 'new'
            ? 'Nuevo usuario'
            : editing
              ? `Editar ${editing.full_name || 'usuario'}`
              : 'Usuario'
        }
        heading={editing === 'new' ? 'Nuevo usuario' : 'Editar usuario'}
        subtitle="Nace confirmado, sin email de verificación."
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <UserForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            currentUserId={profile.id}
            onDone={async () => {
              setEditing(null)
              await load()
            }}
            onError={setError}
          />
        ) : null}
      </Drawer>

      <div className="mt-3.5">
        <DataTable
          rows={profiles}
          rowKey={(p) => p.id}
          columns={columns}
          searchFields={(p) => [p.full_name]}
          searchPlaceholder="Buscar usuario…"
          filters={[rolFilter]}
          emptyCatalog="Todavía no hay usuarios cargados."
          renderActions={(p) => (
            <button
              type="button"
              onClick={() => setEditing(p)}
              className="min-h-9 rounded-lg border border-hair-fuerte px-2.5 text-xs font-semibold text-tinta"
            >
              Editar
            </button>
          )}
        />
      </div>
    </main>
  )
}
