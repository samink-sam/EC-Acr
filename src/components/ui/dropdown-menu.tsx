import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({
  className,
  ...props
}: DropdownMenuPrimitive.DropdownMenuContentProps & { className?: string }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align="end"
        className={cn('z-50 min-w-56 rounded-md border bg-card p-1 text-card-foreground shadow-soft', className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({
  className,
  ...props
}: DropdownMenuPrimitive.DropdownMenuItemProps & { className?: string }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn('relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent', className)}
      {...props}
    />
  )
}
