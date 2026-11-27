import { describe, expect, it } from 'vitest'
import { filterRows, pageButtons, paginate } from './table'

interface Row {
  name: string
  active: boolean
}

const rows: Row[] = [
  { name: 'Cerveza Rubia', active: true },
  { name: 'Café con leche', active: false },
  { name: 'Vino Tinto', active: true },
]

const spec = {
  searchFields: (r: Row) => [r.name],
  filters: [
    {
      id: 'estado',
      predicate: (r: Row, v: string) => (v === 'activa' ? r.active : v === 'inactiva' ? !r.active : true),
    },
  ],
}

describe('filterRows', () => {
  it('searches across fields ignoring case and accents', () => {
    expect(filterRows(rows, spec, { query: 'cafe' })).toEqual([rows[1]])
    expect(filterRows(rows, spec, { query: 'RUBIA' })).toEqual([rows[0]])
  })

  it('combines search and named filters with AND', () => {
    expect(filterRows(rows, spec, { query: 'vino', filters: { estado: 'activa' } })).toEqual([rows[2]])
    expect(filterRows(rows, spec, { filters: { estado: 'inactiva' } })).toEqual([rows[1]])
  })

  it('treats an empty query or filter value as off', () => {
    expect(filterRows(rows, spec, { filters: { estado: '' } })).toEqual(rows)
    expect(filterRows(rows, spec, { query: '' })).toEqual(rows)
  })
})

describe('paginate', () => {
  const big = Array.from({ length: 21 }, (_, i) => i)

  it('slices the page and reports 1-based ranges', () => {
    const p = paginate(big, 2, 8)
    expect(p.pageRows).toEqual([8, 9, 10, 11, 12, 13, 14, 15])
    expect(p).toMatchObject({ page: 2, total: 21, pageCount: 3, start: 9, end: 16 })
  })

  it('clamps an out-of-range page to the last valid one', () => {
    const p = paginate(big, 99, 8)
    expect(p.page).toBe(3)
    expect(p.pageRows).toEqual([16, 17, 18, 19, 20])
    expect(p.start).toBe(17)
    expect(p.end).toBe(21)
  })

  it('handles empty lists', () => {
    expect(paginate([], 1, 8)).toMatchObject({ pageRows: [], total: 0, pageCount: 1, start: 0, end: 0 })
  })
})

describe('pageButtons', () => {
  it('lists every page when there are few', () => {
    expect(pageButtons(2, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('windows around the current page with ellipses', () => {
    expect(pageButtons(1, 10)).toEqual([1, 2, '…', 10])
    expect(pageButtons(5, 10)).toEqual([1, '…', 4, 5, 6, '…', 10])
    expect(pageButtons(10, 10)).toEqual([1, '…', 9, 10])
  })
})
