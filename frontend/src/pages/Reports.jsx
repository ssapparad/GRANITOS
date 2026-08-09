import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client.js'
import { useToast } from '../components/ToastProvider.jsx'

const TABS = ['Sales', 'Inventory', 'Customers', 'Outstanding', 'Day Closing']

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function firstOfMonthStr() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('Sales')

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-900 mb-4">Reports</h2>

      <div className="flex gap-2 mb-6 border-b border-stone-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              activeTab === tab
                ? 'px-4 py-2 text-sm font-medium text-stone-900 border-b-2 border-stone-800'
                : 'px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700'
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Sales' && <SalesReport />}
      {activeTab === 'Inventory' && <InventoryReport />}
      {activeTab === 'Customers' && <CustomerReport />}
      {activeTab === 'Outstanding' && <OutstandingReport />}
      {activeTab === 'Day Closing' && <DayClosingReport />}
    </div>
  )
}

// ==========================================
// SALES REPORT
// ==========================================

function SalesReport() {
  const [startDate, setStartDate] = useState(firstOfMonthStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [data, setData] = useState(null)

  useEffect(() => {
    client.get('/reports/sales', { params: { start_date: startDate, end_date: endDate } }).then((res) => setData(res.data))
  }, [startDate, endDate])

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-stone-300 rounded-md px-3 py-2 text-sm" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-stone-300 rounded-md px-3 py-2 text-sm" />
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
            <SummaryCard label="Invoices" value={data.total_sales_count} />
            <SummaryCard label="Slabs Sold" value={data.total_slabs} />
            <SummaryCard label="Sqft Sold" value={data.total_sqft} />
            <SummaryCard label="Revenue" value={formatINR(data.total_revenue)} />
          </div>

          <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-stone-600 text-left">
                <tr>
                  <th className="px-4 py-2">Invoice #</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Slabs</th>
                  <th className="px-4 py-2">Sqft</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.sales.map((s) => (
                  <tr key={s.sale_id} className="border-t border-stone-100">
                    <td className="px-4 py-2">
                      <Link to={`/sales/${s.sale_id}`} className="text-stone-800 font-medium hover:underline">{s.invoice_no}</Link>
                    </td>
                    <td className="px-4 py-2 text-stone-600">{s.customer_name}</td>
                    <td className="px-4 py-2 text-stone-600">{s.sale_date}</td>
                    <td className="px-4 py-2 text-stone-600">{s.total_slabs}</td>
                    <td className="px-4 py-2 text-stone-600">{s.total_sqft}</td>
                    <td className="px-4 py-2 text-right text-stone-800 font-medium">{formatINR(s.grand_total)}</td>
                  </tr>
                ))}
                {data.sales.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-stone-400">No sales in this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ==========================================
// INVENTORY REPORT
// ==========================================

function InventoryReport() {
  const [data, setData] = useState(null)

  useEffect(() => {
    client.get('/reports/inventory').then((res) => setData(res.data))
  }, [])

  if (!data) return null

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <SummaryCard label="Inventory Value" value={formatINR(data.total_inventory_value)} />
        <SummaryCard label="Available Sqft" value={data.total_available_sqft} />
        <SummaryCard label="Available Slabs" value={data.total_available_slabs} />
      </div>

      <div className="bg-white border border-stone-200 rounded-md overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-stone-600 text-left">
            <tr>
              <th className="px-4 py-2">Granite</th>
              <th className="px-4 py-2">Lot #</th>
              <th className="px-4 py-2">Purchased</th>
              <th className="px-4 py-2">₹/sqft</th>
              <th className="px-4 py-2">Slabs (avail/total)</th>
              <th className="px-4 py-2">Sqft (avail/total)</th>
              <th className="px-4 py-2 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.lots.map((l, idx) => (
              <tr key={idx} className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800">{l.granite_name}</td>
                <td className="px-4 py-2 text-stone-600">{l.lot_number}</td>
                <td className="px-4 py-2 text-stone-600">{l.purchase_date}</td>
                <td className="px-4 py-2 text-stone-600">{l.purchase_price_per_sqft}</td>
                <td className="px-4 py-2 text-stone-600">{l.available_slabs} / {l.total_slabs}</td>
                <td className="px-4 py-2 text-stone-600">{l.available_sqft} / {l.total_sqft}</td>
                <td className="px-4 py-2 text-right text-stone-800 font-medium">{formatINR(l.inventory_value)}</td>
              </tr>
            ))}
            {data.lots.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-stone-400">No active lots.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==========================================
// CUSTOMER REPORT
// ==========================================

function CustomerReport() {
  const [startDate, setStartDate] = useState(firstOfMonthStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [data, setData] = useState(null)

  useEffect(() => {
    client.get('/reports/customers', { params: { start_date: startDate, end_date: endDate } }).then((res) => setData(res.data))
  }, [startDate, endDate])

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-stone-300 rounded-md px-3 py-2 text-sm" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-stone-300 rounded-md px-3 py-2 text-sm" />
      </div>
      <p className="text-xs text-stone-400 mb-4">
        Billed and Paid reflect activity in the selected range. Outstanding is the current running balance (not range-limited).
      </p>

      {data && (
        <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-100 text-stone-600 text-left">
              <tr>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2 text-right">Billed</th>
                <th className="px-4 py-2 text-right">Paid</th>
                <th className="px-4 py-2 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {data.customers.map((c) => (
                <tr key={c.customer_id} className="border-t border-stone-100">
                  <td className="px-4 py-2 text-stone-800">{c.customer_name}</td>
                  <td className="px-4 py-2 text-right text-stone-600">{formatINR(c.total_billed)}</td>
                  <td className="px-4 py-2 text-right text-stone-600">{formatINR(c.total_paid)}</td>
                  <td className="px-4 py-2 text-right text-amber-700 font-medium">{formatINR(c.total_outstanding)}</td>
                </tr>
              ))}
              {data.customers.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-stone-400">No customers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ==========================================
// OUTSTANDING REPORT
// ==========================================

function OutstandingReport() {
  const [data, setData] = useState(null)

  useEffect(() => {
    client.get('/reports/outstanding').then((res) => setData(res.data))
  }, [])

  if (!data) return null

  return (
    <div>
      <div className="mb-4">
        <SummaryCard label="Total Outstanding" value={formatINR(data.total_outstanding)} />
      </div>

      <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-stone-600 text-left">
            <tr>
              <th className="px-4 py-2">Invoice #</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Sale Date</th>
              <th className="px-4 py-2">Days Outstanding</th>
              <th className="px-4 py-2 text-right">Balance Due</th>
            </tr>
          </thead>
          <tbody>
            {data.sales.map((s) => (
              <tr key={s.sale_id} className="border-t border-stone-100">
                <td className="px-4 py-2">
                  <Link to={`/sales/${s.sale_id}`} className="text-stone-800 font-medium hover:underline">{s.invoice_no}</Link>
                </td>
                <td className="px-4 py-2 text-stone-600">{s.customer_name}</td>
                <td className="px-4 py-2 text-stone-600">{s.sale_date}</td>
                <td className="px-4 py-2 text-stone-600">{s.days_outstanding}</td>
                <td className="px-4 py-2 text-right text-amber-700 font-medium">{formatINR(s.balance_due)}</td>
              </tr>
            ))}
            {data.sales.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-stone-400">Nothing outstanding.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==========================================
// DAY CLOSING REPORT (mirrors the paper form)
// ==========================================

function DayClosingReport() {
  const showToast = useToast()

  const [reportDate, setReportDate] = useState(todayStr())
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  // Manual-only fields — not tracked by the system yet, kept local so
  // the printed page matches the paper form. Not saved anywhere.
  const [advanceCash, setAdvanceCash] = useState('')
  const [advancePhonePay, setAdvancePhonePay] = useState('')
  const [transportPaid, setTransportPaid] = useState('')
  const [transportUnpaid, setTransportUnpaid] = useState('')
  const [expensesNote, setExpensesNote] = useState('')
  const [cashInHand, setCashInHand] = useState('')

  function load() {
    client
      .get('/reports/day-closing', { params: { report_date: reportDate } })
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load.'))
  }

  useEffect(() => {
    load()
  }, [reportDate])

  async function handlePayLoadingCharges() {
    try {
      const res = await client.post('/sales/loading-charges/pay', null, { params: { payment_date: reportDate } })
      showToast(`Paid ₹${res.data.total_amount} across ${res.data.sales_count} sale(s).`)
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Something went wrong.', 'error')
    }
  }

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return null

  return (
    <div>
      <div className="mb-4">
        <input
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          className="border border-stone-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="bg-white border border-stone-200 rounded-md overflow-hidden overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-stone-600 text-left">
            <tr>
              <th className="px-3 py-2">Invoice</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Sqft</th>
              <th className="px-3 py-2">Hard Cash</th>
              <th className="px-3 py-2">Phone Pay</th>
              <th className="px-3 py-2">Total Amount</th>
              <th className="px-3 py-2">Commission</th>
              <th className="px-3 py-2">Pending</th>
              <th className="px-3 py-2">Loading</th>
            </tr>
          </thead>
          <tbody>
            {data.sales.map((s) => (
              <tr key={s.sale_id} className="border-t border-stone-100">
                <td className="px-3 py-2">
                  <Link to={`/sales/${s.sale_id}`} className="text-stone-800 font-medium hover:underline">{s.invoice_no}</Link>
                </td>
                <td className="px-3 py-2 text-stone-600">{s.customer_name}</td>
                <td className="px-3 py-2 text-stone-600">{s.sqft_sold}</td>
                <td className="px-3 py-2 text-stone-600">{s.cash_received}</td>
                <td className="px-3 py-2 text-stone-600">{s.phone_pay_received}</td>
                <td className="px-3 py-2 text-stone-800 font-medium">{s.total_amount}</td>
                <td className="px-3 py-2 text-stone-600">{s.commission ?? '—'}</td>
                <td className="px-3 py-2 text-stone-600">{s.pending_amount}</td>
                <td className="px-3 py-2 text-stone-600">{s.loading_amount ?? '—'}</td>
              </tr>
            ))}
            {data.sales.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-stone-400">No sales on this date.</td></tr>
            )}
          </tbody>
          {data.sales.length > 0 && (
            <tfoot className="bg-stone-50 font-medium text-stone-800">
              <tr className="border-t border-stone-200">
                <td className="px-3 py-2" colSpan={2}>Totals</td>
                <td className="px-3 py-2">{data.totals.sqft_sold}</td>
                <td className="px-3 py-2">{data.totals.cash_received}</td>
                <td className="px-3 py-2">{data.totals.phone_pay_received}</td>
                <td className="px-3 py-2">{data.totals.total_amount}</td>
                <td className="px-3 py-2">{data.totals.commission}</td>
                <td className="px-3 py-2">{data.totals.pending_amount}</td>
                <td className="px-3 py-2">{data.totals.loading_amount}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-stone-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-stone-900 mb-3">Advance Amount</h4>
          <p className="text-xs text-stone-400 mb-2">Not tracked by the system yet — fill manually.</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={advanceCash} onChange={(e) => setAdvanceCash(e.target.value)} placeholder="Cash" className="border border-stone-300 rounded-md px-3 py-2 text-sm" />
            <input value={advancePhonePay} onChange={(e) => setAdvancePhonePay(e.target.value)} placeholder="Phone Pay" className="border border-stone-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-stone-900 mb-3">Pending Amount Received</h4>
          <p className="text-xs text-stone-400 mb-2">Old dues collected today (auto-filled).</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-stone-500 text-xs">Amount</p>
              <p className="font-medium text-stone-900">{data.pending_received.total_amount}</p>
            </div>
            <div>
              <p className="text-stone-500 text-xs">Cash</p>
              <p className="font-medium text-stone-900">{data.pending_received.cash}</p>
            </div>
            <div>
              <p className="text-stone-500 text-xs">Phone Pay</p>
              <p className="font-medium text-stone-900">{data.pending_received.phone_pay}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-stone-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-stone-900 mb-3">Transportation</h4>
          <p className="text-xs text-stone-400 mb-2">Not tracked by the system yet — fill manually.</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={transportPaid} onChange={(e) => setTransportPaid(e.target.value)} placeholder="Paid Amount" className="border border-stone-300 rounded-md px-3 py-2 text-sm" />
            <input value={transportUnpaid} onChange={(e) => setTransportUnpaid(e.target.value)} placeholder="Unpaid Amount" className="border border-stone-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-stone-900">Loading</h4>
            <button onClick={handlePayLoadingCharges} className="text-xs text-stone-600 hover:underline">
              Pay outstanding loading charges
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-stone-500 text-xs">Paid Today</p>
              <p className="font-medium text-stone-900">{data.loading.paid_today}</p>
            </div>
            <div>
              <p className="text-stone-500 text-xs">Unpaid (owed to labour)</p>
              <p className="font-medium text-amber-700">{data.loading.unpaid_total}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-stone-900 mb-3">Total Expenses (detail in red book)</h4>
          <textarea
            value={expensesNote}
            onChange={(e) => setExpensesNote(e.target.value)}
            rows={3}
            placeholder="Not tracked by the system — note here if useful."
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="bg-white border border-stone-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-stone-900 mb-3">Total Cash Left In Hand</h4>
          <input
            value={cashInHand}
            onChange={(e) => setCashInHand(e.target.value)}
            placeholder="Fill after reconciling"
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  )
}

// ==========================================
// SHARED
// ==========================================

function SummaryCard({ label, value }) {
  return (
    <div className="bg-white border border-stone-200 rounded-md p-4">
      <p className="text-stone-500 text-sm">{label}</p>
      <p className="text-xl font-semibold text-stone-900 mt-1">{value}</p>
    </div>
  )
}