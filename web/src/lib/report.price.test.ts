import { describe, expect, it } from 'vitest'
import { buildShiftReport } from './report'
import type { SaleWithProduct } from './types'
// price_override is pinned in the helper so Partial spreads can't make it undefined.

function sale(overrides: Partial<SaleWithProduct>): SaleWithProduct {
  const base: SaleWithProduct = {
    id: 's1',
    shift_id: 'sh1',
    product_id: 'p1',
    quantity: 1,
    unit_price: 3,
    is_invitation: false,
    vip_customer_id: null,
    account_id: null,
    created_at: '2026-01-01T00:00:00Z',
    price_override: null,
    products: { name: 'Cerveza', price: 3 },
  }
  return { ...base, ...overrides, price_override: overrides.price_override ?? null }
}

describe('buildShiftReport with price overrides', () => {
  it('totals collected money at the effective (overridden) price', () => {
    const report = buildShiftReport([sale({ quantity: 2, price_override: 2 })])
    expect(report.sold[0].unitPrice).toBe(2)
    expect(report.sold[0].subtotal).toBe(4)
    expect(report.soldTotal).toBe(4)
  })

  it('reports the discount per product against the catalog snapshot', () => {
    const report = buildShiftReport([sale({ quantity: 3, price_override: 2 })])
    expect(report.adjusted).toEqual([
      {
        productId: 'p1',
        name: 'Cerveza',
        quantity: 3,
        catalogUnitPrice: 3,
        effectiveUnitPrice: 2,
        discount: 3,
      },
    ])
    expect(report.discountTotal).toBe(3)
  })

  it('keeps normal sales out of the adjustments and in full-price totals', () => {
    const report = buildShiftReport([
      sale({ quantity: 2, price_override: 2 }),
      sale({ id: 's2', quantity: 1 }),
    ])
    expect(report.adjusted).toHaveLength(1)
    expect(report.soldTotal).toBe(4 + 3)
    expect(report.discountTotal).toBe(2)
  })

  it('never counts cortesías as discounts', () => {
    const report = buildShiftReport([sale({ is_invitation: true, price_override: 2 })])
    expect(report.adjusted).toEqual([])
    expect(report.discountTotal).toBe(0)
  })
})
