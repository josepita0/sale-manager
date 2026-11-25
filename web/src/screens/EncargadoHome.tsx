import { useState } from 'react'
import { HistoryTab } from './EncargadoHistory'
import { ProductsTab } from './EncargadoProducts'
import { VipCustomersTab } from './EncargadoVipCustomers'

type Tab = 'productos' | 'turnos' | 'clientes'

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-emerald-600 text-white' : 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800'
      }`}
    >
      {children}
    </button>
  )
}

export function EncargadoHome() {
  const [tab, setTab] = useState<Tab>('productos')

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="flex gap-2">
        <TabButton active={tab === 'productos'} onClick={() => setTab('productos')}>
          Productos
        </TabButton>
        <TabButton active={tab === 'turnos'} onClick={() => setTab('turnos')}>
          Turnos
        </TabButton>
        <TabButton active={tab === 'clientes'} onClick={() => setTab('clientes')}>
          Clientes VIP
        </TabButton>
      </div>
      <div className="mt-4">
        {tab === 'productos' ? <ProductsTab /> : tab === 'turnos' ? <HistoryTab /> : <VipCustomersTab />}
      </div>
    </main>
  )
}
