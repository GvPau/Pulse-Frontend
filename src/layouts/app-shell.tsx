import { Button } from '@/components/ui/button'
import { AppSseStatus } from '@/components/stream-status'
import { useAuth } from '@/hooks/use-auth'
import type { ReactNode } from 'react'

export function AppShell({ children }: { children: ReactNode }) {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-tight">Pulse</span>
          </div>
          <div className="flex items-center gap-4">
            <AppSseStatus />
            <Button variant="ghost" size="sm" onClick={logout}>
              Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}