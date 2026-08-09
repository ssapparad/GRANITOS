import { useEffect, useState } from 'react'
import client from '../api/client.js'
import { useToast } from '../components/ToastProvider.jsx'
import { useConfirm } from '../components/ConfirmProvider.jsx'

const emptyForm = {
  granite_id: '',
  lot_number: '',
  purchase_date: new Date().toISOString().slice(0, 10),
  purchase_price_per_sqft: '',
  total_slabs: '',
  total_sqft: ''
}

export default function Lots() {
  const [lots, setLots] = useState([])
  const [granites, setGranites] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const showToast = useToast()
  const confirmAction = useConfirm()

  async function loadData() {
    setError('')

    try {
      const lotsRes = await client.get('/lots/')
      setLots(lotsRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load lots.')
    }

    try {
      const granitesRes = await client.get('/granites/')
      setGranites(granitesRes.data)
    } catch (err) {
      setError((prev) => prev || err.response?.data?.detail || 'Failed to load granites.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      await client.post('/lots/', {
        granite_id: Number(form.granite_id),
        lot_number: form.lot_number,
        purchase_date: form.purchase_date,
        purchase_price_per_sqft: Number(form.purchase_price_per_sqft),
        total_slabs: Number(form.total_slabs),
        total_sqft: Number(form.total_sqft)
      })
      showToast('Lot added.')
      setForm(emptyForm)
      loadData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  async function handleDelete(id) {
    const confirmed = await confirmAction('Deactivate this lot?')
    if (!confirmed) return
    await client.delete(`/lots/${id}`)
    showToast('Lot deactivated.')
    loadData()
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-900 mb-4">Lots</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-6">
        <select
          value={form.granite_id}
          onChange={(e) => updateField('granite_id', e.target.value)}
          required
          className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 col-span-2 sm:col-span-1"
        >
          <option value="">Granite</option>
          {granites.map((g) => (
            <option key={g.granite_id} value={g.granite_id}>{g.granite_name}</option>
          ))}
        </select>
        <input
          type="text"
          value={form.lot_number}
          onChange={(e) => updateField('lot_number', e.target.value)}
          placeholder="Lot number"
          required
          className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <input
          type="date"
          value={form.purchase_date}
          onChange={(e) => updateField('purchase_date', e.target.value)}
          required
          className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <input
          type="number"
          step="0.01"
          value={form.purchase_price_per_sqft}
          onChange={(e) => updateField('purchase_price_per_sqft', e.target.value)}
          placeholder="Purchase ₹/sqft"
          required
          className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <input
          type="number"
          value={form.total_slabs}
          onChange={(e) => updateField('total_slabs', e.target.value)}
          placeholder="Total slabs"
          required
          className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <input
          type="number"
          step="0.01"
          value={form.total_sqft}
          onChange={(e) => updateField('total_sqft', e.target.value)}
          placeholder="Total sqft"
          required
          className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <button
          type="submit"
          className="bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-700 col-span-2 sm:col-span-1"
        >
          Add Lot
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="bg-white border border-stone-200 rounded-md overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-stone-600 text-left">
            <tr>
              <th className="px-4 py-2">Granite</th>
              <th className="px-4 py-2">Lot #</th>
              <th className="px-4 py-2">Purchase Date</th>
              <th className="px-4 py-2">Purchase ₹/sqft</th>
              <th className="px-4 py-2">Slabs (avail/total)</th>
              <th className="px-4 py-2">Sqft (avail/total)</th>
              <th className="px-4 py-2 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {lots.map((l) => (
              <tr key={l.lot_id} className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800">{l.granite_name}</td>
                <td className="px-4 py-2 text-stone-600">{l.lot_number}</td>
                <td className="px-4 py-2 text-stone-600">{l.purchase_date}</td>
                <td className="px-4 py-2 text-stone-600">{l.purchase_price_per_sqft}</td>
                <td className="px-4 py-2 text-stone-600">{l.available_slabs} / {l.total_slabs}</td>
                <td className="px-4 py-2 text-stone-600">{l.available_sqft} / {l.total_sqft}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleDelete(l.lot_id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {lots.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-stone-400">
                  No lots yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}