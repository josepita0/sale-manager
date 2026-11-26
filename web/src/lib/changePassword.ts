/** Payload of the self-service password form in the account sheet. */
export interface ChangePasswordInput {
  current: string
  next: string
  confirm: string
}

export type ChangePasswordErrors = Partial<Record<'current' | 'next' | 'confirm', string>>

/** Field-level validation mirroring the project's password rules (min 6). */
export function validateChangePassword(input: ChangePasswordInput): ChangePasswordErrors {
  const errors: ChangePasswordErrors = {}
  if (!input.current.trim()) {
    errors.current = 'Ingresá tu contraseña actual.'
  }
  if (input.next.length < 6) {
    errors.next = 'La nueva contraseña debe tener al menos 6 caracteres.'
  }
  if (input.confirm !== input.next) {
    errors.confirm = 'Las contraseñas no coinciden.'
  }
  return errors
}
