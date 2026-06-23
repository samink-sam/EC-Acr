import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Stepper({
  steps,
  current,
}: {
  steps: string[]
  current: number
}) {
  return (
    <ol
      className="grid gap-2"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
    >
      {steps.map((step, index) => {
        const active = index === current
        const complete = index < current
        return (
          <li
            className={cn(
              'flex items-center gap-3 rounded-md border bg-card p-3 text-sm transition',
              active && 'border-primary shadow-sm',
              complete && 'bg-accent',
            )}
            key={step}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                complete
                  ? 'bg-primary text-primary-foreground'
                  : active
                    ? 'border-primary text-primary'
                    : 'text-muted-foreground',
              )}
            >
              {complete ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className="truncate font-medium">{step}</span>
          </li>
        )
      })}
    </ol>
  )
}
