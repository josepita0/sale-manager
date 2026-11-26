import { describe, expect, it } from 'vitest'
import { validateEditUser } from './editUser'
import type { Role } from './types'

const ID = '1d4f9a52-8c3b-4e27-9a01-2f6b7c8d9e0f'
const V = { id: ID, fullName: 'Ana', role: 'bartender' as Role, password: '' }

// Boundary probes from the independent verifier (S17/S18).
describe('validateEditUser boundaries (S17/S18)', () => {
  it('rejects 32-hex id without hyphens and overlong id', () => {
    expect(validateEditUser({ ...V, id: ID.replace(/-/g, '') }).id).toBeTruthy()
    expect(validateEditUser({ ...V, id: ID + '0' }).id).toBeTruthy()
  })
  it('accepts id with surrounding whitespace and nil UUID shape', () => {
    expect(validateEditUser({ ...V, id: '  ' + ID.toUpperCase() + '  ' })).toEqual({})
    expect(validateEditUser({ ...V, id: '00000000-0000-0000-0000-000000000000' })).toEqual({})
  })
  it('password boundary: 5 rejected, 6 accepted, raw length (no trim)', () => {
    expect(validateEditUser({ ...V, password: 'abcde' }).password).toBeTruthy()
    expect(validateEditUser({ ...V, password: 'abcdef' }).password).toBeUndefined()
    expect(validateEditUser({ ...V, password: '      ' }).password).toBeUndefined()
    expect(validateEditUser({ ...V, password: ' abcd ' }).password).toBeUndefined()
  })
  it('rejects mixed-case and unknown roles; accepts all three lowercase', () => {
    for (const r of ['Manager', 'BARTENDER', 'admin ', 'encargado', '']) {
      expect(validateEditUser({ ...V, role: r as Role }).role).toBeTruthy()
    }
    for (const r of ['admin', 'manager', 'bartender'] as const) {
      expect(validateEditUser({ ...V, role: r }).role).toBeUndefined()
    }
  })
  it('rejects whitespace-only name and id', () => {
    expect(validateEditUser({ ...V, fullName: '\t \n' }).fullName).toBeTruthy()
    expect(validateEditUser({ ...V, id: '   ' }).id).toBeTruthy()
  })
})
