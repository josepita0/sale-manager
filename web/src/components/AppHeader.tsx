import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { initials } from '../lib/format'
import type { Profile } from '../lib/types'

interface Props {
  profile: Profile
  email: string
  children?: ReactNode
}

/**
 * App header of direction 02: brand, role line and the round sign-out
 * avatar, over a dashed hair-fuerte divider.
 */
export function AppHeader({ profile, email, children }: Props) {
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
            onClick={() => void supabase.auth.signOut()}
            aria-label="Cerrar sesión"
            className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-tinta text-xs font-bold text-tinta"
          >
            {initials(profile.full_name ?? '', email)}
          </button>
        </div>
      </div>
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
