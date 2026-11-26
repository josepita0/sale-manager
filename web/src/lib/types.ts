export type Role = 'admin' | 'manager' | 'bartender'

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  manager: 'Encargado',
  bartender: 'Bartender',
}

export interface Profile {
  id: string
  full_name: string
  role: Role
}

export interface Product {
  id: string
  name: string
  price: number
  active: boolean
}

export interface VipCustomer {
  id: string
  name: string
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
  /** Snapshot taken at sale time; reports never read the product flag. */
  is_invitation: boolean
  vip_customer_id: string | null
  /** Catalog price at insert time (audit reference). */
  price_override: number | null
  /** Open account the sale was noted into; null for the loose comanda. */
  account_id: string | null
  created_at: string
}

/** An account opened inside a shift (free name or VIP customer). */
export interface Account {
  id: string
  shift_id: string
  name: string
  vip_customer_id: string | null
  status: 'open' | 'closed'
  created_at: string
}

/** Sale row with its product embedded (PostgREST select). */
export interface SaleWithProduct extends Sale {
  products: Pick<Product, 'name' | 'price'>
}

/** Shift row with bartender name and its sales embedded. */
export interface ShiftWithDetails extends Shift {
  profiles: { full_name: string } | null
  sales: SaleWithProduct[]
}
