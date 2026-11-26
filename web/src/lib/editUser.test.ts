import { describe, expect, it } from 'vitest'
import { validateEditUser } from './editUser'
import type { Role } from './types'

const VALID = {
  id: '1d4f9a52-8c3b-4e27-9a01-2f6b7c8d9e0f',
  fullName: 'Ana Pérez',
  role: 'bartender' as Role,
  password: '',
}

describe('validateEditUser', () => {
  it('accepts a valid payload with an empty password (no change)', () => {
    expect(validateEditUser(VALID)).toEqual({})
  })

  it('accepts an uppercase UUID', () => {
    expect(validateEditUser({ ...VALID, id: VALID.id.toUpperCase() })).toEqual({})
  })

  it('requires the id', () => {
    expect(validateEditUser({ ...VALID, id: '' }).id).toBeTruthy()
    expect(validateEditUser({ ...VALID, id: '   ' }).id).toBeTruthy()
  })

  it('rejects a malformed id', () => {
    expect(validateEditUser({ ...VALID, id: 'abc' }).id).toBeTruthy()
    expect(validateEditUser({ ...VALID, id: VALID.id.slice(1) }).id).toBeTruthy()
  })

  it('requires the full name', () => {
    expect(validateEditUser({ ...VALID, fullName: '' }).fullName).toBeTruthy()
    expect(validateEditUser({ ...VALID, fullName: '   ' }).fullName).toBeTruthy()
  })

  it('requires a known role', () => {
    expect(validateEditUser({ ...VALID, role: '' }).role).toBeTruthy()
    expect(validateEditUser({ ...VALID, role: 'dueno' as Role }).role).toBeTruthy()
  })

  it('rejects uppercase and legacy role names', () => {
    expect(validateEditUser({ ...VALID, role: 'ADMIN' as Role }).role).toBeTruthy()
    expect(validateEditUser({ ...VALID, role: 'encargado' as Role }).role).toBeTruthy()
  })

  it('accepts every known role', () => {
    for (const role of ['admin', 'manager', 'bartender'] as const) {
      expect(validateEditUser({ ...VALID, role }).role).toBeUndefined()
    }
  })

  it('accepts an empty password (no change) but rejects a short one', () => {
    expect(validateEditUser({ ...VALID, password: '' }).password).toBeUndefined()
    expect(validateEditUser({ ...VALID, password: '12345' }).password).toBeTruthy()
  })

  it('accepts a password of 6 or more raw characters', () => {
    expect(validateEditUser({ ...VALID, password: '123456' }).password).toBeUndefined()
    expect(validateEditUser({ ...VALID, password: ' 1234 ' }).password).toBeUndefined()
  })

  it('reports every invalid field at once', () => {
    const errors = validateEditUser({ id: 'x', fullName: ' ', role: '', password: '1' })
    expect(Object.keys(errors).sort()).toEqual(['fullName', 'id', 'password', 'role'])
  })
})
