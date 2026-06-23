import { CheckCircle2, Clock3, FileText, ShieldAlert, Stamp, XCircle } from 'lucide-react'
import type { Status } from '@/data/types'
import { statusLabels } from '@/lib/formatters'
import { cn } from '@/lib/utils'

const styles: Record<Status, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  under_review: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  card_issued: 'bg-green-50 text-primary-dark border-green-200',
}

const icons = {
  draft: FileText,
  submitted: Clock3,
  under_review: ShieldAlert,
  approved: CheckCircle2,
  rejected: XCircle,
  card_issued: Stamp,
}

export function StatusBadge({ status }: { status: Status }) {
  const Icon = icons[status]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold', styles[status])}>
      <Icon className="h-3.5 w-3.5" />
      {statusLabels[status]}
    </span>
  )
}
