import { useState } from 'react'
import type { Profile } from '../lib/types'
import { BottomBar, type BottomBarItem } from '../components/BottomBar'
import { CajaIcon, CopaIcon, EstrellaIcon, RelojIcon } from '../components/icons'
import { BartenderShift } from './BartenderShift'
import { HistoryTab } from './EncargadoHistory'
import { ProductsTab } from './EncargadoProducts'
import { VipCustomersTab } from './EncargadoVipCustomers'

type Tab = 'turno' | 'productos' | 'turnos' | 'clientes'

const ITEMS: BottomBarItem[] = [
  { key: 'turno', label: 'Mi turno', icon: <CopaIcon className="h-full w-full" /> },
  { key: 'productos', label: 'Productos', icon: <CajaIcon className="h-full w-full" /> },
  { key: 'turnos', label: 'Turnos', icon: <RelojIcon className="h-full w-full" /> },
  { key: 'clientes', label: 'VIP', icon: <EstrellaIcon className="h-full w-full" /> },
]

export function EncargadoHome({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<Tab>('turno')

  return (
    <div className="pb-28">
      {tab === 'turno' && <BartenderShift profile={profile} embedded />}
      {tab === 'productos' && <ProductsTab />}
      {tab === 'turnos' && <HistoryTab />}
      {tab === 'clientes' && <VipCustomersTab />}
      <BottomBar items={ITEMS} active={tab} onSelect={(key) => setTab(key as Tab)} />
    </div>
  )
}
