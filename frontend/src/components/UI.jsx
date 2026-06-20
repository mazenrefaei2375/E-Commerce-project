export function Alert({ type = 'info', children }) {
  const colors = {
    success: 'bg-green-50 border-green-200 text-[#16A34A]',
    error: 'bg-red-50 border-red-200 text-[#DC2626]',
    warning: 'bg-amber-50 border-amber-200 text-[#F59E0B]',
    info: 'bg-blue-50 border-blue-200 text-[#2563EB]',
  };
  return (
    <div className={`border px-4 py-3 rounded-lg text-sm ${colors[type] || colors.info}`}>
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-[#16A34A]',
    error: 'bg-red-100 text-[#DC2626]',
    warning: 'bg-amber-100 text-[#F59E0B]',
    info: 'bg-blue-100 text-[#2563EB]',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-8 h-8 border-4 border-[#DBEAFE] border-t-[#2563EB] rounded-full animate-spin" />
      <p className="text-sm text-[#6B7280]">{text}</p>
    </div>
  );
}

export function EmptyState({ title, description, action, actionLabel, actionTo }) {
  return (
    <div className="card p-12 text-center">
      <div className="text-4xl mb-4">&#128722;</div>
      <h3 className="text-lg font-semibold text-[#111827] mb-2">{title}</h3>
      <p className="text-sm text-[#6B7280] mb-6">{description}</p>
      {action && (
        <a href={actionTo} className="btn-primary">{actionLabel}</a>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">{title}</h1>
        {subtitle && <p className="text-sm text-[#6B7280] mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    pending: 'warning', processing: 'info', shipped: 'purple', delivered: 'success',
    approved: 'success', rejected: 'error', basic: 'default',
    trusted: 'info', active: 'success', inactive: 'error',
  };
  return <Badge variant={map[status] || 'default'}>{status}</Badge>;
}

export function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
