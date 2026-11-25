import type { SaleWithProduct } from './types'

export interface ReportLine {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface ShiftReportData {
  /** Products sold during the shift, biggest subtotal first. */
  sold: ReportLine[]
  /** Money collected, cortesías excluded. */
  soldTotal: number
  /** Cortesías (gifted) lines, biggest quantity first. */
  invitations: ReportLine[]
  /** Total cortesías given away. */
  invitationsCount: number
  /** List value of the cortesías (price x quantity). */
  giftedValue: number
}

/**
 * Aggregates the raw sale rows of one shift into report lines.
 * Cortesías are classified from the sale-level snapshot
 * (sale.is_invitation, taken at insert time), so later edits to the
 * product catalog never retroactively reclassify past sales.
 * Each sale keeps its own unit_price snapshot, so price changes
 * mid-shift are respected row by row.
 */
export function buildShiftReport(sales: SaleWithProduct[]): ShiftReportData {
  const soldMap = new Map<string, ReportLine>()
  const invitationMap = new Map<string, ReportLine>()

  for (const sale of sales) {
    const target = sale.is_invitation ? invitationMap : soldMap
    const line = target.get(sale.product_id) ?? {
      productId: sale.product_id,
      name: sale.products.name,
      quantity: 0,
      unitPrice: sale.unit_price,
      subtotal: 0,
    }
    line.quantity += sale.quantity
    line.subtotal += sale.quantity * sale.unit_price
    line.unitPrice = sale.unit_price
    target.set(sale.product_id, line)
  }

  const sold = [...soldMap.values()].sort((a, b) => b.subtotal - a.subtotal)
  const invitations = [...invitationMap.values()].sort((a, b) => b.quantity - a.quantity)

  return {
    sold,
    soldTotal: sold.reduce((acc, l) => acc + l.subtotal, 0),
    invitations,
    invitationsCount: invitations.reduce((acc, l) => acc + l.quantity, 0),
    giftedValue: invitations.reduce((acc, l) => acc + l.subtotal, 0),
  }
}
