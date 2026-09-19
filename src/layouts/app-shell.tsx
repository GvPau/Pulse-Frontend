import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { SiteHeader } from '@/components/dashboard/site-header'
import { useAuth } from '@/hooks/use-auth'
import type { CSSProperties } from 'react'
import { Outlet } from 'react-router-dom'

export function AppShell() {
  const { logout } = useAuth()

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as CSSProperties
      }
    >
      <AppSidebar onLogout={logout} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 transition-all duration-200 ease-in-out group-data-[collapsible=icon]/sidebar-wrapper:h-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}