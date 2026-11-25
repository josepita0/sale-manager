export type Role = 'bartender' | 'encargado'

export interface Profile {
  id: string
  full_name: string
  role: Role
}

export interface Product {
  id: string
  name: string
  price: number
  is_invitation: boolean
  active: boolean
}

export interface Shift {
  id: string
  bartender_id: string
  started_at: string
  ended_at: string | null
  status: 'open' | 'closed'
}

export interface Sale {
  id: string
  shift_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
}

/** Sale row with its product embedded (PostgREST select). */
export interface SaleWithProduct extends Sale {
  products: Pick<Product, 'name' | 'price' | 'is_invitation'>
}

/** Shift row with bartender name and its sales embedded. */
export interface ShiftWithDetails extends Shift {
  profiles: { full_name: string } | null
  sales: SaleWithProduct[]
}
