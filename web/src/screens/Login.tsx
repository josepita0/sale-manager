import { useMemo, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const ticketNo = useMemo(
    () => String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0'),
    [],
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setError(error ? 'No pudimos iniciar sesión. Revisá el email y la contraseña.' : null)
    setLoading(false)
  }

  return (
    <div className="login-stage flex min-h-screen flex-col text-tinta">
      <header className="login-scene">
        <div className="login-lamp login-lamp-a" aria-hidden="true">
          <i className="login-lamp-cord" />
          <i className="login-lamp-shade" />
          <i className="login-lamp-glow" />
        </div>
        <div className="login-lamp login-lamp-b" aria-hidden="true">
          <i className="login-lamp-cord" />
          <i className="login-lamp-shade" />
          <i className="login-lamp-glow" />
        </div>
        <h1 className="login-wordmark">La Barra</h1>
        <p className="login-tagline">Ventas y cortesías de tu turno</p>
        <div className="login-shelf" aria-hidden="true">
          <i className="login-bottle login-bottle-1" />
          <i className="login-bottle login-bottle-2" />
          <i className="login-bottle login-bottle-3" />
          <i className="login-bottle login-bottle-4" />
          <i className="login-bottle login-bottle-5" />
          <i className="login-bottle login-bottle-6" />
        </div>
      </header>

      <main
        className="anim-sheet-in login-sheet-delay fixed inset-x-0 bottom-0 z-10 bg-carta px-7 pb-7 shadow-[0_-8px_30px_rgba(60,45,20,0.14)]"
        aria-labelledby="login-title"
      >
        <div className="login-scallop" aria-hidden="true" />
        <div className="login-handle" aria-hidden="true" />

        <header className="flex items-baseline justify-between">
          <h2 id="login-title" className="login-ticket-title">
            Comanda de ingreso
          </h2>
          <span className="login-ticket-num">Nº {ticketNo}</span>
        </header>
        <p className="login-ticket-sub">turno · personal de barra</p>
        <div className="login-cut" aria-hidden="true">
          <span>✂</span>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3.5">
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
              placeholder="vos@mibar.ar"
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
              placeholder="••••••••"
              className="h-12 w-full rounded-lg border border-hair-fuerte bg-papel px-3.5 text-[15px] text-tinta"
            />
          </div>

          {error && (
            <p className="anim-panel-in rounded-lg border border-rojo/40 bg-rojo/5 px-3 py-2 text-sm text-rojo">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="enabled:hover:opacity-90 mt-1 min-h-12 w-full rounded-lg bg-tinta px-4 py-3 text-[13px] font-bold tracking-[0.05em] text-papel uppercase transition-opacity disabled:opacity-50"
          >
            {loading ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="login-barcode" aria-hidden="true" />
        <p className="login-barcode-cap" aria-hidden="true">
          BAR·TURNO·{ticketNo}
        </p>
      </main>
    </div>
  )
}
