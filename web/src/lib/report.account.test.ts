import { describe, expect, it } from 'vitest'
import { buildAccountReport } from './report'
import type { Account, SaleWithProduct } from './types'

const account = (id: string, name: string): Account => ({
  id,
  shift_id: 'shift-1',
  name,
  vip_customer_id: null,
  status: 'open',
  created_at: '',
})

const sale = (
  overrides: Partial<SaleWithProduct> & { id: string; product_id: string },
): SaleWithProduct => ({
  shift_id: 'shift-1',
  quantity: 1,
  unit_price: 1000,
  is_invitation: false,
  vip_customer_id: null,
  price_override: null,
  account_id: null,
  created_at: '',
  products: { name: 'Producto', price: 1000 },
  ...overrides,
})

describe('buildAccountReport', () => {
  const accounts = [account('a1', 'Mesa 3'), account('a2', 'Cumpleaños Ana')]

  it('groups account sales per account with their specific products', () => {
    const sales = [
      sale({ id: 's1', product_id: 'p1', account_id: 'a1', unit_price: 1500, products: { name: 'Cerveza', price: 1500 } }),
      sale({
        id: 's2',
        product_id: 'p1',
        quantity: 2,
        account_id: 'a1',
        unit_price: 1500,
        products: { name: 'Cerveza', price: 1500 },
      }),
      sale({ id: 's3', product_id: 'p2', account_id: 'a2', unit_price: 2000, products: { name: 'Papas', price: 2000 } }),
    ]
    const report = buildAccountReport(sales, accounts)
    expect(report).toHaveLength(2)
    const mesa3 = report.find((a) => a.accountId === 'a1')
    expect(mesa3?.accountName).toBe('Mesa 3')
    expect(mesa3?.lines).toEqual([
      { productId: 'p1', name: 'Cerveza', quantity: 3, unitPrice: 1500, subtotal: 4500 },
    ])
    expect(mesa3?.subtotal).toBe(4500)
    const ana = report.find((a) => a.accountId === 'a2')
    expect(ana?.lines).toEqual([
      { productId: 'p2', name: 'Papas', quantity: 1, unitPrice: 2000, subtotal: 2000 },
    ])
  })

  it('never includes loose comanda sales (no account)', () => {
    const sales = [sale({ id: 's1', product_id: 'p1', products: { name: 'Cerveza', price: 1500 } })]
    expect(buildAccountReport(sales, accounts)).toEqual([])
  })

  it('omits accounts without sales and applies the price override to sold lines', () => {
    const sales = [
      sale({
        id: 's1',
        product_id: 'p1',
        account_id: 'a2',
        unit_price: 3000,
        price_override: 2500,
        products: { name: 'Cerveza', price: 3000 },
      }),
    ]
    const report = buildAccountReport(sales, accounts)
    expect(report.map((a) => a.accountId)).toEqual(['a2'])
    expect(report[0].lines).toEqual([
      {
        productId: 'p1',
        name: 'Cerveza',
        quantity: 1,
        unitPrice: 2500,
        subtotal: 2500,
        catalogUnitPrice: 3000,
      },
    ])
  })

  it('values an account cortesía at list price (override ignored)', () => {
    const sales = [
      sale({
        id: 's1',
        product_id: 'p1',
        account_id: 'a1',
        is_invitation: true,
        unit_price: 3000,
        price_override: 2500,
        products: { name: 'Cerveza', price: 3000 },
      }),
    ]
    const report = buildAccountReport(sales, accounts)
    expect(report[0].lines).toEqual([
      { productId: 'p1', name: 'Cerveza', quantity: 1, unitPrice: 3000, subtotal: 3000 },
    ])
  })
})
