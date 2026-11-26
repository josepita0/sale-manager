import { describe, expect, it } from 'vitest'
import { validateChangePassword } from './changePassword'
import { validateNewUser } from './newUser'
import { validateEditUser } from './editUser'

describe('validateChangePassword boundary probes', () => {
  it('accepts exactly 6 characters and rejects 5 (min-6 boundary)', () => {
    expect(validateChangePassword({ current: 'actual', next: '123456', confirm: '123456' })).toEqual({})
    expect(validateChangePassword({ current: 'actual', next: '12345', confirm: '12345' }).next).toBe(
      'La nueva contraseña debe tener al menos 6 caracteres.',
    )
  })

  it('reports the exact error texts for every field', () => {
    expect(validateChangePassword({ current: ' ', next: '123456', confirm: '123456' }).current).toBe(
      'Ingresá tu contraseña actual.',
    )
    expect(
      validateChangePassword({ current: 'actual', next: '123456', confirm: 'otra' }).confirm,
    ).toBe('Las contraseñas no coinciden.')
  })

  it('does not flag confirm when both new and confirm are empty (the next rule reports it)', () => {
    const errors = validateChangePassword({ current: 'actual', next: '', confirm: '' })
    expect(errors.confirm).toBeUndefined()
    expect(errors.next).toBeTruthy()
  })

  it('keeps the min-6 rule consistent with the admin validators (new/edit user)', () => {
    const short = '12345'
    const ok = '123456'
    expect(
      validateChangePassword({ current: 'actual', next: short, confirm: short }).next,
    ).toBeTruthy()
    expect(validateNewUser({ email: 'a@b.co', fullName: 'X', role: 'bartender', password: short }).password).toBeTruthy()
    expect(validateEditUser({ id: '00000000-0000-0000-0000-000000000000', fullName: 'X', role: 'bartender', password: short }).password).toBeTruthy()
    expect(
      validateChangePassword({ current: 'actual', next: ok, confirm: ok }).next,
    ).toBeUndefined()
    expect(validateNewUser({ email: 'a@b.co', fullName: 'X', role: 'bartender', password: ok }).password).toBeUndefined()
    expect(validateEditUser({ id: '00000000-0000-0000-0000-000000000000', fullName: 'X', role: 'bartender', password: ok }).password).toBeUndefined()
  })
})
