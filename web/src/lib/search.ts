// Normalize a string for search: lowercase and strip diacritics,
// so "cafe" matches "Café con leche".
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

// True when the query is empty (no filtering) or appears in the text.
export function matchesQuery(text: string, query: string): boolean {
  const needle = normalize(query).trim()
  if (!needle) return true
  return normalize(text).includes(needle)
}

// Filter a list of named items (products, etc.) by a free-text query.
export function filterProducts<T extends { name: string }>(items: T[], query: string): T[] {
  return items.filter((item) => matchesQuery(item.name, query))
}
