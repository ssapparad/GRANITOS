export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-ink-muted mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
