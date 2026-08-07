import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client.js'

const emptyItem = { lot_id: '', slabs_sold: '', sqft_sold: '', negotiated_rate_per_sqft: '' }

export default function NewSale() {
  const navigate = useNavigate()

  const [customers, setCustomers] = useState([])
  const [lots, setLots] = useState([])

  const [invoiceNo, setInvoiceNo] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [remarks, setRemarks] = useState('')
  const [items, setItems] = useState([{ ...emptyItem }])
  const [error, setError] = useState('')

  useEffect(() => {
    client.get('/customers/').then((res) => setCustomers(res.data))
    client.get('/lots/').then((res) => setLots(res.data))
  }, [])

  function updateItem(index, field, value) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function addItemRow() {
    setItems((prev) => [...prev, { ...emptyItem }])
  }

  function removeItemRow(index) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      const res = await client.post('/sales/', {
        invoice_no: invoiceNo,
        customer_id: Number(customerId),
        sale_date: saleDate,
        remarks: remarks || null,
        items: items.map((item) => ({
          lot_id: Number(item.lot_id),
          slabs_sold: Number(item.slabs_sold),
          sqft_sold: Number(item.sqft_sold),
          negotiated_rate_per_sqft: Number(item.negotiated_rate_per_sqft)
        }))
      })
      navigate(`/sales/${res.data.sale_id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-900 mb-4">New Sale</h2>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-md p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            placeholder="Invoice number"
            required
            className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <option value="">Customer</option>
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>
            ))}
          </select>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            required
            className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        <input
          type="text"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Remarks (optional)"
          className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-stone-700">Items</h3>

          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
              <select
                value={item.lot_id}
                onChange={(e) => updateItem(idx, 'lot_id', e.target.value)}
                required
                className="border border-stone-300 rounded-md px-3 py-2 text-sm col-span-2 sm:col-span-1 focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                <option value="">Lot</option>
                {lots.map((l) => (
                  <option key={l.lot_id} value={l.lot_id}>
                    {l.granite_name} · {l.lot_number} ({l.available_sqft} sqft avail)
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={item.slabs_sold}
                onChange={(e) => updateItem(idx, 'slabs_sold', e.target.value)}
                placeholder="Slabs sold"
                required
                className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                type="number"
                step="0.01"
                value={item.sqft_sold}
                onChange={(e) => updateItem(idx, 'sqft_sold', e.target.value)}
                placeholder="Sqft sold"
                required
                className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                type="number"
                step="0.01"
                value={item.negotiated_rate_per_sqft}
                onChange={(e) => updateItem(idx, 'negotiated_rate_per_sqft', e.target.value)}
                placeholder="Rate ₹/sqft"
                required
                className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItemRow(idx)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addItemRow}
            className="text-sm text-stone-600 hover:underline"
          >
            + Add another item
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          className="bg-stone-800 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-stone-700"
        >
          Create Sale
        </button>
      </form>
    </div>
  )
}