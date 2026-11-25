import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface Props {
  profile: Profile
  email: string
  children?: ReactNode
}

export function AppHeader({ profile, email, children }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-neutral-100">🍸 Gestor de Barra</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            profile.role === 'encargado'
              ? 'bg-indigo-500/15 text-indigo-300'
              : 'bg-emerald-500/15 text-emerald-300'
          }`}
        >
          {profile.role === 'encargado' ? 'Encargado' : 'Bartender'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {children}
        <span className="hidden text-sm text-neutral-400 sm:inline" title={email}>
          {profile.full_name || email}
        </span>
        <button
          onClick={() => void supabase.auth.signOut()}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-800"
        >
          Salir
        </button>
      </div>
    </header>
  )
}

export function Splash({ text, error }: { text: string; error?: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <p className={`max-w-md text-center ${error ? 'text-red-300' : 'text-neutral-400'}`}>{text}</p>
    </div>
  )
}
