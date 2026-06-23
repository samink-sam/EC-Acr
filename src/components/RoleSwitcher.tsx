import { useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import type { Role } from '@/data/types'
import { roleLabels } from '@/lib/formatters'
import { useDemoStore } from '@/store'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'

const loginPathByRole: Record<Role, string> = {
  applicant: '/login/applicant',
  central_admin: '/login/central-admin',
  returning_officer: '/login/returning-officer',
  super_admin: '/login/super-admin',
  verifier: '/login/verifier',
}

const roles: Role[] = ['applicant', 'central_admin', 'returning_officer', 'super_admin', 'verifier']

export function RoleSwitcher() {
  const role = useDemoStore((state) => state.activeRole)
  const navigate = useNavigate()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="max-w-full" variant="outline">
          <span className="hidden text-muted-foreground sm:inline">Login as</span>
          <span className="truncate">{roleLabels[role]}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {roles.map((item) => (
          <DropdownMenuItem key={item} onSelect={() => navigate(loginPathByRole[item])}>
            {item === 'applicant' ? 'Applicant OTP Login' : roleLabels[item]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
