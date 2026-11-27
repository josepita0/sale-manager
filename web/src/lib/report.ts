import type { Account, SaleWithProduct } from './types'

export interface ReportLine {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
  /** Catalog price when this line was sold below catalog (price override). */
  catalogUnitPrice?: number
}

export interface ShiftReportData {
  /** Products sold during the shift, biggest subtotal first (effective prices). */
  sold: ReportLine[]
  /** Money collected at effective prices, cortesías excluded. */
  soldTotal: number
  /** Cortesías (gifted) lines, biggest quantity first. */
  invitations: ReportLine[]
  /** Total cortesías given away. */
  invitationsCount: number
  /** List value of the cortesías (price x quantity). */
  giftedValue: number
  /** Per-product price discounts: agreed price below the catalog snapshot. */
  adjusted: AdjustedLine[]
  /** Net money given away in price discounts (always ≥ 0). */
  discountTotal: number
}

/** One product sold below catalog price: the audit trail of a price override. */
export interface AdjustedLine {
  productId: string
  name: string
  quantity: number
  catalogUnitPrice: number
  effectiveUnitPrice: number
  /** (catalogUnitPrice - effectiveUnitPrice) x quantity, always > 0. */
  discount: number
}

/** One account's sales in the shift: the per-person report breakdown. */
export interface AccountReport {
  accountId: string
  accountName: string
  /** Product lines sold into the account, biggest subtotal first. */
  lines: ReportLine[]
  /** Money of the account at effective prices, cortesías valued as gifted. */
  subtotal: number
}

/**
 * Per-account breakdown of a shift's sales: which person was sold
 * which specific products. Loose comanda sales (account_id null) and
 * accounts without sales never appear. Cortesías keep their list price;
 * a sold line's override pins its price and keeps the catalog snapshot
 * for the strikethrough, matching the shift report's semantics.
 */
export function buildAccountReport(
  sales: SaleWithProduct[],
  accounts: Pick<Account, 'id' | 'name'>[],
): AccountReport[] {
  const names = new Map(accounts.map((a) => [a.id, a.name]))
  const byAccount = new Map<string, Map<string, ReportLine>>()

  for (const sale of sales) {
    if (sale.account_id === null) continue
    let lines = byAccount.get(sale.account_id)
    if (!lines) {
      lines = new Map()
      byAccount.set(sale.account_id, lines)
    }
    const effective = sale.is_invitation ? sale.unit_price : (sale.price_override ?? sale.unit_price)
    const line = lines.get(sale.product_id) ?? {
      productId: sale.product_id,
      name: sale.products.name,
      quantity: 0,
      unitPrice: effective,
      subtotal: 0,
    }
    line.quantity += sale.quantity
    line.subtotal += sale.quantity * effective
    line.unitPrice = effective
    if (!sale.is_invitation && sale.price_override !== null) {
      line.catalogUnitPrice = sale.unit_price
    }
    lines.set(sale.product_id, line)
  }

  return [...byAccount.entries()]
    .map(([accountId, lines]) => {
      const sorted = [...lines.values()].sort((a, b) => b.subtotal - a.subtotal)
      return {
        accountId,
        accountName: names.get(accountId) ?? 'Cuenta',
        lines: sorted,
        subtotal: sorted.reduce((acc, l) => acc + l.subtotal, 0),
      }
    })
    .sort((a, b) => b.subtotal - a.subtotal)
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
  const adjustedMap = new Map<string, AdjustedLine>()

  for (const sale of sales) {
    const target = sale.is_invitation ? invitationMap : soldMap
    // The override pins the sale price; without one, the catalog snapshot rules.
    // Cortesías keep their list price: the report values them as gifted.
    const effective = sale.price_override ?? sale.unit_price
    const line = target.get(sale.product_id) ?? {
      productId: sale.product_id,
      name: sale.products.name,
      quantity: 0,
      unitPrice: sale.unit_price,
      subtotal: 0,
    }
    line.quantity += sale.quantity
    line.subtotal += sale.quantity * effective
    line.unitPrice = effective
    if (!sale.is_invitation && sale.price_override !== null) {
      line.catalogUnitPrice = sale.unit_price
    }
    target.set(sale.product_id, line)

    if (!sale.is_invitation && sale.price_override !== null && sale.price_override < sale.unit_price) {
      // One row per distinct (product, catalog price, agreed price): a row must
      // always reconcile quantity x prices with its stated discount.
      const adjustedKey = `${sale.product_id}|${sale.unit_price}|${sale.price_override}`
      const adjusted = adjustedMap.get(adjustedKey) ?? {
        productId: sale.product_id,
        name: sale.products.name,
        quantity: 0,
        catalogUnitPrice: sale.unit_price,
        effectiveUnitPrice: sale.price_override,
        discount: 0,
      }
      adjusted.quantity += sale.quantity
      adjusted.discount += sale.quantity * (sale.unit_price - sale.price_override)
      adjustedMap.set(adjustedKey, adjusted)
    }
  }

  const sold = [...soldMap.values()].sort((a, b) => b.subtotal - a.subtotal)
  const invitations = [...invitationMap.values()].sort((a, b) => b.quantity - a.quantity)
  const adjusted = [...adjustedMap.values()].sort((a, b) => b.discount - a.discount)

  return {
    sold,
    soldTotal: sold.reduce((acc, l) => acc + l.subtotal, 0),
    invitations,
    invitationsCount: invitations.reduce((acc, l) => acc + l.quantity, 0),
    giftedValue: invitations.reduce((acc, l) => acc + l.subtotal, 0),
    adjusted,
    discountTotal: adjusted.reduce((acc, l) => acc + l.discount, 0),
  }
}
