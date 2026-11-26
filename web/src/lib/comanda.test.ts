import { describe, expect, it } from 'vitest'
import {
  enqueueLine,
  lineAmount,
  linesForAccount,
  linesTotal,
  looseLines,
  parseTicket,
  pendingCount,
  readTicket,
  serializeTicket,
  ticketStorageKey,
  visibleSales,
  writeTicket,
  type NewTicketLine,
  type TicketLine,
} from './comanda'

function item(overrides: Partial<NewTicketLine> = {}): NewTicketLine {
  return {
    productId: 'cerveza',
    name: 'Cerveza',
    price: 3500,
    priceOverride: null,
    is_invitation: false,
    vipCustomerId: null,
    accountId: null,
    ...overrides,
  }
}

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key)
    },
    setItem: (key, value) => {
      data.set(key, value)
    },
  }
}

describe('enqueueLine', () => {
  it('anota la primera unidad en la comanda suelta', () => {
    const lines = enqueueLine([], item())
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      productId: 'cerveza',
      name: 'Cerveza',
      price: 3500,
      priceOverride: null,
      is_invitation: false,
      vipCustomerId: null,
      accountId: null,
      qty: 1,
    })
  })

  it('suma cantidad cuando coinciden producto, tipo, VIP y cuenta', () => {
    let lines = enqueueLine([], item({ accountId: 'acc-1' }))
    lines = enqueueLine(lines, item({ accountId: 'acc-1' }))
    expect(lines).toHaveLength(1)
    expect(lines[0].qty).toBe(2)
  })

  it('no mezcla líneas de venta y cortesía del mismo producto', () => {
    let lines = enqueueLine([], item())
    lines = enqueueLine(lines, item({ is_invitation: true, vipCustomerId: 'vip-1' }))
    expect(lines).toHaveLength(2)
    expect(lines.map((l) => l.is_invitation)).toEqual([false, true])
  })

  it('no mezcla cuentas distintas ni clientes VIP distintos', () => {
    let lines = enqueueLine([], item())
    lines = enqueueLine(lines, item({ accountId: 'acc-1' }))
    lines = enqueueLine(lines, item({ accountId: 'acc-2' }))
    lines = enqueueLine(lines, item({ is_invitation: true, vipCustomerId: 'vip-1' }))
    lines = enqueueLine(lines, item({ is_invitation: true, vipCustomerId: 'vip-2' }))
    expect(lines).toHaveLength(5)
    expect(new Set(lines.map((l) => l.key)).size).toBe(5)
  })
})

describe('montos de la comanda', () => {
  it('una cortesía no suma dinero', () => {
    expect(lineAmount({ ...item({ is_invitation: true }), key: 'k', qty: 3 })).toBe(0)
    expect(lineAmount({ ...item({ price: 5000 }), key: 'k', qty: 2 })).toBe(10000)
  })

  it('el total pendiente suma solo las ventas', () => {
    const lines: TicketLine[] = [
      { ...item(), key: 'a', qty: 2 },
      { ...item({ is_invitation: true }), key: 'b', qty: 3 },
    ]
    expect(linesTotal(lines)).toBe(7000)
  })

  it('separa las líneas sueltas de las de cada cuenta', () => {
    const lines: TicketLine[] = [
      { ...item(), key: 'suelta', qty: 1 },
      { ...item({ accountId: 'acc-1' }), key: 'acc-1', qty: 2 },
      { ...item({ accountId: 'acc-2' }), key: 'acc-2', qty: 1 },
    ]
    expect(looseLines(lines).map((l) => l.key)).toEqual(['suelta'])
    expect(linesForAccount(lines, 'acc-1').map((l) => l.key)).toEqual(['acc-1'])
    expect(linesForAccount(lines, 'nope')).toEqual([])
  })

  it('cuenta los ítems pendientes de toda la comanda', () => {
    const lines: TicketLine[] = [
      { ...item(), key: 'a', qty: 2 },
      { ...item({ accountId: 'acc-1' }), key: 'b', qty: 3 },
    ]
    expect(pendingCount(lines)).toBe(5)
    expect(pendingCount([])).toBe(0)
  })
})

describe('persistencia de la comanda', () => {
  it('usa una clave por turno', () => {
    expect(ticketStorageKey('shift-1')).toBe('nairas-ticket-shift-1')
  })

  it('devuelve una comanda vacía ante datos inválidos', () => {
    expect(parseTicket(null)).toEqual([])
    expect(parseTicket('')).toEqual([])
    expect(parseTicket('no es json')).toEqual([])
    expect(parseTicket('{"a":1}')).toEqual([])
    expect(parseTicket('[{"key":"x"}]')).toEqual([])
  })

  it('hace roundtrip de un ticket válido y descarta líneas rotas', () => {
    const lines: TicketLine[] = [{ ...item(), key: 'k', qty: 2 }]
    const raw = serializeTicket(lines)
    expect(parseTicket(raw)).toEqual(lines)
    expect(parseTicket(JSON.stringify([...lines, { key: 'rota' }]))).toEqual(lines)
  })

  it('borra la clave cuando la comanda queda vacía y guarda cuando tiene líneas', () => {
    const storage = memoryStorage()
    const lines: TicketLine[] = [{ ...item(), key: 'k', qty: 1 }]
    writeTicket(storage, 'shift-1', lines)
    expect(readTicket(storage, 'shift-1')).toEqual(lines)
    writeTicket(storage, 'shift-1', [])
    expect(storage.getItem('nairas-ticket-shift-1')).toBeNull()
    expect(readTicket(storage, 'shift-1')).toEqual([])
  })
})

describe('visibleSales', () => {
  const sale = (id: string, account_id: string | null) => ({ id, account_id })

  it('excluye las ventas de cuentas abiertas y deja las cuentas cerradas', () => {
    const sales = [sale('suelta', null), sale('abierta', 'acc-1'), sale('cerrada', 'acc-2')]
    const visible = visibleSales(sales, new Set(['acc-1']))
    expect(visible.map((s) => s.id)).toEqual(['suelta', 'cerrada'])
  })
})
