import * as React from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
}

export const THead = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <thead {...props} />
export const TBody = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody {...props} />
export const TR = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('border-b transition-colors hover:bg-accent/60', className)} {...props} />
)
export const TH = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn('h-11 px-3 text-left align-middle font-semibold text-muted-foreground', className)} {...props} />
)
export const TD = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('px-3 py-3 align-middle', className)} {...props} />
)
