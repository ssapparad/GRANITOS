import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IndianRupee,
  Wallet,
  Smartphone,
  Clock,
  Package,
  AlertTriangle,
  Receipt,
  PlusCircle,
  Boxes,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts'
import client from '../api/client.js'
import PageHeader from '../components/PageHeader.jsx'
import Button from '../components/Button.jsx'

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`
}

function formatCompactINR(value) {
  const n = Number(value)
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'short' })
}

const ICON_TONES = {
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
  amber: 'bg-amber-50 text-amber-600',
  gold: 'bg-gold-50 text-gold-600',
  rose: 'bg-rose-50 text-rose-600',
  ink: 'bg-canvas text-ink-muted'
}

function KpiCard({ icon: Icon, iconTone = 'ink', label, value, sublabel, trend }) {
  return (
    <div className="bg-white border border-line rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${ICON_TONES[iconTone]}`}>
          <Icon size={16} strokeWidth={2.25} />
        </div>
      </div>
      <p className="text-sm text-ink-muted mb-1">{label}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="text-[26px] font-bold text-ink tracking-tight">{value}</p>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
              trend.direction === 'up'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {trend.direction === 'up' ? (
              <ArrowUpRight size={12} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={12} strokeWidth={2.5} />
            )}
            {Math.abs(trend.percent)}%
          </span>
        )}
      </div>
      {sublabel && <p className="text-xs text-ink-faint mt-1">{sublabel}</p>}
      {trend && !sublabel && (
        <p className="text-xs text-ink-faint mt-1">vs previous 7 days</p>
      )}
    </div>
  )
}

const PIE_COLORS = {
  CASH: '#0E6E4E',
  UPI: '#B8863E',
  BANK_TRANSFER: '#7C6FC9'
}

const PIE_LABELS = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer'
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

  const trend = summary.sales_trend_7d.percent_change !== null
    ? {
        percent: summary.sales_trend_7d.percent_change,
        direction: summary.sales_trend_7d.percent_change >= 0 ? 'up' : 'down'
      }
    : null

  const monthlyChartData = summary.monthly_sales_trend.map((row) => ({
    month: formatMonthLabel(row.month),
    total: Number(row.total_sales)
  }))

  const paymentChartData = summary.payment_method_breakdown.map((row) => ({
    name: PIE_LABELS[row.payment_method] || row.payment_method,
    value: Number(row.total),
    color: PIE_COLORS[row.payment_method] || '#9C9A93'
  }))

  const graniteChartData = summary.top_granites_by_revenue.map((row) => ({
    name: row.granite_name,
    revenue: Number(row.revenue)
  }))

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Today's business at a glance"
        action={<Button to="/sales/new" icon={PlusCircle}>New Sale</Button>}
      />

      <div className="flex flex-wrap gap-2 mb-7">
        {QUICK_ACTIONS.map((action) => (
          <Button key={action.to} to={action.to} variant={action.variant} size="sm" icon={action.icon}>
            {action.label}
          </Button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
        <KpiCard
          icon={IndianRupee}
          iconTone="violet"
          label="Today's Sales"
          value={formatINR(summary.todays_sales_total)}
          sublabel={`${summary.todays_sales_count} invoice(s)`}
          trend={trend}
        />
        <KpiCard
          icon={Wallet}
          iconTone="emerald"
          label="Cash Collected"
          value={formatINR(summary.cash_collected_today)}
        />
        <KpiCard
          icon={Smartphone}
          iconTone="sky"
          label="Online Payments"
          value={formatINR(summary.online_payments_today)}
        />
        <KpiCard
          icon={Clock}
          iconTone="amber"
          label="Credit Sales"
          value={formatINR(summary.credit_sales_today)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={Package}
          iconTone="gold"
          label="Inventory Value"
          value={formatINR(summary.total_inventory_value)}
        />
        <KpiCard
          icon={Boxes}
          iconTone="emerald"
          label="Available Stock"
          value={`${summary.total_inventory_sqft} sqft`}
          sublabel={`${summary.total_inventory_slabs} slabs`}
        />
        <KpiCard
          icon={AlertTriangle}
          iconTone="rose"
          label="Outstanding Dues"
          value={formatINR(summary.total_outstanding)}
        />
        <KpiCard
          icon={Receipt}
          iconTone="ink"
          label="Unpaid Invoices"
          value={summary.outstanding_sales_count}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="lg:col-span-2 bg-white border border-line rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink">Sales Trend</h3>
            <span className="text-xs text-ink-faint px-2 py-1 bg-canvas rounded-md">Last 12 months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyChartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0E6E4E" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#0E6E4E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE5" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#9C9A93' }}
                axisLine={{ stroke: '#E3E1DA' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9C9A93' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompactINR}
                width={48}
              />
              <Tooltip
                formatter={(value) => formatINR(value)}
                contentStyle={{
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E3E1DA',
                  boxShadow: '0 4px 12px rgba(27,29,27,0.08)'
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#0E6E4E"
                strokeWidth={2}
                fill="url(#salesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-line rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-ink">Payments</h3>
            <span className="text-xs text-ink-faint px-2 py-1 bg-canvas rounded-md">30 days</span>
          </div>
          {paymentChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={paymentChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {paymentChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatINR(value)} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-ink-muted">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-sm text-ink-faint">No payments in the last 30 days.</p>
            </div>
          )}
        </div>
      </div>

      {/* Top granites by revenue */}
      <div className="bg-white border border-line rounded-2xl p-5 shadow-card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink">Top Granites by Revenue</h3>
          <span className="text-xs text-ink-faint px-2 py-1 bg-canvas rounded-md">All time</span>
        </div>
        {graniteChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(160, graniteChartData.length * 44)}>
            <BarChart
              data={graniteChartData}
              layout="vertical"
              margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE5" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#9C9A93' }}
                axisLine={{ stroke: '#E3E1DA' }}
                tickLine={false}
                tickFormatter={formatCompactINR}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#1B1D1B' }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip formatter={(value) => formatINR(value)} cursor={{ fill: '#F5F4F1' }} />
              <Bar dataKey="revenue" fill="#0E6E4E" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-ink-faint text-center py-10">No sales history yet.</p>
        )}
      </div>

      {/* Movement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">Fast Moving Granite</h3>
          <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-card divide-y divide-line-soft">
            {summary.fast_moving_granites.length > 0 ? (
              summary.fast_moving_granites.map((g) => (
                <div key={g.granite_name} className="flex items-center justify-between px-4 py-2.5">
                  <p className="text-sm text-ink">{g.granite_name}</p>
                  <p className="text-xs font-semibold text-emerald-700">{g.avg_sqft_per_day} sqft/d</p>
                </div>
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
          <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-card divide-y divide-line-soft">
            {summary.slow_moving_granites.length > 0 ? (
              summary.slow_moving_granites.map((g) => (
                <div key={g.granite_name} className="flex items-center justify-between px-4 py-2.5">
                  <p className="text-sm text-ink">{g.granite_name}</p>
                  <p className="text-xs font-semibold text-rose-600">{g.avg_sqft_per_day} sqft/d</p>
                </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">Low Stock Lots</h3>
          <div className="bg-white border border-line rounded-2xl overflow-hidden overflow-x-auto shadow-card">
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
          <div className="bg-white border border-line rounded-2xl overflow-hidden overflow-x-auto shadow-card">
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