import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Gem,
  Users,
  Boxes,
  Receipt,
  PlusCircle,
  BarChart3,
  Settings as SettingsIcon,
  Menu,
  X
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

function SidebarContent({ onNavigate }) {
  return (
    <>
      <div className="px-2 mb-8 flex items-center justify-between">
        <Logo />
      </div>

      <nav className="flex flex-col gap-5 flex-1 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-ink-faint uppercase tracking-[0.1em]">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navClass} onClick={onNavigate}>
                  <item.icon size={16} strokeWidth={2} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pt-4 border-t border-line shrink-0">
        <p className="text-[11px] text-ink-faint">Vaishnavi Granites &amp; Ceramics</p>
      </div>
    </>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      {/* Mobile / tablet top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 bg-white border-b border-line px-4 py-3">
        <Logo size={28} />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-ink-muted hover:bg-canvas hover:text-ink"
        >
          <Menu size={20} strokeWidth={2} />
        </button>
      </header>

      {/* Backdrop, mobile/tablet only, shown while the drawer is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: off-canvas drawer on mobile/tablet, static column on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-line px-4 py-6 flex flex-col
          transform transition-transform duration-200 ease-out
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:z-auto lg:translate-x-0 lg:w-60 lg:max-w-none lg:shrink-0 lg:min-h-screen`}
      >
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
          className="lg:hidden absolute top-5 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-ink-muted hover:bg-canvas hover:text-ink"
        >
          <X size={18} strokeWidth={2} />
        </button>
        <SidebarContent onNavigate={() => setMenuOpen(false)} />
      </aside>

      <main className="flex-1 min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8 max-w-6xl">
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
