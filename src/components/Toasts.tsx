import { useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useDemoStore } from '@/store'

export function Toasts() {
  const queue = useDemoStore((state) => state.toastQueue)
  const consume = useDemoStore((state) => state.consumeToast)

  useEffect(() => {
    const timers = queue.map((note) => window.setTimeout(() => consume(note.id), 3600))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [consume, queue])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {queue.slice(0, 3).map((note) => (
        <div className="rounded-lg border bg-card p-4 shadow-soft" key={note.id}>
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">{note.type}</p>
              <p className="text-sm text-muted-foreground">{note.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
