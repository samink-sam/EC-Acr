import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function KpiCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className="rounded-md bg-accent p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}
