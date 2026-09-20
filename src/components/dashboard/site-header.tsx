import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMonitor } from '@/api/monitors'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { AppSseStatus } from '@/components/stream-status'
import { ThemeToggle } from '@/components/theme-toggle'

const TITLES: Record<string, string> = {
  '/monitores': 'Monitores',
  '/incidentes': 'Incidentes',
  '/metricas': 'Métricas',
}

const MONITOR_DETAIL = /^\/monitores\/([^/]+)$/

function HeaderTitle() {
  const { pathname } = useLocation()
  const isNew = pathname === '/monitores/nuevo'
  const id = isNew ? null : MONITOR_DETAIL.exec(pathname)?.[1] ?? null
  const { data } = useQuery({
    queryKey: ['monitors', id ?? ''],
    queryFn: () => getMonitor(id as string),
    enabled: id != null,
  })

  if (isNew) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/monitores" />}>Monitores</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Nuevo monitor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  if (!id) {
    return (
      <h1 tabIndex={-1} className="text-base font-medium outline-none">
        {TITLES[pathname] ?? 'Monitores'}
      </h1>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/monitores" />}>Monitores</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="block max-w-56 truncate">
            {data?.name ?? 'Monitor'}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <div className="flex min-w-0 flex-1 items-center">
          <HeaderTitle />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <AppSseStatus />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}