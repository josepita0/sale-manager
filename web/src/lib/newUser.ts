import type { Role } from './types'

/** Payload the admin tab sends to the create-user edge function. */
export interface NewUserInput {
  email: string
  fullName: string
  role: Role | ''
  password: string
}

export type NewUserErrors = Partial<Record<'email' | 'fullName' | 'role' | 'password', string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Field-level validation mirroring the create-user edge function. */
export function validateNewUser(input: NewUserInput): NewUserErrors {
  const errors: NewUserErrors = {}
  const email = input.email.trim().toLowerCase()
  if (!email) {
    errors.email = 'El email es obligatorio.'
  } else if (!EMAIL_RE.test(email)) {
    errors.email = 'El email no es válido.'
  }
  if (!input.fullName.trim()) {
    errors.fullName = 'El nombre es obligatorio.'
  }
  if (input.role !== 'admin' && input.role !== 'manager' && input.role !== 'bartender') {
    errors.role = 'Elegí un rol.'
  }
  if (input.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.'
  }
  return errors
}
