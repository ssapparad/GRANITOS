import { Link } from 'react-router-dom'

const VARIANTS = {
  primary:
    'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm',
  secondary:
    'bg-white text-ink border border-line hover:bg-canvas',
  ghost:
    'bg-transparent text-ink-muted hover:bg-canvas hover:text-ink',
  danger:
    'bg-white text-red-600 border border-red-200 hover:bg-red-50'
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  icon: Icon,
  className = '',
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`

  const content = (
    <>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.25} />}
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button className={classes} {...props}>
      {content}
    </button>
  )
}
