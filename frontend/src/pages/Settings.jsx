import { useEffect, useState } from 'react'
import client from '../api/client.js'
import { useToast } from '../components/ToastProvider.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Button from '../components/Button.jsx'

const emptyForm = {
  business_name: '',
  business_address: '',
  business_phone: '',
  business_email: '',
  gst_number: '',
  invoice_prefix: '',
  currency_symbol: ''
}

const inputClass = 'border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500'

export default function Settings() {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const showToast = useToast()

  useEffect(() => {
    client.get('/settings/').then((res) => setForm({ ...emptyForm, ...res.data }))
  }, [])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      const res = await client.put('/settings/', form)
      setForm({ ...emptyForm, ...res.data })
      showToast('Settings saved.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Business details used across invoices and reports" />

      <form onSubmit={handleSubmit} className="bg-white border border-line rounded-2xl shadow-card p-4 sm:p-6 space-y-6 max-w-2xl">
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">Business Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={form.business_name}
              onChange={(e) => updateField('business_name', e.target.value)}
              placeholder="Business name"
              required
              className={`${inputClass} sm:col-span-2`}
            />
            <input
              type="text"
              value={form.business_address || ''}
              onChange={(e) => updateField('business_address', e.target.value)}
              placeholder="Address"
              className={`${inputClass} sm:col-span-2`}
            />
            <input
              type="text"
              value={form.business_phone || ''}
              onChange={(e) => updateField('business_phone', e.target.value)}
              placeholder="Phone"
              className={inputClass}
            />
            <input
              type="email"
              value={form.business_email || ''}
              onChange={(e) => updateField('business_email', e.target.value)}
              placeholder="Email"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">GST Information</h3>
          <input
            type="text"
            value={form.gst_number || ''}
            onChange={(e) => updateField('gst_number', e.target.value)}
            placeholder="GST number"
            className={`w-full ${inputClass}`}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">Invoicing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={form.invoice_prefix}
              onChange={(e) => updateField('invoice_prefix', e.target.value)}
              placeholder="Invoice prefix (e.g. INV-)"
              required
              className={inputClass}
            />
            <input
              type="text"
              value={form.currency_symbol}
              onChange={(e) => updateField('currency_symbol', e.target.value)}
              placeholder="Currency symbol"
              required
              maxLength={5}
              className={inputClass}
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Button type="submit" size="lg">
          Save Settings
        </Button>
      </form>
    </div>
  )
}
