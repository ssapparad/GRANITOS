import { useEffect, useState } from 'react'
import { Gem } from 'lucide-react'
import client from '../api/client.js'
import { useToast } from '../components/ToastProvider.jsx'
import { useConfirm } from '../components/ConfirmProvider.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Button from '../components/Button.jsx'

export default function Granites() {
  const [granites, setGranites] = useState([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const showToast = useToast()
  const confirmAction = useConfirm()

  async function loadGranites() {
    const res = await client.get('/granites/')
    setGranites(res.data)
    setLoaded(true)
  }

  useEffect(() => {
    loadGranites()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      if (editingId) {
        await client.put(`/granites/${editingId}`, { granite_name: name })
        showToast('Granite updated.')
      } else {
        await client.post('/granites/', { granite_name: name })
        showToast('Granite added.')
      }
      setName('')
      setEditingId(null)
      loadGranites()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  function startEdit(granite) {
    setEditingId(granite.granite_id)
    setName(granite.granite_name)
  }

  async function handleDelete(id) {
    const confirmed = await confirmAction('Deactivate this granite?')
    if (!confirmed) return
    await client.delete(`/granites/${id}`)
    showToast('Granite deactivated.')
    loadGranites()
  }

  return (
    <div>
      <PageHeader title="Granites" subtitle="Stone varieties carried in your catalog" />

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Granite name"
          required
          className="flex-1 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
        />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1 sm:flex-none">
            {editingId ? 'Update' : 'Add'}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setEditingId(null); setName('') }}
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
              <th className="px-4 py-2.5 font-medium w-32"></th>
            </tr>
          </thead>
          <tbody>
            {granites.map((g) => (
              <tr key={g.granite_id} className="border-t border-line-soft hover:bg-canvas/60 transition-colors">
                <td className="px-4 py-2.5 text-ink">{g.granite_name}</td>
                <td className="px-4 py-2.5 text-right space-x-3 whitespace-nowrap">
                  <button
                    onClick={() => startEdit(g)}
                    className="text-ink-muted hover:text-ink font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(g.granite_id)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {loaded && granites.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-canvas flex items-center justify-center">
                      <Gem size={18} className="text-ink-faint" strokeWidth={2} />
                    </div>
                    <p className="text-sm text-ink-muted">No granites yet.</p>
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
