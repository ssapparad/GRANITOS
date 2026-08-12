export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
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