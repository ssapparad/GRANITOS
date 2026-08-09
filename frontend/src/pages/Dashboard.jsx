import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client.js'

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/dashboard/summary')
      .then((res) => setSummary(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load dashboard.'))
  }, [])

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>
  }

  if (!summary) {
    return <p className="text-stone-400 text-sm">Loading...</p>
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-900 mb-4">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
        <div className="bg-white border border-stone-200 rounded-md p-4">
          <p className="text-stone-500 text-sm">Today's Sales</p>
          <p className="text-2xl font-semibold text-stone-900 mt-1">
            {formatINR(summary.todays_sales_total)}
          </p>
          <p className="text-stone-400 text-xs mt-0.5">{summary.todays_sales_count} invoice(s)</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-md p-4">
          <p className="text-stone-500 text-sm">Cash Collected Today</p>
          <p className="text-2xl font-semibold text-stone-900 mt-1">
            {formatINR(summary.cash_collected_today)}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-md p-4">
          <p className="text-stone-500 text-sm">Online Payments Today</p>
          <p className="text-2xl font-semibold text-stone-900 mt-1">
            {formatINR(summary.online_payments_today)}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-md p-4">
          <p className="text-stone-500 text-sm">Credit Sales Today</p>
          <p className="text-2xl font-semibold text-amber-700 mt-1">
            {formatINR(summary.credit_sales_today)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-stone-200 rounded-md p-4">
          <p className="text-stone-500 text-sm">Inventory Value</p>
          <p className="text-2xl font-semibold text-stone-900 mt-1">
            {formatINR(summary.total_inventory_value)}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-md p-4">
          <p className="text-stone-500 text-sm">Available Stock</p>
          <p className="text-2xl font-semibold text-stone-900 mt-1">
            {summary.total_inventory_sqft} sqft
          </p>
          <p className="text-stone-400 text-xs mt-0.5">{summary.total_inventory_slabs} slabs</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-md p-4">
          <p className="text-stone-500 text-sm">Outstanding Dues</p>
          <p className="text-2xl font-semibold text-amber-700 mt-1">
            {formatINR(summary.total_outstanding)}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-md p-4">
          <p className="text-stone-500 text-sm">Unpaid Invoices</p>
          <p className="text-2xl font-semibold text-stone-900 mt-1">
            {summary.outstanding_sales_count}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 mb-3">Fast Moving Granite</h3>
          <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-stone-600 text-left">
                <tr>
                  <th className="px-4 py-2">Granite</th>
                  <th className="px-4 py-2">Sqft Sold</th>
                  <th className="px-4 py-2">Sqft / Day</th>
                </tr>
              </thead>
              <tbody>
                {summary.fast_moving_granites.map((g) => (
                  <tr key={g.granite_name} className="border-t border-stone-100">
                    <td className="px-4 py-2 text-stone-800">{g.granite_name}</td>
                    <td className="px-4 py-2 text-stone-600">{g.total_sqft_sold}</td>
                    <td className="px-4 py-2 text-green-700 font-medium">{g.avg_sqft_per_day}</td>
                  </tr>
                ))}
                {summary.fast_moving_granites.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-stone-400">
                      Not enough sales history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-900 mb-3">Slow Moving Granite</h3>
          <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-stone-600 text-left">
                <tr>
                  <th className="px-4 py-2">Granite</th>
                  <th className="px-4 py-2">Sqft Sold</th>
                  <th className="px-4 py-2">Sqft / Day</th>
                </tr>
              </thead>
              <tbody>
                {summary.slow_moving_granites.map((g) => (
                  <tr key={g.granite_name} className="border-t border-stone-100">
                    <td className="px-4 py-2 text-stone-800">{g.granite_name}</td>
                    <td className="px-4 py-2 text-stone-600">{g.total_sqft_sold}</td>
                    <td className="px-4 py-2 text-red-700 font-medium">{g.avg_sqft_per_day}</td>
                  </tr>
                ))}
                {summary.slow_moving_granites.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-stone-400">
                      Not enough sales history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 mb-3">Low Stock Lots</h3>
          <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-stone-600 text-left">
                <tr>
                  <th className="px-4 py-2">Granite</th>
                  <th className="px-4 py-2">Lot #</th>
                  <th className="px-4 py-2">Sqft</th>
                </tr>
              </thead>
              <tbody>
                {summary.low_stock_lots.map((l) => (
                  <tr key={l.lot_id} className="border-t border-stone-100">
                    <td className="px-4 py-2 text-stone-800">{l.granite_name}</td>
                    <td className="px-4 py-2 text-stone-600">{l.lot_number}</td>
                    <td className="px-4 py-2 text-amber-700 font-medium">{l.available_sqft}</td>
                  </tr>
                ))}
                {summary.low_stock_lots.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-stone-400">
                      All lots are well stocked.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Flagged below 100 sqft available.{' '}
            <Link to="/lots" className="underline hover:text-stone-600">Manage lots →</Link>
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-900 mb-3">Recent Sales</h3>
          <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-stone-600 text-left">
                <tr>
                  <th className="px-4 py-2">Invoice</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent_sales.map((s) => (
                  <tr key={s.sale_id} className="border-t border-stone-100 hover:bg-stone-50">
                    <td className="px-4 py-2">
                      <Link to={`/sales/${s.sale_id}`} className="text-stone-800 font-medium hover:underline">
                        {s.invoice_no}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-stone-600">{s.customer_name}</td>
                    <td className="px-4 py-2 text-right text-stone-800 font-medium">
                      {formatINR(s.grand_total)}
                    </td>
                  </tr>
                ))}
                {summary.recent_sales.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-stone-400">
                      No sales yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}