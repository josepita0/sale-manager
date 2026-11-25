import { describe, expect, it } from 'vitest'
import { buildShiftReport } from './report'
import type { SaleWithProduct } from './types'

function makeSale(overrides: Partial<SaleWithProduct> & { product_id: string }): SaleWithProduct {
  const { product_id, ...rest } = overrides
  return {
    id: `sale-${product_id}-${Math.random().toString(36).slice(2)}`,
    shift_id: 'shift-1',
    product_id,
    quantity: 1,
    unit_price: 1000,
    created_at: '2024-01-01T00:00:00Z',
    products: { name: 'Producto', price: 1000, is_invitation: false },
    ...rest,
  }
}

describe('buildShiftReport', () => {
  it('reporte vacío cuando no hay ventas', () => {
    const report = buildShiftReport([])
    expect(report.sold).toEqual([])
    expect(report.soldTotal).toBe(0)
    expect(report.invitations).toEqual([])
    expect(report.invitationsCount).toBe(0)
    expect(report.giftedValue).toBe(0)
  })

  it('agrupa cantidades por producto y calcula subtotales y total', () => {
    const report = buildShiftReport([
      makeSale({ product_id: 'cerveza', products: { name: 'Cerveza', price: 3500, is_invitation: false }, quantity: 3, unit_price: 3500 }),
      makeSale({ product_id: 'gin', products: { name: 'Gin Tonic', price: 5500, is_invitation: false }, quantity: 1, unit_price: 5500 }),
      makeSale({ product_id: 'cerveza', products: { name: 'Cerveza', price: 3500, is_invitation: false }, quantity: 2, unit_price: 3500 }),
    ])
    expect(report.sold).toHaveLength(2)
    const cerveza = report.sold.find((l) => l.name === 'Cerveza')
    expect(cerveza?.quantity).toBe(5)
    expect(cerveza?.subtotal).toBe(17500)
    const gin = report.sold.find((l) => l.name === 'Gin Tonic')
    expect(gin?.quantity).toBe(1)
    expect(gin?.subtotal).toBe(5500)
    expect(report.soldTotal).toBe(23000)
    expect(report.invitationsCount).toBe(0)
  })

  it('separa las cortesías de las ventas y calcula el valor regalado', () => {
    const report = buildShiftReport([
      makeSale({ product_id: 'cerveza', products: { name: 'Cerveza', price: 3500, is_invitation: false }, quantity: 2, unit_price: 3500 }),
      makeSale({ product_id: 'cortesia-trago', products: { name: 'Cortesía Trago', price: 5000, is_invitation: true }, quantity: 1, unit_price: 5000 }),
      makeSale({ product_id: 'cortesia-cerveza', products: { name: 'Cortesía Cerveza', price: 3500, is_invitation: true }, quantity: 2, unit_price: 3500 }),
    ])
    expect(report.sold).toHaveLength(1)
    expect(report.soldTotal).toBe(7000)
    expect(report.invitations).toHaveLength(2)
    expect(report.invitationsCount).toBe(3)
    expect(report.giftedValue).toBe(12000)
  })

  it('usa el precio registrado en cada venta cuando cambió a mitad del turno', () => {
    const report = buildShiftReport([
      makeSale({ product_id: 'cerveza', products: { name: 'Cerveza', price: 3500, is_invitation: false }, quantity: 2, unit_price: 3000 }),
      makeSale({ product_id: 'cerveza', products: { name: 'Cerveza', price: 3500, is_invitation: false }, quantity: 1, unit_price: 3500 }),
    ])
    const cerveza = report.sold[0]
    expect(cerveza.quantity).toBe(3)
    expect(cerveza.subtotal).toBe(9500)
    expect(cerveza.unitPrice).toBe(3500)
    expect(report.soldTotal).toBe(9500)
  })
})
