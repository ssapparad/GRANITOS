import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client.js'
import { useToast } from '../components/ToastProvider.jsx'

const paymentMethods = ['CASH', 'UPI', 'BANK_TRANSFER']

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
    return <p className="text-stone-400 text-sm">Loading...</p>
  }

  const balanceDue = Number(balance.balance_due)
  const isCredit = balanceDue < 0
  const isPaid = balanceDue === 0

  return (
    <div>
      <Link to="/sales" className="text-sm text-stone-500 hover:underline">← Back to sales</Link>

      <div className="bg-white border border-stone-200 rounded-md p-6 mt-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">{sale.invoice_no}</h2>
            <p className="text-sm text-stone-500 mt-1">{sale.customer_name} · {sale.sale_date}</p>
            {(sale.commission || sale.loading_charge) && (
              <p className="text-xs text-stone-400 mt-1">
                {sale.commission ? `Commission: ₹${sale.commission}` : ''}
                {sale.commission && sale.loading_charge ? ' · ' : ''}
                {sale.loading_charge ? `Loading: ₹${sale.loading_charge} (${sale.loading_paid ? 'Paid' : 'Unpaid'})` : ''}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-stone-900">₹{sale.grand_total}</p>
            <span
              className={
                isCredit
                  ? 'inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'
                  : isPaid
                    ? 'inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700'
                    : 'inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'
              }
            >
              {isCredit ? `₹${Math.abs(balanceDue).toFixed(2)} credit owed` : isPaid ? 'Paid' : `₹${balance.balance_due} due`}
            </span>
          </div>
        </div>

        {sale.remarks && (
          <p className="text-sm text-stone-500 mb-6 italic">{sale.remarks}</p>
        )}

        <table className="w-full text-sm mb-8">
          <thead className="text-stone-500 text-left border-b border-stone-200">
            <tr>
              <th className="py-2">Granite</th>
              <th className="py-2">Lot #</th>
              <th className="py-2">Slabs</th>
              <th className="py-2">Sqft</th>
              <th className="py-2">Rate/sqft</th>
              <th className="py-2 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, idx) => (
              <tr key={idx} className="border-b border-stone-100">
                <td className="py-2 text-stone-800">{item.granite_name}</td>
                <td className="py-2 text-stone-600">{item.lot_number}</td>
                <td className="py-2 text-stone-600">{item.slabs_sold}</td>
                <td className="py-2 text-stone-600">{item.sqft_sold}</td>
                <td className="py-2 text-stone-600">₹{item.negotiated_rate_per_sqft}</td>
                <td className="py-2 text-right text-stone-800 font-medium">₹{item.line_total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-stone-200 pt-6 mb-8">
          <h3 className="text-sm font-semibold text-stone-900 mb-4">Payments</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
            <div className="bg-stone-50 rounded-md p-3">
              <p className="text-stone-500">Total billed</p>
              <p className="text-stone-900 font-medium">₹{balance.gross_total}</p>
            </div>
            {Number(balance.total_refunded) > 0 && (
              <div className="bg-stone-50 rounded-md p-3">
                <p className="text-stone-500">Returned</p>
                <p className="text-stone-900 font-medium">−₹{balance.total_refunded}</p>
              </div>
            )}
            <div className="bg-stone-50 rounded-md p-3">
              <p className="text-stone-500">Paid</p>
              <p className="text-stone-900 font-medium">₹{balance.amount_paid}</p>
            </div>
            <div className="bg-stone-50 rounded-md p-3">
              <p className="text-stone-500">Balance due</p>
              <p className="text-stone-900 font-medium">₹{balance.balance_due}</p>
            </div>
          </div>

          {balance.payments.length > 0 && (
            <table className="w-full text-sm mb-4">
              <thead className="text-stone-500 text-left border-b border-stone-200">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Method</th>
                  <th className="py-2">Remarks</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {balance.payments.map((p) => (
                  <tr key={p.payment_id} className="border-b border-stone-100">
                    <td className="py-2 text-stone-600">{p.payment_date}</td>
                    <td className="py-2 text-stone-600">{p.payment_method}</td>
                    <td className="py-2 text-stone-500">{p.remarks || '—'}</td>
                    <td className="py-2 text-right text-stone-800 font-medium">₹{p.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {balanceDue > 0 && (
            <form onSubmit={handleRecordPayment} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                required
                className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
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
                className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <button
                type="submit"
                className="bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-700"
              >
                Record Payment
              </button>
            </form>
          )}

          {paymentError && <p className="text-red-600 text-sm mt-2">{paymentError}</p>}
        </div>

        <div className="border-t border-stone-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900">Returns</h3>
            <span
              className={
                returnSummary.window_open
                  ? 'text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700'
                  : 'text-xs font-medium px-2 py-0.5 rounded-full bg-stone-200 text-stone-600'
              }
            >
              {returnSummary.window_open
                ? `Return window open · ${15 - returnSummary.days_since_sale} day(s) left`
                : 'Return window closed'}
            </span>
          </div>

          <table className="w-full text-sm mb-4">
            <thead className="text-stone-500 text-left border-b border-stone-200">
              <tr>
                <th className="py-2">Granite</th>
                <th className="py-2">Lot #</th>
                <th className="py-2">Sold</th>
                <th className="py-2">Returned</th>
                <th className="py-2">Returnable</th>
                <th className="py-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {returnSummary.items.map((item) => (
                <tr key={item.sale_item_id} className="border-b border-stone-100">
                  <td className="py-2 text-stone-800">{item.granite_name}</td>
                  <td className="py-2 text-stone-600">{item.lot_number}</td>
                  <td className="py-2 text-stone-600">{item.sqft_sold} sqft / {item.slabs_sold} slabs</td>
                  <td className="py-2 text-stone-600">{item.sqft_returned} sqft / {item.slabs_returned} slabs</td>
                  <td className="py-2 text-stone-600">{item.sqft_returnable} sqft / {item.slabs_returnable} slabs</td>
                  <td className="py-2 text-right">
                    {returnSummary.window_open && Number(item.sqft_returnable) > 0 && (
                      <button
                        onClick={() => openReturnForm(item.sale_item_id)}
                        className="text-stone-600 hover:underline"
                      >
                        Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {activeReturnItemId && (
            <form onSubmit={handleSubmitReturn} className="bg-stone-50 border border-stone-200 rounded-md p-4 space-y-2 mb-4">
              <h4 className="text-sm font-medium text-stone-700">Record Return</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <input
                  type="date"
                  value={returnForm.return_date}
                  onChange={(e) => updateReturnField('return_date', e.target.value)}
                  required
                  className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <input
                  type="number"
                  step="0.01"
                  value={returnForm.sqft_returned}
                  onChange={(e) => updateReturnField('sqft_returned', e.target.value)}
                  placeholder="Sqft returned"
                  required
                  className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <input
                  type="number"
                  value={returnForm.slabs_returned}
                  onChange={(e) => updateReturnField('slabs_returned', e.target.value)}
                  placeholder="Slabs returned"
                  required
                  className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <select
                  value={returnForm.refund_method}
                  onChange={(e) => updateReturnField('refund_method', e.target.value)}
                  className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
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
                  className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>
              <p className="text-xs text-stone-400">A 15% restocking deduction applies to the refund amount.</p>
              {returnError && <p className="text-red-600 text-sm">{returnError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-700"
                >
                  Save Return
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReturnItemId(null)}
                  className="px-4 py-2 rounded-md text-sm text-stone-500 hover:bg-stone-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {returnSummary.returns.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-stone-500 text-left border-b border-stone-200">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Item</th>
                  <th className="py-2">Sqft / Slabs</th>
                  <th className="py-2">Deduction</th>
                  <th className="py-2">Refund status</th>
                  <th className="py-2 text-right">Refunded</th>
                </tr>
              </thead>
              <tbody>
                {returnSummary.returns.map((r) => (
                  <tr key={r.return_id} className="border-b border-stone-100">
                    <td className="py-2 text-stone-600">{r.return_date}</td>
                    <td className="py-2 text-stone-600">{r.granite_name} · {r.lot_number}</td>
                    <td className="py-2 text-stone-600">{r.sqft_returned} sqft / {r.slabs_returned} slabs</td>
                    <td className="py-2 text-stone-600">{r.deduction_percent}%</td>
                    <td className="py-2 text-stone-600">
                      {r.refunded ? `Paid via ${r.refund_method.replace('_', ' ')}` : 'Credit (not paid out)'}
                    </td>
                    <td className="py-2 text-right text-stone-800 font-medium">₹{r.refund_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}