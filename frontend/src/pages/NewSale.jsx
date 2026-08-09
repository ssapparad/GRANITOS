import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client.js'
import { useToast } from '../components/ToastProvider.jsx'

const emptyItem = { lot_id: '', slabs_sold: '', sqft_sold: '', negotiated_rate_per_sqft: '' }
const emptyCustomerForm = { customer_name: '', phone: '', address: '' }

export default function NewSale() {
  const navigate = useNavigate()
  const showToast = useToast()

  const [customers, setCustomers] = useState([])
  const [lots, setLots] = useState([])

  const [invoiceNo, setInvoiceNo] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [remarks, setRemarks] = useState('')
  const [commission, setCommission] = useState('')
  const [loadingCharge, setLoadingCharge] = useState('')
  const [items, setItems] = useState([{ ...emptyItem }])
  const [error, setError] = useState('')

  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState(emptyCustomerForm)
  const [newCustomerError, setNewCustomerError] = useState('')

  useEffect(() => {
    client.get('/customers/').then((res) => setCustomers(res.data))
    client.get('/lots/').then((res) => setLots(res.data))
    client.get('/settings/').then((res) => {
      if (res.data.invoice_prefix) {
        setInvoiceNo((prev) => (prev === '' ? res.data.invoice_prefix : prev))
      }
    })
  }, [])

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  function addItemRow() {
    setItems((prev) => [...prev, { ...emptyItem }])
  }

  function removeItemRow(index) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateNewCustomerField(field, value) {
    setNewCustomerForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleAddCustomer(e) {
    e.preventDefault()
    setNewCustomerError('')

    try {
      const res = await client.post('/customers/', newCustomerForm)
      setCustomers((prev) => [...prev, res.data])
      setCustomerId(String(res.data.customer_id))
      setShowNewCustomer(false)
      setNewCustomerForm(emptyCustomerForm)
      showToast('Customer added.')
    } catch (err) {
      setNewCustomerError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (invoiceNo.trim() === '') {
      setError('Invoice number is required.')
      return
    }

    try {
      const res = await client.post('/sales/', {
        invoice_no: invoiceNo.trim(),
        customer_id: Number(customerId),
        sale_date: saleDate,
        remarks: remarks || null,
        commission: commission ? Number(commission) : null,
        loading_charge: loadingCharge ? Number(loadingCharge) : null,
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

          <div>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              <option value="">Customer</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCustomer((prev) => !prev)}
              className="text-xs text-stone-500 hover:underline mt-1"
            >
              {showNewCustomer ? 'Cancel' : '+ New customer'}
            </button>
          </div>

          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            required
            className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        {showNewCustomer && (
          <div className="bg-stone-50 border border-stone-200 rounded-md p-4 space-y-2">
            <h4 className="text-sm font-medium text-stone-700">New Customer</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newCustomerForm.customer_name}
                onChange={(e) => updateNewCustomerField('customer_name', e.target.value)}
                placeholder="Customer name"
                required
                className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                type="text"
                value={newCustomerForm.phone}
                onChange={(e) => updateNewCustomerField('phone', e.target.value)}
                placeholder="Phone"
                className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                type="text"
                value={newCustomerForm.address}
                onChange={(e) => updateNewCustomerField('address', e.target.value)}
                placeholder="Address"
                className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            {newCustomerError && <p className="text-red-600 text-sm">{newCustomerError}</p>}
            <button
              type="button"
              onClick={handleAddCustomer}
              className="bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-700"
            >
              Save Customer
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Remarks (optional)"
            className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          <input
            type="number"
            step="0.01"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            placeholder="Commission (optional)"
            className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          <input
            type="number"
            step="0.01"
            value={loadingCharge}
            onChange={(e) => setLoadingCharge(e.target.value)}
            placeholder="Loading charge (optional)"
            className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

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