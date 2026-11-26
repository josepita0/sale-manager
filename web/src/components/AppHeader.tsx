import { useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { initials } from '../lib/format'
import { Sheet } from './Sheet'
import { PasswordInput } from './PasswordInput'
import { toast } from './Toast'
import { Privacidad } from './Privacidad'
import { validateChangePassword } from '../lib/changePassword'
import { ROLE_LABEL, type Profile } from '../lib/types'

interface Props {
  profile: Profile
  email: string
  children?: ReactNode
}

/**
 * App header of direction 02: brand, role line and the round avatar,
 * which opens the account sheet (sign out is an explicit choice, never
 * an accidental tap). Over a dashed hair-fuerte divider.
 */
export function AppHeader({ profile, email, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [privOpen, setPrivOpen] = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNext, setPwNext] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwErrors, setPwErrors] = useState<ReturnType<typeof validateChangePassword>>({})
  const [pwSaving, setPwSaving] = useState(false)

  function openPasswordForm() {
    setMenuOpen(false)
    setPwErrors({})
    setPwOpen(true)
  }

  /** Closing the form always discards what was typed: nothing lingers for the next open. */
  function closePasswordForm() {
    setPwOpen(false)
    setPwCurrent('')
    setPwNext('')
    setPwConfirm('')
    setPwErrors({})
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    const errors = validateChangePassword({ current: pwCurrent, next: pwNext, confirm: pwConfirm })
    setPwErrors(errors)
    if (Object.keys(errors).length > 0) return
    setPwSaving(true)
    try {
      // Verify the current password first: an unlocked session alone must not
      // be enough to take over the account (anti session-hijack check).
      const { error: checkError } = await supabase.auth.signInWithPassword({ email, password: pwCurrent })
      if (checkError) {
        setPwErrors({ current: 'La contraseña actual no es correcta.' })
        return
      }
      const { error } = await supabase.auth.updateUser({ password: pwNext })
      if (error) {
        setPwErrors({ next: 'No pudimos actualizar la contraseña. Intentá de nuevo.' })
        return
      }
      closePasswordForm()
      toast('Contraseña actualizada ✓')
    } catch {
      // supabase-js normally resolves errors, but a network-level throw must
      // still surface a message instead of an unhandled rejection.
      setPwErrors({ next: 'No pudimos conectar. Revisá tu conexión e intentá de nuevo.' })
    } finally {
      setPwSaving(false)
    }
  }

  async function signOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    setMenuOpen(false)
    setSigningOut(false)
  }

  return (
    <header className="border-b-2 border-dashed border-hair-fuerte bg-papel px-5 pt-4 pb-3">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div>
          <p className="text-base font-extrabold tracking-[0.06em] text-tinta uppercase">
            La Barra
          </p>
          <p className="mt-0.5 text-xs text-tinta-suave">
            {ROLE_LABEL[profile.role]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {children}
          <span className="hidden max-w-[14rem] truncate text-xs text-tinta-suave sm:inline" title={email}>
            {profile.full_name || email}
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir mi cuenta"
            aria-haspopup="dialog"
            className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-tinta text-xs font-bold text-tinta transition-transform active:scale-95"
          >
            {initials(profile.full_name ?? '', email)}
          </button>
        </div>
      </div>

      <Sheet
        open={menuOpen}
        title="Mi cuenta"
        heading={profile.full_name || email}
        subtitle={email}
        onClose={() => setMenuOpen(false)}
      >
        <div className="mb-4 flex items-center justify-between border-b border-dashed border-hair py-2.5 text-sm">
          <span className="text-tinta-suave">Rol</span>
          <span className="font-semibold text-tinta">{ROLE_LABEL[profile.role]}</span>
        </div>
        <button
          type="button"
          onClick={openPasswordForm}
          className="min-h-12 w-full rounded-lg border-[1.5px] border-tinta text-xs font-semibold tracking-[0.05em] text-tinta uppercase"
        >
          Cambiar contraseña
        </button>
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false)
            setPrivOpen(true)
          }}
          className="mt-2.5 min-h-12 w-full rounded-lg border-[1.5px] border-tinta text-xs font-semibold tracking-[0.05em] text-tinta uppercase"
        >
          Privacidad y datos
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={signingOut}
          className="mt-2.5 min-h-12 w-full rounded-lg bg-rojo text-[13px] font-bold tracking-[0.05em] text-white uppercase transition-opacity disabled:opacity-50"
        >
          {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          disabled={signingOut}
          className="mt-2.5 min-h-12 w-full rounded-lg border-[1.5px] border-tinta text-xs font-semibold tracking-[0.05em] text-tinta uppercase"
        >
          Volver
        </button>
      </Sheet>

      <Sheet
        open={pwOpen}
        title="Cambiar contraseña"
        heading={profile.full_name || email}
        subtitle={email}
        onClose={closePasswordForm}
      >
        <form onSubmit={(e) => void changePassword(e)}>
          <label className="mb-3 block text-sm">
            <span className="mb-1 block text-xs text-tinta-suave">Contraseña actual</span>
            <PasswordInput id="pw-current" value={pwCurrent} onChange={setPwCurrent} required autoComplete="current-password" />
            {pwErrors.current && <span className="mt-1 block text-xs text-rojo">{pwErrors.current}</span>}
          </label>
          <label className="mb-3 block text-sm">
            <span className="mb-1 block text-xs text-tinta-suave">Nueva contraseña</span>
            <PasswordInput id="pw-next" value={pwNext} onChange={setPwNext} required autoComplete="new-password" placeholder="Mínimo 6 caracteres" />
            {pwErrors.next && <span className="mt-1 block text-xs text-rojo">{pwErrors.next}</span>}
          </label>
          <label className="mb-4 block text-sm">
            <span className="mb-1 block text-xs text-tinta-suave">Confirmar nueva contraseña</span>
            <PasswordInput id="pw-confirm" value={pwConfirm} onChange={setPwConfirm} required autoComplete="new-password" />
            {pwErrors.confirm && <span className="mt-1 block text-xs text-rojo">{pwErrors.confirm}</span>}
          </label>
          <button
            type="submit"
            disabled={pwSaving}
            className="min-h-12 w-full rounded-lg bg-tinta text-[13px] font-bold tracking-[0.05em] text-papel uppercase transition-opacity disabled:opacity-50"
          >
            {pwSaving ? 'Guardando…' : 'Guardar contraseña'}
          </button>
          <button
            type="button"
            onClick={closePasswordForm}
            disabled={pwSaving}
            className="mt-2.5 min-h-12 w-full rounded-lg border-[1.5px] border-tinta text-xs font-semibold tracking-[0.05em] text-tinta uppercase"
          >
            Volver
          </button>
        </form>
      </Sheet>

      {privOpen && <Privacidad onBack={() => setPrivOpen(false)} />}
    </header>
  )
}

export function Splash({ text, error }: { text: string; error?: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-papel px-4">
      <p className={`max-w-md text-center text-sm ${error ? 'text-rojo' : 'text-tinta-suave'}`}>
        {text}
      </p>
    </div>
  )
}
