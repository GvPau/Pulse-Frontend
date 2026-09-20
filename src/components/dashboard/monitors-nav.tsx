import { useQuery } from '@tanstack/react-query'
import { CirclePlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { listMonitors } from '@/api/monitors'
import { STATUS_META, getMonitorStatus } from '@/components/monitor/status'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const MAX_ITEMS = 8

export function MonitorsNav() {
  const { data } = useQuery({
    queryKey: ['monitors'],
    queryFn: () => listMonitors({ page: 1, limit: 50 }),
  })

  const monitors = data?.data ?? []
  if (monitors.length === 0) return null

  const items = monitors.slice(0, MAX_ITEMS)

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="justify-between">
        Tus monitores
        <SidebarGroupAction
          render={<Link to="/monitores" aria-label="Ver todos los monitores" />}
        >
          <CirclePlus />
        </SidebarGroupAction>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((monitor) => {
            const status = getMonitorStatus(monitor.status, monitor.active)
            const meta = STATUS_META[status]
            const latency = monitor.avg_response_ms > 0 ? `${Math.round(monitor.avg_response_ms)} ms` : null
            return (
              <SidebarMenuItem key={monitor.id}>
                <SidebarMenuButton
                  render={<Link to={`/monitores/${monitor.id}`} />}
                  className="gap-2"
                >
                  <span className={`size-2 shrink-0 rounded-full ${meta.dot}`} aria-hidden />
                  <span>{monitor.name}</span>
                  {latency && (
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                      {latency}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}