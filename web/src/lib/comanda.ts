/**
 * Pending comanda (ticket) of the shift. Nothing here is persisted in
 * Postgres until the bartender registers the comanda / an account.
 * Lines are grouped by product + kind (venta/cortesía) + VIP + the
 * account they are being noted into, so tapping the same product twice
 * bumps the quantity instead of adding a row.
 */
export interface TicketLine {
  key: string
  productId: string
  name: string
  price: number
  is_invitation: boolean
  vipCustomerId: string | null
  accountId: string | null
  qty: number
}

export type NewTicketLine = Omit<TicketLine, 'key' | 'qty'>

const TICKET_PREFIX = 'nairas-ticket-'

export function ticketStorageKey(shiftId: string): string {
  return `${TICKET_PREFIX}${shiftId}`
}

function lineKey(item: NewTicketLine): string {
  return [
    item.accountId ?? 'suelta',
    item.productId,
    item.is_invitation ? 'cortesia' : 'venta',
    item.vipCustomerId ?? '',
  ].join('|')
}

export function enqueueLine(lines: TicketLine[], item: NewTicketLine): TicketLine[] {
  const key = lineKey(item)
  const existing = lines.find((line) => line.key === key)
  if (existing) {
    return lines.map((line) => (line.key === key ? { ...line, qty: line.qty + 1 } : line))
  }
  return [...lines, { ...item, key, qty: 1 }]
}

/** Money of one pending line; cortesías are worth 0. */
export function lineAmount(line: TicketLine): number {
  return line.is_invitation ? 0 : line.price * line.qty
}

export function linesTotal(lines: TicketLine[]): number {
  return lines.reduce((acc, line) => acc + lineAmount(line), 0)
}

export function looseLines(lines: TicketLine[]): TicketLine[] {
  return lines.filter((line) => line.accountId === null)
}

export function linesForAccount(lines: TicketLine[], accountId: string): TicketLine[] {
  return lines.filter((line) => line.accountId === accountId)
}

export function pendingCount(lines: TicketLine[]): number {
  return lines.reduce((acc, line) => acc + line.qty, 0)
}

function isTicketLine(value: unknown): value is TicketLine {
  if (typeof value !== 'object' || value === null) return false
  const line = value as Record<string, unknown>
  return (
    typeof line.key === 'string' &&
    typeof line.productId === 'string' &&
    typeof line.name === 'string' &&
    typeof line.price === 'number' &&
    typeof line.is_invitation === 'boolean' &&
    (typeof line.vipCustomerId === 'string' || line.vipCustomerId === null) &&
    (typeof line.accountId === 'string' || line.accountId === null) &&
    typeof line.qty === 'number' &&
    line.qty > 0
  )
}

export function serializeTicket(lines: TicketLine[]): string {
  return JSON.stringify(lines)
}

/** Tolerant reader: a corrupted or older ticket degrades to an empty comanda. */
export function parseTicket(raw: string | null): TicketLine[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isTicketLine)
  } catch {
    return []
  }
}

export function readTicket(storage: Storage, shiftId: string): TicketLine[] {
  return parseTicket(storage.getItem(ticketStorageKey(shiftId)))
}

/** Persists the comanda; an empty comanda clears the key. */
export function writeTicket(storage: Storage, shiftId: string, lines: TicketLine[]): void {
  const key = ticketStorageKey(shiftId)
  if (lines.length === 0) storage.removeItem(key)
  else storage.setItem(key, serializeTicket(lines))
}

/**
 * Sales that count for "recaudado en el turno": those not attached to an
 * account that is still open (loose sales and already-closed accounts do
 * count).
 */
export function visibleSales<T extends { account_id: string | null }>(
  sales: T[],
  openAccountIds: Set<string>,
): T[] {
  return sales.filter((sale) => sale.account_id === null || !openAccountIds.has(sale.account_id))
}
