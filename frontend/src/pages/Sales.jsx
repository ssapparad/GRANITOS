import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Receipt } from 'lucide-react'
import client from '../api/client.js'
import PageHeader from '../components/PageHeader.jsx'
import Button from '../components/Button.jsx'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    client.get('/sales/').then((res) => {
      setSales(res.data)
      setLoaded(true)
    })
  }, [])

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Every sale recorded at the showroom"
        action={<Button to="/sales/new" icon={PlusCircle}>New Sale</Button>}
      />

      <div className="bg-white border border-line rounded-xl overflow-hidden overflow-x-auto shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink-muted text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Invoice #</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Slabs</th>
              <th className="px-4 py-2.5 font-medium">Sqft</th>
              <th className="px-4 py-2.5 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.sale_id} className="border-t border-line-soft hover:bg-canvas/60 transition-colors">
                <td className="px-4 py-2.5">
                  <Link
                    to={`/sales/${s.sale_id}`}
                    className="text-ink font-medium hover:text-emerald-700"
                  >
                    {s.invoice_no}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-ink-muted">{s.customer_name}</td>
                <td className="px-4 py-2.5 text-ink-muted">{s.sale_date}</td>
                <td className="px-4 py-2.5 text-ink-muted">{s.total_slabs}</td>
                <td className="px-4 py-2.5 text-ink-muted">{s.total_sqft}</td>
                <td className="px-4 py-2.5 text-ink font-medium text-right">₹{s.grand_total}</td>
              </tr>
            ))}
            {loaded && sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-canvas flex items-center justify-center">
                      <Receipt size={18} className="text-ink-faint" strokeWidth={2} />
                    </div>
                    <p className="text-sm text-ink-muted">No sales recorded yet.</p>
                    <Button to="/sales/new" size="sm" icon={PlusCircle}>
                      Record your first sale
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
