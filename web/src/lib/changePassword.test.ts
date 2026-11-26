import { describe, expect, it } from 'vitest'
import { validateChangePassword } from './changePassword'

const VALID = { current: 'actual123', next: 'nueva456', confirm: 'nueva456' }

describe('validateChangePassword', () => {
  it('accepts a valid change', () => {
    expect(validateChangePassword(VALID)).toEqual({})
  })

  it('requires the current password', () => {
    expect(validateChangePassword({ ...VALID, current: '' }).current).toBeTruthy()
    expect(validateChangePassword({ ...VALID, current: '   ' }).current).toBeTruthy()
  })

  it('requires the new password with at least 6 characters', () => {
    expect(validateChangePassword({ ...VALID, next: '' }).next).toBeTruthy()
    expect(validateChangePassword({ ...VALID, next: 'corta' }).next).toBeTruthy()
  })

  it('requires the confirmation to match the new password', () => {
    expect(validateChangePassword({ ...VALID, confirm: 'distinta' }).confirm).toBeTruthy()
  })
})
