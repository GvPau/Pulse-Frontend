import { IncidentsList } from '@/components/dashboard/incidents-list'

export function IncidentesPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-4">
      <IncidentsList />
    </div>
  )
}