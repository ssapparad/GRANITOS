import { Routes, Route, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Gem,
  Users,
  Boxes,
  Receipt,
  PlusCircle,
  BarChart3,
  Settings as SettingsIcon
} from 'lucide-react'
import Dashboard from './pages/Dashboard.jsx'
import Granites from './pages/Granites.jsx'
import Customers from './pages/Customers.jsx'
import Lots from './pages/Lots.jsx'
import Sales from './pages/Sales.jsx'
import SaleDetail from './pages/SaleDetail.jsx'
import NewSale from './pages/NewSale.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'
import Logo from './components/Logo.jsx'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }]
  },
  {
    label: 'Catalog',
    items: [
      { to: '/granites', label: 'Granites', icon: Gem },
      { to: '/lots', label: 'Lots', icon: Boxes },
      { to: '/customers', label: 'Customers', icon: Users }
    ]
  },
  {
    label: 'Sales',
    items: [
      { to: '/sales', label: 'Invoices', icon: Receipt },
      { to: '/sales/new', label: 'New Sale', icon: PlusCircle }
    ]
  },
  {
    label: 'Business',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/settings', label: 'Settings', icon: SettingsIcon }
    ]
  }
]

function navClass({ isActive }) {
  return isActive
    ? 'flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium'
    : 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink-muted hover:bg-canvas hover:text-ink text-sm font-medium transition-colors'
}

export default function App() {
  return (
    <div className="min-h-screen bg-canvas flex">
      <aside className="w-60 shrink-0 bg-white border-r border-line min-h-screen px-4 py-6 flex flex-col">
        <div className="px-2 mb-8">
          <Logo />
        </div>

        <nav className="flex flex-col gap-5 flex-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-ink-faint uppercase tracking-[0.1em]">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                    <item.icon size={16} strokeWidth={2} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 pt-4 border-t border-line">
          <p className="text-[11px] text-ink-faint">Vaishnavi Granites &amp; Ceramics</p>
        </div>
      </aside>

      <main className="flex-1 px-10 py-8 max-w-6xl">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/granites" element={<Granites />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/lots" element={<Lots />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/new" element={<NewSale />} />
          <Route path="/sales/:saleId" element={<SaleDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
