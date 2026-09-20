import { useQuery } from '@tanstack/react-query'
import { Activity, ChartBar, Settings2, ShieldAlert } from 'lucide-react'
import { listIncidents } from '@/api/incidents'
import { NavMain } from './nav-main'
import { MonitorsNav } from './monitors-nav'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Link } from 'react-router-dom'
import type { ComponentProps } from 'react'

const navSecondary = [{ title: 'Ajustes', url: '#', icon: <Settings2 /> }]

const user = { name: 'Pulse', email: 'monitorización en curso' }

export function AppSidebar(
  props: ComponentProps<typeof Sidebar> & { onLogout?: () => void }
) {
  const { onLogout, ...sidebarProps } = props

  const { data: incidents } = useQuery({
    queryKey: ['incidents', 'active'],
    queryFn: () => listIncidents({ status: 'active' }),
  })
  const activeIncidents = incidents?.pagination.total ?? 0

  const navMain = [
    { title: 'Monitores', url: '/monitores', icon: <Activity /> },
    {
      title: 'Incidentes',
      url: '/incidentes',
      icon: <ShieldAlert />,
      badge:
        activeIncidents > 0 ? (
          <span className="rounded-md bg-destructive px-1.5 text-destructive-foreground">
            {activeIncidents}
          </span>
        ) : undefined,
    },
    { title: 'Métricas', url: '/metricas', icon: <ChartBar /> },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...sidebarProps}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link to="/monitores" />}
            >
              <Activity className="size-5!" />
              <span className="text-base font-semibold">Pulse</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <MonitorsNav />
        <NavSecondary items={navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}