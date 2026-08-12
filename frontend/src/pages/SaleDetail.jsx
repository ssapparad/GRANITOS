import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client.js'
import { useToast } from '../components/ToastProvider.jsx'
import Button from '../components/Button.jsx'

const paymentMethods = ['CASH', 'UPI', 'BANK_TRANSFER']

const inputClass = 'border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500'

export default function SaleDetail() {
  const { saleId } = useParams()
  const showToast = useToast()

  const [sale, setSale] = useState(null)
  const [balance, setBalance] = useState(null)
  const [returnSummary, setReturnSummary] = useState(null)
  const [error, setError] = useState('')

  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [remarks, setRemarks] = useState('')
  const [paymentError, setPaymentError] = useState('')

  const [activeReturnItemId, setActiveReturnItemId] = useState(null)
  const [returnForm, setReturnForm] = useState({
    return_date: new Date().toISOString().slice(0, 10),
    sqft_returned: '',
    slabs_returned: '',
    remarks: '',
    refund_method: ''
  })
  const [returnError, setReturnError] = useState('')

  async function loadAll() {
    const [saleRes, balanceRes, returnsRes] = await Promise.all([
      client.get(`/sales/${saleId}`),
      client.get(`/payments/sale/${saleId}`),
      client.get(`/returns/sale/${saleId}`)
    ])
    setSale(saleRes.data)
    setBalance(balanceRes.data)
    setReturnSummary(returnsRes.data)
  }

  useEffect(() => {
    loadAll().catch((err) => setError(err.response?.data?.detail || 'Failed to load sale.'))
  }, [saleId])

  async function handleRecordPayment(e) {
    e.preventDefault()
    setPaymentError('')

    try {
      await client.post('/payments/', {
        sale_id: Number(saleId),
        payment_date: paymentDate,
        amount: Number(amount),
        payment_method: method,
        remarks: remarks || null
      })
      setAmount('')
      setRemarks('')
      showToast('Payment recorded.')
      loadAll()
    } catch (err) {
      setPaymentError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  function openReturnForm(saleItemId) {
    setActiveReturnItemId(saleItemId)
    setReturnForm({
      return_date: new Date().toISOString().slice(0, 10),
      sqft_returned: '',
      slabs_returned: '',
      remarks: '',
      refund_method: ''
    })
    setReturnError('')
  }

  function updateReturnField(field, value) {
    setReturnForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmitReturn(e) {
    e.preventDefault()
    setReturnError('')

    try {
      await client.post('/returns/', {
        sale_item_id: activeReturnItemId,
        return_date: returnForm.return_date,
        sqft_returned: Number(returnForm.sqft_returned),
        slabs_returned: Number(returnForm.slabs_returned),
        remarks: returnForm.remarks || null,
        refund_method: returnForm.refund_method || null
      })
      showToast('Return recorded.')
      setActiveReturnItemId(null)
      loadAll()
    } catch (err) {
      setReturnError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>
  }

  if (!sale || !balance || !returnSummary) {
    return <p className="text-ink-faint text-sm">Loading...</p>
  }

  const balanceDue = Number(balance.balance_due)
  const isCredit = balanceDue < 0
  const isPaid = balanceDue === 0

  return (
    <div>
      <Link to="/sales" className="text-sm text-ink-muted hover:text-ink">← Back to sales</Link>

      <div className="bg-white border border-line rounded-2xl shadow-card p-4 sm:p-6 mt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-6">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-ink">{sale.invoice_no}</h2>
            <p className="text-sm text-ink-muted mt-1">{sale.customer_name} · {sale.sale_date}</p>
            {(sale.commission || sale.loading_charge) && (
              <p className="text-xs text-ink-faint mt-1">
                {sale.commission ? `Commission: ₹${sale.commission}` : ''}
                {sale.commission && sale.loading_charge ? ' · ' : ''}
                {sale.loading_charge ? `Loading: ₹${sale.loading_charge} (${sale.loading_paid ? 'Paid' : 'Unpaid'})` : ''}
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-2xl font-semibold text-ink">₹{sale.grand_total}</p>
            <span
              className={
                isCredit
                  ? 'inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700'
                  : isPaid
                    ? 'inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700'
                    : 'inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700'
              }
            >
              {isCredit ? `₹${Math.abs(balanceDue).toFixed(2)} credit owed` : isPaid ? 'Paid' : `₹${balance.balance_due} due`}
            </span>
          </div>
        </div>

        {sale.remarks && (
          <p className="text-sm text-ink-muted mb-6 italic">{sale.remarks}</p>
        )}

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="text-ink-muted text-left border-b border-line">
              <tr>
                <th className="py-2 font-medium">Granite</th>
                <th className="py-2 font-medium">Lot #</th>
                <th className="py-2 font-medium">Slabs</th>
                <th className="py-2 font-medium">Sqft</th>
                <th className="py-2 font-medium">Rate/sqft</th>
                <th className="py-2 font-medium text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx} className="border-b border-line-soft">
                  <td className="py-2 text-ink">{item.granite_name}</td>
                  <td className="py-2 text-ink-muted">{item.lot_number}</td>
                  <td className="py-2 text-ink-muted">{item.slabs_sold}</td>
                  <td className="py-2 text-ink-muted">{item.sqft_sold}</td>
                  <td className="py-2 text-ink-muted">₹{item.negotiated_rate_per_sqft}</td>
                  <td className="py-2 text-right text-ink font-medium">₹{item.line_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-line pt-6 mb-8">
          <h3 className="text-sm font-semibold text-ink mb-4">Payments</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
            <div className="bg-canvas rounded-xl p-3">
              <p className="text-ink-muted">Total billed</p>
              <p className="text-ink font-medium">₹{balance.gross_total}</p>
            </div>
            {Number(balance.total_refunded) > 0 && (
              <div className="bg-canvas rounded-xl p-3">
                <p className="text-ink-muted">Returned</p>
                <p className="text-ink font-medium">−₹{balance.total_refunded}</p>
              </div>
            )}
            <div className="bg-canvas rounded-xl p-3">
              <p className="text-ink-muted">Paid</p>
              <p className="text-ink font-medium">₹{balance.amount_paid}</p>
            </div>
            <div className="bg-canvas rounded-xl p-3">
              <p className="text-ink-muted">Balance due</p>
              <p className="text-ink font-medium">₹{balance.balance_due}</p>
            </div>
          </div>

          {balance.payments.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm min-w-[420px]">
                <thead className="text-ink-muted text-left border-b border-line">
                  <tr>
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 font-medium">Method</th>
                    <th className="py-2 font-medium">Remarks</th>
                    <th className="py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {balance.payments.map((p) => (
                    <tr key={p.payment_id} className="border-b border-line-soft">
                      <td className="py-2 text-ink-muted">{p.payment_date}</td>
                      <td className="py-2 text-ink-muted">{p.payment_method}</td>
                      <td className="py-2 text-ink-faint">{p.remarks || '—'}</td>
                      <td className="py-2 text-right text-ink font-medium">₹{p.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {balanceDue > 0 && (
            <form onSubmit={handleRecordPayment} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                required
                className={inputClass}
              />
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className={inputClass}
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{m.replace('_', ' ')}</option>
                ))}
              </select>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Remarks (optional)"
                className={inputClass}
              />
              <Button type="submit">
                Record Payment
              </Button>
            </form>
          )}

          {paymentError && <p className="text-red-600 text-sm mt-2">{paymentError}</p>}
        </div>

        <div className="border-t border-line pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink">Returns</h3>
            <span
              className={
                returnSummary.window_open
                  ? 'text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700'
                  : 'text-xs font-medium px-2 py-0.5 rounded-full bg-canvas text-ink-muted'
              }
            >
              {returnSummary.window_open
                ? `Return window open · ${15 - returnSummary.days_since_sale} day(s) left`
                : 'Return window closed'}
            </span>
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-ink-muted text-left border-b border-line">
                <tr>
                  <th className="py-2 font-medium">Granite</th>
                  <th className="py-2 font-medium">Lot #</th>
                  <th className="py-2 font-medium">Sold</th>
                  <th className="py-2 font-medium">Returned</th>
                  <th className="py-2 font-medium">Returnable</th>
                  <th className="py-2 font-medium w-24"></th>
                </tr>
              </thead>
              <tbody>
                {returnSummary.items.map((item) => (
                  <tr key={item.sale_item_id} className="border-b border-line-soft">
                    <td className="py-2 text-ink">{item.granite_name}</td>
                    <td className="py-2 text-ink-muted">{item.lot_number}</td>
                    <td className="py-2 text-ink-muted whitespace-nowrap">{item.sqft_sold} sqft / {item.slabs_sold} slabs</td>
                    <td className="py-2 text-ink-muted whitespace-nowrap">{item.sqft_returned} sqft / {item.slabs_returned} slabs</td>
                    <td className="py-2 text-ink-muted whitespace-nowrap">{item.sqft_returnable} sqft / {item.slabs_returnable} slabs</td>
                    <td className="py-2 text-right">
                      {returnSummary.window_open && Number(item.sqft_returnable) > 0 && (
                        <button
                          onClick={() => openReturnForm(item.sale_item_id)}
                          className="text-emerald-700 hover:underline font-medium"
                        >
                          Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {activeReturnItemId && (
            <form onSubmit={handleSubmitReturn} className="bg-canvas border border-line rounded-xl p-4 space-y-2 mb-4">
              <h4 className="text-sm font-medium text-ink">Record Return</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <input
                  type="date"
                  value={returnForm.return_date}
                  onChange={(e) => updateReturnField('return_date', e.target.value)}
                  required
                  className={`bg-white ${inputClass}`}
                />
                <input
                  type="number"
                  step="0.01"
                  value={returnForm.sqft_returned}
                  onChange={(e) => updateReturnField('sqft_returned', e.target.value)}
                  placeholder="Sqft returned"
                  required
                  className={`bg-white ${inputClass}`}
                />
                <input
                  type="number"
                  value={returnForm.slabs_returned}
                  onChange={(e) => updateReturnField('slabs_returned', e.target.value)}
                  placeholder="Slabs returned"
                  required
                  className={`bg-white ${inputClass}`}
                />
                <select
                  value={returnForm.refund_method}
                  onChange={(e) => updateReturnField('refund_method', e.target.value)}
                  className={`bg-white ${inputClass}`}
                >
                  <option value="">Not refunding now (credit)</option>
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>Refund via {m.replace('_', ' ')}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={returnForm.remarks}
                  onChange={(e) => updateReturnField('remarks', e.target.value)}
                  placeholder="Remarks (optional)"
                  className={`bg-white ${inputClass}`}
                />
              </div>
              <p className="text-xs text-ink-faint">A 15% restocking deduction applies to the refund amount.</p>
              {returnError && <p className="text-red-600 text-sm">{returnError}</p>}
              <div className="flex gap-2">
                <Button type="submit">
                  Save Return
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveReturnItemId(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {returnSummary.returns.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="text-ink-muted text-left border-b border-line">
                  <tr>
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 font-medium">Item</th>
                    <th className="py-2 font-medium">Sqft / Slabs</th>
                    <th className="py-2 font-medium">Deduction</th>
                    <th className="py-2 font-medium">Refund status</th>
                    <th className="py-2 font-medium text-right">Refunded</th>
                  </tr>
                </thead>
                <tbody>
                  {returnSummary.returns.map((r) => (
                    <tr key={r.return_id} className="border-b border-line-soft">
                      <td className="py-2 text-ink-muted whitespace-nowrap">{r.return_date}</td>
                      <td className="py-2 text-ink-muted">{r.granite_name} · {r.lot_number}</td>
                      <td className="py-2 text-ink-muted whitespace-nowrap">{r.sqft_returned} sqft / {r.slabs_returned} slabs</td>
                      <td className="py-2 text-ink-muted">{r.deduction_percent}%</td>
                      <td className="py-2 text-ink-muted whitespace-nowrap">
                        {r.refunded ? `Paid via ${r.refund_method.replace('_', ' ')}` : 'Credit (not paid out)'}
                      </td>
                      <td className="py-2 text-right text-ink font-medium">₹{r.refund_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
