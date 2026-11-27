import { useState, type ReactNode } from 'react'
import { filterRows, pageButtons, paginate, type TableFilterDef, type TableSpec } from '../lib/table'

export interface DataTableColumn<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  /** Right-aligned (prices, counts). */
  numeric?: boolean
}

/** A named filter with the chip labels the UI offers. */
export interface DataTableFilter<T> extends TableFilterDef<T> {
  label: string
  options: { value: string; label: string }[]
}

interface Props<T> {
  /** null = loading (skeleton). */
  rows: T[] | null
  rowKey: (row: T) => string
  columns: DataTableColumn<T>[]
  searchFields: (row: T) => (string | undefined)[]
  searchPlaceholder: string
  filters?: DataTableFilter<T>[]
  pageSize?: number
  /** Message when the source list itself is empty. */
  emptyCatalog: string
  renderActions?: (row: T) => ReactNode
}

const thClass =
  'px-1 py-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-tinta-suave border-b-2 border-dashed border-hair-fuerte'
const tdClass = 'px-1 py-2 border-b border-dashed border-hair text-tinta'

/**
 * Reusable table for catalog-style views (Productos, VIP, Usuarios and
 * future lists): free-text search, named filter chips, and pagination
 * with a range counter, following the "tabla con paginación" artboard.
 * Views declare columns, search fields and filters; this component
 * owns search, filtering, paging and the empty states. Data stays
 * client-side today; swapping in Supabase .ilike()/.range() later
 * changes the rows source, not this API.
 */
export function DataTable<T>({
  rows,
  rowKey,
  columns,
  searchFields,
  searchPlaceholder,
  filters = [],
  pageSize = 8,
  emptyCatalog,
  renderActions,
}: Props<T>) {
  const [query, setQuery] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)

  const spec: TableSpec<T> = { searchFields, filters }
  const filtered = rows === null ? [] : filterRows(rows, spec, { query, filters: filterValues })
  const { pageRows, page: safePage, total, pageCount, start, end } = paginate(filtered, page, pageSize)

  function setFilter(id: string, value: string) {
    setFilterValues((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="h-11 w-full rounded-lg border border-hair-fuerte bg-papel px-3.5 text-[15px] text-tinta placeholder:text-tinta-suave/70"
      />

      {filters.map((filter) => (
        <div
          key={filter.id}
          role="group"
          aria-label={filter.label}
          className="mt-3 flex overflow-hidden rounded-lg border-[1.5px] border-tinta"
        >
          {filter.options.map((option) => {
            const isOn = (filterValues[filter.id] ?? '') === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isOn}
                onClick={() => setFilter(filter.id, option.value)}
                className={`min-h-9 flex-1 px-2 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                  isOn ? 'bg-tinta text-carta' : 'text-tinta-suave hover:text-tinta'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      ))}

      <div className="mt-3.5">
        {rows === null ? (
          <div className="space-y-2 py-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-hair/40" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-3 text-sm text-tinta-suave">{emptyCatalog}</p>
        ) : filtered.length === 0 ? (
          <p className="py-3 text-sm text-tinta-suave">
            {query
              ? `Ningún resultado para “${query}”.`
              : 'Ningún resultado con los filtros aplicados.'}
          </p>
        ) : (
          <>
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`${thClass} ${column.numeric ? 'text-right' : ''}`}
                    >
                      {column.header}
                    </th>
                  ))}
                  {renderActions && (
                    <th scope="col" className={`${thClass} text-right`}>
                      <span className="sr-only">Acciones</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={rowKey(row)}>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`${tdClass} ${column.numeric ? 'text-right font-mono tabular-nums' : ''}`}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                    {renderActions && <td className={`${tdClass} text-right`}>{renderActions(row)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {pageCount > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-[11.5px] tabular-nums text-tinta-suave">
                  {start}–{end} de {total}
                </span>
                <div className="flex gap-1.5" role="navigation" aria-label="Páginas">
                  {pageButtons(safePage, pageCount).map((button, index) =>
                    button === '…' ? (
                      <span
                        key={`gap-${index}`}
                        aria-hidden="true"
                        className="flex h-7 min-w-7 items-center justify-center text-xs text-tinta-suave"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={button}
                        type="button"
                        aria-current={button === safePage ? 'page' : undefined}
                        aria-label={`Página ${button}`}
                        onClick={() => setPage(button)}
                        className={`h-7 min-w-7 rounded-md border-[1.5px] px-1 text-xs font-semibold ${
                          button === safePage
                            ? 'border-tinta bg-tinta text-carta'
                            : 'border-hair-fuerte text-tinta-suave hover:text-tinta'
                        }`}
                      >
                        {button}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
