import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IndianRupee,
  Wallet,
  Smartphone,
  Clock,
  Package,
  AlertTriangle,
  PlusCircle,
  Boxes,
  Users,
  BarChart3,
  Receipt
} from 'lucide-react'
import client from '../api/client.js'
import PageHeader from '../components/PageHeader.jsx'
import Button from '../components/Button.jsx'

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`
}

function KpiCard({ icon: Icon, label, value, sublabel, tone = 'ink' }) {
  const toneClasses = {
    ink: 'text-ink',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700'
  }

  return (
    <div className="bg-white border border-line rounded-xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        <div className="w-7 h-7 rounded-md bg-canvas flex items-center justify-center">
          <Icon size={14} strokeWidth={2} className="text-ink-muted" />
        </div>
      </div>
      <p className={`font-display text-2xl font-semibold ${toneClasses[tone]}`}>{value}</p>
      {sublabel && <p className="text-xs text-ink-faint mt-1">{sublabel}</p>}
    </div>
  )
}

function MovementBar({ label, valueLabel, percent, tone }) {
  const barTone = tone === 'up' ? 'bg-emerald-500' : 'bg-red-400'

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <p className="text-sm text-ink w-28 truncate">{label}</p>
      <div className="flex-1 h-1.5 bg-canvas rounded-full overflow-hidden">
        <div
          className={`h-full ${barTone} rounded-full`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <p className={`text-xs font-medium w-20 text-right ${tone === 'up' ? 'text-emerald-700' : 'text-red-600'}`}>
        {valueLabel}
      </p>
    </div>
  )
}

const QUICK_ACTIONS = [
  { to: '/sales/new', label: 'New Sale', icon: PlusCircle, variant: 'primary' },
  { to: '/lots', label: 'Manage Stock', icon: Boxes, variant: 'secondary' },
  { to: '/customers', label: 'Customers', icon: Users, variant: 'secondary' },
  { to: '/reports', label: 'Reports', icon: BarChart3, variant: 'secondary' }
]

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/dashboard/summary')
      .then((res) => setSummary(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load dashboard.'))
  }, [])

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>
  }

  if (!summary) {
    return <p className="text-ink-faint text-sm">Loading...</p>
  }

  const maxMovement = Math.max(
    1,
    ...summary.fast_moving_granites.map((g) => g.avg_sqft_per_day),
    ...summary.slow_moving_granites.map((g) => g.avg_sqft_per_day)
  )

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Today's business at a glance"
        action={<Button to="/sales/new" icon={PlusCircle}>New Sale</Button>}
      />

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_ACTIONS.map((action) => (
          <Button key={action.to} to={action.to} variant={action.variant} size="sm" icon={action.icon}>
            {action.label}
          </Button>
        ))}
      </div>

      {/* Today's activity */}
      <p className="text-xs font-semibold text-ink-faint uppercase tracking-[0.1em] mb-3">
        Today
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={IndianRupee}
          label="Today's Sales"
          value={formatINR(summary.todays_sales_total)}
          sublabel={`${summary.todays_sales_count} invoice(s)`}
        />
        <KpiCard
          icon={Wallet}
          label="Cash Collected"
          value={formatINR(summary.cash_collected_today)}
        />
        <KpiCard
          icon={Smartphone}
          label="Online Payments"
          value={formatINR(summary.online_payments_today)}
        />
        <KpiCard
          icon={Clock}
          label="Credit Sales"
          value={formatINR(summary.credit_sales_today)}
          tone="amber"
        />
      </div>

      {/* Business health */}
      <p className="text-xs font-semibold text-ink-faint uppercase tracking-[0.1em] mb-3">
        Business Health
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={Package}
          label="Inventory Value"
          value={formatINR(summary.total_inventory_value)}
        />
        <KpiCard
          icon={Boxes}
          label="Available Stock"
          value={`${summary.total_inventory_sqft} sqft`}
          sublabel={`${summary.total_inventory_slabs} slabs`}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Outstanding Dues"
          value={formatINR(summary.total_outstanding)}
          tone="amber"
        />
        <KpiCard
          icon={Receipt}
          label="Unpaid Invoices"
          value={summary.outstanding_sales_count}
        />
      </div>

      {/* Movement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">Fast Moving Granite</h3>
          <div className="bg-white border border-line rounded-xl overflow-hidden shadow-card divide-y divide-line-soft">
            {summary.fast_moving_granites.length > 0 ? (
              summary.fast_moving_granites.map((g) => (
                <MovementBar
                  key={g.granite_name}
                  label={g.granite_name}
                  valueLabel={`${g.avg_sqft_per_day} sqft/d`}
                  percent={(g.avg_sqft_per_day / maxMovement) * 100}
                  tone="up"
                />
              ))
            ) : (
              <p className="px-4 py-6 text-center text-sm text-ink-faint">
                Not enough sales history yet.
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">Slow Moving Granite</h3>
          <div className="bg-white border border-line rounded-xl overflow-hidden shadow-card divide-y divide-line-soft">
            {summary.slow_moving_granites.length > 0 ? (
              summary.slow_moving_granites.map((g) => (
                <MovementBar
                  key={g.granite_name}
                  label={g.granite_name}
                  valueLabel={`${g.avg_sqft_per_day} sqft/d`}
                  percent={(g.avg_sqft_per_day / maxMovement) * 100}
                  tone="down"
                />
              ))
            ) : (
              <p className="px-4 py-6 text-center text-sm text-ink-faint">
                Not enough sales history yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Low stock + recent sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">Low Stock Lots</h3>
          <div className="bg-white border border-line rounded-xl overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-ink-muted text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Granite</th>
                  <th className="px-4 py-2 font-medium">Lot #</th>
                  <th className="px-4 py-2 font-medium">Sqft</th>
                </tr>
              </thead>
              <tbody>
                {summary.low_stock_lots.map((l) => (
                  <tr key={l.lot_id} className="border-t border-line-soft hover:bg-canvas/60">
                    <td className="px-4 py-2 text-ink">{l.granite_name}</td>
                    <td className="px-4 py-2 text-ink-muted">{l.lot_number}</td>
                    <td className="px-4 py-2 text-amber-700 font-medium">{l.available_sqft}</td>
                  </tr>
                ))}
                {summary.low_stock_lots.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-ink-faint">
                      All lots are well stocked.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-faint mt-2">
            Flagged below 100 sqft available.{' '}
            <Link to="/lots" className="text-emerald-700 hover:underline font-medium">
              Manage lots →
            </Link>
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">Recent Sales</h3>
          <div className="bg-white border border-line rounded-xl overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-ink-muted text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Invoice</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent_sales.map((s) => (
                  <tr key={s.sale_id} className="border-t border-line-soft hover:bg-canvas/60">
                    <td className="px-4 py-2">
                      <Link
                        to={`/sales/${s.sale_id}`}
                        className="text-ink font-medium hover:text-emerald-700"
                      >
                        {s.invoice_no}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-ink-muted">{s.customer_name}</td>
                    <td className="px-4 py-2 text-right text-ink font-medium">
                      {formatINR(s.grand_total)}
                    </td>
                  </tr>
                ))}
                {summary.recent_sales.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-ink-faint">
                      No sales yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
