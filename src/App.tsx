import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/layouts/app-shell'
import { useAuth } from '@/hooks/use-auth'
import { IncidentesPage } from '@/pages/incidentes'
import { LoginPage } from '@/pages/login'
import { MetricasPage } from '@/pages/metricas'
import { MonitoresPage } from '@/pages/monitores'
import type { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/monitores" replace />} />
          <Route path="monitores" element={<MonitoresPage />} />
          <Route path="incidentes" element={<IncidentesPage />} />
          <Route path="metricas" element={<MetricasPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/monitores" replace />} />
      </Routes>
    </BrowserRouter>
  )
}