import { useEffect, useState, type FormEvent } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { ScreenHead } from '../components/ScreenHead'
import { ListRowsSkeleton } from './skeleton'
import { toast } from '../components/Toast'
import { validateNewUser, type NewUserErrors } from '../lib/newUser'
import { ROLE_LABEL, type Profile, type Role } from '../lib/types'

/** Profile row with the creation date shown in the list. */
interface StaffProfile extends Profile {
  created_at: string
}

/** Turns a failed edge-function call into a Spanish, user-facing message. */
async function edgeErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = (await error.context.json()) as { error?: string }
      if (payload?.error) return payload.error
    } catch {
      // fall through to the generic message
    }
  }
  return 'No se pudo crear el usuario: ' + (error instanceof Error ? error.message : 'error desconocido')
}

function UserForm({
  onDone,
  onError,
}: {
  onDone: () => Promise<void> | void
  onError: (message: string) => void
}) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Role | ''>('bartender')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<NewUserErrors>({})
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errors = validateNewUser({ email, fullName, role, password })
    setFieldErrors(errors)
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

  const fieldClass = 'h-12 w-full rounded-lg border border-hair-fuerte bg-papel px-3.5 text-[15px] text-tinta'
  const labelClass = 'mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase'

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-hair bg-carta p-4">
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
          onChange={(e) => setRole(e.target.value as Role | '')}
          className={fieldClass}
        >
          {(['admin', 'manager', 'bartender'] as const).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        {fieldErrors.role && <p className="mt-1 text-xs text-rojo">{fieldErrors.role}</p>}
      </div>

      <div className="mb-3.5">
        <label htmlFor="user-password" className={labelClass}>
          Contraseña inicial
        </label>
        <input
          id="user-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={fieldClass}
        />
        {fieldErrors.password && <p className="mt-1 text-xs text-rojo">{fieldErrors.password}</p>}
        <p className="mt-1 text-[11px] text-tinta-suave">Mínimo 6 caracteres; compartila con el usuario.</p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-lg bg-tinta px-4 py-2.5 text-[13px] font-bold tracking-[0.05em] text-papel uppercase transition-opacity disabled:opacity-50"
      >
        Crear usuario
      </button>
    </form>
  )
}

export function UsersTab() {
  const [profiles, setProfiles] = useState<StaffProfile[] | null>(null)
  const [creating, setCreating] = useState(false)
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

  return (
    <main className="mx-auto max-w-3xl px-5 pt-4">
      <ScreenHead title="Usuarios" subtitle={`${profiles?.length ?? 0} cuentas`} />
      <p className="mb-3 text-xs leading-[1.5] text-tinta-suave">
        Creás el usuario con email, nombre, rol y una contraseña inicial: nace confirmado, sin email de
        verificación.
      </p>

      {error && (
        <p className="anim-slide-down mb-3 rounded-lg border border-rojo/40 bg-rojo/5 px-3 py-2 text-sm text-rojo">
          {error}
        </p>
      )}

      <div className="mb-3 flex justify-end">
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="min-h-11 rounded-lg bg-tinta px-4 text-[12.5px] font-bold tracking-[0.05em] text-papel uppercase"
          >
            + Nuevo usuario
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-3">
          <UserForm
            onDone={async () => {
              setCreating(false)
              await load()
            }}
            onError={setError}
          />
          <button
            type="button"
            onClick={() => setCreating(false)}
            className="mt-2 min-h-11 text-sm text-tinta-suave underline-offset-2 hover:underline"
          >
            Cancelar
          </button>
        </div>
      )}

      <div>
        {profiles === null ? (
          <ListRowsSkeleton label="Cargando usuarios" rows={4} />
        ) : profiles.length === 0 ? (
          <p className="py-3 text-sm text-tinta-suave">Todavía no hay usuarios cargados.</p>
        ) : (
          profiles.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-hair py-2.5"
            >
              <div>
                <p className="text-sm font-semibold text-tinta">{p.full_name || '(sin nombre)'}</p>
                <p className="text-xs text-tinta-suave">{ROLE_LABEL[p.role]}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
