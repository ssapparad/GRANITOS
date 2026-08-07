import { useEffect, useState } from 'react'
import client from '../api/client.js'

export default function Granites() {
  const [granites, setGranites] = useState([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  async function loadGranites() {
    const res = await client.get('/granites/')
    setGranites(res.data)
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
      } else {
        await client.post('/granites/', { granite_name: name })
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
    if (!confirm('Deactivate this granite?')) return
    await client.delete(`/granites/${id}`)
    loadGranites()
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-900 mb-4">Granites</h2>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Granite name"
          required
          className="flex-1 border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <button
          type="submit"
          className="bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-700"
        >
          {editingId ? 'Update' : 'Add'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => { setEditingId(null); setName('') }}
            className="px-4 py-2 rounded-md text-sm text-stone-500 hover:bg-stone-100"
          >
            Cancel
          </button>
        )}
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-stone-600 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {granites.map((g) => (
              <tr key={g.granite_id} className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800">{g.granite_name}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button
                    onClick={() => startEdit(g)}
                    className="text-stone-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(g.granite_id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {granites.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-stone-400">
                  No granites yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}