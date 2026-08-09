import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Granites from './pages/Granites.jsx'
import Customers from './pages/Customers.jsx'
import Lots from './pages/Lots.jsx'
import Sales from './pages/Sales.jsx'
import SaleDetail from './pages/SaleDetail.jsx'
import NewSale from './pages/NewSale.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/granites', label: 'Granites' },
  { to: '/customers', label: 'Customers' },
  { to: '/lots', label: 'Lots' },
  { to: '/sales', label: 'Sales' },
  { to: '/sales/new', label: 'New Sale' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' }
]

function navClass({ isActive }) {
  return isActive
    ? 'block px-3 py-2 rounded-md bg-stone-800 text-white text-sm font-medium'
    : 'block px-3 py-2 rounded-md text-stone-600 hover:bg-stone-100 text-sm font-medium'
}

export default function App() {
  return (
    <div className="min-h-screen bg-stone-50 flex">
      <aside className="w-56 shrink-0 bg-white border-r border-stone-200 min-h-screen px-3 py-6">
        <h1 className="text-lg font-semibold text-stone-900 tracking-tight px-3 mb-6">
          GRANITOS
        </h1>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 px-8 py-8 max-w-5xl">
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