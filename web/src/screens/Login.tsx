import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setError(error ? 'No pudimos iniciar sesión. Revisá el email y la contraseña.' : null)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-papel px-4">
      <div className="w-full max-w-sm rounded-lg border border-hair bg-carta p-6 shadow-[0_6px_18px_rgba(60,45,20,0.10)]">
        <h1 className="text-center text-3xl font-extrabold tracking-[0.06em] text-tinta uppercase">
          Naira's
        </h1>
        <p className="mt-1 text-center text-sm text-tinta-suave">Ventas y cortesías de tu turno</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-lg border border-hair-fuerte bg-papel px-3.5 text-[15px] text-tinta placeholder:text-tinta-suave/70"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-tinta-suave uppercase"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-lg border border-hair-fuerte bg-papel px-3.5 text-[15px] text-tinta"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-rojo/40 bg-rojo/5 px-3 py-2 text-sm text-rojo">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-lg bg-tinta px-4 py-3 text-[13px] font-bold tracking-[0.05em] text-papel uppercase transition-opacity disabled:opacity-50"
          >
            {loading ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
