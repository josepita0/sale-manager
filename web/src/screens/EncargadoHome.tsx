import { useState } from 'react'
import type { Profile } from '../lib/types'
import { BottomBar, type BottomBarItem } from '../components/BottomBar'
import { CajaIcon, CopaIcon, EstrellaIcon, RelojIcon, UsuariosIcon } from '../components/icons'
import { BartenderShift } from './BartenderShift'
import { HistoryTab } from './EncargadoHistory'
import { ProductsTab } from './EncargadoProducts'
import { UsersTab } from './EncargadoUsers'
import { VipCustomersTab } from './EncargadoVipCustomers'

type Tab = 'turno' | 'productos' | 'turnos' | 'clientes' | 'usuarios'

const ITEMS: BottomBarItem[] = [
  { key: 'turno', label: 'Mi turno', icon: <CopaIcon className="h-full w-full" /> },
  { key: 'productos', label: 'Productos', icon: <CajaIcon className="h-full w-full" /> },
  { key: 'turnos', label: 'Turnos', icon: <RelojIcon className="h-full w-full" /> },
  { key: 'clientes', label: 'VIP', icon: <EstrellaIcon className="h-full w-full" /> },
]

const ADMIN_ITEMS: BottomBarItem[] = [
  ...ITEMS,
  { key: 'usuarios', label: 'Usuarios', icon: <UsuariosIcon className="h-full w-full" /> },
]

export function EncargadoHome({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<Tab>('turno')
  const isAdmin = profile.role === 'admin'
  const items = isAdmin ? ADMIN_ITEMS : ITEMS

  return (
    <div className="pb-28">
      <div key={tab} className="anim-panel-in">
        {tab === 'turno' && <BartenderShift profile={profile} embedded />}
        {tab === 'productos' && <ProductsTab />}
        {tab === 'turnos' && <HistoryTab />}
        {tab === 'clientes' && <VipCustomersTab />}
        {isAdmin && tab === 'usuarios' && <UsersTab profile={profile} />}
      </div>
      <BottomBar items={items} active={tab} onSelect={(key) => setTab(key as Tab)} />
    </div>
  )
}
