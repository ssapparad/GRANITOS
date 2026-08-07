import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client.js'

const paymentMethods = ['CASH', 'UPI', 'BANK_TRANSFER']

export default function SaleDetail() {
  const { saleId } = useParams()
  const [sale, setSale] = useState(null)
  const [balance, setBalance] = useState(null)
  const [error, setError] = useState('')

  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [remarks, setRemarks] = useState('')
  const [paymentError, setPaymentError] = useState('')

  async function loadAll() {
    const [saleRes, balanceRes] = await Promise.all([
      client.get(`/sales/${saleId}`),
      client.get(`/payments/sale/${saleId}`)
    ])
    setSale(saleRes.data)
    setBalance(balanceRes.data)
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
      loadAll()
    } catch (err) {
      setPaymentError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>
  }

  if (!sale || !balance) {
    return <p className="text-stone-400 text-sm">Loading...</p>
  }

  const isPaid = balance.balance_due <= 0

  return (
    <div>
      <Link to="/sales" className="text-sm text-stone-500 hover:underline">← Back to sales</Link>

      <div className="bg-white border border-stone-200 rounded-md p-6 mt-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">{sale.invoice_no}</h2>
            <p className="text-sm text-stone-500 mt-1">{sale.customer_name} · {sale.sale_date}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-stone-900">₹{sale.grand_total}</p>
            <span
              className={
                isPaid
                  ? 'inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700'
                  : 'inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'
              }
            >
              {isPaid ? 'Paid' : `₹${balance.balance_due} due`}
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

        <div className="border-t border-stone-200 pt-6">
          <h3 className="text-sm font-semibold text-stone-900 mb-4">Payments</h3>

          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div className="bg-stone-50 rounded-md p-3">
              <p className="text-stone-500">Total billed</p>
              <p className="text-stone-900 font-medium">₹{balance.grand_total}</p>
            </div>
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

          {!isPaid && (
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
      </div>
    </div>
  )
}