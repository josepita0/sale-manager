import { describe, expect, it } from 'vitest'
import { validateNewUser } from './newUser'
import type { Role } from './types'

const VALID = {
  email: 'Ana@Example.COM',
  fullName: 'Ana Pérez',
  role: 'bartender' as Role,
  password: 'secreta',
}

describe('validateNewUser', () => {
  it('accepts an email with surrounding spaces or mixed case', () => {
    expect(validateNewUser({ ...VALID, email: '  Ana@Example.COM ' })).toEqual({})
  })

  it('requires an email', () => {
    expect(validateNewUser({ ...VALID, email: '   ' }).email).toBeTruthy()
  })

  it('rejects a malformed email', () => {
    expect(validateNewUser({ ...VALID, email: 'ana-sin-arroba' }).email).toBeTruthy()
  })

  it('requires the full name', () => {
    expect(validateNewUser({ ...VALID, fullName: '   ' }).fullName).toBeTruthy()
  })

  it('requires a known role', () => {
    expect(validateNewUser({ ...VALID, role: '' }).role).toBeTruthy()
    expect(validateNewUser({ ...VALID, role: 'dueno' as Role }).role).toBeTruthy()
  })

  it('requires a password of at least 6 characters', () => {
    expect(validateNewUser({ ...VALID, password: '12345' }).password).toBeTruthy()
    expect(validateNewUser({ ...VALID, password: '123456' }).password).toBeUndefined()
  })
})
