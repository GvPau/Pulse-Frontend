import { Bell, CirclePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

export type NavMainItem = {
  title: string
  url: string
  icon?: ReactNode
  badge?: ReactNode
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  const { pathname } = useLocation()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Nuevo monitor"
              render={<Link to="/monitores/nuevo" />}
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <CirclePlus />
              <span>Nuevo monitor</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
              aria-label="Notificaciones"
            >
              <Bell />
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={<Link to={item.url} />}
                tooltip={item.title}
                isActive={pathname === item.url}
              >
                {item.icon}
                <span>{item.title}</span>
                {item.badge != null && (
                  <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}