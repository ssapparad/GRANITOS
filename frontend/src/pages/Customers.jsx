import { useEffect, useState } from 'react'
import client from '../api/client.js'
import { useToast } from '../components/ToastProvider.jsx'
import { useConfirm } from '../components/ConfirmProvider.jsx'

const emptyForm = { customer_name: '', phone: '', address: '' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const showToast = useToast()
  const confirmAction = useConfirm()

  async function loadCustomers() {
    const res = await client.get('/customers/')
    setCustomers(res.data)
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      if (editingId) {
        await client.put(`/customers/${editingId}`, form)
        showToast('Customer updated.')
      } else {
        await client.post('/customers/', form)
        showToast('Customer added.')
      }
      setForm(emptyForm)
      setEditingId(null)
      loadCustomers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  function startEdit(customer) {
    setEditingId(customer.customer_id)
    setForm({
      customer_name: customer.customer_name,
      phone: customer.phone || '',
      address: customer.address || ''
    })
  }

  async function handleDelete(id) {
    const confirmed = await confirmAction('Deactivate this customer?')
    if (!confirmed) return
    await client.delete(`/customers/${id}`)
    showToast('Customer deactivated.')
    loadCustomers()
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-900 mb-4">Customers</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-6">
        <input
          type="text"
          value={form.customer_name}
          onChange={(e) => updateField('customer_name', e.target.value)}
          placeholder="Customer name"
          required
          className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <input
          type="text"
          value={form.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="Phone"
          className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <input
          type="text"
          value={form.address}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="Address"
          className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-700"
          >
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm(emptyForm) }}
              className="px-3 py-2 rounded-md text-sm text-stone-500 hover:bg-stone-100"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-stone-600 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.customer_id} className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800">{c.customer_name}</td>
                <td className="px-4 py-2 text-stone-600">{c.phone}</td>
                <td className="px-4 py-2 text-stone-600">{c.address}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button onClick={() => startEdit(c)} className="text-stone-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(c.customer_id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-stone-400">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}