import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client.js'
import { useToast } from '../components/ToastProvider.jsx'
import PageHeader from '../components/PageHeader.jsx'

const TABS = ['Sales', 'Inventory', 'Customers', 'Outstanding', 'Payables', 'Day Closing']

const inputClass = 'border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500'

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
      <PageHeader title="Reports" subtitle="Sales, inventory, and daily closing summaries" />

      <div className="flex gap-2 mb-6 border-b border-line overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              activeTab === tab
                ? 'px-4 py-2 text-sm font-medium text-ink border-b-2 border-emerald-600 whitespace-nowrap shrink-0'
                : 'px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink whitespace-nowrap shrink-0'
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
      {activeTab === 'Payables' && <PayablesReport />}
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
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <SummaryCard label="Invoices" value={data.total_sales_count} />
            <SummaryCard label="Slabs Sold" value={data.total_slabs} />
            <SummaryCard label="Sqft Sold" value={data.total_sqft} />
            <SummaryCard label="Revenue" value={formatINR(data.total_revenue)} />
          </div>

          <div className="bg-white border border-line rounded-2xl overflow-hidden overflow-x-auto shadow-card">
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
                {data.sales.map((s) => (
                  <tr key={s.sale_id} className="border-t border-line-soft hover:bg-canvas/60 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link to={`/sales/${s.sale_id}`} className="text-ink font-medium hover:text-emerald-700">{s.invoice_no}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-ink-muted">{s.customer_name}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{s.sale_date}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{s.total_slabs}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{s.total_sqft}</td>
                    <td className="px-4 py-2.5 text-right text-ink font-medium">{formatINR(s.grand_total)}</td>
                  </tr>
                ))}
                {data.sales.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-faint">No sales in this range.</td></tr>
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

      <div className="bg-white border border-line rounded-2xl overflow-hidden overflow-x-auto shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink-muted text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Granite</th>
              <th className="px-4 py-2.5 font-medium">Lot #</th>
              <th className="px-4 py-2.5 font-medium">Purchased</th>
              <th className="px-4 py-2.5 font-medium">₹/sqft</th>
              <th className="px-4 py-2.5 font-medium">Slabs (avail/total)</th>
              <th className="px-4 py-2.5 font-medium">Sqft (avail/total)</th>
              <th className="px-4 py-2.5 font-medium text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.lots.map((l, idx) => (
              <tr key={idx} className="border-t border-line-soft hover:bg-canvas/60 transition-colors">
                <td className="px-4 py-2.5 text-ink">{l.granite_name}</td>
                <td className="px-4 py-2.5 text-ink-muted">{l.lot_number}</td>
                <td className="px-4 py-2.5 text-ink-muted">{l.purchase_date}</td>
                <td className="px-4 py-2.5 text-ink-muted">{l.purchase_price_per_sqft}</td>
                <td className="px-4 py-2.5 text-ink-muted">{l.available_slabs} / {l.total_slabs}</td>
                <td className="px-4 py-2.5 text-ink-muted">{l.available_sqft} / {l.total_sqft}</td>
                <td className="px-4 py-2.5 text-right text-ink font-medium">{formatINR(l.inventory_value)}</td>
              </tr>
            ))}
            {data.lots.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-ink-faint">No active lots.</td></tr>
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
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
      </div>
      <p className="text-xs text-ink-faint mb-4">
        Billed and Paid reflect activity in the selected range. Outstanding is the current running balance (not range-limited).
      </p>

      {data && (
        <div className="bg-white border border-line rounded-2xl overflow-hidden overflow-x-auto shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-ink-muted text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium text-right">Billed</th>
                <th className="px-4 py-2.5 font-medium text-right">Paid</th>
                <th className="px-4 py-2.5 font-medium text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {data.customers.map((c) => (
                <tr key={c.customer_id} className="border-t border-line-soft hover:bg-canvas/60 transition-colors">
                  <td className="px-4 py-2.5 text-ink">{c.customer_name}</td>
                  <td className="px-4 py-2.5 text-right text-ink-muted">{formatINR(c.total_billed)}</td>
                  <td className="px-4 py-2.5 text-right text-ink-muted">{formatINR(c.total_paid)}</td>
                  <td className="px-4 py-2.5 text-right text-amber-700 font-medium">{formatINR(c.total_outstanding)}</td>
                </tr>
              ))}
              {data.customers.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-faint">No customers yet.</td></tr>
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

      <div className="bg-white border border-line rounded-2xl overflow-hidden overflow-x-auto shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink-muted text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Invoice #</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Sale Date</th>
              <th className="px-4 py-2.5 font-medium">Days Outstanding</th>
              <th className="px-4 py-2.5 font-medium text-right">Balance Due</th>
            </tr>
          </thead>
          <tbody>
            {data.sales.map((s) => (
              <tr key={s.sale_id} className="border-t border-line-soft hover:bg-canvas/60 transition-colors">
                <td className="px-4 py-2.5">
                  <Link to={`/sales/${s.sale_id}`} className="text-ink font-medium hover:text-emerald-700">{s.invoice_no}</Link>
                </td>
                <td className="px-4 py-2.5 text-ink-muted">{s.customer_name}</td>
                <td className="px-4 py-2.5 text-ink-muted">{s.sale_date}</td>
                <td className="px-4 py-2.5 text-ink-muted">{s.days_outstanding}</td>
                <td className="px-4 py-2.5 text-right text-amber-700 font-medium">{formatINR(s.balance_due)}</td>
              </tr>
            ))}
            {data.sales.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-faint">Nothing outstanding.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==========================================
// PAYABLES REPORT (money YOU owe out — to
// agents/brokers and loading labour. Kept
// separate from customer Outstanding above,
// since it's the opposite direction of money)
// ==========================================

function PayablesReport() {
  const showToast = useToast()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const [activePayout, setActivePayout] = useState(null) // { saleId, type } | null
  const [payoutForm, setPayoutForm] = useState({ payment_date: todayStr(), payment_method: 'CASH' })
  const [payoutError, setPayoutError] = useState('')

  function load() {
    client.get('/sales/payables/').then((res) => setData(res.data)).catch((err) => setError(err.response?.data?.detail || 'Failed to load.'))
  }

  useEffect(() => {
    load()
  }, [])

  function openPayoutForm(saleId, type) {
    setActivePayout({ saleId, type })
    setPayoutForm({ payment_date: todayStr(), payment_method: 'CASH' })
    setPayoutError('')
  }

  async function handleSubmitPayout(e) {
    e.preventDefault()
    setPayoutError('')

    try {
      await client.post(`/sales/${activePayout.saleId}/${activePayout.type}/pay`, payoutForm)
      showToast(activePayout.type === 'commission' ? 'Commission marked as paid.' : 'Loading charge marked as paid.')
      setActivePayout(null)
      load()
    } catch (err) {
      setPayoutError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return null

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <SummaryCard label="Unpaid Commission" value={formatINR(data.total_unpaid_commission)} />
        <SummaryCard label="Unpaid Loading" value={formatINR(data.total_unpaid_loading)} />
      </div>
      <p className="text-xs text-ink-faint mb-4">
        Money you pay out — to agents/brokers (commission) and loading labour. Kept separate from customer dues.
      </p>

      <div className="bg-white border border-line rounded-2xl overflow-hidden overflow-x-auto shadow-card mb-4">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink-muted text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Invoice #</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Sale Date</th>
              <th className="px-4 py-2.5 font-medium">Commission</th>
              <th className="px-4 py-2.5 font-medium">Loading</th>
            </tr>
          </thead>
          <tbody>
            {data.sales.map((s) => (
              <tr key={s.sale_id} className="border-t border-line-soft hover:bg-canvas/60 transition-colors">
                <td className="px-4 py-2.5">
                  <Link to={`/sales/${s.sale_id}`} className="text-ink font-medium hover:text-emerald-700">{s.invoice_no}</Link>
                </td>
                <td className="px-4 py-2.5 text-ink-muted">{s.customer_name}</td>
                <td className="px-4 py-2.5 text-ink-muted">{s.sale_date}</td>
                <td className="px-4 py-2.5 text-ink-muted">
                  {s.commission && !s.commission_paid ? (
                    <div className="flex items-center gap-2">
                      <span>{formatINR(s.commission)}</span>
                      <button onClick={() => openPayoutForm(s.sale_id, 'commission')} className="text-emerald-700 hover:underline font-medium text-xs">Pay</button>
                    </div>
                  ) : '—'}
                </td>
                <td className="px-4 py-2.5 text-ink-muted">
                  {s.loading_charge && !s.loading_paid ? (
                    <div className="flex items-center gap-2">
                      <span>{formatINR(s.loading_charge)}</span>
                      <button onClick={() => openPayoutForm(s.sale_id, 'loading')} className="text-emerald-700 hover:underline font-medium text-xs">Pay</button>
                    </div>
                  ) : '—'}
                </td>
              </tr>
            ))}
            {data.sales.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-faint">Nothing owed out right now.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {activePayout && (
        <form onSubmit={handleSubmitPayout} className="bg-canvas border border-line rounded-xl p-4 space-y-2 max-w-md">
          <h4 className="text-sm font-medium text-ink">
            Pay {activePayout.type === 'commission' ? 'Commission' : 'Loading Charge'}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={payoutForm.payment_date}
              onChange={(e) => setPayoutForm((prev) => ({ ...prev, payment_date: e.target.value }))}
              required
              className={`bg-white ${inputClass}`}
            />
            <select
              value={payoutForm.payment_method}
              onChange={(e) => setPayoutForm((prev) => ({ ...prev, payment_method: e.target.value }))}
              className={`bg-white ${inputClass}`}
            >
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
            </select>
          </div>
          {payoutError && <p className="text-red-600 text-sm">{payoutError}</p>}
          <div className="flex gap-2">
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
              Confirm
            </button>
            <button type="button" onClick={() => setActivePayout(null)} className="px-4 py-2 rounded-lg text-sm text-ink-muted hover:bg-white">
              Cancel
            </button>
          </div>
        </form>
      )}
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
          className={inputClass}
        />
      </div>

      <div className="bg-white border border-line rounded-2xl overflow-hidden overflow-x-auto shadow-card mb-6">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink-muted text-left">
            <tr>
              <th className="px-3 py-2.5 font-medium">Invoice</th>
              <th className="px-3 py-2.5 font-medium">Customer</th>
              <th className="px-3 py-2.5 font-medium">Sqft</th>
              <th className="px-3 py-2.5 font-medium">Hard Cash</th>
              <th className="px-3 py-2.5 font-medium">Phone Pay</th>
              <th className="px-3 py-2.5 font-medium">Total Amount</th>
              <th className="px-3 py-2.5 font-medium">Commission</th>
              <th className="px-3 py-2.5 font-medium">Pending</th>
              <th className="px-3 py-2.5 font-medium">Loading</th>
            </tr>
          </thead>
          <tbody>
            {data.sales.map((s) => (
              <tr key={s.sale_id} className="border-t border-line-soft hover:bg-canvas/60 transition-colors">
                <td className="px-3 py-2.5">
                  <Link to={`/sales/${s.sale_id}`} className="text-ink font-medium hover:text-emerald-700">{s.invoice_no}</Link>
                </td>
                <td className="px-3 py-2.5 text-ink-muted">{s.customer_name}</td>
                <td className="px-3 py-2.5 text-ink-muted">{s.sqft_sold}</td>
                <td className="px-3 py-2.5 text-ink-muted">{s.cash_received}</td>
                <td className="px-3 py-2.5 text-ink-muted">{s.phone_pay_received}</td>
                <td className="px-3 py-2.5 text-ink font-medium">{s.total_amount}</td>
                <td className="px-3 py-2.5 text-ink-muted">{s.commission ?? '—'}</td>
                <td className="px-3 py-2.5 text-ink-muted">{s.pending_amount}</td>
                <td className="px-3 py-2.5 text-ink-muted">{s.loading_amount ?? '—'}</td>
              </tr>
            ))}
            {data.sales.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-ink-faint">No sales on this date.</td></tr>
            )}
          </tbody>
          {data.sales.length > 0 && (
            <tfoot className="bg-canvas font-medium text-ink">
              <tr className="border-t border-line">
                <td className="px-3 py-2.5" colSpan={2}>Totals</td>
                <td className="px-3 py-2.5">{data.totals.sqft_sold}</td>
                <td className="px-3 py-2.5">{data.totals.cash_received}</td>
                <td className="px-3 py-2.5">{data.totals.phone_pay_received}</td>
                <td className="px-3 py-2.5">{data.totals.total_amount}</td>
                <td className="px-3 py-2.5">{data.totals.commission}</td>
                <td className="px-3 py-2.5">{data.totals.pending_amount}</td>
                <td className="px-3 py-2.5">{data.totals.loading_amount}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-line rounded-2xl shadow-card p-4">
          <h4 className="text-sm font-semibold text-ink mb-3">Advance Amount</h4>
          <p className="text-xs text-ink-faint mb-2">Not tracked by the system yet — fill manually.</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={advanceCash} onChange={(e) => setAdvanceCash(e.target.value)} placeholder="Cash" className={inputClass} />
            <input value={advancePhonePay} onChange={(e) => setAdvancePhonePay(e.target.value)} placeholder="Phone Pay" className={inputClass} />
          </div>
        </div>

        <div className="bg-white border border-line rounded-2xl shadow-card p-4">
          <h4 className="text-sm font-semibold text-ink mb-3">Pending Amount Received</h4>
          <p className="text-xs text-ink-faint mb-2">Old dues collected today (auto-filled).</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-ink-faint text-xs">Amount</p>
              <p className="font-medium text-ink">{data.pending_received.total_amount}</p>
            </div>
            <div>
              <p className="text-ink-faint text-xs">Cash</p>
              <p className="font-medium text-ink">{data.pending_received.cash}</p>
            </div>
            <div>
              <p className="text-ink-faint text-xs">Phone Pay</p>
              <p className="font-medium text-ink">{data.pending_received.phone_pay}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-line rounded-2xl shadow-card p-4">
          <h4 className="text-sm font-semibold text-ink mb-3">Transportation</h4>
          <p className="text-xs text-ink-faint mb-2">Not tracked by the system yet — fill manually.</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={transportPaid} onChange={(e) => setTransportPaid(e.target.value)} placeholder="Paid Amount" className={inputClass} />
            <input value={transportUnpaid} onChange={(e) => setTransportUnpaid(e.target.value)} placeholder="Unpaid Amount" className={inputClass} />
          </div>
        </div>

        <div className="bg-white border border-line rounded-2xl shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-ink">Loading</h4>
            <button onClick={handlePayLoadingCharges} className="text-xs text-emerald-700 hover:underline font-medium">
              Pay outstanding loading charges
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-ink-faint text-xs">Paid Today</p>
              <p className="font-medium text-ink">{data.loading.paid_today}</p>
            </div>
            <div>
              <p className="text-ink-faint text-xs">Unpaid (owed to labour)</p>
              <p className="font-medium text-amber-700">{data.loading.unpaid_total}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-line rounded-2xl shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-ink">Commission</h4>
            <Link to="/reports" onClick={() => window.scrollTo(0, 0)} className="text-xs text-emerald-700 hover:underline font-medium">
              Pay per invoice →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-ink-faint text-xs">Paid Today</p>
              <p className="font-medium text-ink">{data.commission.paid_today}</p>
            </div>
            <div>
              <p className="text-ink-faint text-xs">Unpaid (owed to agents)</p>
              <p className="font-medium text-amber-700">{data.commission.unpaid_total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-line rounded-2xl shadow-card p-4">
          <h4 className="text-sm font-semibold text-ink mb-1">Payouts Today</h4>
          <p className="text-xs text-ink-faint mb-3">Commission + loading paid out today — subtract this from cash in hand below.</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-ink-faint text-xs">Cash</p>
              <p className="font-medium text-ink">{data.payouts_today.cash}</p>
            </div>
            <div>
              <p className="text-ink-faint text-xs">Online</p>
              <p className="font-medium text-ink">{data.payouts_today.online}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-line rounded-2xl shadow-card p-4">
          <h4 className="text-sm font-semibold text-ink mb-3">Total Expenses (detail in red book)</h4>
          <textarea
            value={expensesNote}
            onChange={(e) => setExpensesNote(e.target.value)}
            rows={3}
            placeholder="Not tracked by the system — note here if useful."
            className={`w-full ${inputClass}`}
          />
        </div>

        <div className="bg-white border border-line rounded-2xl shadow-card p-4">
          <h4 className="text-sm font-semibold text-ink mb-3">Total Cash Left In Hand</h4>
          <input
            value={cashInHand}
            onChange={(e) => setCashInHand(e.target.value)}
            placeholder="Fill after reconciling"
            className={`w-full ${inputClass}`}
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
    <div className="bg-white border border-line rounded-2xl shadow-card p-4">
      <p className="text-ink-muted text-sm">{label}</p>
      <p className="text-xl font-semibold text-ink mt-1">{value}</p>
    </div>
  )
}
