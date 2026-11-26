import type { Role } from './types'

/** Payload the admin tab sends to the update-user edge function. */
export interface EditUserInput {
  id: string
  fullName: string
  role: Role | ''
  /** Empty string means "keep the current password". */
  password: string
}

export type EditUserErrors = Partial<Record<'id' | 'fullName' | 'role' | 'password', string>>

/** Same UUID shape the update-user edge function accepts. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Field-level validation mirroring the update-user edge function. */
export function validateEditUser(input: EditUserInput): EditUserErrors {
  const errors: EditUserErrors = {}
  const id = input.id.trim().toLowerCase()
  if (!id) {
    errors.id = 'El usuario a editar es obligatorio.'
  } else if (!UUID_RE.test(id)) {
    errors.id = 'El usuario a editar no es válido.'
  }
  if (!input.fullName.trim()) {
    errors.fullName = 'El nombre es obligatorio.'
  }
  if (input.role !== 'admin' && input.role !== 'manager' && input.role !== 'bartender') {
    errors.role = 'Elegí un rol.'
  }
  // An empty password means "no change"; a provided one keeps the raw length rule.
  if (input.password && input.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.'
  }
  return errors
}
