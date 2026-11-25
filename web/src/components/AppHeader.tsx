import { useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { initials } from '../lib/format'
import { Sheet } from './Sheet'
import type { Profile } from '../lib/types'

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
            Naira's
          </p>
          <p className="mt-0.5 text-xs text-tinta-suave">
            {profile.role === 'encargado' ? 'Encargado' : 'Bartender'}
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
          <span className="font-semibold text-tinta">
            {profile.role === 'encargado' ? 'Encargado' : 'Bartender'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={signingOut}
          className="min-h-12 w-full rounded-lg bg-rojo text-[13px] font-bold tracking-[0.05em] text-white uppercase transition-opacity disabled:opacity-50"
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
