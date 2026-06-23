import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root
export const TabsContent = TabsPrimitive.Content

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps & { className?: string }) {
  return <TabsPrimitive.List className={cn('inline-flex rounded-md bg-muted p-1', className)} {...props} />
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps & { className?: string }) {
  return (
    <TabsPrimitive.Trigger
      className={cn('rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm', className)}
      {...props}
    />
  )
}
