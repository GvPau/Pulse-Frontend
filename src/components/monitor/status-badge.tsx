import { Badge } from '@/components/ui/badge'
import { cn } from 'cn'
import { STATUS_META, type MonitorStatus } from './status'

export function MonitorStatusBadge({
  status,
  className,
}: {
  status: MonitorStatus
  className?: string
}) {
  const meta = STATUS_META[status]
  return (
    <Badge variant="secondary" className={cn(meta.badge, 'shadow-none', className)}>
      <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden />
      <span className={meta.text}>{meta.label}</span>
    </Badge>
  )
}