import { describe, expect, it } from 'vitest'
import {
  editLinePrice,
  enqueueLine,
  lineAmount,
  validatePriceOverride,
  type NewTicketLine,
} from './comanda'

const VENTA: NewTicketLine = {
  productId: 'p1',
  name: 'Cerveza',
  price: 3,
  is_invitation: false,
  vipCustomerId: null,
  accountId: null,
}

function groupWithQty(qty: number): ReturnType<typeof enqueueLine> {
  let lines = enqueueLine([], VENTA)
  for (let i = 1; i < qty; i += 1) lines = enqueueLine(lines, VENTA)
  return lines
}

describe('editLinePrice', () => {
  it('sets the override on the whole pending group', () => {
    const lines = editLinePrice(groupWithQty(2), 'suelta|p1|venta|', 2.5)
    expect(lines[0].priceOverride).toBe(2.5)
    expect(lineAmount(lines[0])).toBe(5)
  })

  it('clears the override with null and returns to catalog price', () => {
    const lines = editLinePrice(groupWithQty(1), 'suelta|p1|venta|', 2)
    const cleared = editLinePrice(lines, 'suelta|p1|venta|', null)
    expect(cleared[0].priceOverride).toBeNull()
    expect(lineAmount(cleared[0])).toBe(3)
  })

  it('keeps the group key and quantity (editing never splits the group)', () => {
    const group = groupWithQty(2)
    const edited = editLinePrice(group, group[0].key, 2)
    expect(edited[0].key).toBe(group[0].key)
    expect(edited[0].qty).toBe(2)
  })
})

describe('validatePriceOverride', () => {
  it('accepts a decimal discount with dot or comma', () => {
    expect(validatePriceOverride(3, '2,5')).toEqual({ price: 2.5, error: null })
    expect(validatePriceOverride(3, '2.5')).toEqual({ price: 2.5, error: null })
  })

  it('requires a value', () => {
    expect(validatePriceOverride(3, '').error).toBeTruthy()
    expect(validatePriceOverride(3, '   ').error).toBeTruthy()
  })

  it('rejects a non-numeric price', () => {
    expect(validatePriceOverride(3, 'abc').error).toBeTruthy()
  })

  it('rejects zero and negatives: free is cortesía, not a discount', () => {
    expect(validatePriceOverride(3, '0').error).toBeTruthy()
    expect(validatePriceOverride(3, '-1').error).toBeTruthy()
  })

  it('rejects the catalog price itself and any surcharge (solo bajar)', () => {
    expect(validatePriceOverride(3, '3').error).toBeTruthy()
    expect(validatePriceOverride(3, '4').error).toBeTruthy()
  })
})
