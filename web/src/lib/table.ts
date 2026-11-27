import { matchesQuery } from './search'

/**
 * One named filter of a table: the UI picks a value from `values`
 * ('' means off) and `predicate` decides which rows survive.
 */
export interface TableFilterDef<T> {
  id: string
  predicate: (row: T, value: string) => boolean
}

export interface TableSpec<T> {
  /** Fields the free-text search covers; matches if any field matches. */
  searchFields?: (row: T) => (string | undefined)[]
  filters?: TableFilterDef<T>[]
}

export interface TableQuery {
  query?: string
  /** Filter id -> selected value ('' = off). */
  filters?: Record<string, string>
}

/**
 * Applies the free-text search (accent/case-insensitive, same
 * normalizer as the product search) and every active named filter,
 * combined with AND. An empty query or filter value means "off".
 */
export function filterRows<T>(rows: T[], spec: TableSpec<T>, q: TableQuery): T[] {
  const query = (q.query ?? '').trim()
  const activeFilters = q.filters ?? {}
  return rows.filter((row) => {
    if (query) {
      const fields = (spec.searchFields?.(row) ?? []).filter(
        (field): field is string => Boolean(field),
      )
      if (!fields.some((field) => matchesQuery(field, query))) return false
    }
    for (const def of spec.filters ?? []) {
      const value = activeFilters[def.id]
      if (!value) continue
      if (!def.predicate(row, value)) return false
    }
    return true
  })
}

export interface Page<T> {
  pageRows: T[]
  /** 1-based page actually shown (clamped into range). */
  page: number
  total: number
  pageCount: number
  /** First and last row numbers shown on this page (0-0 when empty). */
  start: number
  end: number
}

/** Slices rows into a 1-based page, clamping the page into range. */
export function paginate<T>(rows: T[], page: number, pageSize: number): Page<T> {
  const total = rows.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), pageCount)
  const startIdx = (safePage - 1) * pageSize
  return {
    pageRows: rows.slice(startIdx, startIdx + pageSize),
    page: safePage,
    total,
    pageCount,
    start: total === 0 ? 0 : startIdx + 1,
    end: Math.min(startIdx + pageSize, total),
  }
}

/**
 * Pager buttons for a page count: every number while there are few,
 * otherwise 1 and the last page plus the current page and its
 * neighbours, with '…' filling the gaps.
 */
export function pageButtons(page: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const wanted = new Set(
    [1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount),
  )
  const out: (number | '…')[] = []
  let prev = 0
  for (let n = 1; n <= pageCount; n++) {
    if (!wanted.has(n)) continue
    if (prev && n - prev > 1) out.push('…')
    out.push(n)
    prev = n
  }
  return out
}
