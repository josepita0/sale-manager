// create-user — Edge Function: an admin creates a staff user from the app.
//
// The browser cannot create confirmed users (the Admin API needs the
// service_role key, which must never ship with the frontend), so this
// function holds it server-side. It:
//   1. verifies the caller is an authenticated `admin` profile;
//   2. validates the payload (email, full_name, role, password);
//   3. creates the user with the Auth Admin API and `email_confirm: true`,
//      so no confirmation email is ever sent — the user can sign in
//      immediately with the email + password the admin chose;
//   4. assigns the requested role with the service client. Roles never
//      travel in signup metadata: public signup must not be able to
//      claim one (0007 keeps every new account as bartender).
//
// Deploy: `supabase functions deploy create-user`

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_ROLES = ['admin', 'manager', 'bartender'] as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
      return json(500, { error: 'Configuración del servidor incompleta.' })
    }

    // Service-role client: server-side only, bypasses RLS for the
    // admin check and the Admin API call.
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1) The platform JWT check (verify_jwt) only proves authentication;
    //    the role check is ours.
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    if (!token) return json(401, { error: 'No autenticado.' })

    const { data: caller, error: callerError } = await admin.auth.getUser(token)
    if (callerError || !caller.user) return json(401, { error: 'Sesión inválida.' })

    const { data: callerProfile, error: callerProfileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', caller.user.id)
      .single()
    if (callerProfileError || !callerProfile) {
      return json(403, { error: 'No se encontró tu perfil.' })
    }
    if (callerProfile.role !== 'admin') {
      return json(403, { error: 'Solo un administrador puede crear usuarios.' })
    }

    // 2) Payload validation.
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') return json(400, { error: 'Cuerpo inválido.' })

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''
    const role = typeof body.role === 'string' ? body.role : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!EMAIL_RE.test(email)) return json(400, { error: 'El email no es válido.' })
    if (!fullName) return json(400, { error: 'El nombre es obligatorio.' })
    if (!(VALID_ROLES as readonly string[]).includes(role)) {
      return json(400, { error: 'El rol no es válido.' })
    }
    if (password.length < 6) {
      return json(400, { error: 'La contraseña debe tener al menos 6 caracteres.' })
    }

    // 3) Create the user already confirmed: no email is sent. Only
    //    full_name goes in metadata (the trigger reads it); the role is
    //    granted server-side afterwards.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (createError) {
      const duplicated =
        createError.code === 'email_exists' || /already registered|already exists/i.test(createError.message)
      return json(400, {
        error: duplicated
          ? 'Ya existe un usuario con ese email.'
          : 'No se pudo crear el usuario: ' + createError.message,
      })
    }
    const createdId = created.user?.id
    if (!createdId) return json(500, { error: 'El usuario se creó pero no se pudo confirmar.' })

    // 4) Grant the role server-side; the signup trigger always creates
    //    the profile as bartender.
    const { error: roleError } = await admin
      .from('profiles')
      .update({ role })
      .eq('id', createdId)
    if (roleError) {
      return json(500, { error: 'El usuario se creó pero no se le pudo asignar el rol.' })
    }

    // The trigger builds the profile; return it so the UI can show it.
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, full_name, role, created_at')
      .eq('id', createdId)
      .single()
    if (profileError || !profile) {
      return json(500, { error: 'El usuario se creó pero su perfil no quedó disponible.' })
    }

    return json(200, { user: profile })
  } catch (_error) {
    return json(500, { error: 'Error inesperado del servidor.' })
  }
})
