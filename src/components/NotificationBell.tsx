import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/formatters'
import { useDemoStore } from '@/store'

export function NotificationBell() {
  const notifications = useDemoStore((state) => state.notifications)
  const markRead = useDemoStore((state) => state.markNotificationRead)
  const unread = notifications.filter((note) => !note.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Notifications" className="relative" size="icon" variant="outline">
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
              {unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-semibold">Notifications</span>
          <CheckCheck className="h-4 w-4 text-primary" />
        </div>
        {notifications.slice(0, 6).map((note) => (
          <DropdownMenuItem className="block" key={note.id} onSelect={() => markRead(note.id)}>
            <p className="text-sm font-medium">{note.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDate(note.createdAt)}</p>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
