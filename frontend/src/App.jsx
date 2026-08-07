import { Routes, Route, NavLink } from 'react-router-dom'
import Granites from './pages/Granites.jsx'
import Customers from './pages/Customers.jsx'
import Lots from './pages/Lots.jsx'
import Sales from './pages/Sales.jsx'
import SaleDetail from './pages/SaleDetail.jsx'
import NewSale from './pages/NewSale.jsx'

function navClass({ isActive }) {
  return isActive
    ? 'px-4 py-2 rounded-md bg-stone-800 text-white text-sm font-medium'
    : 'px-4 py-2 rounded-md text-stone-600 hover:bg-stone-100 text-sm font-medium'
}

export default function App() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-stone-900 tracking-tight">
            GRANITOS
          </h1>
          <nav className="flex gap-2">
            <NavLink to="/" end className={navClass}>Granites</NavLink>
            <NavLink to="/customers" className={navClass}>Customers</NavLink>
            <NavLink to="/lots" className={navClass}>Lots</NavLink>
            <NavLink to="/sales" className={navClass}>Sales</NavLink>
            <NavLink to="/sales/new" className={navClass}>New Sale</NavLink>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Granites />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/lots" element={<Lots />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/new" element={<NewSale />} />
          <Route path="/sales/:saleId" element={<SaleDetail />} />
        </Routes>
      </main>
    </div>
  )
}