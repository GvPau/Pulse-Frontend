import { Activity, ChartBar, Settings2, ShieldAlert } from 'lucide-react'
import { NavMain } from './nav-main'
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

const navMain = [
  { title: 'Monitores', url: '/monitores', icon: <Activity /> },
  { title: 'Incidentes', url: '/incidentes', icon: <ShieldAlert /> },
  { title: 'Métricas', url: '/metricas', icon: <ChartBar /> },
]

const navSecondary = [{ title: 'Ajustes', url: '#', icon: <Settings2 /> }]

const user = { name: 'Pulse', email: 'monitorización en curso' }

export function AppSidebar(
  props: ComponentProps<typeof Sidebar> & { onLogout?: () => void }
) {
  const { onLogout, ...sidebarProps } = props

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
        <NavSecondary items={navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}