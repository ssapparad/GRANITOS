import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import client from '../api/client.js'
import { useToast } from '../components/ToastProvider.jsx'
import { useConfirm } from '../components/ConfirmProvider.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Button from '../components/Button.jsx'

const emptyForm = { customer_name: '', phone: '', address: '' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const showToast = useToast()
  const confirmAction = useConfirm()

  async function loadCustomers() {
    const res = await client.get('/customers/')
    setCustomers(res.data)
    setLoaded(true)
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
      <PageHeader title="Customers" subtitle="Everyone who's bought from the showroom" />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-6">
        <input
          type="text"
          value={form.customer_name}
          onChange={(e) => updateField('customer_name', e.target.value)}
          placeholder="Customer name"
          required
          className="border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
        />
        <input
          type="text"
          value={form.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="Phone"
          className="border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
        />
        <input
          type="text"
          value={form.address}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="Address"
          className="border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
        />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            {editingId ? 'Update' : 'Add'}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setEditingId(null); setForm(emptyForm) }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="bg-white border border-line rounded-2xl overflow-hidden overflow-x-auto shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink-muted text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Phone</th>
              <th className="px-4 py-2.5 font-medium">Address</th>
              <th className="px-4 py-2.5 font-medium w-32"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.customer_id} className="border-t border-line-soft hover:bg-canvas/60 transition-colors">
                <td className="px-4 py-2.5 text-ink">{c.customer_name}</td>
                <td className="px-4 py-2.5 text-ink-muted">{c.phone}</td>
                <td className="px-4 py-2.5 text-ink-muted">{c.address}</td>
                <td className="px-4 py-2.5 text-right space-x-3 whitespace-nowrap">
                  <button onClick={() => startEdit(c)} className="text-ink-muted hover:text-ink font-medium">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(c.customer_id)} className="text-red-600 hover:text-red-700 font-medium">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {loaded && customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-canvas flex items-center justify-center">
                      <Users size={18} className="text-ink-faint" strokeWidth={2} />
                    </div>
                    <p className="text-sm text-ink-muted">No customers yet.</p>
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
