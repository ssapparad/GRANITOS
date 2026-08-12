import { useEffect, useState } from 'react'
import { Boxes } from 'lucide-react'
import client from '../api/client.js'
import { useToast } from '../components/ToastProvider.jsx'
import { useConfirm } from '../components/ConfirmProvider.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Button from '../components/Button.jsx'

const emptyForm = {
  granite_id: '',
  lot_number: '',
  purchase_date: new Date().toISOString().slice(0, 10),
  purchase_price_per_sqft: '',
  total_slabs: '',
  total_sqft: ''
}

const inputClass = 'border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500'

export default function Lots() {
  const [lots, setLots] = useState([])
  const [granites, setGranites] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const showToast = useToast()
  const confirmAction = useConfirm()

  async function loadData() {
    setError('')

    try {
      const lotsRes = await client.get('/lots/')
      setLots(lotsRes.data)
      setLoaded(true)
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
      <PageHeader title="Lots" subtitle="Stock batches, purchase cost, and availability" />

      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-6">
        <select
          value={form.granite_id}
          onChange={(e) => updateField('granite_id', e.target.value)}
          required
          className={`${inputClass} col-span-2 sm:col-span-1`}
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
          className={inputClass}
        />
        <input
          type="date"
          value={form.purchase_date}
          onChange={(e) => updateField('purchase_date', e.target.value)}
          required
          className={inputClass}
        />
        <input
          type="number"
          step="0.01"
          value={form.purchase_price_per_sqft}
          onChange={(e) => updateField('purchase_price_per_sqft', e.target.value)}
          placeholder="Purchase ₹/sqft"
          required
          className={inputClass}
        />
        <input
          type="number"
          value={form.total_slabs}
          onChange={(e) => updateField('total_slabs', e.target.value)}
          placeholder="Total slabs"
          required
          className={inputClass}
        />
        <input
          type="number"
          step="0.01"
          value={form.total_sqft}
          onChange={(e) => updateField('total_sqft', e.target.value)}
          placeholder="Total sqft"
          required
          className={inputClass}
        />
        <Button type="submit" className="col-span-2 sm:col-span-1">
          Add Lot
        </Button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="bg-white border border-line rounded-2xl overflow-hidden overflow-x-auto shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink-muted text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Granite</th>
              <th className="px-4 py-2.5 font-medium">Lot #</th>
              <th className="px-4 py-2.5 font-medium">Purchase Date</th>
              <th className="px-4 py-2.5 font-medium">Purchase ₹/sqft</th>
              <th className="px-4 py-2.5 font-medium">Slabs (avail/total)</th>
              <th className="px-4 py-2.5 font-medium">Sqft (avail/total)</th>
              <th className="px-4 py-2.5 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {lots.map((l) => (
              <tr key={l.lot_id} className="border-t border-line-soft hover:bg-canvas/60 transition-colors">
                <td className="px-4 py-2.5 text-ink">{l.granite_name}</td>
                <td className="px-4 py-2.5 text-ink-muted">{l.lot_number}</td>
                <td className="px-4 py-2.5 text-ink-muted">{l.purchase_date}</td>
                <td className="px-4 py-2.5 text-ink-muted">{l.purchase_price_per_sqft}</td>
                <td className="px-4 py-2.5 text-ink-muted">{l.available_slabs} / {l.total_slabs}</td>
                <td className="px-4 py-2.5 text-ink-muted">{l.available_sqft} / {l.total_sqft}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => handleDelete(l.lot_id)} className="text-red-600 hover:text-red-700 font-medium">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {loaded && lots.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-canvas flex items-center justify-center">
                      <Boxes size={18} className="text-ink-faint" strokeWidth={2} />
                    </div>
                    <p className="text-sm text-ink-muted">No lots yet.</p>
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
