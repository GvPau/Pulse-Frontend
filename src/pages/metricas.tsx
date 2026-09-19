import { ChartAreaInteractive } from '@/components/dashboard/chart-area-interactive'
import { SectionCards } from '@/components/dashboard/section-cards'

export function MetricasPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-4">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
    </div>
  )
}