import { describe, expect, it } from 'vitest'
import { filterProducts, matchesQuery } from './search'

describe('matchesQuery', () => {
  it('finds products ignoring case and accents', () => {
    expect(matchesQuery('Cerveza Rubia', 'cerv')).toBe(true)
    expect(matchesQuery('Café con leche', 'cafe')).toBe(true)
    expect(matchesQuery('Cerveza Rubia', 'RUBIA')).toBe(true)
  })

  it('rejects non-matching queries', () => {
    expect(matchesQuery('Cerveza Rubia', 'vino')).toBe(false)
  })

  it('matches everything when the query is empty', () => {
    expect(matchesQuery('Cerveza Rubia', '')).toBe(true)
    expect(matchesQuery('Cerveza Rubia', '   ')).toBe(true)
  })
})

describe('filterProducts', () => {
  const products = [
    { id: '1', name: 'Cerveza Rubia', price: 1500, active: true },
    { id: '2', name: 'Café con leche', price: 900, active: false },
  ]

  it('filters a product list by name', () => {
    expect(filterProducts(products, 'cafe')).toEqual([products[1]])
  })

  it('returns the full list when the query is empty', () => {
    expect(filterProducts(products, '')).toEqual(products)
  })
})
