import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { Profile } from './lib/types'
import { AppHeader, Splash } from './components/AppHeader'
import { Toaster } from './components/Toast'
import { Login } from './screens/Login'
import { BartenderShift } from './screens/BartenderShift'
import { EncargadoHome } from './screens/EncargadoHome'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  const email = session?.user.email ?? ''

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setProfileError(null)
      return
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setProfile(null)
          setProfileError(
            'No pudimos cargar tu perfil. ¿Ya ejecutaste el SQL del esquema en Supabase? (ver README, paso 1)',
          )
        } else {
          setProfile(data)
        }
      })
  }, [userId])

  if (loading) return <Splash text="Cargando…" />
  if (!session) return <Login />
  if (!profile) return <Splash text={profileError ?? 'Cargando perfil…'} error />

  const header = <AppHeader profile={profile} email={email} />

  return (
    <div className="min-h-screen bg-papel text-tinta">
      {header}
      {profile.role !== 'bartender' ? (
        <EncargadoHome profile={profile} />
      ) : (
        <BartenderShift profile={profile} />
      )}
      <Toaster />
    </div>
  )
}
