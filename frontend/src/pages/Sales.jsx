import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client.js'

export default function Sales() {
  const [sales, setSales] = useState([])

  useEffect(() => {
    client.get('/sales/').then((res) => setSales(res.data))
  }, [])

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-900 mb-4">Sales</h2>

      <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-stone-600 text-left">
            <tr>
              <th className="px-4 py-2">Invoice #</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Slabs</th>
              <th className="px-4 py-2">Sqft</th>
              <th className="px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.sale_id} className="border-t border-stone-100 hover:bg-stone-50">
                <td className="px-4 py-2">
                  <Link to={`/sales/${s.sale_id}`} className="text-stone-800 font-medium hover:underline">
                    {s.invoice_no}
                  </Link>
                </td>
                <td className="px-4 py-2 text-stone-600">{s.customer_name}</td>
                <td className="px-4 py-2 text-stone-600">{s.sale_date}</td>
                <td className="px-4 py-2 text-stone-600">{s.total_slabs}</td>
                <td className="px-4 py-2 text-stone-600">{s.total_sqft}</td>
                <td className="px-4 py-2 text-stone-800 font-medium">₹{s.grand_total}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-stone-400">
                  No sales yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}