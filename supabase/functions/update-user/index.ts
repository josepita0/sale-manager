// update-user — Edge Function: an admin edits an existing staff user.
//
// Same trust model as `create-user`: the browser only holds the anon
// key, so this function keeps the service_role key server-side. It:
//   1. verifies the caller is an authenticated `admin` profile;
//   2. validates the payload (id, full_name, role, optional password);
//   3. updates the profile (name + role) with the service client;
//   4. resets the password through the Auth Admin API when provided.
// The email (login identifier) is deliberately not editable.
// The admin cannot change their own role here — that avoids locking
// the only admin out (dashboard SQL or another admin can do it).
//
// Deploy: `supabase functions deploy update-user`

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_ROLES = ['admin', 'manager', 'bartender'] as const

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1) The caller must be a logged-in admin (platform JWT check only
    //    proves authentication; the role check is ours).
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
      return json(403, { error: 'Solo un administrador puede editar usuarios.' })
    }

    // 2) Payload validation.
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') return json(400, { error: 'Cuerpo inválido.' })

    const id = typeof body.id === 'string' ? body.id.trim().toLowerCase() : ''
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''
    const role = typeof body.role === 'string' ? body.role : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!UUID_RE.test(id)) return json(400, { error: 'El usuario a editar no es válido.' })
    if (!fullName) return json(400, { error: 'El nombre es obligatorio.' })
    if (!(VALID_ROLES as readonly string[]).includes(role)) {
      return json(400, { error: 'El rol no es válido.' })
    }
    if (password && password.length < 6) {
      return json(400, { error: 'La contraseña debe tener al menos 6 caracteres.' })
    }

    // Guard: the admin cannot change their own role (sole-admin lockout).
    if (id === caller.user.id && role !== callerProfile.role) {
      return json(400, { error: 'No podés cambiar tu propio rol. Hacelo desde el dashboard SQL o con otro admin.' })
    }

    // 3) The target must exist.
    const { data: target, error: targetError } = await admin
      .from('profiles')
      .select('id, full_name, role, created_at')
      .eq('id', id)
      .single()
    if (targetError || !target) return json(404, { error: 'No existe ese usuario.' })

    // 4) Update the profile (name + role) with the service client.
    const { data: updated, error: updateError } = await admin
      .from('profiles')
      .update({ full_name: fullName, role })
      .eq('id', id)
      .select('id, full_name, role, created_at')
      .single()
    if (updateError || !updated) {
      return json(400, { error: 'No se pudo actualizar el usuario: ' + (updateError?.message ?? 'error desconocido') })
    }

    // 5) Optional password reset through the Auth Admin API.
    if (password) {
      const { error: passwordError } = await admin.auth.admin.updateUserById(id, { password })
      if (passwordError) {
        return json(500, {
          error: 'Se guardaron los datos del perfil pero no se pudo cambiar la contraseña: ' + passwordError.message,
        })
      }
    }

    return json(200, { user: updated })
  } catch (_error) {
    return json(500, { error: 'Error inesperado del servidor.' })
  }
})
